<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="empty-container">
      <div class="spinner-sm" style="width: 32px; height: 32px; border-width: 3px;"></div>
      <p style="color: #94a3b8; margin-top: 12px;">Loading profile...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="fetchError" class="empty-container" style="border: none; background: #fff; border-radius: 16px;">
      <i class="bi bi-exclamation-triangle" style="font-size: 2rem; color: #ef4444;"></i>
      <p style="color: #64748b; margin: 12px 0 16px;">{{ fetchError }}</p>
      <button class="btn btn-primary-custom" @click="loadProfile">
        <i class="bi bi-arrow-clockwise me-1"></i> Retry
      </button>
    </div>

    <template v-else>
      <!-- Alerts -->
      <div v-if="successMessage" class="profile-alert profile-alert-success">
        <i class="bi bi-check-circle-fill me-2"></i>
        {{ successMessage }}
        <button type="button" class="profile-alert-close" @click="successMessage = ''">&times;</button>
      </div>
      <div v-if="saveError" class="profile-alert profile-alert-error">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        {{ saveError }}
        <button type="button" class="profile-alert-close" @click="saveError = ''">&times;</button>
      </div>

      <div class="profile-grid">
        <!-- Left: Profile Card -->
        <div class="profile-card">
          <!-- Gradient Header -->
          <div class="profile-header">
            <div class="profile-avatar" @click="triggerUpload" role="button" tabindex="0" @keydown.enter.prevent="triggerUpload" :title="avatarUploading ? 'Uploading...' : 'Click to change photo'">
              <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" />
              <span v-else>{{ initials }}</span>
              <div class="profile-avatar-hover">
                <i class="bi bi-camera-fill"></i>
              </div>
            </div>
            <div class="profile-header-info">
              <h2>{{ form.name || 'User' }}</h2>
              <div class="profile-header-meta">
                <span class="profile-role-tag">
                  <i class="bi bi-shield-lock"></i>
                  {{ form.role || 'N/A' }}
                </span>
              </div>
            </div>
            <span v-if="avatarUploading" class="spinner-sm" style="width: 18px; height: 18px; border-width: 2px; color: rgba(255,255,255,0.7);"></span>
          </div>

          <!-- Info Section -->
          <div class="profile-detail-section">
            <div class="profile-detail-section-title">
              <span>Personal Information</span>
            </div>
            <div class="profile-detail-grid">
              <div class="profile-detail-item">
                <div class="profile-detail-item-icon"><i class="bi bi-person"></i></div>
                <div class="profile-detail-item-content">
                  <span class="profile-detail-item-label">Full Name</span>
                  <span class="profile-detail-item-value">{{ form.name || '—' }}</span>
                </div>
              </div>
              <div class="profile-detail-item">
                <div class="profile-detail-item-icon"><i class="bi bi-envelope"></i></div>
                <div class="profile-detail-item-content">
                  <span class="profile-detail-item-label">Email</span>
                  <span class="profile-detail-item-value">{{ form.email || '—' }}</span>
                </div>
              </div>
              <div class="profile-detail-item">
                <div class="profile-detail-item-icon"><i class="bi bi-telephone"></i></div>
                <div class="profile-detail-item-content">
                  <span class="profile-detail-item-label">Phone</span>
                  <span class="profile-detail-item-value">{{ form.phone || '—' }}</span>
                </div>
              </div>
              <div class="profile-detail-item">
                <div class="profile-detail-item-icon"><i class="bi bi-building"></i></div>
                <div class="profile-detail-item-content">
                  <span class="profile-detail-item-label">Department</span>
                  <span class="profile-detail-item-value">{{ form.department || '—' }}</span>
                </div>
              </div>
              <div class="profile-detail-item">
                <div class="profile-detail-item-icon"><i class="bi bi-bank"></i></div>
                <div class="profile-detail-item-content">
                  <span class="profile-detail-item-label">School</span>
                  <span class="profile-detail-item-value">{{ form.school || '—' }}</span>
                </div>
              </div>
              <div class="profile-detail-item">
                <div class="profile-detail-item-icon"><i class="bi bi-calendar3"></i></div>
                <div class="profile-detail-item-content">
                  <span class="profile-detail-item-label">Joined</span>
                  <span class="profile-detail-item-value">{{ formattedDate || '—' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Edit Button -->
          <div class="profile-card-footer">
            <button class="btn btn-primary-custom" @click="showEditModal = true">
              <i class="bi bi-pencil-square me-1"></i> Edit Profile
            </button>
          </div>
        </div>

        <!-- Right: Password Card -->
        <div class="profile-card">
          <div class="profile-section-header">
            <div class="profile-section-icon" style="background: #fef3c7; color: #d97706;">
              <i class="bi bi-key-fill"></i>
            </div>
            <div>
              <h3>Change Password</h3>
              <p>Keep your account secure</p>
            </div>
          </div>

          <div class="profile-password-stack">
            <div class="form-group">
              <label class="form-label">
                <i class="bi bi-lock me-1"></i> Current Password
              </label>
              <div class="input-wrapper">
                <input :type="showCurrent ? 'text' : 'password'" v-model="password.current" class="modern-input" placeholder="Enter current password" style="padding-right: 40px;" />
                <button type="button" class="password-eye" @click="showCurrent = !showCurrent">
                  <i :class="showCurrent ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">
                <i class="bi bi-lock-fill me-1"></i> New Password
              </label>
              <div class="input-wrapper">
                <input :type="showNew ? 'text' : 'password'" v-model="password.new" class="modern-input" placeholder="Enter new password (min 8 chars)" minlength="8" style="padding-right: 40px;" />
                <button type="button" class="password-eye" @click="showNew = !showNew">
                  <i :class="showNew ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">
                <i class="bi bi-lock-fill me-1"></i> Confirm Password
              </label>
              <div class="input-wrapper">
                <input :type="showConfirm ? 'text' : 'password'" v-model="password.confirm" class="modern-input" placeholder="Confirm new password" style="padding-right: 40px;" />
                <button type="button" class="password-eye" @click="showConfirm = !showConfirm">
                  <i :class="showConfirm ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="profile-card-actions">
            <button class="btn btn-ghost" @click="resetPassword">
              <i class="bi bi-x-lg me-1"></i> Clear
            </button>
            <button class="btn btn-primary-custom" @click="updatePassword" :disabled="passwordSaving">
              <span v-if="passwordSaving" class="spinner-sm" style="width: 14px; height: 14px; border-width: 2px;"></span>
              <i v-else class="bi bi-shield-check me-1"></i>
              {{ passwordSaving ? 'Updating...' : 'Update Password' }}
            </button>
          </div>

          <p v-if="passwordMessage" class="profile-hint" :class="passwordStatus === 'success' ? 'profile-hint-success' : 'profile-hint-error'">
            <i :class="passwordStatus === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-circle-fill'" class="me-1"></i>
            {{ passwordMessage }}
          </p>
        </div>
      </div>
    </template>

    <!-- Edit Profile Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
          <div class="modal-content-panel">
            <div class="modal-header-custom">
              <button class="modal-close-btn" @click="showEditModal = false" aria-label="Close">
                <i class="bi bi-x-lg"></i>
              </button>
              <div class="modal-icon icon-edit">
                <i class="bi bi-pencil-square"></i>
              </div>
              <div>
                <h5>Edit Profile</h5>
                <p class="modal-subtitle">Update your personal information</p>
              </div>
            </div>

            <form @submit.prevent="saveProfile">
              <div class="modal-body-custom">
                <div class="profile-edit-grid">
                  <div class="form-group">
                    <label class="form-label">
                      <i class="bi bi-person me-1"></i> Full Name
                    </label>
                    <input type="text" v-model="form.name" class="modern-input" placeholder="Your full name" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      <i class="bi bi-envelope me-1"></i> Email Address
                    </label>
                    <input type="email" v-model="form.email" class="modern-input" placeholder="you@example.com" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      <i class="bi bi-telephone me-1"></i> Phone
                    </label>
                    <input type="text" v-model="form.phone" class="modern-input" placeholder="+1 555-0001" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      <i class="bi bi-building me-1"></i> Department
                    </label>
                    <input type="text" v-model="form.department" class="modern-input" placeholder="e.g. Information Technology" />
                  </div>
                  <div class="form-group" style="grid-column: 1 / -1;">
                    <label class="form-label">
                      <i class="bi bi-bank me-1"></i> School
                    </label>
                    <input type="text" v-model="form.school" class="modern-input" placeholder="e.g. PNC" />
                  </div>
                </div>
              </div>
              <div class="modal-footer-custom">
                <button type="button" class="btn btn-ghost" @click="resetForm; showEditModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary-custom" :disabled="saving">
                  <span v-if="saving" class="spinner-sm" style="width: 14px; height: 14px; border-width: 2px;"></span>
                  <i v-else class="bi bi-check-lg me-1"></i>
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

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
import { http } from '@/services/apiHttp'

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
const showEditModal = ref(false)

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
    showEditModal.value = false
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

  if (file.size > 2 * 1024 * 1024) {
    saveError.value = 'Image must be less than 2MB'
    return
  }

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
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}

.profile-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
}

/* Gradient Header (same as TeacherPage details-header) */
.profile-header {
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%);
  padding: 28px 24px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.profile-avatar:hover {
  transform: scale(1.04);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar-hover {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.1rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.profile-avatar:hover .profile-avatar-hover {
  opacity: 1;
}

.profile-header-info {
  flex: 1;
  min-width: 0;
}

.profile-header-info h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.profile-header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.profile-role-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 12px;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Detail Section */
.profile-detail-section {
  padding: 20px 24px 12px;
}

.profile-detail-section-title {
  margin-bottom: 12px;
}

.profile-detail-section-title span {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.profile-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}

.profile-detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  transition: background 0.15s ease;
}

.profile-detail-item:hover {
  background: #f8fafc;
}

.profile-detail-item-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.9rem;
}

.profile-detail-item-content {
  flex: 1;
  min-width: 0;
}

.profile-detail-item-label {
  display: block;
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.profile-detail-item-value {
  display: block;
  font-size: 0.875rem;
  color: #0f172a;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Card Footer */
.profile-card-footer {
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}

/* Password Section */
.profile-section-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px 24px 0;
}

.profile-section-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.profile-section-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.profile-section-header p {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 2px 0 0;
}

.profile-password-stack {
  padding: 20px 24px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 24px;
  border-top: 1px solid #f1f5f9;
  margin-top: 20px;
}

.profile-alert {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.profile-alert-success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.profile-alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.profile-alert-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  opacity: 0.6;
  line-height: 1;
}

.profile-alert-close:hover {
  opacity: 1;
}

.profile-hint {
  padding: 0 24px 20px;
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
}

.profile-hint-success {
  color: #059669;
}

.profile-hint-error {
  color: #dc2626;
}

.password-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.password-eye:hover {
  color: #2563eb;
  background: #eff6ff;
}

/* Edit Modal */
.profile-edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

@media (max-width: 900px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-detail-grid {
    grid-template-columns: 1fr;
  }

  .profile-edit-grid {
    grid-template-columns: 1fr;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-header-meta {
    justify-content: center;
  }
}
</style>
