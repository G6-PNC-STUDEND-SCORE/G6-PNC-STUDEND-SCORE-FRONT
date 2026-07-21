<template>
  <div class="admin-profile-page">
    <!-- ═══════════ PAGE HEADER ═══════════ -->
    <header class="page-header">
      <div class="page-header-bg"></div>
      <div class="page-header-content">
        <div class="page-header-icon">
          <i class="bi bi-person-circle"></i>
        </div>
        <div class="page-header-text">
          <h1 class="page-header-title">My Profile</h1>
          <p class="page-header-subtitle">Manage your institutional profile and security preferences</p>
        </div>
        <div class="page-header-badge">
          <span class="badge-pulse"></span>
          Active
        </div>
      </div>
    </header>

    <!-- ═══════════ LOADING STATE ═══════════ -->
    <template v-if="loading">
      <Transition name="fade-slide">
        <div class="state-card">
          <div class="loading-content">
            <div class="spinner-ring">
              <div class="ring"></div>
              <div class="ring"></div>
              <div class="ring"></div>
            </div>
            <p class="state-text">Loading your profile...</p>
          </div>
        </div>
      </Transition>
    </template>

    <!-- ═══════════ ERROR STATE ═══════════ -->
    <template v-else-if="fetchError">
      <Transition name="fade-slide">
        <div class="state-card error-state-card">
          <div class="state-icon error-icon">
            <i class="bi bi-exclamation-triangle-fill"></i>
          </div>
          <p class="state-text error-text">{{ fetchError }}</p>
          <button class="btn btn-primary" @click="loadProfile">
            <i class="bi bi-arrow-clockwise me-1"></i>
            Retry
          </button>
        </div>
      </Transition>
    </template>

    <!-- ═══════════ MAIN CONTENT ═══════════ -->
    <template v-else>
      <TransitionGroup name="stagger" tag="div" class="content-wrapper">
      <!-- Success Message -->
      <Transition name="alert-slide" key="success">
        <div v-if="successMessage" class="alert alert-success" role="alert">
          <div class="alert-icon">
            <i class="bi bi-check-circle-fill"></i>
          </div>
          <span class="alert-text">{{ successMessage }}</span>
          <button type="button" class="alert-close" @click="successMessage = ''" aria-label="Close">
            <i class="bi bi-x-lg"></i>
          </button>
          <div class="alert-progress"></div>
        </div>
      </Transition>

      <!-- Error Message -->
      <Transition name="alert-slide" key="error">
        <div v-if="saveError" class="alert alert-danger" role="alert">
          <div class="alert-icon">
            <i class="bi bi-exclamation-circle-fill"></i>
          </div>
          <span class="alert-text">{{ saveError }}</span>
          <button type="button" class="alert-close" @click="saveError = ''" aria-label="Close">
            <i class="bi bi-x-lg"></i>
          </button>
          <div class="alert-progress"></div>
        </div>
      </Transition>

      <!-- ═══════ PROFILE CARD ═══════ -->
      <section class="profile-card" key="profile-card">
        <!-- Cover -->
        <div class="profile-cover">
          <div class="cover-pattern"></div>
          <div class="cover-overlay"></div>
        </div>

        <div class="profile-body">
          <!-- Left: Avatar -->
          <div class="avatar-section">
            <div class="avatar-wrapper">
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
                <div class="avatar-overlay">
                  <i class="bi bi-camera-fill"></i>
                </div>
                <span v-if="avatarUrl" class="avatar-zoom-icon" aria-hidden="true">
                  <i class="bi bi-arrows-fullscreen"></i>
                </span>
              </div>
              <div class="avatar-ring"></div>
            </div>
            <button
              class="avatar-upload-btn"
              @click="triggerUpload"
              :disabled="avatarUploading"
              :title="avatarUploading ? 'Uploading...' : 'Change photo'"
            >
              <template v-if="avatarUploading">
                <span class="spinner-border spinner-border-sm" role="status"></span>
                Uploading...
              </template>
              <template v-else>
                <i class="bi bi-camera-fill me-1"></i> Change photo
              </template>
            </button>
          </div>

          <!-- Right: Info List -->
          <div class="profile-info">
            <div class="info-row info-row--header">
              <div class="info-icon info-icon--user">
                <i class="bi bi-person-fill"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Name</span>
                <span class="info-value info-value--name">{{ form.name || 'User' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-icon info-icon--id">
                <i class="bi bi-hash"></i>
              </div>
              <div class="info-content">
                <span class="info-label">ID</span>
                <span class="info-value">#{{ form.id || '—' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-icon info-icon--email">
                <i class="bi bi-envelope-fill"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Email</span>
                <span class="info-value">{{ form.email || '—' }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-icon info-icon--gen">
                <i class="bi bi-layers-fill"></i>
              </div>
              <div class="info-content">
                <span class="info-label">Generation</span>
                <span class="info-value">{{ form.department || '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ BOTTOM GRID ═══════ -->
      <div class="content-grid" key="content-grid">
        <!-- Personal Information -->
        <section class="form-card">
          <header class="form-card-header">
            <div class="form-card-header-left">
              <div class="form-card-icon">
                <i class="bi bi-person-lines-fill"></i>
              </div>
              <div>
                <h3 class="form-card-title">Personal Information</h3>
                <p class="form-card-subtitle">Update your personal details</p>
              </div>
            </div>
            <span class="chip">Primary Contact</span>
          </header>

          <div class="form-grid">
            <div class="field-group">
              <label class="field-label">
                <i class="bi bi-person"></i>
                Full Name
              </label>
              <div class="field-input-wrapper">
                <input type="text" v-model="form.name" placeholder="Your full name" />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">
                <i class="bi bi-envelope"></i>
                Email Address
              </label>
              <div class="field-input-wrapper">
                <input type="email" v-model="form.email" placeholder="you@example.com" />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">
                <i class="bi bi-telephone"></i>
                Phone
              </label>
              <div class="field-input-wrapper">
                <input type="text" v-model="form.phone" placeholder="+1 555-0001" />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">
                <i class="bi bi-building"></i>
                Department
              </label>
              <div class="field-input-wrapper">
                <input type="text" v-model="form.department" placeholder="e.g. Information Technology" />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">
                <i class="bi bi-mortarboard"></i>
                School
              </label>
              <div class="field-input-wrapper">
                <input type="text" v-model="form.school" placeholder="e.g. PNC" />
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">
                <i class="bi bi-shield-check"></i>
                Role
              </label>
              <div class="field-input-wrapper">
                <input type="text" :value="form.role" disabled class="input-disabled" />
              </div>
            </div>
          </div>

          <div class="form-card-footer">
            <button class="btn btn-ghost" @click="resetForm" :disabled="saving">
              <i class="bi bi-arrow-counterclockwise"></i>
              Reset
            </button>
            <button class="btn btn-primary" @click="saveProfile" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm" role="status"></span>
              <template v-else>
                <i class="bi bi-check-lg"></i>
                Save Changes
              </template>
            </button>
          </div>
        </section>

        <!-- Change Password -->
        <section class="form-card">
          <header class="form-card-header">
            <div class="form-card-header-left">
              <div class="form-card-icon form-card-icon--lock">
                <i class="bi bi-lock-fill"></i>
              </div>
              <div>
                <h3 class="form-card-title">Change Password</h3>
                <p class="form-card-subtitle">Ensure your account security</p>
              </div>
            </div>
          </header>

          <div class="password-form">
            <div class="field-group">
              <label class="field-label">
                <i class="bi bi-key"></i>
                Current Password
              </label>
              <div class="password-input-wrapper">
                <input
                  :type="showCurrent ? 'text' : 'password'"
                  v-model="password.current"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showCurrent ? 'Hide password' : 'Show password'"
                  @click="showCurrent = !showCurrent"
                >
                  <i :class="showCurrent ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
                </button>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">
                <i class="bi bi-lock"></i>
                New Password
              </label>
              <div class="password-input-wrapper">
                <input
                  :type="showNew ? 'text' : 'password'"
                  v-model="password.new"
                  placeholder="Enter new password (min 8 chars)"
                  minlength="8"
                  @input="updateStrength"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showNew ? 'Hide password' : 'Show password'"
                  @click="showNew = !showNew"
                >
                  <i :class="showNew ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
                </button>
              </div>
              <!-- Strength Indicator -->
              <Transition name="strength-fade">
                <div v-if="password.new.length > 0" class="strength-bar-wrapper">
                  <div class="strength-bar">
                    <div
                      class="strength-bar-fill"
                      :class="`strength--${strengthLevel}`"
                      :style="{ width: strengthPercent + '%' }"
                    ></div>
                  </div>
                  <span class="strength-label" :class="`strength--${strengthLevel}`">
                    {{ strengthText }}
                  </span>
                </div>
              </Transition>
            </div>
            <div class="field-group">
              <label class="field-label">
                <i class="bi bi-check2-all"></i>
                Confirm Password
              </label>
              <div class="password-input-wrapper">
                <input
                  :type="showConfirm ? 'text' : 'password'"
                  v-model="password.confirm"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  :aria-label="showConfirm ? 'Hide password' : 'Show password'"
                  @click="showConfirm = !showConfirm"
                >
                  <i :class="showConfirm ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
                </button>
              </div>
              <!-- Match Indicator -->
              <Transition name="strength-fade">
                <div v-if="password.confirm.length > 0 && password.new.length > 0" class="match-indicator">
                  <i
                    :class="passwordsMatch ? 'bi bi-check-circle-fill match-yes' : 'bi bi-x-circle-fill match-no'"
                  ></i>
                  <span :class="passwordsMatch ? 'match-yes' : 'match-no'">
                    {{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}
                  </span>
                </div>
              </Transition>
            </div>
          </div>

          <div class="form-card-footer">
            <button class="btn btn-ghost" @click="resetPassword">
              <i class="bi bi-x-circle"></i>
              Clear
            </button>
            <button class="btn btn-primary" @click="updatePassword" :disabled="passwordSaving">
              <span v-if="passwordSaving" class="spinner-border spinner-border-sm" role="status"></span>
              <template v-else>
                <i class="bi bi-lock"></i>
                Update Password
              </template>
            </button>
          </div>

          <!-- Password Message -->
          <Transition name="strength-fade">
            <div v-if="passwordMessage" class="password-message" :class="passwordStatus">
              <i :class="passwordStatus === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-circle-fill'"></i>
              {{ passwordMessage }}
            </div>
          </Transition>
        </section>
      </div>
      </TransitionGroup>
    </template>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
      class="sr-only"
      @change="onFileChange"
    />

    <!-- ═══════ FULL-SCREEN AVATAR VIEWER ═══════ -->
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
import { getProfile, updateProfile, uploadAvatar } from '@/services/profileService'
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
  id: 0,
  name: '',
  email: '',
  phone: '',
  department: '',
  school: '',
  role: '',
  joined: '',
})

const originalForm = reactive({
  id: 0,
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

// ── Password strength ──
const strengthLevel = ref<'none' | 'weak' | 'fair' | 'strong' | 'very-strong'>('none')

const strengthPercent = computed(() => {
  switch (strengthLevel.value) {
    case 'weak': return 25
    case 'fair': return 50
    case 'strong': return 75
    case 'very-strong': return 100
    default: return 0
  }
})

const strengthText = computed(() => {
  switch (strengthLevel.value) {
    case 'weak': return 'Weak'
    case 'fair': return 'Fair'
    case 'strong': return 'Strong'
    case 'very-strong': return 'Very Strong'
    default: return ''
  }
})

const passwordsMatch = computed(() => {
  if (!password.new || !password.confirm) return false
  return password.new === password.confirm
})

function updateStrength() {
  const pwd = password.new
  if (!pwd) {
    strengthLevel.value = 'none'
    return
  }

  let score = 0
  if (pwd.length >= 8) score += 1
  if (pwd.length >= 12) score += 1
  if (/[A-Z]/.test(pwd)) score += 1
  if (/[a-z]/.test(pwd)) score += 1
  if (/[0-9]/.test(pwd)) score += 1
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1

  if (score <= 2) strengthLevel.value = 'weak'
  else if (score <= 3) strengthLevel.value = 'fair'
  else if (score <= 4) strengthLevel.value = 'strong'
  else strengthLevel.value = 'very-strong'
}

// ── Viewer ──
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

// ── Date formatting ──
const formattedDate = computed(() => {
  if (!form.joined) return ''
  const d = new Date(form.joined)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
})

// ── API functions ──
async function loadProfile() {
  loading.value = true
  fetchError.value = ''
  try {
    const profile = await getProfile()
    form.id = profile.id
    form.name = profile.name || ''
    form.email = profile.email || ''
    form.phone = profile.phone || ''
    form.department = profile.department || ''
    form.school = profile.school || ''
    form.role = profile.role || ''
    Object.assign(originalForm, {
      id: form.id,
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
      id: form.id,
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
  form.id = originalForm.id
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
    const baseUrl = http.defaults.baseURL?.replace('/api', '') || ''
    avatarUrl.value = baseUrl + '/storage/' + result.avatar
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

  setTimeout(() => {
    passwordMessage.value = 'Password changed successfully'
    passwordStatus.value = 'success'
    password.current = ''
    password.new = ''
    password.confirm = ''
    passwordSaving.value = false
    strengthLevel.value = 'none'
  }, 1000)
}

function resetPassword() {
  password.current = ''
  password.new = ''
  password.confirm = ''
  passwordMessage.value = ''
  passwordStatus.value = ''
  strengthLevel.value = 'none'
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
/* ════════════════════════════════════════════════════
   BASE & RESET
   ════════════════════════════════════════════════════ */
* {
  box-sizing: border-box;
  font-family: 'Segoe UI', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
}

/* ════════════════════════════════════════════════════
   PAGE CONTAINER
   ════════════════════════════════════════════════════ */
.admin-profile-page {
  position: relative;
  min-height: 100vh;
  padding: 32px;
  background: linear-gradient(160deg, #f0f4f8 0%, #e9eef5 30%, #e2e8f0 60%, #eef2ff 100%);
  overflow-x: hidden;
}

/* Decorative background blobs */
.admin-profile-page::before {
  content: '';
  position: fixed;
  top: -25%;
  right: -10%;
  width: 700px;
  height: 700px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.admin-profile-page::after {
  content: '';
  position: fixed;
  bottom: -20%;
  left: -8%;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ════════════════════════════════════════════════════
   PAGE HEADER
   ════════════════════════════════════════════════════ */
.page-header {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto 0;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 28px;
  background: linear-gradient(135deg, #1e3a5f 0%, #1a365d 20%, #1e40af 60%, #1d4ed8 100%);
  box-shadow:
    0 4px 20px rgba(30, 58, 95, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-header-bg {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

.page-header-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 32px;
}

.page-header-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: #fff;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.page-header-text {
  flex: 1;
  min-width: 0;
}

.page-header-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.3px;
}

.page-header-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.82rem;
  margin: 4px 0 0;
  line-height: 1.4;
}

.page-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 18px;
  border-radius: 20px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #6ee7b7;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
}

.badge-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}

/* ════════════════════════════════════════════════════
   LOADING & ERROR STATES
   ════════════════════════════════════════════════════ */
.state-card {
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
  padding: 56px 40px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 18px rgba(15, 23, 42, 0.04);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* Spinner Ring */
.spinner-ring {
  position: relative;
  width: 56px;
  height: 56px;
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  animation: spin-ring 1.2s linear infinite;
}

.ring:nth-child(1) {
  border-top-color: #1565d8;
  animation-delay: 0s;
}

.ring:nth-child(2) {
  inset: 6px;
  border-right-color: #6366f1;
  animation-duration: 1.5s;
  animation-delay: 0.15s;
}

.ring:nth-child(3) {
  inset: 12px;
  border-bottom-color: #10b981;
  animation-duration: 1.8s;
  animation-delay: 0.3s;
}

@keyframes spin-ring {
  to { transform: rotate(360deg); }
}

.state-text {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.error-state-card .state-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fef2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.error-icon i {
  font-size: 1.5rem;
  color: #dc2626;
}

.error-text {
  margin-bottom: 20px;
  color: #6b7280;
}

/* ════════════════════════════════════════════════════
   ALERTS
   ════════════════════════════════════════════════════ */
.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
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

.alert-icon {
  flex-shrink: 0;
  font-size: 1.2rem;
  display: flex;
}

.alert-text {
  flex: 1;
}

.alert-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: inherit;
  opacity: 0.5;
  transition: all 0.15s ease;
  font-size: 0.75rem;
}

.alert-close:hover {
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.05);
}

.alert-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  opacity: 0.2;
  animation: alert-shrink 4s linear forwards;
}

@keyframes alert-shrink {
  from { width: 100%; }
  to { width: 0%; }
}

/* ════════════════════════════════════════════════════
   PROFILE CARD
   ════════════════════════════════════════════════════ */
.profile-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 6px 18px rgba(15, 23, 42, 0.04),
    0 20px 40px rgba(15, 23, 42, 0.03);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.profile-card:hover {
  border-color: #cbd5e1;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 8px 24px rgba(15, 23, 42, 0.06),
    0 24px 48px rgba(15, 23, 42, 0.04);
}

/* Cover */
.profile-cover {
  height: 100px;
  background: linear-gradient(135deg, #1e3a5f, #1e40af, #3b82f6);
  position: relative;
  overflow: hidden;
}

.cover-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 30% 40%, rgba(255,255,255,0.08) 0%, transparent 40%),
    radial-gradient(circle at 70% 60%, rgba(255,255,255,0.05) 0%, transparent 35%),
    repeating-linear-gradient(45deg, transparent 0px, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 11px);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.15));
}

/* Body */
.profile-body {
  display: flex;
  align-items: flex-start;
  gap: 28px;
  padding: 28px 32px 24px;
  position: relative;
}

/* ─── Avatar ─── */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: -56px;
  flex-shrink: 0;
  position: relative;
}

.avatar-wrapper {
  position: relative;
  width: 96px;
  height: 96px;
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  pointer-events: none;
}

.avatar {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  overflow: hidden;
  cursor: default;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.avatar--clickable {
  cursor: zoom-in;
}

.avatar:hover .avatar-overlay {
  opacity: 1;
}

.avatar--clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  color: #ffffff;
  font-size: 1.3rem;
  opacity: 0;
  transition: opacity 0.25s ease;
  backdrop-filter: blur(2px);
  cursor: pointer;
}

.avatar-zoom-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.4);
  color: #ffffff;
  font-size: 1.2rem;
  opacity: 0;
  transition: opacity 0.25s ease;
  backdrop-filter: blur(2px);
}

.avatar--clickable:hover .avatar-zoom-icon {
  opacity: 1;
}

.avatar--clickable:hover .avatar-overlay {
  opacity: 0;
}

.avatar-upload-btn {
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-family: inherit;
  white-space: nowrap;
}

.avatar-upload-btn:hover:not(:disabled) {
  color: #1565d8;
  background: rgba(21, 101, 216, 0.06);
  transform: translateY(-1px);
}

.avatar-upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Profile Info List ─── */
.profile-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.info-row:hover {
  background: #ffffff;
  border-color: #e2e8f0;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.info-row--header {
  background: linear-gradient(135deg, #f0f4ff, #e8f0fe);
  border-color: #d0e0ff;
}

.info-row--header:hover {
  background: linear-gradient(135deg, #e8f0fe, #dce8fc);
  border-color: #b8d0ff;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  flex-shrink: 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.info-row:hover .info-icon {
  transform: scale(1.08);
}

.info-icon--user {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
}

.info-icon--id {
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  color: #4338ca;
}

.info-icon--email {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #059669;
}

.info-icon--gen {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.info-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-value--name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.2px;
}

/* ════════════════════════════════════════════════════
   CONTENT GRID
   ════════════════════════════════════════════════════ */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

/* ════════════════════════════════════════════════════
   FORM CARDS
   ════════════════════════════════════════════════════ */
.form-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 6px 18px rgba(15, 23, 42, 0.04);
  transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
}

.form-card:hover {
  border-color: #cbd5e1;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.04),
    0 8px 24px rgba(15, 23, 42, 0.06),
    0 20px 40px rgba(15, 23, 42, 0.03);
  transform: translateY(-2px);
}

/* Card Header */
.form-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 12px;
}

.form-card-header-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.form-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #2563eb;
  flex-shrink: 0;
  border: 1px solid #bfdbfe;
}

.form-card-icon--lock {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
  border-color: #fcd34d;
}

.form-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.form-card-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0;
}

.chip {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}

/* ─── Form Grid ─── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.field-label i {
  font-size: 0.85rem;
  color: #94a3b8;
}

.field-input-wrapper {
  position: relative;
}

input {
  width: 100%;
  padding: 11px 14px;
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

input:hover {
  border-color: #94a3b8;
  background: #ffffff;
}

input:focus {
  border-color: #1565d8;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(21, 101, 216, 0.1);
}

input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.input-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: #f1f5f9 !important;
}

.input-disabled:hover {
  border-color: #e2e8f0 !important;
  background: #f1f5f9 !important;
}

/* ─── Password Input ─── */
.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  right: 6px;
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
  cursor: pointer;
  border-radius: 9px;
  transition: all 0.2s ease;
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

.password-input-wrapper input:focus ~ .password-toggle {
  color: #1565d8;
}

/* ─── Strength Indicator ─── */
.strength-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.strength-bar {
  flex: 1;
  height: 5px;
  border-radius: 10px;
  background: #e2e8f0;
  overflow: hidden;
}

.strength-bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease, background 0.3s ease;
}

.strength--weak {
  background: #ef4444;
}

.strength--fair {
  background: #f59e0b;
}

.strength--strong {
  background: #10b981;
}

.strength--very-strong {
  background: #059669;
}

.strength-label {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  min-width: 70px;
  text-align: right;
}

.strength--weak { color: #dc2626; }
.strength--fair { color: #d97706; }
.strength--strong { color: #059669; }
.strength--very-strong { color: #047857; }

/* ─── Match Indicator ─── */
.match-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 500;
}

.match-yes {
  color: #059669;
}

.match-no {
  color: #dc2626;
}

.match-yes i, .match-no i {
  font-size: 0.9rem;
}

/* ─── Password Message ─── */
.password-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.password-message.success {
  color: #065f46;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.password-message.error {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.password-message i {
  font-size: 1rem;
  flex-shrink: 0;
}

/* ─── Footer ─── */
.form-card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

/* ════════════════════════════════════════════════════
   BUTTONS
   ════════════════════════════════════════════════════ */
.btn {
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  font-family: inherit;
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
  transform: translateY(-1px);
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

.spinner-border {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
}

/* ════════════════════════════════════════════════════
   FULL-SCREEN AVATAR VIEWER
   ════════════════════════════════════════════════════ */
.avatar-viewer {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: zoom-out;
}

.viewer-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 20px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.08);
  cursor: default;
  animation: viewerReveal 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes viewerReveal {
  from {
    transform: scale(0.9) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
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
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.viewer-close:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.08) rotate(90deg);
}

.viewer-close:active {
  transform: scale(0.95);
}

/* ════════════════════════════════════════════════════
   ANIMATIONS
   ════════════════════════════════════════════════════ */

/* Fade Slide */
.fade-slide-enter-active {
  transition: all 0.4s ease-out;
}
.fade-slide-leave-active {
  transition: all 0.25s ease-in;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Stagger - for TransitionGroup */
.stagger-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.stagger-leave-active {
  transition: all 0.25s ease-in;
}
.stagger-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}
.stagger-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.stagger-move {
  transition: transform 0.4s ease;
}

/* Alert Slide */
.alert-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.alert-slide-leave-active {
  transition: all 0.2s ease-in;
}
.alert-slide-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.96);
}
.alert-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

/* Strength fade */
.strength-fade-enter-active {
  transition: all 0.25s ease-out;
}
.strength-fade-leave-active {
  transition: all 0.15s ease-in;
}
.strength-fade-enter-from,
.strength-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Viewer fade */
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

/* ════════════════════════════════════════════════════
   SCREEN READER ONLY
   ════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════
   RESPONSIVE
   ════════════════════════════════════════════════════ */
@media (max-width: 1100px) {
  .admin-profile-page {
    padding: 24px;
  }

  .profile-info {
    gap: 4px;
  }
}

@media (max-width: 900px) {
  .admin-profile-page {
    padding: 20px;
  }

  .page-header-content {
    padding: 20px 24px;
    flex-wrap: wrap;
  }

  .page-header-badge {
    width: 100%;
    justify-content: center;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .profile-body {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px 24px 20px;
  }

  .profile-info {
    width: 100%;
    padding-top: 4px;
  }

  .profile-card {
    padding: 0;
  }

  .form-card {
    padding: 24px 20px;
  }

  .profile-cover {
    height: 80px;
  }
}

@media (max-width: 600px) {
  .admin-profile-page {
    padding: 16px;
  }

  .page-header-content {
    padding: 16px 18px;
    gap: 14px;
  }

  .page-header-icon {
    width: 44px;
    height: 44px;
    font-size: 1.2rem;
    border-radius: 12px;
  }

  .page-header-title {
    font-size: 1.1rem;
  }

  .page-header-subtitle {
    font-size: 0.75rem;
  }

  .profile-body {
    padding: 16px 18px 16px;
    gap: 16px;
  }

  .avatar-wrapper {
    width: 80px;
    height: 80px;
  }

  .avatar-ring {
    inset: -3px;
    border-width: 2px;
  }

  .profile-info {
    width: 100%;
    gap: 4px;
  }

  .info-row {
    padding: 10px 14px;
    gap: 12px;
  }

  .info-icon {
    width: 34px;
    height: 34px;
    font-size: 0.9rem;
    border-radius: 10px;
  }

  .info-value {
    font-size: 13px;
  }

  .info-value--name {
    font-size: 14px;
  }

  .profile-cover {
    height: 64px;
  }
}

@media (max-width: 420px) {
  .admin-profile-page {
    padding: 12px;
  }

  .page-header-content {
    padding: 14px 14px;
  }

  .page-header-title {
    font-size: 1rem;
  }

  .form-card-header {
    flex-direction: column;
  }

  .chip {
    margin-top: 0;
  }

  .form-card-footer {
    flex-direction: column;
  }

  .form-card-footer .btn {
    width: 100%;
  }

  .info-row {
    padding: 10px 12px;
    gap: 10px;
  }

  .info-icon {
    width: 30px;
    height: 30px;
    font-size: 0.85rem;
  }

  .info-value {
    font-size: 12px;
  }
}
</style>
