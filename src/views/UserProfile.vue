<template>
  <div class="profile-container">
    <!-- Left Profile Card -->
    <div class="profile-card">
      <div class="avatar-wrap" @click="triggerUpload">
        <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="avatar" />
        <div v-else class="avatar">LF</div>
        <div class="avatar-badge" aria-label="Upload photo">
          <span>📷</span>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="sr-only"
          @change="onFileChange"
        />
      </div>

      <h2>{{ user.name }}</h2>
      <p class="role">{{ user.role }}</p>
      <div class="rating">★★★★☆</div>

      <div class="info-list">
        <div>
          <span>Department</span>
          <b>{{ user.department }}</b>
        </div>
        <div>
          <span>School</span>
          <b>{{ user.school }}</b>
        </div>
        <div>
          <span>Joined</span>
          <b>{{ user.joined }}</b>
        </div>
        <div>
          <span>Employee ID</span>
          <b>{{ user.employeeId }}</b>
        </div>
      </div>
    </div>


    <!-- Right Content -->
    <div class="right-section">

      <!-- Personal Information -->
      <div class="card fade-up">
        <h2>Personal Information</h2>

        <div class="form-grid">

          <div class="form-group">
            <label>Full Name</label>
            <input v-model="user.name" />
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input v-model="user.email" />
          </div>

          <div class="form-group">
            <label>Phone</label>
            <input v-model="user.phone" />
          </div>

          <div class="form-group">
            <label>Role</label>
            <select v-model="user.role">
              <option>Administrator</option>
              <option>Teacher</option>
              <option>Student</option>
            </select>
          </div>

        </div>

        <div class="form-group">
          <label>Bio</label>
          <textarea v-model="user.bio"></textarea>
        </div>

        <div class="actions">
          <button class="ghost" @click="resetProfile">Cancel</button>
          <button class="primary" @click="saveProfile">Save Changes</button>
        </div>
      </div>

      <!-- Change Password -->
      <div class="card password fade-up">
        <h2>Change Password</h2>

        <div class="form-grid password-grid">
          <div class="form-group">
            <label>Current Password</label>
            <input type="password" v-model="password.current" />
          </div>

          <div class="form-group">
            <label>New Password</label>
            <input type="password" v-model="password.new" />
          </div>

          <div class="form-group">
            <label>Confirm New Password</label>
            <input type="password" v-model="password.confirm" />
          </div>
        </div>

        <div class="actions">
          <button class="ghost" @click="resetPassword">Clear</button>
          <button class="primary" @click="updatePassword">Update Password</button>
        </div>

        <p v-if="passwordMessage" class="hint" :class="passwordStatus">{{ passwordMessage }}</p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onUnmounted } from 'vue'

let objectUrl: string | null = null

const user = reactive({
  name: 'Dr. Linda Foster',
  email: 'linda@school.edu',
  phone: '+1 555-0001',
  role: 'Administrator',
  department: 'Administration',
  school: 'Springfield Academy',
  joined: 'September 2013',
  employeeId: 'EMP-001',
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
  alert('Profile updated successfully')
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
}

.profile-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 28px;
  padding: 32px;
  width: 100%;
  background: #f5f7fb;
  min-height: 100vh;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Cards */
.profile-card,
.card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(140%) blur(14px);
  -webkit-backdrop-filter: saturate(140%) blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 20px;
  padding: 24px;
  box-shadow:
    0 10px 30px rgba(15, 23, 42, 0.06),
    0 1px 3px rgba(15, 23, 42, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 20px 40px rgba(15, 23, 42, 0.08),
    0 1px 3px rgba(15, 23, 42, 0.05);
}

/* Left Card */
.profile-card {
  text-align: center;
  position: sticky;
  top: 24px;
  height: fit-content;
}

.avatar-wrap {
  display: inline-block;
  position: relative;
  cursor: pointer;
  width: 96px;
  height: 96px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.25);
  transition: transform 0.2s ease;
}

.avatar-wrap:hover .avatar-img {
  transform: scale(1.04);
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.25);
  transition: transform 0.2s ease;
}

.avatar-wrap:hover .avatar {
  transform: scale(1.04);
}

.avatar-badge {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ffffff;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
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

.profile-card h2 {
  margin-top: 22px;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.role {
  margin-top: 6px;
  color: #64748b;
  font-size: 14px;
}

.rating {
  margin-top: 14px;
  color: #f59e0b;
  font-size: 20px;
  letter-spacing: 2px;
}

.info-list {
  margin-top: 28px;
  text-align: left;
}

.info-list div {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  transition: background 0.15s ease;
}

.info-list div:last-child {
  border-bottom: none;
}

.info-list span {
  color: #64748b;
  font-size: 13px;
}

.info-list b {
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
}

/* Right */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card h2 {
  font-size: 18px;
  margin-bottom: 20px;
  color: #0f172a;
  font-weight: 700;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-grid.password-grid {
  grid-template-columns: 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

label {
  margin-bottom: 8px;
  color: #334155;
  font-size: 13px;
  font-weight: 500;
}

input,
select,
textarea {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 14px;
  outline: none;
  background: #f8fafc;
  color: #0f172a;
  transition: all 0.2s ease;
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
  border-color: #6366f1;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}

textarea {
  height: 100px;
  resize: vertical;
  line-height: 1.5;
}

/* Actions */
.actions {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  align-items: center;
}

button {
  border: none;
  padding: 12px 22px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
}

.ghost {
  background: #f1f5f9;
  color: #334155;
}

.ghost:hover {
  background: #e2e8f0;
}

.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  box-shadow: 0 8px 18px rgba(99, 102, 241, 0.25);
}

.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(99, 102, 241, 0.3);
}

/* Password */
.hint {
  margin-top: 16px;
  font-size: 13px;
  min-height: 20px;
}

.hint.success {
  color: #059669;
}

.hint.error {
  color: #dc2626;
}

/* Entrance */
.fade-up {
  animation: fadeUp 0.45s ease both;
}

.fade-up:nth-child(2) {
  animation-delay: 0.05s;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 960px) {
  .profile-container {
    grid-template-columns: 1fr;
  }

  .profile-card {
    position: static;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
