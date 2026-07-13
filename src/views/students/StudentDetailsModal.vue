<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && student" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content-panel" style="max-width: 460px;">
          <div class="modal-header-custom">
            <div class="modal-icon" style="background: #eef2ff; color: #2563eb;">
              <i class="bi bi-person-badge-fill"></i>
            </div>
            <h5 class="mb-1 fw-bold" style="color: #1a1a2e;">Student Details</h5>
          </div>
          <div class="modal-body-custom">
            <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <div
                class="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0"
                style="width: 52px; height: 52px; font-size: 1.125rem; background: linear-gradient(135deg, #2563eb, #1d4ed8);"
              >
                {{ getInitials(student.user?.name || '') }}
              </div>
              <div>
                <h6 class="mb-0 fw-bold" style="color: #1a1a2e; font-size: 1rem;">{{ student.user?.name }}</h6>
                <span
                  class="badge rounded-pill mt-1"
                  :style="{
                    background: student.gender === 'Male' ? '#e0f2fe' : '#fce7f3',
                    color: (student.user?.gender || '') === 'Male' ? '#0369a1' : '#be185d',
                    fontSize: '0.6875rem',
                  }"
                >
                  <i :class="(student.user?.gender || '') === 'Male' ? 'bi bi-gender-male' : 'bi bi-gender-female'"></i>
                  {{ student.user?.gender || '—' }}
                </span>
              </div>
            </div>

            <div class="detail-row mb-2">
              <span class="detail-label">ID</span>
              <span class="detail-value">#{{ student.id }}</span>
            </div>
            <div class="detail-row mb-2">
              <span class="detail-label">Class</span>
              <span class="detail-value">{{ student.class?.name || 'Not assigned' }}</span>
            </div>
            <div class="detail-row mb-2">
              <span class="detail-label">Gender</span>
              <span class="detail-value">{{ student.user?.gender || '—' }}</span>
            </div>
            <div class="detail-row mb-2">
              <span class="detail-label">Created</span>
              <span class="detail-value">{{ formatDate(student.created_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Updated</span>
              <span class="detail-value">{{ formatDate(student.updated_at) }}</span>
            </div>
          </div>
          <div class="modal-footer-custom">
            <button type="button" class="btn-submit" style="background: #2563eb; flex: 1;" @click="$emit('close')">Close</button>
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
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content-panel {
  background: #fff;
  border-radius: 16px;
  width: 480px;
  max-width: 92vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modalBounce 0.3s ease-out;
}

@keyframes modalBounce {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-header-custom { padding: 28px 28px 16px; text-align: center; }
.modal-header-custom h5 { font-size: 1.1rem; }
.modal-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin: 0 auto 12px;
}

.modal-body-custom { padding: 0 28px 16px; }
.modal-footer-custom {
  display: flex;
  gap: 8px;
  padding: 12px 28px 28px;
}

.modal-footer-custom button {
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  font-family: "Inter", "Noto Sans Khmer", sans-serif;
}

.btn-submit { color: white; }
.btn-submit:hover { opacity: 0.9; }

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label { font-size: 0.8125rem; color: #6b7280; font-weight: 500; }
.detail-value { font-size: 0.875rem; color: #1a1a2e; font-weight: 600; }

.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content-panel,
.modal-leave-to .modal-content-panel { transform: scale(0.9); }
</style>
