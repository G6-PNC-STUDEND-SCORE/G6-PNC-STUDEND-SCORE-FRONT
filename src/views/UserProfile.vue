<template>
  <div class="admin-profile-page">
    <header class="page-header">
      <div>
        <h1>My Profile</h1>
        <p class="page-subtitle">Manage your institutional profile and security preferences.</p>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading profile...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="fetchError" class="error-state">
      <AlertTriangle :size="32" style="color: #dc2626; margin-bottom: 12px;" />
      <p>{{ fetchError }}</p>
      <button class="btn btn-primary" @click="loadProfile">Retry</button>
    </div>

    <template v-else>
      <!-- Success Message -->
      <div v-if="successMessage" class="alert alert-success d-flex align-items-center gap-2 alert-dismissible fade show" role="alert">
        <CheckCircle :size="18" />
        {{ successMessage }}
        <button type="button" class="btn-close" @click="successMessage = ''" aria-label="Close"></button>
      </div>

      <!-- Error Message -->
      <div v-if="saveError" class="alert alert-danger d-flex align-items-center gap-2 alert-dismissible fade show" role="alert">
        <AlertTriangle :size="18" />
        {{ saveError }}
        <button type="button" class="btn-close" @click="saveError = ''" aria-label="Close"></button>
      </div>

      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-body">
          <div class="avatar-wrap" @click="triggerUpload" role="button" tabindex="0" @keydown.enter.prevent="triggerUpload" :title="avatarUploading ? 'Uploading...' : 'Click to change photo'">
            <div class="avatar">
              <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="avatar" />
              <div v-else class="avatar-fallback">{{ initials }}</div>
            </div>
            <span class="avatar-hint">
              <template v-if="avatarUploading">
                <span class="spinner-border spinner-border-sm" role="status"></span>
                Uploading...
              </template>
              <template v-else>
                <Camera :size="14" class="me-1" /> Change photo
              </template>
            </span>
          </div>

          <div class="profile-meta">
            <h2 class="profile-name">{{ form.name || 'User' }}</h2>
            <p class="profile-role">{{ form.role || 'N/A' }}</p>


          </div>
        </div>

        <div class="profile-stats">
          <div class="stat">
            <span class="stat-label">Department</span>
            <span class="stat-value">{{ form.department || '—' }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">School</span>
            <span class="stat-value">{{ form.school || '—' }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Joined</span>
            <span class="stat-value">{{ formattedDate || '—' }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Role</span>
            <span class="stat-value">{{ form.role || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="content-grid">
        <!-- Personal Information -->
        <section class="card">
          <header class="card-header">
            <h3>Personal Information</h3>
            <span class="chip">Primary Contact</span>
          </header>

          <div class="form-grid">
            <div class="field">
              <label>Full Name</label>
              <input type="text" v-model="form.name" placeholder="Your full name" />
            </div>
            <div class="field">
              <label>Email Address</label>
              <input type="email" v-model="form.email" placeholder="you@example.com" />
            </div>
            <div class="field">
              <label>Phone</label>
              <input type="text" v-model="form.phone" placeholder="+1 555-0001" />
            </div>
            <div class="field">
              <label>Department</label>
              <input type="text" v-model="form.department" placeholder="e.g. Information Technology" />
            </div>
            <div class="field">
              <label>School</label>
              <input type="text" v-model="form.school" placeholder="e.g. PNC" />
            </div>
            <div class="field">
              <label>Role</label>
              <input type="text" :value="form.role" disabled class="disabled-input" />
            </div>
          </div>



          <div class="card-actions">
            <button class="btn btn-ghost" @click="resetForm" :disabled="saving">Reset</button>
            <button class="btn btn-primary" @click="saveProfile" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1" role="status"></span>
              <Check v-else :size="16" class="me-1" />
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </section>

        <!-- Change Password -->
        <section class="card">
          <h3 class="card-title">Change Password</h3>

          <div class="stacked-form">
            <div class="field">
              <label>Current Password</label>
              <div class="password-input">
                <input :type="showCurrent ? 'text' : 'password'" v-model="password.current" placeholder="Enter current password" />
                <button type="button" class="password-toggle" :aria-label="showCurrent ? 'Hide password' : 'Show password'" @click="showCurrent = !showCurrent">
                  <EyeOff v-if="showCurrent" :size="18" />
                  <Eye v-else :size="18" />
                </button>
              </div>
            </div>
            <div class="field">
              <label>New Password</label>
              <div class="password-input">
                <input :type="showNew ? 'text' : 'password'" v-model="password.new" placeholder="Enter new password (min 8 chars)" minlength="8" />
                <button type="button" class="password-toggle" :aria-label="showNew ? 'Hide password' : 'Show password'" @click="showNew = !showNew">
                  <EyeOff v-if="showNew" :size="18" />
                  <Eye v-else :size="18" />
                </button>
              </div>
            </div>
            <div class="field">
              <label>Confirm Password</label>
              <div class="password-input">
                <input :type="showConfirm ? 'text' : 'password'" v-model="password.confirm" placeholder="Confirm new password" />
                <button type="button" class="password-toggle" :aria-label="showConfirm ? 'Hide password' : 'Show password'" @click="showConfirm = !showConfirm">
                  <EyeOff v-if="showConfirm" :size="18" />
                  <Eye v-else :size="18" />
                </button>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn btn-ghost" @click="resetPassword">Clear</button>
            <button class="btn btn-primary" @click="updatePassword" :disabled="passwordSaving">
              <span v-if="passwordSaving" class="spinner-border spinner-border-sm me-1" role="status"></span>
              <Lock v-else :size="16" class="me-1" />
              {{ passwordSaving ? 'Updating...' : 'Update Password' }}
            </button>
          </div>

          <p v-if="passwordMessage" class="hint" :class="passwordStatus">{{ passwordMessage }}</p>
        </section>
      </div>
    </template>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
      class="sr-only"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getProfile, updateProfile, uploadAvatar, type UserProfile } from '@/services/profileService'
import { storageUrl } from '@/services/apiHttp'
import { http } from '@/services/api'
import { AlertTriangle, CheckCircle, Camera, Check, EyeOff, Eye, Lock } from '@lucide/vue'

let cachedProfile: UserProfile | null = null
let profileCacheTime = 0
const PROFILE_CACHE_TTL = 30_000

function isProfileCacheStale(): boolean {
  return Date.now() - profileCacheTime > PROFILE_CACHE_TTL
}

function invalidateProfileCache() {
  cachedProfile = null
  profileCacheTime = 0
}

const auth = useAuthStore()
let objectUrl: string | null = null

const loading = ref(!cachedProfile || isProfileCacheStale())
const saving = ref(false)
const fetchError = ref('')
const saveError = ref('')
const successMessage = ref('')
const avatarUploading = ref(false)

const form = reactive({
  name: '',
  email: '',
  phone: '',
  department: '',
  school: '',
  role: '',
  joined: '',
})

const originalForm = reactive({
  name: '',
  email: '',
  phone: '',
  department: '',
  school: '',
  role: '',
  joined: '',
})

const password = reactive({
  current: '',
  new: '',
  confirm: '',
})

const passwordMessage = ref('')
const passwordStatus = ref('')
const passwordSaving = ref(false)
const avatarUrl = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const initials = computed(() => {
  if (!form.name) return 'U'
  return form.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const formattedDate = computed(() => {
  if (!form.joined) return ''
  const d = new Date(form.joined)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
})



function applyProfile(profile: UserProfile) {
  form.name = profile.name || ''
  form.email = profile.email || ''
  form.phone = profile.phone || ''
  form.department = profile.department || ''
  form.school = profile.school || ''
  form.role = profile.role || ''
  Object.assign(originalForm, {
    name: form.name,
    email: form.email,
    phone: form.phone,
    department: form.department,
    school: form.school,
    role: form.role,
  })
  form.joined = profile.created_at || ''
  if (profile.avatar) {
    avatarUrl.value = storageUrl(profile.avatar)
  }
}

async function loadProfile() {
  if (cachedProfile && !isProfileCacheStale()) {
    applyProfile(cachedProfile)
    loading.value = false
    return
  }
  loading.value = true
  fetchError.value = ''
  try {
    const profile = await getProfile()
    cachedProfile = profile
    profileCacheTime = Date.now()
    applyProfile(profile)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    fetchError.value = err.response?.data?.message || err.message || 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  saveError.value = ''
  successMessage.value = ''

  try {
    const updated = await updateProfile({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      department: form.department || undefined,
      school: form.school || undefined,
    })

    invalidateProfileCache()
    cachedProfile = updated
    profileCacheTime = Date.now()
    applyProfile(updated)
    successMessage.value = 'Profile updated successfully!'
    setTimeout(() => { successMessage.value = '' }, 4000)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
    saveError.value = err.response?.data?.message || err.message || 'Failed to save profile'
    if (err.response?.data?.errors) {
      const errorMessages = Object.values(err.response.data.errors).flat()
      saveError.value = errorMessages.join(', ')
    }
  } finally {
    saving.value = false
  }
}

function resetForm() {
  form.name = originalForm.name
  form.email = originalForm.email
  form.phone = originalForm.phone
  form.department = originalForm.department
  form.school = originalForm.school
  saveError.value = ''
  successMessage.value = ''
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    saveError.value = 'Image must be less than 2MB'
    return
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    saveError.value = 'Only JPEG, PNG, GIF, and WebP images are allowed'
    return
  }

  avatarUploading.value = true
  saveError.value = ''

  try {
    const result = await uploadAvatar(file)
    avatarUrl.value = storageUrl(result.avatar)
    // Keep the sidebar avatar in sync
    if (auth.user) {
      auth.user.avatar = result.avatar
    }
    successMessage.value = 'Avatar uploaded successfully!'
    setTimeout(() => { successMessage.value = '' }, 4000)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
    saveError.value = err.response?.data?.message || err.message || 'Failed to upload avatar'
    if (err.response?.data?.errors) {
      const errorMessages = Object.values(err.response.data.errors).flat()
      saveError.value = errorMessages.join(', ')
    }
  } finally {
    avatarUploading.value = false
    // Reset file input so the same file can be re-selected
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

function triggerUpload() {
  if (!avatarUploading.value) {
    fileInput.value?.click()
  }
}

async function updatePassword() {
  passwordMessage.value = ''
  passwordStatus.value = ''

  if (!password.current || !password.new || !password.confirm) {
    passwordMessage.value = 'Please fill in all password fields'
    passwordStatus.value = 'error'
    return
  }

  if (password.new.length < 8) {
    passwordMessage.value = 'New password must be at least 8 characters'
    passwordStatus.value = 'error'
    return
  }

  if (password.new !== password.confirm) {
    passwordMessage.value = 'Passwords do not match'
    passwordStatus.value = 'error'
    return
  }

  passwordSaving.value = true

  try {
    const response = await http.patch('/change-password', {
      current_password: password.current,
      new_password: password.new,
      new_password_confirmation: password.confirm,
    })
    
    passwordMessage.value = response.data.message || 'Password changed successfully'
    passwordStatus.value = 'success'
    password.current = ''
    password.new = ''
    password.confirm = ''
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    passwordMessage.value = err.response?.data?.message || err.message || 'Failed to change password'
    passwordStatus.value = 'error'
  } finally {
    passwordSaving.value = false
  }
}

function resetPassword() {
  password.current = ''
  password.new = ''
  password.confirm = ''
  passwordMessage.value = ''
  passwordStatus.value = ''
}

onMounted(() => {
  loadProfile()
})

onUnmounted(() => {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }
})
</script>

<style scoped>
* {
  box-sizing: border-box;
  font-family: 'Segoe UI', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
}

.admin-profile-page {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
  padding: 36px;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.page-subtitle {
  color: #64748b;
  margin: 6px 0 0;
  font-size: 14px;
}

.loading-state,
.error-state {
  max-width: 1200px;
  margin: 60px auto;
  text-align: center;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.error-state p {
  color: #64748b;
  margin-bottom: 16px;
}

.profile-card {
  max-width: 1200px;
  margin: 0 auto 28px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 18px rgba(15, 23, 42, 0.04);
}

.profile-body {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  outline: none;
}

.avatar-wrap:focus-visible .avatar {
  box-shadow: 0 0 0 3px rgba(21, 101, 216, 0.4);
}

.avatar {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1565d8, #1e40af);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 26px rgba(21, 101, 216, 0.25);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.avatar-wrap:hover .avatar {
  transform: scale(1.05);
  box-shadow: 0 12px 30px rgba(21, 101, 216, 0.35);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-fallback {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.avatar-hint {
  font-size: 12px;
  color: #64748b;
  transition: color 0.2s ease;
}

.avatar-wrap:hover .avatar-hint {
  color: #1565d8;
}

.profile-meta {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.profile-role {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  text-transform: capitalize;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.stat-value {
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
}

.content-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 18px rgba(15, 23, 42, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 24px;
}

.chip {
  background: #eff6ff;
  color: #1565d8;
  border: 1px solid #dbeafe;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stacked-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input {
  width: 100%;
  padding-right: 46px;
}

.password-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
  background: transparent;
  color: #94a3b8;
  line-height: 1;
  cursor: pointer;
  border-radius: 10px;
  transition: color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}

.password-toggle:hover {
  color: #1565d8;
  background: #eff6ff;
}

.password-toggle:active {
  transform: translateY(-50%) scale(0.92);
}

.password-toggle:focus-visible {
  color: #1565d8;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(21, 101, 216, 0.2);
}

.password-input input:focus ~ .password-toggle {
  color: #1565d8;
}

.field {
  display: flex;
  flex-direction: column;
}

.field label {
  display: block;
  margin-bottom: 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

input,
select {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  outline: none;
  background: #f8fafc;
  color: #0f172a;
  transition: all 0.15s ease;
}

input:hover,
select:hover {
  border-color: #cbd5e1;
  background: #ffffff;
}

input:focus,
select:focus {
  border-color: #1565d8;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(21, 101, 216, 0.1);
}

.disabled-input {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
}

.btn {
  border: none;
  padding: 12px 22px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ghost {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn-ghost:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-primary {
  background: #1565d8;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(21, 101, 216, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: #104dae;
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(21, 101, 216, 0.3);
}

.hint {
  margin-top: 14px;
  font-size: 12px;
  min-height: 18px;
  font-weight: 600;
}

.hint.success {
  color: #059669;
}

.hint.error {
  color: #dc2626;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.alert {
  max-width: 1200px;
  margin: 0 auto 16px;
  border-radius: 12px;
  font-size: 14px;
}

@media (max-width: 900px) {
  .admin-profile-page {
    padding: 20px;
  }

  .content-grid,
  .profile-stats,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .profile-body {
    flex-direction: column;
    text-align: center;
  }

}
</style>
