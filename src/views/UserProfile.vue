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
      <i class="bi bi-exclamation-triangle-fill"></i>
      <p>{{ fetchError }}</p>
      <button class="btn btn-primary" @click="loadProfile">Retry</button>
    </div>

    <template v-else>
      <!-- Success Message -->
      <div v-if="successMessage" class="alert alert-success d-flex align-items-center gap-2 alert-dismissible fade show" role="alert">
        <i class="bi bi-check-circle-fill"></i>
        {{ successMessage }}
        <button type="button" class="btn-close" @click="successMessage = ''" aria-label="Close"></button>
      </div>

      <!-- Error Message -->
      <div v-if="saveError" class="alert alert-danger d-flex align-items-center gap-2 alert-dismissible fade show" role="alert">
        <i class="bi bi-exclamation-triangle-fill"></i>
        {{ saveError }}
        <button type="button" class="btn-close" @click="saveError = ''" aria-label="Close"></button>
      </div>

      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-body">
          <div class="avatar-wrap">
            <div
              class="avatar"
              :class="{ 'avatar--clickable': avatarUrl }"
              role="button"
              tabindex="0"
              :title="avatarUrl ? 'Click to view full screen' : 'Click to add a photo'"
              @click="avatarUrl ? openViewer() : triggerUpload()"
              @keydown.enter.prevent="avatarUrl ? openViewer() : triggerUpload()"
            >
              <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="avatar" />
              <div v-else class="avatar-fallback">{{ initials }}</div>
              <span v-if="avatarUrl" class="avatar-zoom" aria-hidden="true">
                <i class="bi bi-arrows-fullscreen"></i>
              </span>
            </div>
            <span
              class="avatar-hint"
              role="button"
              tabindex="0"
              @click="triggerUpload"
              @keydown.enter.prevent="triggerUpload"
              :title="avatarUploading ? 'Uploading...' : 'Click to change photo'"
            >
              <template v-if="avatarUploading">
                <span class="spinner-border spinner-border-sm" role="status"></span>
                Uploading...
              </template>
              <template v-else>
                <i class="bi bi-camera-fill me-1"></i> Change photo
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
              <i v-else class="bi bi-check-lg me-1"></i>
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
                  <i :class="showCurrent ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
                </button>
              </div>
            </div>
            <div class="field">
              <label>New Password</label>
              <div class="password-input">
                <input :type="showNew ? 'text' : 'password'" v-model="password.new" placeholder="Enter new password (min 8 chars)" minlength="8" />
                <button type="button" class="password-toggle" :aria-label="showNew ? 'Hide password' : 'Show password'" @click="showNew = !showNew">
                  <i :class="showNew ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
                </button>
              </div>
            </div>
            <div class="field">
              <label>Confirm Password</label>
              <div class="password-input">
                <input :type="showConfirm ? 'text' : 'password'" v-model="password.confirm" placeholder="Confirm new password" />
                <button type="button" class="password-toggle" :aria-label="showConfirm ? 'Hide password' : 'Show password'" @click="showConfirm = !showConfirm">
                  <i :class="showConfirm ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn btn-ghost" @click="resetPassword">Clear</button>
            <button class="btn btn-primary" @click="updatePassword" :disabled="passwordSaving">
              <span v-if="passwordSaving" class="spinner-border spinner-border-sm me-1" role="status"></span>
              <i v-else class="bi bi-lock me-1"></i>
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

    <!-- Full-screen avatar viewer -->
    <Transition name="viewer-fade">
      <div
        v-if="viewerOpen && avatarUrl"
        class="avatar-viewer"
        role="dialog"
        aria-modal="true"
        aria-label="Profile photo full screen"
        @click.self="closeViewer"
      >
        <button type="button" class="viewer-close" aria-label="Close" @click="closeViewer">
          <i class="bi bi-x-lg"></i>
        </button>
        <img :src="avatarUrl" class="viewer-img" alt="Profile photo full screen" @click.stop />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getProfile, updateProfile, uploadAvatar, type UserProfile } from '@/services/profileService'
import { http } from '@/services/apiHttp'

const auth = useAuthStore()
let objectUrl: string | null = null

const loading = ref(true)
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
const viewerOpen = ref(false)

function openViewer() {
  if (avatarUrl.value) {
    viewerOpen.value = true
  }
}

function closeViewer() {
  viewerOpen.value = false
}

function onViewerKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeViewer()
}

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



async function loadProfile() {
  loading.value = true
  fetchError.value = ''
  try {
    const profile = await getProfile()
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
      avatarUrl.value = http.defaults.baseURL?.replace('/api', '') + '/storage/' + profile.avatar
    }
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

    form.name = updated.name || ''
    form.email = updated.email || ''
    form.phone = updated.phone || ''
    form.department = updated.department || ''
    form.school = updated.school || ''
    Object.assign(originalForm, {
      name: form.name,
      email: form.email,
      phone: form.phone,
      department: form.department,
      school: form.school,
      role: form.role,
    })

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
    // Build full URL for the uploaded avatar
    const baseUrl = http.defaults.baseURL?.replace('/api', '') || ''
    avatarUrl.value = baseUrl + '/storage/' + result.avatar
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

function updatePassword() {
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

  // Simulate password update for now (backend endpoint to be added)
  setTimeout(() => {
    passwordMessage.value = 'Password changed successfully'
    passwordStatus.value = 'success'
    password.current = ''
    password.new = ''
    password.confirm = ''
    passwordSaving.value = false
  }, 1000)
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

watch(viewerOpen, (open) => {
  if (open) {
    window.addEventListener('keydown', onViewerKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    window.removeEventListener('keydown', onViewerKeydown)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }
  window.removeEventListener('keydown', onViewerKeydown)
  document.body.style.overflow = ''
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

.error-state i {
  font-size: 2rem;
  color: #dc2626;
  margin-bottom: 12px;
}

.error-state p {
  color: #64748b;
  margin-bottom: 16px;
}

/* Profile Card */
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
  outline: none;
}

.avatar-wrap:focus-visible .avatar {
  box-shadow: 0 0 0 3px rgba(21, 101, 216, 0.4);
}

.avatar {
  position: relative;
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

.avatar--clickable {
  cursor: zoom-in;
}

.avatar:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(21, 101, 216, 0.4);
}

.avatar-wrap:hover .avatar {
  transform: scale(1.05);
  box-shadow: 0 12px 30px rgba(21, 101, 216, 0.35);
}

.avatar-zoom {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  color: #ffffff;
  font-size: 20px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar--clickable:hover .avatar-zoom {
  opacity: 1;
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
  cursor: pointer;
  transition: color 0.2s ease;
}

.avatar-hint:hover,
.avatar-hint:focus-visible {
  color: #1565d8;
  outline: none;
}

/* Full-screen viewer */
.avatar-viewer {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(4px);
  cursor: zoom-out;
}

.viewer-img {
  max-width: 92vw;
  max-height: 88vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  cursor: default;
}

.viewer-close {
  position: absolute;
  top: 20px;
  right: 24px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.viewer-close:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.viewer-fade-enter-active,
.viewer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.viewer-fade-enter-from,
.viewer-fade-leave-to {
  opacity: 0;
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

/* Bottom */
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
  font-size: 1.05rem;
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