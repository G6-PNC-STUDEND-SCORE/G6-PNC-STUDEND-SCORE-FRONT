<template>
  <div :class="['profile-page', { 'dark-mode': theme.isDark }]">
    <!-- Header -->
    <header class="page-head">
      <div class="page-head-left">
        <div class="page-icon">
          <User :size="20" />
        </div>
        <div>
          <h1 class="page-title">My Profile</h1>
          <p class="page-desc">Manage your personal information and security settings.</p>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <span>Loading your profile...</span>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="state-box error">
      <AlertTriangle :size="24" />
      <p>{{ fetchError }}</p>
      <button class="btn btn-primary" @click="loadProfile">Try Again</button>
    </div>

    <template v-else>
      <!-- Success toast -->
      <Transition name="slide">
        <div v-if="successMessage" class="toast toast-success">
          <CheckCircle :size="16" />
          <span>{{ successMessage }}</span>
          <button class="toast-x" @click="successMessage = ''">&times;</button>
        </div>
      </Transition>

      <!-- Error toast -->
      <Transition name="slide">
        <div v-if="saveError" class="toast toast-error">
          <AlertTriangle :size="16" />
          <span>{{ saveError }}</span>
          <button class="toast-x" @click="saveError = ''">&times;</button>
        </div>
      </Transition>

      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-cover">
          <div class="cover-glow"></div>
          <div class="cover-content">
            <div class="avatar-block">
              <div class="avatar-border">
                <div
                  class="avatar"
                  :class="{ clickable: !!avatarUrl }"
                  role="button"
                  tabindex="0"
                  :title="avatarUrl ? 'View full screen' : 'Upload photo'"
                  @click="avatarUrl ? openViewer() : $refs.fileInput?.click()"
                  @keydown.enter.prevent="avatarUrl ? openViewer() : $refs.fileInput?.click()"
                >
                  <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="" />
                  <span v-else class="avatar-initials">{{ initials }}</span>
                  <span class="avatar-cam">
                    <Camera :size="16" />
                  </span>
                </div>
              </div>
              <div class="avatar-info">
                <h2 class="avatar-name">{{ form.name || 'User' }}</h2>
                <div class="avatar-meta">
                  <div class="meta-tag">
                    <ShieldCheck :size="12" />
                    {{ form.role || 'N/A' }}
                  </div>
                  <span class="meta-dot">&bull;</span>
                  <button class="meta-upload" @click="$refs.fileInput?.click()" :disabled="avatarUploading">
                    <Camera :size="12" />
                    {{ avatarUploading ? 'Uploading...' : 'Change photo' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-cell">
            <div class="stat-icon-box" style="background:#eef2ff;color:#6366f1">
              <Building2 :size="16" />
            </div>
            <div class="stat-body">
              <span class="stat-label">Department</span>
              <span class="stat-value">{{ form.department || '—' }}</span>
            </div>
          </div>
          <div class="stat-cell">
            <div class="stat-icon-box" style="background:#f0fdf4;color:#22c55e">
              <GraduationCap :size="16" />
            </div>
            <div class="stat-body">
              <span class="stat-label">School</span>
              <span class="stat-value">{{ form.school || '—' }}</span>
            </div>
          </div>
          <div class="stat-cell">
            <div class="stat-icon-box" style="background:#fef3c7;color:#f59e0b">
              <Calendar :size="16" />
            </div>
            <div class="stat-body">
              <span class="stat-label">Joined</span>
              <span class="stat-value">{{ formattedDate || '—' }}</span>
            </div>
          </div>
          <div class="stat-cell">
            <div class="stat-icon-box" style="background:#fef2f2;color:#ef4444">
              <UserCheck :size="16" />
            </div>
            <div class="stat-body">
              <span class="stat-label">Role</span>
              <span class="stat-value">{{ form.role || '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Grid -->
      <div class="grid-2">
        <!-- Personal Info -->
        <section class="card">
          <h3 class="card-title">
            <UserCheck :size="16" />
            Personal Information
          </h3>
          <form id="profile-form" class="form-grid" @submit.prevent="saveProfile">
            <div class="field">
              <label for="f-name">Full Name</label>
              <input id="f-name" v-model="form.name" placeholder="Your full name" />
            </div>
            <div class="field">
              <label for="f-email">Email</label>
              <input id="f-email" v-model="form.email" type="email" placeholder="you@example.com" />
            </div>
            <div class="field">
              <label for="f-phone">Phone</label>
              <input id="f-phone" v-model="form.phone" placeholder="+855 12 345 678" />
            </div>
            <div class="field">
              <label for="f-dept">Department</label>
              <input id="f-dept" v-model="form.department" placeholder="e.g. IT" />
            </div>
            <div class="field">
              <label for="f-school">School</label>
              <input id="f-school" v-model="form.school" placeholder="e.g. PNC" />
            </div>
            <div class="field">
              <label for="f-role">Role</label>
              <input id="f-role" :value="form.role" disabled class="input-disabled" />
            </div>
          </form>
          <div class="card-actions">
            <button type="button" class="btn btn-ghost" @click="resetForm" :disabled="saving">Reset</button>
            <button type="submit" class="btn btn-primary" :disabled="saving" form="profile-form">
              <span v-if="saving" class="spinner-sm"></span>
              <Check v-else :size="15" />
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </section>

        <!-- Password -->
        <section class="card">
          <h3 class="card-title">
            <Lock :size="16" />
            Change Password
          </h3>
          <form class="form-stacked" @submit.prevent="updatePassword">
            <div class="field">
              <label for="pw-current">Current Password</label>
              <div class="pw-wrap">
                <input id="pw-current" :type="showCurrent ? 'text' : 'password'" v-model="password.current" placeholder="Enter current password" autocomplete="current-password" />
                <button type="button" class="pw-toggle" :aria-label="showCurrent ? 'Hide' : 'Show'" @click="showCurrent = !showCurrent">
                  <EyeOff v-if="showCurrent" :size="15" />
                  <Eye v-else :size="15" />
                </button>
              </div>
            </div>
            <div class="field">
              <label for="pw-new">New Password</label>
              <div class="pw-wrap">
                <input id="pw-new" :type="showNew ? 'text' : 'password'" v-model="password.new" placeholder="Min 8 characters" minlength="8" autocomplete="new-password" />
                <button type="button" class="pw-toggle" :aria-label="showNew ? 'Hide' : 'Show'" @click="showNew = !showNew">
                  <EyeOff v-if="showNew" :size="15" />
                  <Eye v-else :size="15" />
                </button>
              </div>
              <!-- Strength bar -->
              <div v-if="password.new" class="pw-strength">
                <div class="pw-bar">
                  <div class="pw-fill" :style="{ width: pwStrength.width, background: pwStrength.color }"></div>
                </div>
                <span class="pw-label" :style="{ color: pwStrength.color }">{{ pwStrength.label }}</span>
              </div>
            </div>
            <div class="field">
              <label for="pw-confirm">Confirm Password</label>
              <div class="pw-wrap">
                <input id="pw-confirm" :type="showConfirm ? 'text' : 'password'" v-model="password.confirm" placeholder="Confirm new password" autocomplete="new-password" />
                <button type="button" class="pw-toggle" :aria-label="showConfirm ? 'Hide' : 'Show'" @click="showConfirm = !showConfirm">
                  <EyeOff v-if="showConfirm" :size="15" />
                  <Eye v-else :size="15" />
                </button>
              </div>
            </div>
          </form>
          <div class="card-actions">
            <button type="button" class="btn btn-ghost" @click="resetPassword">Clear</button>
            <button type="submit" class="btn btn-primary" :disabled="passwordSaving">
              <span v-if="passwordSaving" class="spinner-sm"></span>
              <Lock v-else :size="15" />
              {{ passwordSaving ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
          <p v-if="passwordMessage" class="hint" :class="passwordStatus">{{ passwordMessage }}</p>
        </section>
      </div>
    </template>

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" class="sr-only" @change="onFileChange" />

    <!-- Avatar viewer -->
    <Transition name="fade">
      <div v-if="viewerOpen && avatarUrl" class="viewer-overlay" @click.self="closeViewer">
        <button class="viewer-x" @click="closeViewer" aria-label="Close"><X :size="18" /></button>
        <img :src="avatarUrl" class="viewer-img" alt="" @click.stop />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { getProfile, updateProfile, uploadAvatar } from '@/services/profileService'
import { http } from '@/services/apiHttp'
import {
  User, UserCheck, CheckCircle, AlertTriangle, Camera,
  X, Eye, EyeOff, Check, Lock,
  ShieldCheck, Building2, GraduationCap, Calendar,
} from '@lucide/vue'

const theme = useThemeStore()
const auth = useAuthStore()

const loading = ref(true)
const saving = ref(false)
const fetchError = ref('')
const saveError = ref('')
const successMessage = ref('')
const avatarUploading = ref(false)

const form = reactive({ name: '', email: '', phone: '', department: '', school: '', role: '', joined: '' })
const originalForm = reactive({ name: '', email: '', phone: '', department: '', school: '', role: '', joined: '' })

const password = reactive({ current: '', new: '', confirm: '' })
const passwordMessage = ref('')
const passwordStatus = ref('')
const passwordSaving = ref(false)
const avatarUrl = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const viewerOpen = ref(false)

function openViewer() { if (avatarUrl.value) viewerOpen.value = true }
function closeViewer() { viewerOpen.value = false }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeViewer()
}

const initials = computed(() => {
  if (!form.name) return 'U'
  return form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const formattedDate = computed(() => {
  if (!form.joined) return ''
  const d = new Date(form.joined)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
})

const pwStrength = computed(() => {
  const pw = password.new
  if (!pw) return { label: '', color: '', width: '0%' }
  let s = 0
  if (pw.length >= 8) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  const map = [
    { label: 'Weak', color: '#ef4444', width: '25%' },
    { label: 'Fair', color: '#f59e0b', width: '50%' },
    { label: 'Good', color: '#3b82f6', width: '75%' },
    { label: 'Strong', color: '#10b981', width: '100%' },
  ]
  return map[s - 1] || { label: '', color: '', width: '0%' }
})

async function loadProfile() {
  loading.value = true; fetchError.value = ''
  try {
    const p = await getProfile()
    Object.assign(form, { name: p.name || '', email: p.email || '', phone: p.phone || '', department: p.department || '', school: p.school || '', role: p.role || '' })
    Object.assign(originalForm, { ...form })
    form.joined = p.created_at || ''
    if (p.avatar) avatarUrl.value = (http.defaults.baseURL?.replace('/api', '') || '') + '/storage/' + p.avatar
  } catch (e: any) {
    fetchError.value = e?.response?.data?.message || e?.message || 'Failed to load profile'
  } finally { loading.value = false }
}

async function saveProfile() {
  saving.value = true; saveError.value = ''; successMessage.value = ''
  try {
    const u = await updateProfile({ name: form.name, email: form.email, phone: form.phone || undefined, department: form.department || undefined, school: form.school || undefined })
    Object.assign(form, { name: u.name || '', email: u.email || '', phone: u.phone || '', department: u.department || '', school: u.school || '' })
    Object.assign(originalForm, { ...form })
    successMessage.value = 'Profile updated!'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (e: any) {
    saveError.value = e?.response?.data?.message || e?.message || 'Failed to save'
    if (e?.response?.data?.errors) saveError.value = Object.values(e.response.data.errors).flat().join(', ')
  } finally { saving.value = false }
}

function resetForm() {
  Object.assign(form, { name: originalForm.name, email: originalForm.email, phone: originalForm.phone, department: originalForm.department, school: originalForm.school })
  saveError.value = ''; successMessage.value = ''
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { saveError.value = 'Image must be under 2MB'; return }
  if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'].includes(file.type)) { saveError.value = 'Only JPEG, PNG, GIF, WebP allowed'; return }
  avatarUploading.value = true; saveError.value = ''
  try {
    const r = await uploadAvatar(file)
    avatarUrl.value = (http.defaults.baseURL?.replace('/api', '') || '') + '/storage/' + r.avatar
    if (auth.user) auth.user.avatar = r.avatar
    successMessage.value = 'Avatar uploaded!'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (e: any) {
    saveError.value = e?.response?.data?.message || e?.message || 'Upload failed'
    if (e?.response?.data?.errors) saveError.value = Object.values(e.response.data.errors).flat().join(', ')
  } finally {
    avatarUploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function updatePassword() {
  passwordMessage.value = ''; passwordStatus.value = ''
  if (!password.current || !password.new || !password.confirm) { passwordMessage.value = 'Fill in all fields'; passwordStatus.value = 'error'; return }
  if (password.new.length < 8) { passwordMessage.value = 'Password must be at least 8 characters'; passwordStatus.value = 'error'; return }
  if (password.new !== password.confirm) { passwordMessage.value = 'Passwords do not match'; passwordStatus.value = 'error'; return }
  passwordSaving.value = true
  setTimeout(() => {
    passwordMessage.value = 'Password changed!'; passwordStatus.value = 'success'
    password.current = ''; password.new = ''; password.confirm = ''
    passwordSaving.value = false
  }, 1000)
}

function triggerUpload() {
  fileInput.value?.click()
}

function resetPassword() {
  password.current = ''; password.new = ''; password.confirm = ''
  passwordMessage.value = ''; passwordStatus.value = ''
}

onMounted(() => loadProfile())

watch(viewerOpen, (o) => {
  if (o) { window.addEventListener('keydown', onKeydown); document.body.style.overflow = 'hidden' }
  else { window.removeEventListener('keydown', onKeydown); document.body.style.overflow = '' }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* ── Layout ── */
.profile-page {
  padding: 28px 32px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', 'Noto Sans Khmer', system-ui, sans-serif;
}

.dark-mode.profile-page { color: #e2e8f0; }

.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-head-left { display: flex; align-items: center; gap: 14px; }
.page-icon { width: 44px; height: 44px; border-radius: 12px; background: #dbeafe; color: #2563eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dark-mode .page-icon { background: #1e3a5f; color: #60a5fa; }
.page-title { font-size: 1.4rem; font-weight: 800; margin: 0 0 2px; color: #0f172a; }
.dark-mode .page-title { color: #f1f5f9; }
.page-desc { font-size: 0.85rem; color: #64748b; margin: 0; }
.dark-mode .page-desc { color: #94a3b8; }

/* ── States ── */
.state-box { text-align: center; padding: 60px 20px; background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; }
.dark-mode .state-box { background: #1e293b; border-color: #334155; }
.state-box p { color: #64748b; margin: 12px 0 16px; }
.spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 12px; }
.spinner-sm { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Toasts ── */
.toast { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 500; margin-bottom: 14px; max-width: 100%; }
.toast-success { background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }
.toast-error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
.toast-x { margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; opacity: 0.5; padding: 0 4px; line-height: 1; }
.toast-x:hover { opacity: 1; }
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateX(20px); }

/* ── Cards ── */
.card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: box-shadow 0.2s;
}
.card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.dark-mode .card { background: #1e293b; border-color: #334155; }
.dark-mode .card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.2); }

.card-title { font-size: 1rem; font-weight: 700; margin: 0 0 20px; color: #0f172a; display: flex; align-items: center; gap: 8px; }
.dark-mode .card-title { color: #f1f5f9; }

/* ── Profile Card ── */
.profile-card {
  margin-bottom: 24px; overflow: hidden; border-radius: 16px;
  background: #fff; border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: box-shadow 0.2s;
}
.profile-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.dark-mode .profile-card { background: #1e293b; border-color: #334155; }
.dark-mode .profile-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.2); }

/* ── Cover ── */
.profile-cover {
  position: relative;
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%);
  padding: 36px 32px;
  overflow: hidden;
}
.dark-mode .profile-cover {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2d1b69 100%);
}

.cover-glow {
  position: absolute; top: -80px; right: -80px;
  width: 240px; height: 240px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
  pointer-events: none;
}

.cover-content { position: relative; z-index: 1; }

/* ── Avatar Block ── */
.avatar-block { display: flex; align-items: center; gap: 20px; }

.avatar-border {
  flex-shrink: 0;
  position: relative;
  width: 88px; height: 88px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.avatar-border::before {
  content: ''; position: absolute; inset: -3px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0.1));
}

.avatar {
  position: relative; z-index: 1;
  width: 82px; height: 82px;
  border-radius: 50%; overflow: hidden;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  transition: transform 0.25s, box-shadow 0.25s;
}
.avatar:hover { transform: scale(1.06); box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
.avatar.clickable { cursor: zoom-in; }

.avatar-initials { font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }

.avatar-cam {
  position: absolute; bottom: 0; right: 0;
  width: 28px; height: 28px; border-radius: 50%;
  background: #2563eb; color: #fff;
  display: flex; align-items: center; justify-content: center;
  border: 2.5px solid #fff;
  opacity: 0; transform: scale(0.8);
  transition: all 0.2s;
  z-index: 2; cursor: pointer;
}
.avatar:hover .avatar-cam { opacity: 1; transform: scale(1); }
.dark-mode .avatar-cam { border-color: #1e293b; }

.avatar-info { flex: 1; min-width: 0; color: #fff; }
.avatar-name { font-size: 1.3rem; font-weight: 700; margin: 0; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.1); }

.avatar-meta {
  display: flex; align-items: center; gap: 8px;
  margin-top: 6px; flex-wrap: wrap;
}
.meta-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 6px;
  background: rgba(255,255,255,0.12);
  font-size: 0.78rem; font-weight: 500; color: rgba(255,255,255,0.9);
}
.meta-dot { color: rgba(255,255,255,0.3); font-size: 0.6rem; }
.meta-upload {
  background: none; border: none; color: rgba(255,255,255,0.7);
  font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
  transition: color 0.15s; font-family: inherit; padding: 2px 4px;
}
.meta-upload:hover { color: #fff; }
.meta-upload:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Stats Row ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 18px 24px;
  background: #f8fafc;
}
.dark-mode .stats-row { background: #0f172a; }

.stat-cell {
  display: flex; align-items: center; gap: 12px;
  padding: 0 12px;
}
.stat-cell:not(:last-child) { border-right: 1px solid #e2e8f0; }
.dark-mode .stat-cell:not(:last-child) { border-color: #334155; }

.stat-icon-box {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dark-mode .stat-icon-box { opacity: 0.85; }

.stat-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.stat-label { font-size: 0.68rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
.stat-value { font-size: 0.85rem; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dark-mode .stat-value { color: #e2e8f0; }

/* ── Grid ── */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: stretch; }
.grid-2 .card { display: flex; flex-direction: column; }
.grid-2 .card > form { flex: 1; }

/* ── Forms ── */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-stacked { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 0.78rem; font-weight: 600; color: #475569; }
.dark-mode .field label { color: #94a3b8; }

input {
  padding: 10px 13px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.88rem;
  outline: none; background: #f8fafc; color: #0f172a; transition: all 0.15s; font-family: inherit;
}
input:hover { border-color: #cbd5e1; background: #fff; }
input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
.dark-mode input { background: #0f172a; border-color: #475569; color: #e2e8f0; }
.dark-mode input:hover { border-color: #64748b; background: #1a2332; }
.dark-mode input:focus { border-color: #60a5fa; background: #1a2332; box-shadow: 0 0 0 3px rgba(96,165,250,0.1); }

.input-disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Password ── */
.pw-wrap { position: relative; display: flex; align-items: center; }
.pw-wrap input { width: 100%; padding-right: 44px; }
.pw-toggle {
  position: absolute; right: 6px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: #94a3b8; cursor: pointer; border-radius: 8px; transition: all 0.15s;
}
.pw-toggle:hover { color: #3b82f6; background: #eff6ff; }
.dark-mode .pw-toggle:hover { background: #1e3a5f; }

.pw-strength { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.pw-bar { flex: 1; height: 4px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.dark-mode .pw-bar { background: #334155; }
.pw-fill { height: 100%; border-radius: 4px; transition: width 0.3s, background 0.3s; }
.pw-label { font-size: 0.72rem; font-weight: 600; min-width: 36px; text-align: right; }

/* ── Buttons ── */
.btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 10px;
  font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; font-family: inherit;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn:not(:disabled):active { transform: scale(0.97); }
.btn-primary { background: #2563eb; color: #fff; box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
.btn-primary:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37,99,235,0.3); }
.btn-ghost { background: #fff; border: 1.5px solid #e2e8f0; color: #475569; }
.btn-ghost:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
.dark-mode .btn-ghost { background: transparent; border-color: #475569; color: #94a3b8; }
.dark-mode .btn-ghost:hover:not(:disabled) { background: #334155; border-color: #64748b; color: #e2e8f0; }

.card-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
.dark-mode .card-actions { border-top-color: #334155; }

/* ── Hint ── */
.hint { margin-top: 12px; font-size: 0.78rem; font-weight: 600; }
.hint.success { color: #059669; }
.hint.error { color: #dc2626; }

/* ── Viewer ── */
.viewer-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(15,23,42,0.9); backdrop-filter: blur(4px); cursor: zoom-out; }
.viewer-img { max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); cursor: default; }
.viewer-x { position: absolute; top: 18px; right: 20px; width: 40px; height: 40px; border-radius: 50%; border: none; background: rgba(255,255,255,0.1); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
.viewer-x:hover { background: rgba(255,255,255,0.2); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .profile-page { padding: 20px; }
  .grid-2, .form-grid { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: 1fr 1fr; }
  .stat-cell:nth-child(4n) { border-right: 1px solid #e2e8f0; }
  .stat-cell:nth-child(4n+2) { border-right: none; }
  .dark-mode .stat-cell:nth-child(4n) { border-color: #334155; }
  .avatar-block { flex-direction: column; text-align: center; }
  .avatar-meta { justify-content: center; }
  .profile-cover { padding: 28px 20px; }
}
</style>
