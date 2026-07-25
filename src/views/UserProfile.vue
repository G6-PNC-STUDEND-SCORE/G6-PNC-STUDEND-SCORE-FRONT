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

      <!-- ── Quick Stats ── -->
      <div class="stats-row">
        <div class="stat-tile">
          <div class="stat-icon icon-blue"><ShieldCheck :size="18" /></div>
          <div>
            <div class="stat-value">{{ form.role === 'admin' ? 'Administrator' : (form.role || '—') }}</div>
            <div class="stat-label">Role</div>
          </div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon icon-green"><CheckCircle :size="18" /></div>
          <div>
            <div class="stat-value">{{ statusLabel }}</div>
            <div class="stat-label">Account Status</div>
          </div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon icon-violet"><Calendar :size="18" /></div>
          <div>
            <div class="stat-value">{{ accountAgeLabel }}</div>
            <div class="stat-label">Member For</div>
          </div>
        </div>
        <div class="stat-tile">
          <div class="stat-icon icon-amber"><Clock :size="18" /></div>
          <div>
            <div class="stat-value">{{ relativeLastLogin }}</div>
            <div class="stat-label">Last Active</div>
          </div>
        </div>
      </div>

      <div class="profile-layout">
        <!-- ══════════ LEFT: Identity card ══════════ -->
        <aside class="profile-side">
          <div class="side-card">
            <div class="side-cover"></div>
            <div class="side-avatar-wrap">
              <div class="avatar avatar-xl" @click="triggerUpload" role="button" tabindex="0" @keydown.enter.prevent="triggerUpload" :title="avatarUploading ? 'Uploading…' : 'Change photo'">
                <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" @error="onAvatarError" />
                <span v-else>{{ initials }}</span>
                <div class="avatar-overlay">
                  <Camera :size="20" />
                </div>
                <div v-if="avatarUploading" class="avatar-spinner"><div class="spinner-sm"></div></div>
                <div v-if="form.emailVerifiedAt" class="avatar-verified-badge" title="Verified account">
                  <BadgeCheck :size="16" />
                </div>
              </div>
            </div>

            <h5 class="side-name">{{ form.name || 'User' }}</h5>
            <p class="side-email"><Mail :size="13" />{{ form.email || '—' }}</p>

            <div class="side-badges">
              <span class="role-badge" :class="roleBadgeClass">
                <ShieldCheck :size="12" />
                {{ form.role === 'admin' ? 'Administrator' : form.role || 'N/A' }}
              </span>
              <span class="status-badge" :class="statusBadgeClass">{{ statusLabel }}</span>
            </div>

            <button class="side-edit-btn" @click="showEditModal = true">
              <Pencil :size="14" /> Edit Profile
            </button>

            <div class="side-divider"></div>

            <ul class="side-meta">
              <li>
                <Calendar :size="15" />
                <span class="side-meta-label">Joined</span>
                <span class="side-meta-value">{{ formattedJoined || '—' }}</span>
              </li>
              <li>
                <Clock :size="15" />
                <span class="side-meta-label">Last login</span>
                <span class="side-meta-value">{{ formattedLastLogin || 'Never' }}</span>
              </li>
              <li>
                <CheckCircle v-if="form.emailVerifiedAt" :size="15" style="color: #16a34a;" />
                <AlertTriangle v-else :size="15" style="color: #dc2626;" />
                <span class="side-meta-label">Email</span>
                <span class="side-meta-value">{{ form.emailVerifiedAt ? 'Verified' : 'Unverified' }}</span>
              </li>
            </ul>
          </div>
        </aside>

        <!-- ══════════ RIGHT: Detail cards ══════════ -->
        <div class="profile-main">
          <!-- ── Personal Details ── -->
          <section class="info-card">
            <div class="info-card-head">
              <IdCard :size="16" />
              <span>Personal Details</span>
            </div>
            <div class="info-grid">
              <div class="info-field">
                <div class="info-field-icon"><UserIcon :size="14" /></div>
                <div>
                  <span class="info-label">Full Name</span>
                  <span class="info-value">{{ form.name || '—' }}</span>
                </div>
              </div>
              <div class="info-field">
                <div class="info-field-icon"><Mail :size="14" /></div>
                <div>
                  <span class="info-label">Email Address</span>
                  <span class="info-value">{{ form.email || '—' }}</span>
                </div>
              </div>
              <div class="info-field">
                <div class="info-field-icon"><Users2 :size="14" /></div>
                <div>
                  <span class="info-label">Gender</span>
                  <span class="info-value">{{ form.gender || '—' }}</span>
                </div>
              </div>
              <div class="info-field">
                <div class="info-field-icon"><Calendar :size="14" /></div>
                <div>
                  <span class="info-label">Date of Birth</span>
                  <span class="info-value">{{ formattedDob || '—' }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Bio ── -->
          <section class="info-card">
            <div class="info-card-head">
              <FileText :size="16" />
              <span>About</span>
            </div>
            <p v-if="form.bio" class="bio-text">{{ form.bio }}</p>
            <p v-else class="bio-empty">No bio added yet.</p>
          </section>

          <!-- ── Role-specific info ── -->
          <section v-if="form.role === 'teacher' && teacherInfo" class="info-card">
            <div class="info-card-head">
              <BookOpen :size="16" />
              <span>Teaching Info</span>
            </div>
            <div class="info-grid">
              <div class="info-field">
                <div class="info-field-icon"><Building :size="14" /></div>
                <div>
                  <span class="info-label">Department</span>
                  <span class="info-value">{{ teacherInfo.department || '—' }}</span>
                </div>
              </div>
              <div class="info-field info-field-wide">
                <span class="info-label">Assigned Classes</span>
                <span v-if="teacherInfo.classes.length === 0" class="info-value">—</span>
                <span v-else class="chip-list">
                  <span v-for="c in teacherInfo.classes" :key="c" class="chip">{{ c }}</span>
                </span>
              </div>
              <div class="info-field info-field-wide">
                <span class="info-label">Subjects Taught</span>
                <span v-if="teacherInfo.subjects.length === 0" class="info-value">—</span>
                <span v-else class="chip-list">
                  <span v-for="s in teacherInfo.subjects" :key="s" class="chip chip-violet">{{ s }}</span>
                </span>
              </div>
            </div>
          </section>

          <section v-else-if="form.role === 'student' && studentInfo" class="info-card">
            <div class="info-card-head">
              <GraduationCap :size="16" />
              <span>Academic Info</span>
            </div>
            <div class="info-grid">
              <div class="info-field">
                <div class="info-field-icon"><IdCard :size="14" /></div>
                <div>
                  <span class="info-label">Student ID</span>
                  <span class="info-value">{{ studentInfo.student_id_number || '—' }}</span>
                </div>
              </div>
              <div class="info-field">
                <div class="info-field-icon"><Users2 :size="14" /></div>
                <div>
                  <span class="info-label">Generation</span>
                  <span class="info-value">{{ studentInfo.generation || '—' }}</span>
                </div>
              </div>
              <div class="info-field">
                <div class="info-field-icon"><BookOpen :size="14" /></div>
                <div>
                  <span class="info-label">Class</span>
                  <span class="info-value">{{ studentInfo.class || '—' }}</span>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="form.role === 'admin'" class="info-card">
            <div class="info-card-head">
              <KeyRound :size="16" />
              <span>Access</span>
            </div>
            <div class="access-summary">
              <div class="access-count">
                <span class="access-count-value">{{ form.permissions.length }}</span>
                <span class="access-count-label">Permissions Granted</span>
              </div>
              <div class="chip-list">
                <span v-for="g in permissionGroups" :key="g.name" class="chip chip-blue">{{ g.name }} · {{ g.count }}</span>
              </div>
            </div>
          </section>

          <!-- ── Security ── -->
          <section class="info-card">
            <div class="info-card-head">
              <Lock :size="16" />
              <span>Security</span>
            </div>

            <div class="security-body">
              <div class="pw-group">
                <label>Current Password</label>
                <div class="pw-input-box">
                  <input :type="showCurrent ? 'text' : 'password'" v-model="password.current" placeholder="Enter current password" />
                  <button type="button" class="pw-eye" @click="showCurrent = !showCurrent">
                    <EyeIcon :size="16" v-if="!showCurrent" />
                    <EyeOff :size="16" v-else />
                  </button>
                </div>
              </div>
              <div class="pw-group">
                <label>New Password</label>
                <div class="pw-input-box">
                  <input :type="showNew ? 'text' : 'password'" v-model="password.new" placeholder="Min. 8 characters" />
                  <button type="button" class="pw-eye" @click="showNew = !showNew">
                    <EyeIcon :size="16" v-if="!showNew" />
                    <EyeOff :size="16" v-else />
                  </button>
                </div>
              </div>
              <div class="pw-group">
                <label>Confirm Password</label>
                <div class="pw-input-box">
                  <input :type="showConfirm ? 'text' : 'password'" v-model="password.confirm" placeholder="Confirm new password" />
                  <button type="button" class="pw-eye" @click="showConfirm = !showConfirm">
                    <EyeIcon :size="16" v-if="!showConfirm" />
                    <EyeOff :size="16" v-else />
                  </button>
                </div>
              </div>
            </div>

            <div class="security-actions">
              <button class="cancel-btn" @click="resetPassword">Clear</button>
              <button class="save-btn" @click="updatePassword" :disabled="passwordSaving">
                <span v-if="passwordSaving" class="spinner-sm" style="width: 14px; height: 14px; border-width: 2px; border-color: #fff; border-top-color: transparent;"></span>
                <template v-else><CheckCircle :size="15" /> Update Password</template>
              </button>
            </div>

            <Transition name="fade">
              <p v-if="passwordMessage" class="pw-msg" :class="passwordStatus === 'success' ? 'msg-ok' : 'msg-fail'">
                <CheckCircle v-if="passwordStatus === 'success'" :size="14" style="margin-right: 4px;" />
                <AlertTriangle v-else :size="14" style="margin-right: 4px;" />
                {{ passwordMessage }}
              </p>
            </Transition>
          </section>
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
                        <option value="">— Not set —</option>
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
                      <textarea v-model="form.bio" class="modern-input" rows="3" placeholder="A short note about yourself..." style="resize: vertical; min-height: 60px;"></textarea>
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
  IdCard,
  Calendar,
  Clock,
  Lock,
  EyeIcon,
  EyeOff,
  SquarePen,
  UserIcon,
  Check,
  FileText,
  BookOpen,
  GraduationCap,
  KeyRound,
  Users2,
  BadgeCheck,
  Building,
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
  name: '',
  email: '',
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

function formatDate(value: string, options: Intl.DateTimeFormatOptions): string {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', options)
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
  if (!form.joined) return '—'
  const joined = new Date(form.joined)
  if (isNaN(joined.getTime())) return '—'
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

const permissionGroups = computed(() => {
  const counts = new Map<string, number>()
  for (const slug of form.permissions) {
    // Permission slugs look like "view-students", "create-classes", "manage-roles-permissions"
    const resource = slug.replace(/^(view|create|update|delete|generate|export|manage)-/, '')
    const label = resource.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    counts.set(label, (counts.get(label) || 0) + 1)
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
})

function applyProfile(profile: UserProfile) {
  form.name = profile.name || ''
  form.email = profile.email || ''
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
      name: form.name,
      email: form.email,
      gender: (form.gender || undefined) as 'Male' | 'Female' | 'Other' | undefined,
      date_of_birth: form.dateOfBirth || undefined,
      bio: form.bio || undefined,
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
/* ═══════════════════════════════════════════════
   PAGE LAYOUT — matches Users page exactly
   ═══════════════════════════════════════════════ */
.profile-page {
  height: calc(100vh - 96px);
  width: calc(100% + 12px);
  margin-top: -6px;
  margin-left: -6px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  padding: 20px 24px;
}

/* ═══════════════════════════════════════════════
   LOADING
   ═══════════════════════════════════════════════ */
.load-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 4rem;
  color: #6b7280;
  flex: 1;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e5e7eb;
  border-top-color: #6b7280;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ═══════════════════════════════════════════════
   ERROR
   ═══════════════════════════════════════════════ */
.error-card {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-card-inner {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 48px 40px;
  text-align: center;
  max-width: 380px;
}

.error-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #fef2f2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}

.error-card-inner h5 {
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px;
  font-size: 1rem;
}

.error-card-inner p {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0 0 20px;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border: none;
  border-radius: 9px;
  background: #111827;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}

.retry-btn:hover { background: #1f2937; }

/* ═══════════════════════════════════════════════
   ALERTS
   ═══════════════════════════════════════════════ */
.alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 16px;
  animation: slideDown 0.25s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  opacity: 0.5;
  line-height: 1;
  padding: 0 4px;
  color: inherit;
}

.alert-close:hover { opacity: 1; }

/* ═══════════════════════════════════════════════
   QUICK STATS
   ═══════════════════════════════════════════════ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
}

.stat-tile:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-blue { background: linear-gradient(135deg, rgba(59, 130, 246, 0.14), rgba(59, 130, 246, 0.06)); color: #3b82f6; }
.icon-green { background: linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(16, 185, 129, 0.06)); color: #10b981; }
.icon-violet { background: linear-gradient(135deg, rgba(139, 92, 246, 0.14), rgba(139, 92, 246, 0.06)); color: #8b5cf6; }
.icon-amber { background: linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(245, 158, 11, 0.06)); color: #f59e0b; }

.stat-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.stat-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  margin-top: 2px;
  letter-spacing: 0.01em;
}

/* ═══════════════════════════════════════════════
   TWO-COLUMN LAYOUT
   ═══════════════════════════════════════════════ */
.profile-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  align-items: start;
}

/* ═══════════════════════════════════════════════
   LEFT: Identity sidebar
   ═══════════════════════════════════════════════ */
.profile-side {
  position: sticky;
  top: 0;
}

.side-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  text-align: center;
  padding-bottom: 20px;
}

.side-cover {
  height: 80px;
  background:
    radial-gradient(circle at 15% 30%, rgba(255, 255, 255, 0.16) 0%, transparent 45%),
    radial-gradient(circle at 85% 70%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    linear-gradient(135deg, #1d4ed8, #3b82f6 55%, #60a5fa);
}

.side-avatar-wrap {
  margin-top: -48px;
  display: flex;
  justify-content: center;
  position: relative;
}

/* ── Avatar (base + xl variant) ── */
.avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  background: #2563eb;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
}

.avatar-xl {
  width: 80px !important;
  height: 80px !important;
  border-radius: 20px !important;
  font-size: 1.4rem !important;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border: 4px solid #fff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15);
}

.avatar-xl img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-xl:hover .avatar-overlay {
  opacity: 1;
}

.avatar-spinner {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-verified-badge {
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  border: 2.5px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.4);
}

.side-name {
  margin: 12px 0 2px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.side-email {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 0 0 12px;
  font-size: 0.8rem;
  color: #64748b;
}

.side-badges {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 0 16px;
}

/* ── Role / Status Badges ── */
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.25rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: 100px;
  letter-spacing: 0.01em;
  background: #dbeafe;
  color: #1d4ed8;
}

.role-admin { background: #dbeafe; color: #1d4ed8; }
.role-teacher { background: #dbeafe; color: #1d4ed8; }
.role-student { background: #dbeafe; color: #1d4ed8; }

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: 100px;
  letter-spacing: 0.01em;
}
.status-active { background: #dcfce7; color: #16a34a; }
.status-inactive { background: #f1f5f9; color: #64748b; }
.status-suspended { background: #fef2f2; color: #dc2626; }

.side-edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 16px 16px 0;
  padding: 8px 0;
  width: calc(100% - 32px);
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.side-edit-btn:hover {
  background: #dbeafe;
}

.side-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 18px 0 0;
}

.side-meta {
  list-style: none;
  margin: 0;
  padding: 14px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.side-meta li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.side-meta li svg {
  flex-shrink: 0;
  color: #94a3b8;
}

.side-meta-label {
  font-size: 0.78rem;
  color: #64748b;
  flex: 1;
}

.side-meta-value {
  font-size: 0.78rem;
  font-weight: 600;
  color: #0f172a;
  text-align: right;
}

/* ═══════════════════════════════════════════════
   RIGHT: Info cards
   ═══════════════════════════════════════════════ */
.profile-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.info-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  padding: 18px 22px 22px;
  transition: box-shadow 0.25s ease;
}

.info-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.info-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 14px;
}

.info-card-head svg {
  color: #2563eb;
  flex-shrink: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}

.info-field {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.info-field > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.info-field-icon {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.info-field-wide {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

/* ── Bio ── */
.bio-text {
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}
.bio-empty {
  font-size: 0.85rem;
  color: #94a3b8;
  font-style: italic;
  margin: 0;
}

/* ── Chip list (teaching info) ── */
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 100px;
  font-size: 0.72rem;
  font-weight: 600;
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #dbeafe;
}

.chip-blue { background: #eff6ff; color: #2563eb; border-color: #dbeafe; }
.chip-violet { background: #f5f3ff; color: #7c3aed; border-color: #ede9fe; }

/* ── Access summary (admin) ── */
.access-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.access-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.04));
  border-radius: 14px;
  flex-shrink: 0;
}

.access-count-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #2563eb;
  line-height: 1;
}

.access-count-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 4px;
  white-space: nowrap;
}

/* ═══════════════════════════════════════════════
   SECURITY
   ═══════════════════════════════════════════════ */
.security-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.pw-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.pw-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
}

.pw-input-box {
  position: relative;
}

.pw-input-box input {
  width: 100%;
  padding: 0.6rem 40px 0.6rem 12px;
  font-size: 0.85rem;
  font-family: inherit;
  color: #111827;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.pw-input-box input:hover { border-color: #cbd5e1; }
.pw-input-box input:focus { border-color: #94a3b8; }
.pw-input-box input::placeholder { color: #cbd5e1; }

.pw-eye {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.pw-eye:hover { color: #64748b; }

.security-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
}

.cancel-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.cancel-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border: none;
  background: #111827;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}

.save-btn:hover { background: #1f2937; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.pw-msg {
  padding-top: 10px;
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.msg-ok { color: #16a34a; }
.msg-fail { color: #dc2626; }

/* ═══════════════════════════════════════════════
   EDIT MODAL
   ═══════════════════════════════════════════════ */
.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* ═══════════════════════════════════════════════
   TRANSITIONS
   ═══════════════════════════════════════════════ */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
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

/* ═══════════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════════ */
@media (max-width: 900px) {
  .profile-page { padding: 16px; }
  .stats-row { grid-template-columns: 1fr 1fr; }
  .profile-layout { grid-template-columns: 1fr; }
  .profile-side { position: static; }
  .info-grid { grid-template-columns: 1fr; }
  .security-body { grid-template-columns: 1fr; }
  .edit-grid { grid-template-columns: 1fr; }
}

@media (max-width: 560px) {
  .stats-row { grid-template-columns: 1fr; }
}

</style>
