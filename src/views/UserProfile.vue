<template>
  <div class="admin-profile-page">
    <header class="page-header">
      <div>
        <h1>My Profile</h1>
        <p class="page-subtitle">Manage your institutional profile and security preferences.</p>
      </div>
    </header>

    <!-- Profile Card -->
    <div class="profile-card">
      <div class="profile-body">
        <div class="avatar-wrap" @click="triggerUpload">
          <div class="avatar">
            <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="avatar" />
            <div v-else class="avatar-fallback">LF</div>
          </div>
          <span class="avatar-hint">Click to change photo</span>
        </div>

        <div class="profile-meta">
          <h2 class="profile-name">{{ user.name }}</h2>
          <p class="profile-role">{{ user.role }}</p>

          <div class="rating-line">
            <span class="stars">★★★★★</span>
            <span class="star-text">4.5 Rating</span>
          </div>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat">
          <span class="stat-label">Department</span>
          <span class="stat-value">{{ user.department }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">School</span>
          <span class="stat-value">{{ user.school }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Joined</span>
          <span class="stat-value">{{ user.joined }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Employee ID</span>
          <span class="stat-value">{{ user.employeeId }}</span>
        </div>
      </div>
    </div>

    <!-- Bottom Section -->
    <div class="content-grid">
      <!-- Personal Information -->
      <section class="card">
        <header class="card-header">
          <h3>Personal Information</h3>
          <button class="chip">Primary Contact</button>
        </header>

        <div class="form-grid">
          <div class="field">
            <label>Full Name</label>
            <input type="text" v-model="user.name" />
          </div>
          <div class="field">
            <label>Email Address</label>
            <input type="email" v-model="user.email" />
          </div>
          <div class="field">
            <label>Phone</label>
            <input type="text" v-model="user.phone" />
          </div>
          <div class="field">
            <label>Role</label>
            <select v-model="user.role">
              <option>Administrator</option>
              <option>Teacher</option>
              <option>Student</option>
            </select>
          </div>
        </div>

        <div class="field full">
          <label>Bio</label>
          <textarea v-model="user.bio"></textarea>
        </div>

        <div class="card-actions">
          <button class="btn btn-ghost" @click="resetProfile">Cancel</button>
          <button class="btn btn-primary" @click="saveProfile">Save Changes</button>
        </div>
      </section>

      <!-- Change Password -->
      <section class="card">
        <h3 class="card-title">Change Password</h3>

        <div class="stacked-form">
          <div class="field">
            <label>Current Password</label>
            <input type="password" v-model="password.current" />
          </div>
          <div class="field">
            <label>New Password</label>
            <input type="password" v-model="password.new" />
          </div>
          <div class="field">
            <label>Confirm Password</label>
            <input type="password" v-model="password.confirm" />
          </div>
        </div>

        <div class="card-actions">
          <button class="btn btn-ghost" @click="resetPassword">Clear</button>
          <button class="btn btn-primary" @click="updatePassword">Update Password</button>
        </div>

        <p v-if="passwordMessage" class="hint" :class="passwordStatus">{{ passwordMessage }}</p>
      </section>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="sr-only"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onUnmounted } from 'vue'

let objectUrl: string | null = null

const user = reactive({
  name: 'Dr. Linda Foster',
  role: 'Administrator',
  department: 'Administration',
  school: 'Springfield Academy',
  joined: 'September 2013',
  employeeId: 'EMP-001',
  email: 'linda@school.edu',
  phone: '+1 555-0001',
  bio: 'School Administrator with 12 years of experience in educational management.'
})

const password = reactive({
  current: '',
  new: '',
  confirm: ''
})

const passwordMessage = ref('')
const passwordStatus = ref('')
const avatarUrl = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

function saveProfile() {
  passwordMessage.value = ''
  passwordStatus.value = ''
}

function resetProfile() {
  passwordMessage.value = ''
  passwordStatus.value = ''
}

function updatePassword() {
  passwordMessage.value = ''
  passwordStatus.value = ''

  if (!password.current || !password.new || !password.confirm) {
    passwordMessage.value = 'Please fill in all password fields'
    passwordStatus.value = 'error'
    return
  }

  if (password.new !== password.confirm) {
    passwordMessage.value = 'Password does not match'
    passwordStatus.value = 'error'
    return
  }

  passwordMessage.value = 'Password changed successfully'
  passwordStatus.value = 'success'
  password.current = ''
  password.new = ''
  password.confirm = ''
}

function resetPassword() {
  password.current = ''
  password.new = ''
  password.confirm = ''
  passwordMessage.value = ''
  passwordStatus.value = ''
}

function triggerUpload() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }

  objectUrl = URL.createObjectURL(file)
  avatarUrl.value = objectUrl
}

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
  padding: 28px;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto 22px;
}

.page-header h1 {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.page-subtitle {
  color: #64748b;
  margin: 6px 0 0;
  font-size: 14px;
}

/* Profile Card */
.profile-card {
  max-width: 1200px;
  margin: 0 auto 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 18px rgba(15, 23, 42, 0.04);
}

.profile-body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1565d8, #1e40af);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 26px rgba(21, 101, 216, 0.25);
  overflow: hidden;
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
  font-size: 11px;
  color: #64748b;
}

.profile-meta {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.profile-role {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 13px;
}

.rating-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 5px 10px;
  background: #fff7ed;
  border: 1px solid #ffedd5;
  border-radius: 20px;
  font-size: 12px;
  color: #b45309;
  font-weight: 600;
}

.stars {
  color: #f59e0b;
  letter-spacing: 1px;
}

.star-text {
  color: #92400e;
  font-weight: 700;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 20px;
  padding-top: 18px;
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
  gap: 20px;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 18px rgba(15, 23, 42, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px;
}

.chip {
  background: #eff6ff;
  color: #1565d8;
  border: 1px solid #dbeafe;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.chip:hover {
  background: #dbeafe;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.stacked-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
}

.field.full {
  margin-top: 14px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

input,
select,
textarea {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  outline: none;
  background: #f8fafc;
  color: #0f172a;
  transition: all 0.15s ease;
}

input:hover,
select:hover,
textarea:hover {
  border-color: #cbd5e1;
  background: #ffffff;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #1565d8;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(21, 101, 216, 0.1);
}

textarea {
  height: 110px;
  resize: vertical;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-ghost {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn-ghost:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-primary {
  background: #1565d8;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(21, 101, 216, 0.25);
}

.btn-primary:hover {
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