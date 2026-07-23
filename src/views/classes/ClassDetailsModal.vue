<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && classData" :class="['modal-overlay', { 'dark-mode': theme.isDark }]" @click.self="$emit('close')">
        <div class="modal-content-panel bg-white rounded-4 shadow-lg" style="max-width: 460px;">
          <!-- Header Section -->
          <div class="text-center pt-4 pb-3 px-4 border-bottom border-light">
            <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                 style="width: 60px; height: 60px; background: linear-gradient(135deg, #eef2ff, #dbeafe);">
              <i class="bi bi-journal-bookmark-fill fs-3" style="color: #4f46e5;"></i>
            </div>
            <h5 class="fw-bold mb-0 text-dark">Class Details</h5>
            <p class="text-muted small mt-1 mb-0">Complete information about this class</p>
          </div>

          <!-- Body Section -->
          <div class="px-4 py-3">
            <!-- Class Name -->
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
              <span class="small text-secondary fw-medium">Class Name</span>
              <span class="text-dark fw-semibold">{{ classData.name }}</span>
            </div>

            <!-- Generation -->
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
              <span class="small text-secondary fw-medium">Generation</span>
              <span class="text-dark fw-semibold">
                <span class="badge bg-light text-dark rounded-pill px-3 py-2">{{ classData.generation }}</span>
              </span>
            </div>

            <!-- Room -->
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
              <span class="small text-secondary fw-medium">Room</span>
              <span class="text-dark fw-semibold">{{ classData.room }}</span>
            </div>

            <!-- Students -->
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
              <span class="small text-secondary fw-medium">Students</span>
              <span class="text-dark fw-semibold">{{ classData.students }}</span>
            </div>

            <!-- Teacher -->
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
              <span class="small text-secondary fw-medium">Homeroom Teacher</span>
              <span class="text-dark fw-semibold">{{ classData.teacher?.name || '—' }}</span>
            </div>

            <!-- Status -->
            <div class="d-flex justify-content-between align-items-center py-2">
              <span class="small text-secondary fw-medium">Status</span>
              <span class="text-dark fw-semibold">
                <span class="badge rounded-pill" :class="classData.status === 'Active' ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'">
                  {{ classData.status }}
                </span>
              </span>
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
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()

defineProps<{
  show: boolean
  classData: {
    id: number
    name: string
    generation: string
    room: string
    students: number
    status: string
    teacher: { id: number; name: string } | null
  } | null
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

/* ── Dark Mode ── */
.dark-mode .modal-overlay {
  background: rgba(0, 0, 0, 0.6);
}
.dark-mode .modal-content-panel {
  background: #1e293b !important;
}
.dark-mode .modal-content-panel h5 {
  color: #f1f5f9 !important;
}
.dark-mode .modal-content-panel .text-muted {
  color: #94a3b8 !important;
}
.dark-mode .modal-content-panel .text-dark {
  color: #e2e8f0 !important;
}
.dark-mode .modal-content-panel .text-secondary {
  color: #64748b !important;
}
.dark-mode .modal-content-panel .border-light {
  border-color: #334155 !important;
}
.dark-mode .modal-content-panel .badge.bg-light {
  background: #334155 !important;
  color: #e2e8f0 !important;
}
.dark-mode .modal-content-panel .bg-success-subtle {
  background: rgba(22, 163, 74, 0.15) !important;
  color: #4ade80 !important;
}
.dark-mode .modal-content-panel .bg-secondary-subtle {
  background: #334155 !important;
  color: #94a3b8 !important;
}
</style>
