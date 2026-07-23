<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && student" :class="['modal-overlay', { 'dark-mode': theme.isDark }]" @click.self="$emit('close')">
        <div class="modal-content-panel">
          <!-- Close Button -->
          <button class="modal-close-btn" @click="$emit('close')" aria-label="Close">
            <i class="bi bi-x-lg"></i>
          </button>

          <!-- Profile Header -->
          <div class="profile-section">
            <div class="profile-avatar-wrap">
              <div class="profile-avatar" :style="avatarGradient">
                {{ getInitials(student.user?.name || '') }}
              </div>
              <span class="profile-status-dot" :class="(student.user?.status || '') === 'active' ? 'dot-active' : 'dot-inactive'" />
            </div>
            <h4 class="profile-name">{{ student.user?.name }}</h4>
            <span class="profile-badge" :class="(student.user?.gender || '') === 'Male' ? 'badge-m' : 'badge-f'">
              <i :class="(student.user?.gender || '') === 'Male' ? 'bi bi-gender-male' : 'bi bi-gender-female'" />
              {{ student.user?.gender || '—' }}
            </span>
          </div>

          <!-- Detail Cards -->
          <div class="details-grid">
            <div class="detail-card">
              <div class="detail-card-left">
                <div class="detail-icon-box" style="background: #eef2ff; color: #2563eb;">
                  <i class="bi bi-hash"></i>
                </div>
                <div>
                  <p class="detail-label">Student ID</p>
                  <p class="detail-value">#{{ student.id }}</p>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-card-left">
                <div class="detail-icon-box" style="background: #d1fae5; color: #059669;">
                  <i class="bi bi-upc-scan"></i>
                </div>
                <div>
                  <p class="detail-label">Student Number</p>
                  <p
                    class="detail-value"
                    style="font-family: 'JetBrains Mono', 'Courier New', monospace; letter-spacing: 0.03em;"
                  >
                    {{ student.studentNumberSequence?.student_number || '—' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-card-left">
                <div class="detail-icon-box" style="background: #ede9fe; color: #7c3aed;">
                  <i class="bi bi-envelope-fill"></i>
                </div>
                <div>
                  <p class="detail-label">Email</p>
                  <p class="detail-value">{{ student.user?.email || '—' }}</p>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-card-left">
                <div class="detail-icon-box" style="background: #fef3c7; color: #d97706;">
                  <i class="bi bi-calendar-event-fill"></i>
                </div>
                <div>
                  <p class="detail-label">Generation</p>
                  <p class="detail-value">{{ student.generation?.name || '—' }}</p>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-card-left">
                <div class="detail-icon-box" style="background: #fef3c7; color: #d97706;">
                  <i class="bi bi-mortarboard-fill"></i>
                </div>
                <div>
                  <p class="detail-label">Class</p>
                  <p class="detail-value">{{ student.class?.name || 'Not assigned' }}</p>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-card-left">
                <div class="detail-icon-box" :style="genderIconStyle">
                  <i :class="(student.user?.gender || '') === 'Male' ? 'bi bi-gender-male' : 'bi bi-gender-female'" />
                </div>
                <div>
                  <p class="detail-label">Gender</p>
                  <p class="detail-value">{{ student.user?.gender || '—' }}</p>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-card-left">
                <div class="detail-icon-box" style="background: #dbeafe; color: #2563eb;">
                  <i class="bi bi-calendar3"></i>
                </div>
                <div>
                  <p class="detail-label">Status</p>
                  <span class="status-pill" :class="(student.user?.status || '') === 'active' ? 'stat-active' : 'stat-inactive'">
                    <span class="status-dot-sm" :class="(student.user?.status || '') === 'active' ? 'sdot-active' : 'sdot-inactive'" />
                    {{ (student.user?.status || '') === 'active' ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-card-left">
                <div class="detail-icon-box" style="background: #f0fdf4; color: #16a34a;">
                  <i class="bi bi-clock-history"></i>
                </div>
                <div>
                  <p class="detail-label">Created</p>
                  <p class="detail-value">{{ formatDate(student.created_at) }}</p>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-card-left">
                <div class="detail-icon-box" style="background: #fef2f2; color: #dc2626;">
                  <i class="bi bi-arrow-repeat"></i>
                </div>
                <div>
                  <p class="detail-label">Updated</p>
                  <p class="detail-value">{{ formatDate(student.updated_at) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer-custom">
            <button type="button" class="btn-close-modal" @click="$emit('close')">
              <i class="bi bi-check-lg me-1"></i>
              Done
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
const theme = useThemeStore()
import type { Student } from '@/services/studentService'

const props = defineProps<{
  show: boolean
  student: Student | null
  getInitials: (name: string) => string
  formatDate: (date?: string) => string
}>()

defineEmits<{
  close: []
}>()

const avatarGradient = computed(() => {
  const gender = props.student?.user?.gender
  if (gender === 'Male') return 'background: linear-gradient(135deg, #3b82f6, #1d4ed8);'
  if (gender === 'Female') return 'background: linear-gradient(135deg, #ec4899, #be185d);'
  return 'background: linear-gradient(135deg, #6366f1, #4f46e5);'
})

const genderIconStyle = computed(() => {
  const gender = props.student?.user?.gender
  if (gender === 'Male') return 'background: #dbeafe; color: #3b82f6;'
  if (gender === 'Female') return 'background: #fce7f3; color: #ec4899;'
  return 'background: #f3e8ff; color: #9333ea;'
})
</script>

<style scoped>
/* ==================== Overlay ==================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  backdrop-filter: blur(6px);
}

.modal-content-panel {
  background: #fff;
  border-radius: 20px;
  width: 480px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
  animation: modalBounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  position: relative;
}

@keyframes modalBounce {
  0% {
    transform: scale(0.92) translateY(12px);
    opacity: 0;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* ==================== Close Button ==================== */
.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  z-index: 2;
}

.modal-close-btn:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: rotate(90deg);
}

/* ==================== Profile Section ==================== */
.profile-section {
  padding: 36px 32px 20px;
  text-align: center;
  background: linear-gradient(180deg, #f8faff 0%, #ffffff 100%);
  border-bottom: 1px solid #f1f3f5;
  border-radius: 20px 20px 0 0;
}

.profile-avatar-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 14px;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.375rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
  transition: transform 0.2s ease;
}

.profile-avatar-wrap:hover .profile-avatar {
  transform: scale(1.05);
}

.profile-status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.dot-active {
  background: #22c55e;
}
.dot-inactive {
  background: #94a3b8;
}

.profile-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.profile-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.3rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 100px;
}

.profile-badge i {
  font-size: 0.8rem;
}

.badge-m {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-f {
  background: #fce7f3;
  color: #be185d;
}

/* ==================== Details Grid ==================== */
.details-grid {
  padding: 20px 24px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #f1f3f5;
  border-radius: 14px;
  transition: all 0.2s ease;
}

.detail-card:hover {
  background: #fff;
  border-color: #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transform: translateX(4px);
}

.detail-card-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.detail-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.detail-card:hover .detail-icon-box {
  transform: scale(1.1);
}

.detail-label {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.detail-value {
  margin: 2px 0 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

/* ==================== Status Pill ==================== */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.2rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 100px;
  margin-top: 2px;
}

.stat-active {
  background: #dcfce7;
  color: #15803d;
}

.stat-inactive {
  background: #f1f5f9;
  color: #64748b;
}

.status-dot-sm {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.sdot-active {
  background: #22c55e;
}

.sdot-inactive {
  background: #94a3b8;
}

/* ==================== Footer ==================== */
.modal-footer-custom {
  padding: 16px 24px 24px;
}

.btn-close-modal {
  width: 100%;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
}

.btn-close-modal:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.btn-close-modal:active {
  transform: translateY(0);
}

/* ==================== Transitions ==================== */
.modal-enter-active {
  transition: all 0.25s ease-out;
}

.modal-leave-active {
  transition: all 0.15s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content-panel,
.modal-leave-to .modal-content-panel {
  transform: scale(0.92) translateY(12px);
}

/* ==================== Scrollbar ==================== */
.modal-content-panel::-webkit-scrollbar {
  width: 4px;
}
.modal-content-panel::-webkit-scrollbar-track {
  background: transparent;
}
.modal-content-panel::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

/* ── Dark Mode ── */
.dark-mode .modal-overlay {
  background: rgba(0,0,0,0.65);
}
.dark-mode .modal-content-panel {
  background: #1e293b;
}
.dark-mode .modal-close-btn {
  background: #334155;
  color: #94a3b8;
}
.dark-mode .modal-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}
.dark-mode .profile-section {
  background: linear-gradient(180deg, #1e3a5f 0%, #1e293b 100%);
  border-bottom-color: #334155;
}
.dark-mode .profile-name {
  color: #f1f5f9;
}
.dark-mode .profile-status-dot {
  border-color: #1e293b;
}
.dark-mode .detail-card {
  background: #0f172a;
  border-color: #334155;
}
.dark-mode .detail-card:hover {
  background: #1e293b;
  border-color: #475569;
}
.dark-mode .detail-value {
  color: #e2e8f0;
}
</style>

