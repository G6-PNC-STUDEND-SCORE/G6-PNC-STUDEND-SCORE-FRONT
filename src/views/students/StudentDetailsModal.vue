<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && student" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content-panel">
          <!-- Close -->
          <button class="modal-close-btn" @click="$emit('close')" aria-label="Close">
            <i class="bi bi-x-lg"></i>
          </button>

          <!-- Header with Photo -->
          <div class="modal-header-custom">
            <div class="profile-photo-wrap">
              <img
                v-if="student.photo"
                :src="getPhotoUrl(student.photo)"
                :alt="student.name"
                class="profile-photo"
              />
              <div v-else class="profile-photo-fallback">
                {{ getInitials(student.name) }}
              </div>
              <div class="photo-ring"></div>
            </div>
            <h3 class="student-name-title">{{ student.name }}</h3>
            <div class="student-meta">
              <span class="meta-badge">#{{ student.id }}</span>
              <span
                class="meta-badge gender-badge"
                :class="student.gender === 'Male' ? 'male' : 'female'"
              >
                {{ student.gender }}
              </span>
              <span
                class="meta-badge status-indicator"
                :class="student.status === 'active' ? 'active' : 'inactive'"
              >
                {{ student.status === 'active' ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>

          <!-- Details Grid -->
          <div class="modal-body-custom">
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-icon"><i class="bi bi-building"></i></div>
                <div class="detail-info">
                  <span class="detail-label">Class</span>
                  <span class="detail-value">{{ student.class?.name || 'Not assigned' }}</span>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-icon"><i class="bi bi-calendar-plus"></i></div>
                <div class="detail-info">
                  <span class="detail-label">Created</span>
                  <span class="detail-value">{{ formatDate(student.created_at) }}</span>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-icon"><i class="bi bi-calendar-check"></i></div>
                <div class="detail-info">
                  <span class="detail-label">Last Updated</span>
                  <span class="detail-value">{{ formatDate(student.updated_at) }}</span>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-icon"><i class="bi bi-person-badge"></i></div>
                <div class="detail-info">
                  <span class="detail-label">Status</span>
                  <span class="detail-value">{{ student.status === 'active' ? 'Active' : 'Inactive' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer-custom">
            <button type="button" class="btn-edit" @click="handleEdit">
              <i class="bi bi-pencil"></i>
              Edit Student
            </button>
            <button type="button" class="btn-close-custom" @click="$emit('close')">
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { getPhotoUrl, type Student } from '@/services/studentService'

const props = defineProps<{
  show: boolean
  student: Student | null
  getInitials: (name: string) => string
  formatDate: (date?: string) => string
}>()

const emit = defineEmits<{
  close: []
  edit: [student: Student]
}>()

function handleEdit() {
  if (props.student) {
    emit('edit', props.student)
    emit('close')
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  padding: 1rem;
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
  0% { transform: scale(0.92) translateY(12px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

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

/* ==================== Header ==================== */
.modal-header-custom {
  padding: 40px 32px 20px;
  text-align: center;
  position: relative;
}

.profile-photo-wrap {
  width: 100px;
  height: 100px;
  margin: 0 auto 16px;
  position: relative;
}

.profile-photo,
.profile-photo-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 1;
}

.profile-photo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
}

.photo-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  z-index: 0;
}

.student-name-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.student-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-badge {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 100px;
  background: #f1f5f9;
  color: #475569;
}

.meta-badge.gender-badge.male {
  background: #dbeafe;
  color: #1d4ed8;
}

.meta-badge.gender-badge.female {
  background: #fce7f3;
  color: #be185d;
}

.meta-badge.status-indicator.active {
  background: #dcfce7;
  color: #15803d;
}

.meta-badge.status-indicator.inactive {
  background: #f1f5f9;
  color: #64748b;
}

/* ==================== Body ==================== */
.modal-body-custom {
  padding: 8px 32px 20px;
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #f8fafc;
  transition: background 0.2s ease;
}

.detail-item:hover {
  background: #f1f5f9;
}

.detail-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #2563eb;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.detail-info {
  flex: 1;
}

.detail-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  margin-bottom: 1px;
}

.detail-value {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

/* ==================== Footer ==================== */
.modal-footer-custom {
  display: flex;
  gap: 10px;
  padding: 8px 32px 28px;
}

.modal-footer-custom button {
  flex: 1;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.btn-edit {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
}

.btn-edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.btn-close-custom {
  background: #f1f5f9;
  color: #475569;
  border: 1.5px solid #e2e8f0 !important;
}

.btn-close-custom:hover {
  background: #e2e8f0;
}

/* ==================== Transitions ==================== */
.modal-enter-active { transition: all 0.25s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content-panel,
.modal-leave-to .modal-content-panel {
  transform: scale(0.92) translateY(12px);
}

.modal-content-panel::-webkit-scrollbar { width: 4px; }
.modal-content-panel::-webkit-scrollbar-track { background: transparent; }
.modal-content-panel::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
</style>
