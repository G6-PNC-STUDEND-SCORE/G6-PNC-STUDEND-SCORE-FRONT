<template>
  <div class="personal-info-card">
    <div class="profile-header">
      <div class="profile-avatar-container" @click="$emit('avatar-click')" role="button" tabindex="0" @keydown.enter.prevent="$emit('avatar-click')">
        <div class="profile-avatar">
          <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" @error="onAvatarError" />
          <span v-else class="avatar-initials">{{ initials }}</span>
        </div>
        <div class="avatar-edit-overlay">
          <Camera :size="18" />
        </div>
      </div>
      <div class="profile-details">
        <h2 class="profile-name">{{ name || 'User' }}</h2>
        <div class="rating-info">
          <span class="rating-count">{{ ratings || '0' }} rates</span>
          <span class="trust-score">{{ trustScore || '0' }}% trust</span>
        </div>
      </div>
    </div>

    <div class="info-grid-section">
      <div class="info-card-item">
        <div class="info-icon"><UserIcon :size="18" /></div>
        <div class="info-content">
          <span class="info-label">Gender</span>
          <span class="info-value">{{ gender || '—' }}</span>
        </div>
      </div>
      <div class="info-card-item">
        <div class="info-icon"><Calendar :size="18" /></div>
        <div class="info-content">
          <span class="info-label">Date of Birth</span>
          <span class="info-value">{{ formattedDob || '—' }}</span>
        </div>
      </div>
      <div class="info-card-item">
        <div class="info-icon"><Phone :size="18" /></div>
        <div class="info-content">
          <span class="info-label">Phone</span>
          <span class="info-value">{{ phone || '—' }}</span>
        </div>
      </div>
      <div class="info-card-item">
        <div class="info-icon"><Droplet :size="18" /></div>
        <div class="info-content">
          <span class="info-label">Blood Type</span>
          <span class="info-value">{{ bloodType || '—' }}</span>
        </div>
      </div>
    </div>

    <div class="toggles-section">
      <div class="toggle-item">
        <span class="toggle-label">Dark Mode</span>
        <label class="toggle-switch">
          <input type="checkbox" :checked="darkMode" @change="(e) => $emit('toggle-dark-mode', (e.target as HTMLInputElement).checked)" />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="toggle-item">
        <span class="toggle-label">Blind Mode</span>
        <label class="toggle-switch">
          <input type="checkbox" :checked="blindMode" @change="(e) => $emit('toggle-blind-mode', (e.target as HTMLInputElement).checked)" />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storageUrl } from '@/services/apiHttp'
import { getUserInitials } from '@/utils'
import {
  UserIcon,
  Calendar,
  Phone,
  Droplet,
  Camera,
} from '@lucide/vue'

interface Props {
  name?: string
  avatar?: string | null
  gender?: string
  dateOfBirth?: string
  phone?: string
  bloodType?: string
  ratings?: string | number
  trustScore?: string | number
  darkMode?: boolean
  blindMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  avatar: null,
  gender: '',
  dateOfBirth: '',
  phone: '',
  bloodType: '',
  ratings: '0',
  trustScore: '0',
  darkMode: false,
  blindMode: false,
})

defineEmits<{
  'avatar-click': []
  'toggle-dark-mode': [value: boolean]
  'toggle-blind-mode': [value: boolean]
}>()

const avatarUrl = computed(() => storageUrl(props.avatar ?? null))
const initials = computed(() => getUserInitials(props.name))

const formattedDob = computed(() => {
  if (!props.dateOfBirth) return ''
  const d = new Date(props.dateOfBirth)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

function onAvatarError() {
  // Handle avatar error if needed
}
</script>

<style scoped>
.personal-info-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
}

.profile-avatar-container {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
}

.avatar-edit-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.profile-avatar-container:hover .avatar-edit-overlay {
  opacity: 1;
}

.profile-details {
  flex: 1;
}

.profile-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px;
}

.rating-info {
  display: flex;
  gap: 16px;
}

.rating-count,
.trust-score {
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
}

.trust-score {
  color: #10b981;
}

.info-grid-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.info-card-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.info-card-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
}

.toggles-section {
  display: flex;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #cbd5e1;
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

@media (max-width: 768px) {
  .info-grid-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .rating-info {
    justify-content: center;
  }
  
  .info-grid-section {
    grid-template-columns: 1fr;
  }
  
  .toggles-section {
    flex-direction: column;
  }
}
</style>
