<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && student" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content-panel bg-white rounded-4 shadow-lg" style="max-width: 460px;">
          <!-- Header Section -->
          <div class="text-center pt-4 pb-3 px-4 border-bottom border-light">
            <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                 style="width: 60px; height: 60px; background: linear-gradient(135deg, #eef2ff, #dbeafe);">
              <i class="bi bi-person-badge-fill fs-3" style="color: #4f46e5;"></i>
            </div>
            <h5 class="fw-bold mb-0 text-dark">Student Details</h5>
            <p class="text-muted small mt-1 mb-0">Complete information about this student</p>
          </div>

          <!-- Body Section -->
          <div class="px-4 py-3">
            <!-- Student Avatar & Name -->
            <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom border-light">
              <div
                v-if="student.profile_photo_url"
                class="avatar-img-details"
              >
                <img
                  :src="student.profile_photo_url"
                  :alt="student.user?.name || 'Student'"
                  class="photo-img-details"
                />
              </div>
              <div
                v-else
                class="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0 shadow-sm"
                style="width: 54px; height: 54px; font-size: 1.125rem; background: linear-gradient(135deg, #6366f1, #4f46e5);"
              >
                {{ getInitials(student.user?.name || '') }}
              </div>
              <div>
                <h6 class="mb-1 fw-bold text-dark">{{ student.user?.name }}</h6>
                <span
                  class="badge rounded-pill"
                  :class="(student.user?.gender || '') === 'Male' ? 'bg-primary-subtle text-primary' : 'bg-danger-subtle text-danger'"
                >
                  <i :class="(student.user?.gender || '') === 'Male' ? 'bi bi-gender-male me-1' : 'bi bi-gender-female me-1'"></i>
                  {{ student.user?.gender || '—' }}
                </span>
              </div>
            </div>

            <!-- Detail Rows -->
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
              <span class="small text-secondary fw-medium">Student ID</span>
              <span class="text-dark fw-semibold">
                <span class="badge bg-light text-dark rounded-pill px-3 py-2">#{{ student.id }}</span>
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
              <span class="small text-secondary fw-medium">Class</span>
              <span class="text-dark fw-semibold">
                <span class="badge bg-info-subtle text-info-emphasis rounded-pill px-3 py-2">
                  <i class="bi bi-bookmark me-1"></i>{{ student.class?.name || 'Not assigned' }}
                </span>
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
              <span class="small text-secondary fw-medium">Gender</span>
              <span class="text-dark fw-semibold">
                <i :class="(student.user?.gender || '') === 'Male' ? 'bi bi-gender-male text-primary' : 'bi bi-gender-female text-danger'" class="me-1"></i>
                {{ student.user?.gender || '—' }}
              </span>
            </div>
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
              <span class="small text-secondary fw-medium">Created</span>
              <span class="text-dark fw-semibold small">{{ formatDate(student.created_at) }}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center py-2">
              <span class="small text-secondary fw-medium">Updated</span>
              <span class="text-dark fw-semibold small">{{ formatDate(student.updated_at) }}</span>
            </div>
          </div>

          <!-- Footer Section -->
          <div class="d-flex px-4 pb-4 pt-2 gap-2">
            <button
              type="button"
              class="btn btn-primary w-100 py-2 fw-semibold rounded-pill shadow-sm"
              @click="$emit('close')"
            >
              <i class="bi bi-check-circle me-2"></i>Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Student } from '@/services/studentService'

defineProps<{
  show: boolean
  student: Student | null
  getInitials: (name: string) => string
  formatDate: (date?: string) => string
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
}

.avatar-img-details {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.photo-img-details {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.modal-content-panel {
  width: 460px;
  max-width: 92vw;
  animation: modalBounce 0.3s ease-out;
}

@keyframes modalBounce {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content-panel,
.modal-leave-to .modal-content-panel { transform: scale(0.9); }
</style>