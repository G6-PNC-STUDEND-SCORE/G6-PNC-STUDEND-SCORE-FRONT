<template>
  <div class="profile-page">
    <div v-if="loading && !cachedProfile" class="load-state">
      <div class="spinner"></div>
      <span>Loading profile…</span>
    </div>

    <div v-else-if="fetchError" class="error-card">
      <div class="error-card-inner">
        <div class="error-icon"><AlertTriangle :size="22" /></div>
        <h5>Failed to Load Profile</h5>
        <p>{{ fetchError }}</p>
        <button class="retry-btn" @click="loadProfile">
          <RefreshCw :size="14" /> Retry
        </button>
      </div>
    </div>

    <template v-else>
      <div class="profile-card">
        <!-- Success/Error Alerts -->
        <div v-if="successMessage" class="alert alert-success">
          <CheckCircle :size="16" />
          <span>{{ successMessage }}</span>
          <button class="alert-close" @click="successMessage = ''">&times;</button>
        </div>
        <div v-if="saveError" class="alert alert-error">
          <AlertTriangle :size="16" />
          <span>{{ saveError }}</span>
          <button class="alert-close" @click="saveError = ''">&times;</button>
        </div>

        <!-- Scrollable Content Wrapper -->
        <div class="profile-content-wrap">
          <!-- Profile Header Section -->
          <div class="profile-header-section">
            <div class="profile-avatar-wrap">
              <div class="avatar-container" @click="triggerUpload" role="button" tabindex="0" @keydown.prevent.enter="triggerUpload">
                <div class="avatar-circle">
                  <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" @error="onAvatarError" />
                  <span v-else class="avatar-text">{{ initials }}</span>
                  <div class="avatar-hover-overlay">
                    <Camera :size="16" />
                  </div>
                </div>
                <div v-if="avatarUploading" class="avatar-uploading-loader">
                  <span class="spinner-sm"></span>
                </div>
              </div>
            </div>
            <div class="profile-title-info">
              <h2 class="user-display-name">{{ form.name || 'User' }}</h2>
              <div class="user-meta-badges">
                <span class="badge badge-role" :class="form.role">{{ form.role ? form.role.toUpperCase() : 'USER' }}</span>
                <span class="badge badge-status" :class="form.status">{{ statusLabel }}</span>
                <span v-if="form.emailVerifiedAt" class="badge badge-verified"><BadgeCheck :size="12" /> VERIFIED</span>
                <span v-else class="badge badge-unverified">UNVERIFIED</span>
                <span v-if="form.permissions.length" class="badge badge-perm-count"><Shield :size="12" /> {{ form.permissions.length }} PERMISSIONS</span>
              </div>
            </div>
            <button class="btn btn-primary" @click="showEditModal = true">
              <Pencil :size="14" /> Edit Profile
            </button>
          </div>

          <!-- Section Divider -->
          <div class="section-divider"></div>

          <!-- Personal & Account Details Section (2 Boxes Side-by-Side) -->
          <div class="profile-section">
            <div class="two-boxes-wrapper">
              <!-- Box 1: Personal Details -->
              <div class="detail-card-box">
                <div class="card-box-header">
                  <div class="box-header-icon personal-icon">
                    <Contact :size="16" />
                  </div>
                  <div class="box-header-title-wrap">
                    <h3 class="box-header-title">Personal Details</h3>
                    <span class="box-header-subtitle">Basic identity and contact info</span>
                  </div>
                </div>
                <div class="box-fields-grid">
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <UserIcon :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">Full Name</span>
                      <span class="field-value" :title="form.name">{{ form.name || 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <Mail :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">Email Address</span>
                      <span class="field-value" :title="form.email">{{ form.email || 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <Hash :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">Account ID</span>
                      <span class="field-value">{{ formattedUserId }}</span>
                    </div>
                  </div>
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <Phone :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">Phone Number</span>
                      <span class="field-value">{{ form.phone || 'Not set' }}</span>
                    </div>
                  </div>
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <Users2 :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">Gender</span>
                      <span class="field-value">{{ form.gender || 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <Calendar :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">Date of Birth</span>
                      <span class="field-value">{{ formattedDob || '—' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Box 2: Account Details -->
              <div class="detail-card-box">
                <div class="card-box-header">
                  <div class="box-header-icon account-icon">
                    <Clock :size="16" />
                  </div>
                  <div class="box-header-title-wrap">
                    <h3 class="box-header-title">Account Details</h3>
                    <span class="box-header-subtitle">Activity, privileges & history</span>
                  </div>
                </div>
                <div class="box-fields-grid">
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <Shield :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">System Role</span>
                      <span class="field-value">{{ form.role ? form.role.toUpperCase() : 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <BadgeCheck :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">Email Status</span>
                      <span class="field-value" :class="{ 'text-success': form.emailVerifiedAt }">
                        {{ emailVerifiedLabel }}
                      </span>
                    </div>
                  </div>
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <Calendar :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">Member Since</span>
                      <span class="field-value">{{ formattedJoined || 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <Clock :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">Last Login</span>
                      <span class="field-value" :title="formattedLastLogin">{{ relativeLastLogin }}</span>
                    </div>
                  </div>
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <ShieldCheck :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">Account Age</span>
                      <span class="field-value">{{ accountAgeLabel }}</span>
                    </div>
                  </div>
                  <div class="box-field-item">
                    <div class="field-icon-square">
                      <FileText :size="14" />
                    </div>
                    <div class="field-text-group">
                      <span class="field-label">Granted Rules</span>
                      <span class="field-value">{{ form.permissions.length }} permission{{ form.permissions.length === 1 ? '' : 's' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Academic Details Section (Only if Student or Teacher info exists) -->
          <template v-if="(form.role === 'teacher' && teacherInfo) || (form.role === 'student' && studentInfo)">
            <div class="section-divider"></div>
            <div class="profile-section">
              <h3 class="section-title-label">Academic Details</h3>
              
              <!-- Student -->
              <div v-if="form.role === 'student' && studentInfo" class="icon-details-grid">
                <div class="icon-detail-item">
                  <div class="item-square-icon">
                    <FileText :size="15" />
                  </div>
                  <div class="item-text-stack">
                    <span class="item-label">Student ID</span>
                    <span class="item-value">{{ studentInfo.student_id_number || 'N/A' }}</span>
                  </div>
                </div>
                <div class="icon-detail-item">
                  <div class="item-square-icon">
                    <Users2 :size="15" />
                  </div>
                  <div class="item-text-stack">
                    <span class="item-label">Class</span>
                    <span class="item-value">{{ studentInfo.class || 'N/A' }}</span>
                  </div>
                </div>
                <div class="icon-detail-item">
                  <div class="item-square-icon">
                    <Calendar :size="15" />
                  </div>
                  <div class="item-text-stack">
                    <span class="item-label">Generation</span>
                    <span class="item-value">{{ studentInfo.generation || 'N/A' }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Teacher -->
              <div v-if="form.role === 'teacher' && teacherInfo" class="icon-details-grid">
                <div class="icon-detail-item">
                  <div class="item-square-icon">
                    <FileText :size="15" />
                  </div>
                  <div class="item-text-stack">
                    <span class="item-label">Department</span>
                    <span class="item-value">{{ teacherInfo.department || 'N/A' }}</span>
                  </div>
                </div>
                <div class="icon-detail-item full-width">
                  <div class="item-square-icon">
                    <Users2 :size="15" />
                  </div>
                  <div class="item-text-stack">
                    <span class="item-label">Classes Taught</span>
                    <div class="badge-chips">
                      <span v-for="cls in teacherInfo.classes" :key="cls" class="chip-item">{{ cls }}</span>
                      <span v-if="!teacherInfo.classes?.length" class="chip-empty">None</span>
                    </div>
                  </div>
                </div>
                <div class="icon-detail-item full-width">
                  <div class="item-square-icon">
                    <FileText :size="15" />
                  </div>
                  <div class="item-text-stack">
                    <span class="item-label">Subjects</span>
                    <div class="badge-chips">
                      <span v-for="sub in teacherInfo.subjects" :key="sub" class="chip-item">{{ sub }}</span>
                      <span v-if="!teacherInfo.subjects?.length" class="chip-empty">None</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- About Me Section -->
          <div class="section-divider"></div>
          <div class="profile-section">
            <div class="detail-card-box bio-card-box">
              <div class="card-box-header">
                <div class="box-header-icon bio-icon">
                  <FileText :size="16" />
                </div>
                <div class="box-header-title-wrap">
                  <h3 class="box-header-title">About Me</h3>
                  <span class="box-header-subtitle">Personal biography and notes</span>
                </div>
              </div>
              <div class="bio-box-content">
                <p v-if="form.bio" class="bio-paragraph">{{ form.bio }}</p>
                <div v-else class="bio-empty-box">
                  <span class="bio-empty-text">No bio details set yet. Click <strong>Edit Profile</strong> to add a bio.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Security & Password Section -->
          <div class="section-divider"></div>
          <div class="profile-section" style="padding-bottom: 32px;">
            <div class="detail-card-box security-card-box">
              <div class="card-box-header">
                <div class="box-header-icon security-icon">
                  <ShieldCheck :size="16" />
                </div>
                <div class="box-header-title-wrap">
                  <h3 class="box-header-title">Security & Password</h3>
                  <span class="box-header-subtitle">Update your account authentication credentials</span>
                </div>
              </div>
              <div class="password-form-compact">
                <div class="form-inputs-row">
                  <div class="pw-field">
                    <label class="pw-label">Current Password</label>
                    <div class="pw-wrapper">
                      <input :type="showCurrent ? 'text' : 'password'" v-model="password.current" placeholder="••••••••" />
                      <button class="pw-toggle-btn" @click="showCurrent = !showCurrent" type="button">
                        <Eye v-if="!showCurrent" :size="14" />
                        <EyeOff v-else :size="14" />
                      </button>
                    </div>
                  </div>
                  <div class="pw-field">
                    <label class="pw-label">New Password</label>
                    <div class="pw-wrapper">
                      <input :type="showNew ? 'text' : 'password'" v-model="password.new" placeholder="••••••••" />
                      <button class="pw-toggle-btn" @click="showNew = !showNew" type="button">
                        <Eye v-if="!showNew" :size="14" />
                        <EyeOff v-else :size="14" />
                      </button>
                    </div>
                  </div>
                  <div class="pw-field">
                    <label class="pw-label">Confirm Password</label>
                    <div class="pw-wrapper">
                      <input :type="showConfirm ? 'text' : 'password'" v-model="password.confirm" placeholder="••••••••" />
                      <button class="pw-toggle-btn" @click="showConfirm = !showConfirm" type="button">
                        <Eye v-if="!showConfirm" :size="14" />
                        <EyeOff v-else :size="14" />
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="passwordMessage" class="pw-status-msg" :class="passwordStatus === 'success' ? 'success' : 'error'">
                  {{ passwordMessage }}
                </div>

                <div class="pw-submit-actions">
                  <button class="btn btn-reset" @click="resetPassword" type="button">Clear</button>
                  <button class="btn btn-save" @click="updatePassword" :disabled="passwordSaving" type="button">
                    <span v-if="passwordSaving" class="spinner-sm"></span>
                    <span v-else>Update Password</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
          <div class="modal-content-panel">
            <div class="modal-head">
              <div class="modal-icon icon-edit">
                <SquarePen :size="18" />
              </div>
              <div>
                <h3>Edit Profile</h3>
                <p>Update your personal information</p>
              </div>
              <button class="modal-x" @click="showEditModal = false">&times;</button>
            </div>

            <form @submit.prevent="saveProfile">
              <div class="modal-body-custom">
                <div class="edit-grid">
                  <div class="form-group">
                    <label class="form-label"><UserIcon :size="14" class="me-1" /> Full Name</label>
                    <div class="input-wrapper">
                      <input type="text" v-model="form.name" class="modern-input" placeholder="Your full name" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label"><Mail :size="14" class="me-1" /> Email Address</label>
                    <div class="input-wrapper">
                      <input type="email" v-model="form.email" class="modern-input" placeholder="you@example.com" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label"><Users2 :size="14" class="me-1" /> Gender</label>
                    <div class="input-wrapper">
                      <select v-model="form.gender" class="modern-input">
                        <option value="">N/A</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label"><Calendar :size="14" class="me-1" /> Date of Birth</label>
                    <div class="input-wrapper">
                      <input type="date" v-model="form.dateOfBirth" class="modern-input" />
                    </div>
                  </div>
                  <div class="form-group" style="grid-column: 1 / -1;">
                    <label class="form-label"><FileText :size="14" class="me-1" /> Bio</label>
                    <div class="input-wrapper">
                      <textarea v-model="form.bio" class="modern-input" rows="3" placeholder="A short note about yourself..."></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="resetForm; showEditModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  <span v-if="saving" class="spinner-sm"></span>
                  <Check v-else :size="16" />
                  {{ saving ? 'Saving…' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" class="sr-only" @change="onFileChange" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getProfile, updateProfile, uploadAvatar, type UserProfile, type ProfileTeacherInfo, type ProfileStudentInfo } from '@/services/profileService'
import { storageUrl } from '@/services/apiHttp'
import { http } from '@/services/apiHttp'
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Camera,
  Mail,
  ShieldCheck,
  Pencil,
  Calendar,
  Clock,
  SquarePen,
  UserIcon,
  Check,
  FileText,
  Users2,
  Eye,
  EyeOff,
  Contact,
  Phone,
  Hash,
  BadgeCheck,
  Shield,
} from '@lucide/vue'

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
let currentPreviewUrl: string | null = null

const loading = ref(!cachedProfile || isProfileCacheStale())
const saving = ref(false)
const fetchError = ref('')
const saveError = ref('')
const successMessage = ref('')
const avatarUploading = ref(false)
const showEditModal = ref(false)

const form = reactive({
  id: null as number | null,
  name: '',
  email: '',
  phone: '',
  emailVerifiedAt: '',
  gender: '',
  dateOfBirth: '',
  bio: '',
  role: '',
  status: '',
  joined: '',
  lastLogin: '',
  permissions: [] as string[],
})


const originalForm = reactive({
  name: '',
  email: '',
  gender: '',
  dateOfBirth: '',
  bio: '',
})

const teacherInfo = ref<ProfileTeacherInfo | null>(null)
const studentInfo = ref<ProfileStudentInfo | null>(null)

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

const roleBadgeClass = computed(() => {
  if (form.role === 'admin') return 'role-admin'
  if (form.role === 'teacher') return 'role-teacher'
  if (form.role === 'student') return 'role-student'
  return ''
})

const initials = computed(() => {
  if (!form.name) return 'U'
  return form.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const formattedJoined = computed(() => formatDate(form.joined, { year: 'numeric', month: 'long' }))
const formattedDob = computed(() => formatDate(form.dateOfBirth, { year: 'numeric', month: 'long', day: 'numeric' }))
const formattedLastLogin = computed(() => formatDate(form.lastLogin, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))

const formattedUserId = computed(() => {
  if (!form.id) return 'N/A'
  return `#USR-${String(form.id).padStart(3, '0')}`
})

const emailVerifiedLabel = computed(() => {
  return form.emailVerifiedAt ? 'Verified' : 'Unverified'
})

function formatDate(value: string, options: Intl.DateTimeFormatOptions): string {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', options)
}

function normalizeEmpty(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

const statusLabel = computed(() => {
  if (!form.status) return 'Active'
  return form.status.charAt(0).toUpperCase() + form.status.slice(1)
})

const statusBadgeClass = computed(() => {
  if (form.status === 'suspended') return 'status-suspended'
  if (form.status === 'inactive') return 'status-inactive'
  return 'status-active'
})

const accountAgeLabel = computed(() => {
  if (!form.joined) return 'N/A'
  const joined = new Date(form.joined)
  if (isNaN(joined.getTime())) return 'N/A'
  const days = Math.max(0, Math.floor((Date.now() - joined.getTime()) / 86_400_000))
  if (days < 1) return 'Today'
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`
  if (days < 365) { const m = Math.floor(days / 30); return `${m} month${m === 1 ? '' : 's'}` }
  const y = Math.floor(days / 365)
  return `${y} year${y === 1 ? '' : 's'}`
})

const relativeLastLogin = computed(() => {
  if (!form.lastLogin) return 'Never'
  const last = new Date(form.lastLogin)
  if (isNaN(last.getTime())) return 'Never'
  const seconds = Math.max(0, Math.floor((Date.now() - last.getTime()) / 1000))
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(form.lastLogin, { year: 'numeric', month: 'short', day: 'numeric' })
})

function applyProfile(profile: UserProfile) {
  form.id = profile.id ?? null
  form.name = profile.name || ''
  form.email = profile.email || ''
  form.phone = (profile as unknown as Record<string, string>).phone || ''
  form.emailVerifiedAt = profile.email_verified_at || ''
  form.gender = profile.gender || ''
  form.dateOfBirth = profile.date_of_birth || ''
  form.bio = profile.bio || ''
  form.role = profile.role || ''
  form.status = profile.status || ''
  form.joined = profile.created_at || ''
  form.lastLogin = profile.last_login_at || ''
  form.permissions = profile.permissions || []
  teacherInfo.value = profile.teacher_info || null
  studentInfo.value = profile.student_info || null
  Object.assign(originalForm, {
    name: form.name,
    email: form.email,
    phone: form.phone,
    gender: form.gender,
    dateOfBirth: form.dateOfBirth,
    bio: form.bio,
  })
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
      name: normalizeEmpty(form.name) ?? form.name,
      email: normalizeEmpty(form.email) ?? form.email,
      gender: normalizeEmpty(form.gender) as 'Male' | 'Female' | 'Other' | null,
      date_of_birth: normalizeEmpty(form.dateOfBirth),
      bio: normalizeEmpty(form.bio),
    })

    invalidateProfileCache()
    cachedProfile = updated
    profileCacheTime = Date.now()
    applyProfile(updated)
    if (auth.user) {
      auth.user = {
        ...auth.user,
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar ?? auth.user.avatar,
      }
    }
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
  form.gender = originalForm.gender
  form.dateOfBirth = originalForm.dateOfBirth
  form.bio = originalForm.bio
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

  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl)
  }
  const previewUrl = URL.createObjectURL(file)
  currentPreviewUrl = previewUrl
  avatarUrl.value = previewUrl
  avatarUploading.value = true
  saveError.value = ''

  try {
    const result = await uploadAvatar(file)
    if (auth.user) {
      auth.user.avatar = result.avatar
    }
    successMessage.value = 'Photo uploaded successfully!'
    setTimeout(() => { successMessage.value = '' }, 4000)
  } catch (e: unknown) {
    avatarUrl.value = ''
    const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
    saveError.value = err.response?.data?.message || err.message || 'Failed to upload photo'
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

function onAvatarError() {
  if (!avatarUploading.value) {
    avatarUrl.value = ''
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
  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl)
    currentPreviewUrl = null
  }
})
</script>

<style scoped>
.profile-page,
.profile-page button,
.profile-page input,
.profile-page select,
.profile-page textarea,
.profile-page h1,
.profile-page h2,
.profile-page h3,
.profile-page h4,
.profile-page h5,
.profile-page h6,
.profile-page span,
.profile-page p,
.profile-page div {
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.profile-page {
  height: calc(100vh - 96px);
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  background: var(--color-bg);
}

.profile-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  flex: 1;
  height: 1px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: box-shadow var(--transition-normal);
}

.profile-card:hover {
  box-shadow: var(--shadow-md);
}

.profile-content-wrap {
  width: 100%;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

/* Webkit Scrollbar */
.profile-content-wrap::-webkit-scrollbar {
  width: 6px;
}

.profile-content-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.profile-content-wrap::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.profile-content-wrap::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Header Section */
.profile-header-section {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 24px 16px;
}

.profile-avatar-wrap {
  flex-shrink: 0;
}

.avatar-container {
  position: relative;
  cursor: pointer;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
}

.avatar-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
}

.avatar-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  opacity: 0;
  transition: opacity 0.2s ease;
  border-radius: 50%;
}

.avatar-container:hover .avatar-hover-overlay {
  opacity: 1;
}

.avatar-uploading-loader {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.profile-title-info {
  flex-grow: 1;
}

.user-display-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.01em;
}

.user-meta-badges {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge.admin {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.badge.teacher {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}

.badge.student {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}

.badge.active {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
}

.badge.inactive {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

.badge.suspended {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.badge-verified {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
  border: 1px solid rgba(22, 163, 74, 0.2);
}

.badge-unverified {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.badge-perm-count {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.text-success {
  color: #16a34a !important;
}

.btn {
  font-family: var(--font-family);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-outline-edit {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  margin-left: auto;
}

.btn-outline-edit:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-text-muted);
  color: var(--color-text);
}

/* Dividers & Sections */
.section-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: 0;
}

.profile-content-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.profile-section {
  padding: 18px 24px;
}

.section-title-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 16px;
  letter-spacing: -0.01em;
}

/* 2 Boxes Side-by-Side Wrapper */
.two-boxes-wrapper {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
}

/* Individual Card Box - Compact & Sleek */
.detail-card-box {
  background: var(--color-bg-card, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.detail-card-box:hover {
  border-color: rgba(37, 99, 235, 0.3);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

/* Card Box Header */
.card-box-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border-light, #f1f5f9);
}

.box-header-icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.box-header-icon.personal-icon {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(59, 130, 246, 0.06));
  color: var(--color-primary, #2563eb);
}

.box-header-icon.account-icon {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(20, 184, 166, 0.06));
  color: #10b981;
}

.box-header-icon.security-icon {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(248, 113, 113, 0.06));
  color: #ef4444;
}

.box-header-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.box-header-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text, #0f172a);
  margin: 0;
  letter-spacing: -0.01em;
}

.box-header-subtitle {
  font-size: 0.68rem;
  color: var(--color-text-secondary, #64748b);
}

/* Grid of Field Items inside each Box */
.box-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 10px;
  align-content: start;
  flex: 1;
}

.box-field-item {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  min-height: 36px;
  padding: 7px 8px;
  border-radius: 9px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border: 1px solid var(--color-border-light, #eef2f7);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  transition: all 0.18s ease;
}

.box-field-item:hover {
  background: #ffffff;
  border-color: rgba(37, 99, 235, 0.18);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.05);
  transform: translateY(-1px);
}

.field-icon-square {
  width: 26px;
  height: 26px;
  background: var(--color-bg-hover, #f8fafc);
  border: 1px solid var(--color-border-light, #eef2f7);
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary, #64748b);
  flex-shrink: 0;
  line-height: 1;
  margin-top: 0;
}

.field-text-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-top: 1px;
  min-width: 0;
  overflow: hidden;
}

.field-label {
  font-size: 0.66rem;
  font-weight: 700;
  color: var(--color-text-secondary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.045em;
  line-height: 1.1;
}

.field-value {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--color-text, #0f172a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

/* 2-Column Icon Details Grid */
.icon-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 32px;
}

.icon-detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-detail-item.full-width {
  grid-column: 1 / -1;
}

.item-square-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.item-text-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-label {
  font-size: 0.675rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.item-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.badge-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-item {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 100px;
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.chip-empty {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-style: italic;
}

/* Bio Section Box */
.box-header-icon.bio-icon {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(192, 132, 252, 0.06));
  color: #a855f7;
}

.bio-box-content {
  padding: 10px 12px;
  background: var(--color-bg-hover, #f8fafc);
  border: 1px solid var(--color-border-light, #f1f5f9);
  border-radius: 8px;
  min-height: 52px;
  display: flex;
  align-items: center;
}

.bio-paragraph {
  font-size: 0.85rem;
  color: var(--color-text, #0f172a);
  line-height: 1.5;
  margin: 0;
  white-space: pre-line;
}

.bio-empty-box {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.bio-empty-text {
  font-size: 0.8rem;
  color: var(--color-text-secondary, #64748b);
  font-style: italic;
  margin: 0;
}

/* Security & Password */
.password-form-compact {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-inputs-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.pw-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pw-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.pw-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.pw-wrapper input {
  width: 100%;
  padding: 8px 36px 8px 12px;
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.pw-wrapper input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.pw-toggle-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.pw-toggle-btn:hover {
  color: var(--color-primary);
}

.pw-status-msg {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 6px;
}

.pw-status-msg.success {
  background: rgba(22, 163, 74, 0.1);
  color: #16a34a;
  border: 1px solid rgba(22, 163, 74, 0.15);
}

.pw-status-msg.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.pw-submit-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-reset {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.btn-reset:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.btn-save {
  background: var(--color-primary);
  border: none;
  color: #ffffff;
}

.btn-save:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner */
.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Alerts */
.alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  margin: 16px 28px 0;
}

.alert-success {
  background: rgba(22, 163, 74, 0.1);
  color: #166534;
  border: 1px solid rgba(22, 163, 74, 0.15);
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  color: #991b1b;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.5;
  color: inherit;
}

.alert-close:hover {
  opacity: 1;
}

/* Hidden file input */
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

/* Edit Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
  z-index: 1000;
}

.modal-content-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border-light);
}

.modal-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 99, 235, 0.1);
  color: var(--color-primary);
}

.modal-head h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.modal-head p {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 2px 0 0;
}

.modal-x {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.modal-x:hover {
  opacity: 1;
}

.modal-body-custom {
  padding: 14px 18px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.edit-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.form-group .modern-input {
  width: 100%;
  padding: 9px 12px;
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-bg-card);
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-group .modern-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-bg-hover);
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.btn-ghost {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
}

.btn-ghost:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text);
}

.btn-primary {
  background: var(--color-primary);
  border: none;
  color: #ffffff;
  white-space: nowrap;
  padding-inline: 12px;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

/* Responsive */
@media (max-width: 900px) {
  .two-boxes-wrapper {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .box-fields-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .icon-details-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .form-inputs-row {
    grid-template-columns: 1fr;
  }
  .profile-header-section {
    flex-direction: column;
    text-align: center;
  }
  .btn-outline-edit {
    margin-left: 0;
    margin-top: 12px;
  }
  .user-meta-badges {
    justify-content: center;
  }
}

@media (max-width: 580px) {
  .modal-foot {
    flex-direction: column;
    align-items: stretch;
  }
  .modal-foot .btn {
    width: 100%;
    justify-content: center;
  }
  .box-fields-grid {
    grid-template-columns: 1fr;
  }
}
</style>
