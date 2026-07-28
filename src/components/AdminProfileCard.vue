<template>
  <div class="admin-profile-card">
    <div class="admin-header">
      <div class="admin-avatar-container">
        <div class="admin-avatar">
          <img v-if="avatarUrl" :src="avatarUrl" alt="Admin" />
          <span v-else class="avatar-initials">{{ initials }}</span>
        </div>
      </div>
      <div class="admin-info">
        <h3 class="admin-name">{{ adminName }}</h3>
        <span class="admin-role">Admin</span>
      </div>
    </div>

    <div class="admin-content">
      <div class="admin-stats-grid">
        <div class="stat-item">
          <div class="stat-icon">
            <Users :size="18" />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalUsers }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <BookOpen :size="18" />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalSubjects }}</span>
            <span class="stat-label">Subjects</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <GraduationCap :size="18" />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalStudents }}</span>
            <span class="stat-label">Students</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <ClipboardList :size="18" />
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalClasses }}</span>
            <span class="stat-label">Classes</span>
          </div>
        </div>
      </div>

      <div class="admin-actions">
        <button class="admin-action-btn" @click="goToProfile">
          <User :size="16" />
          <span>View Profile</span>
        </button>
        <button class="admin-action-btn" @click="goToSettings">
          <Settings :size="16" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storageUrl } from '@/services/apiHttp'
import { getUserInitials } from '@/utils'
import {
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
  User,
  Settings,
} from '@lucide/vue'

const router = useRouter()
const auth = useAuthStore()

const avatarUrl = computed(() => storageUrl((auth.user?.avatar as string | undefined) ?? null))
const adminName = computed(() => auth.user?.name || 'Admin')
const initials = computed(() => getUserInitials(auth.user?.name))

// Stats - these would typically come from API calls
const totalUsers = computed(() => '156')
const totalSubjects = computed(() => '24')
const totalStudents = computed(() =>('120'))
const totalClasses = computed(() =>('8'))

function goToProfile() {
  router.push('/profile')
}

function goToSettings() {
  router.push('/settings')
}
</script>

<style scoped>
.admin-profile-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  transition: box-shadow 0.25s ease;
}

.admin-profile-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.admin-header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.admin-avatar-container {
  flex-shrink: 0;
}

.admin-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
}

.admin-info {
  flex: 1;
  min-width: 0;
}

.admin-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-role {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.admin-content {
  padding: 20px;
}

.admin-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.admin-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.admin-action-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #2563eb;
  transform: translateY(-1px);
}

.admin-action-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .admin-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
