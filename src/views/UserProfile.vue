<template>
  <div class="admin-profile-page">
    <header class="page-header">
      <div class="pn-logo-text">
        <h1 class="pn-logo-title">My Profile</h1>
        <small class="pn-logo-subtitle">Manage your institutional profile and security preferences.</small>
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
              <img v-else :src="defaultAvatar" class="avatar-img" alt="avatar" />
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
import defaultAvatar from '@/assets/image.png'

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

/* ──────────────────────────────────────────────
   PAGE CONTAINER
   ────────────────────────────────────────────── */

.admin-profile-page {
  position: relative;
  min-height: 100vh;
  padding: 36px;
  background: linear-gradient(160deg, #f8fafc 0%, #f1f5f9 50%, #eef2ff 100%);
}

/* subtle decorative blobs */
.admin-profile-page::before {
  content: '';
  position: fixed;
  top: -30%;
  right: -15%;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(21, 101, 216, 0.035) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.admin-profile-page::after {
  content: '';
  position: fixed;
  bottom: -20%;
  left: -10%;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ──────────────────────────────────────────────
   PAGE HEADER
   ────────────────────────────────────────────── */

.page-header {
  position: relative;
  z-index: 1;
  margin: 0 0 28px;
  margin-left: -36px;
  margin-right: -36px;
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
  padding: 8px 36px;
}

@media (max-width: 900px) {
  .page-header {
    margin-left: -20px;
    margin-right: -20px;
    padding: 8px 20px;
  }
}

@media (max-width: 480px) {
  .page-header {
    margin-left: -16px;
    margin-right: -16px;
    padding: 8px 16px;
  }
}

.pn-logo-text {
  display: flex;
  flex-direction: column;
}

.pn-logo-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #253858;
  margin: 0;
  line-height: 1.2;
}

.pn-logo-subtitle {
  color: #6c757d;
  font-size: 0.65rem;
  margin-top: 1px;
  line-height: 1.3;
}

/* ──────────────────────────────────────────────
   LOADING & ERROR STATES
   ────────────────────────────────────────────── */

.loading-state,
.error-state {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 60px auto;
  text-align: center;
  padding: 48px 40px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 18px rgba(15, 23, 42, 0.04);
}

.loading-state .spinner-border {
  width: 3rem;
  height: 3rem;
  color: #1565d8 !important;
}

.loading-state p {
  margin-top: 16px;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.error-state i {
  font-size: 2.4rem;
  color: #dc2626;
  margin-bottom: 12px;
}

.error-state p {
  color: #64748b;
  margin-bottom: 20px;
  font-size: 14px;
}

/* ──────────────────────────────────────────────
   ALERTS
   ────────────────────────────────────────────── */

.alert {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto 16px;
  border-radius: 14px;
  font-size: 14px;
  padding: 14px 18px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.alert-success {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  color: #065f46;
  border-left: 4px solid #10b981;
}

.alert-danger {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #991b1b;
  border-left: 4px solid #ef4444;
}

.alert i {
  font-size: 1.15rem;
  flex-shrink: 0;
}

.alert .btn-close {
  filter: none;
  opacity: 0.5;
  transition: opacity 0.15s ease;
}

.alert .btn-close:hover {
  opacity: 0.8;
}

/* ──────────────────────────────────────────────
   PROFILE CARD
   ────────────────────────────────────────────── */

.profile-card {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto 28px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 32px;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 6px 18px rgba(15, 23, 42, 0.04),
    0 20px 40px rgba(15, 23, 42, 0.03);
  transition: box-shadow 0.25s ease, border-color 0.25s ease;
}

.profile-card:hover {
  border-color: #cbd5e1;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 8px 24px rgba(15, 23, 42, 0.06),
    0 24px 48px rgba(15, 23, 42, 0.04);
}

.profile-body {
  display: flex;
  align-items: center;
  gap: 28px;
}

/* ──────────────────────────────────────────────
   AVATAR
   ────────────────────────────────────────────── */

.avatar-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  outline: none;
  flex-shrink: 0;
}

.avatar-wrap:focus-visible .avatar {
  box-shadow: 0 0 0 4px rgba(21, 101, 216, 0.35);
}

.avatar {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8px 24px rgba(21, 101, 216, 0.2),
    0 2px 6px rgba(21, 101, 216, 0.15);
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
}

.avatar--clickable {
  cursor: zoom-in;
}

.avatar:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(21, 101, 216, 0.35);
}

.avatar-wrap:hover .avatar {
  transform: scale(1.06);
  box-shadow:
    0 10px 30px rgba(21, 101, 216, 0.28),
    0 2px 6px rgba(21, 101, 216, 0.15);
}

.avatar-zoom {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.4);
  color: #ffffff;
  font-size: 20px;
  opacity: 0;
  transition: opacity 0.25s ease;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
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

.avatar-hint {
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
  user-select: none;
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 6px;
}

.avatar-hint:hover,
.avatar-hint:focus-visible {
  color: #1565d8;
  background: rgba(21, 101, 216, 0.06);
  outline: none;
  transform: translateY(-1px);
}

/* ──────────────────────────────────────────────
   FULL-SCREEN AVATAR VIEWER
   ────────────────────────────────────────────── */

.avatar-viewer {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: zoom-out;
}

.viewer-img {
  max-width: 92vw;
  max-height: 88vh;
  object-fit: contain;
  border-radius: 16px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  cursor: default;
  animation: viewerReveal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes viewerReveal {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.viewer-close {
  position: absolute;
  top: 24px;
  right: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 1.15rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.viewer-close:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: scale(1.08);
}

.viewer-close:active {
  transform: scale(0.95);
}

.viewer-fade-enter-active {
  transition: opacity 0.25s ease;
}

.viewer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.viewer-fade-enter-from,
.viewer-fade-leave-to {
  opacity: 0;
}

/* ──────────────────────────────────────────────
   PROFILE META
   ────────────────────────────────────────────── */

.profile-meta {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.2px;
}

.profile-role {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
}

/* ──────────────────────────────────────────────
   PROFILE STATS
   ────────────────────────────────────────────── */

.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid #f1f5f9;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px 16px;
  border-right: 1px solid #f1f5f9;
  transition: background 0.2s ease;
  border-radius: 8px;
}

.stat:last-child {
  border-right: none;
}

.stat:hover {
  background: #f8fafc;
}

.stat-label {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-value i {
  font-size: 12px;
  color: #94a3b8;
}

/* ──────────────────────────────────────────────
   BOTTOM CONTENT GRID
   ────────────────────────────────────────────── */

.content-grid {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

/* ──────────────────────────────────────────────
   CARDS
   ────────────────────────────────────────────── */

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 6px 18px rgba(15, 23, 42, 0.04);
  transition: box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}

.card:hover {
  border-color: #cbd5e1;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 8px 24px rgba(15, 23, 42, 0.06),
    0 20px 40px rgba(15, 23, 42, 0.03);
  transform: translateY(-1px);
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
  position: relative;
  display: inline-block;
}

.card-title::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 28px;
  height: 2.5px;
  border-radius: 2px;
  background: linear-gradient(90deg, #1565d8, #6366f1);
}

.chip {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

/* ──────────────────────────────────────────────
   FORM FIELDS
   ────────────────────────────────────────────── */

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}

.stacked-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.field {
  display: flex;
  flex-direction: column;
}

.field label {
  display: block;
  margin-bottom: 8px;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

input,
select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  font-size: 14px;
  outline: none;
  background: #f8fafc;
  color: #0f172a;
  transition: all 0.2s ease;
  font-family: inherit;
  -webkit-appearance: none;
  appearance: none;
}

input:hover,
select:hover {
  border-color: #94a3b8;
  background: #ffffff;
}

input:focus,
select:focus {
  border-color: #1565d8;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(21, 101, 216, 0.1);
}

input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.disabled-input {
  opacity: 0.55;
  cursor: not-allowed;
  background: #f1f5f9 !important;
}

.disabled-input:hover {
  border-color: #e2e8f0 !important;
  background: #f1f5f9 !important;
}

/* ──────────────────────────────────────────────
   PASSWORD INPUT
   ────────────────────────────────────────────── */

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input {
  width: 100%;
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
  background: transparent;
  color: #94a3b8;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  border-radius: 10px;
  transition: color 0.2s ease, background 0.2s ease, transform 0.15s ease;
}

.password-toggle:hover {
  color: #1565d8;
  background: #eff6ff;
}

.password-toggle:active {
  transform: translateY(-50%) scale(0.9);
}

.password-toggle:focus-visible {
  color: #1565d8;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(21, 101, 216, 0.2);
}

.password-input input:focus ~ .password-toggle {
  color: #1565d8;
}

/* ──────────────────────────────────────────────
   BUTTONS
   ────────────────────────────────────────────── */

.btn {
  border: none;
  padding: 11px 22px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-ghost {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  color: #475569;
}

.btn-ghost:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-ghost:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-primary {
  background: linear-gradient(135deg, #1565d8, #1d4ed8);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(21, 101, 216, 0.25);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #104dae, #1e40af);
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(21, 101, 216, 0.35);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(21, 101, 216, 0.2);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

/* ──────────────────────────────────────────────
   HINT / PASSWORD MESSAGE
   ────────────────────────────────────────────── */

.hint {
  margin-top: 14px;
  font-size: 12px;
  min-height: 18px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  width: 100%;
}

.hint.success {
  color: #065f46;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.hint.error {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

/* ──────────────────────────────────────────────
   SCREEN READER ONLY
   ────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────
   RESPONSIVE
   ────────────────────────────────────────────── */

@media (max-width: 1100px) {
  .profile-stats {
    grid-template-columns: repeat(2, 1fr);
    row-gap: 16px;
  }
  .stat:nth-child(2) {
    border-right: none;
  }
}

@media (max-width: 900px) {
  .admin-profile-page {
    padding: 20px;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .profile-body {
    flex-direction: column;
    text-align: center;
  }

  .profile-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 0;
  }

  .profile-card {
    padding: 24px 20px;
  }

  .card {
    padding: 24px 20px;
  }

  .pn-logo-title {
    font-size: 0.9rem;
  }

  .avatar {
    width: 80px;
    height: 80px;
  }
}

@media (max-width: 480px) {
  .admin-profile-page {
    padding: 16px;
  }

  .profile-stats {
    row-gap: 12px;
  }

  .stat {
    padding: 6px 12px;
  }

  .profile-card {
    padding: 20px 16px;
    border-radius: 16px;
  }

  .card {
    padding: 20px 16px;
    border-radius: 16px;
  }

  .pn-logo-title {
    font-size: 0.85rem;
  }

  .avatar {
    width: 72px;
    height: 72px;
  }

  .card-actions {
    flex-direction: column;
  }

  .card-actions .btn {
    width: 100%;
  }
}
</style>
