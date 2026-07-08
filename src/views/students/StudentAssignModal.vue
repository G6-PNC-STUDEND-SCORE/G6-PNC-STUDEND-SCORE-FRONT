<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content-panel" style="max-width: 420px;">
          <div class="modal-header-custom">
            <div class="modal-icon" style="background: #fef9c3; color: #854d0e;">
              <i class="bi bi-box-arrow-in-right"></i>
            </div>
            <h5 class="mb-1 fw-bold" style="color: #1a1a2e;">Assign to Class</h5>
            <p class="mb-0" style="font-size: 0.8125rem; color: #6b7280;">
              Assign <strong>{{ studentName }}</strong> to a class
            </p>
          </div>

          <form @submit.prevent="$emit('confirm')">
            <div class="modal-body-custom">
              <div class="mb-0">
                <label class="d-block mb-1 fw-medium" style="font-size: 0.8125rem; color: #374151;">Select Class</label>
                <select
                  :value="classId"
                  @change="$emit('update:classId', Number(($event.target as HTMLSelectElement).value))"
                  class="form-select"
                  style="border-radius: 0.5rem; border-color: #e5e7eb; font-size: 0.875rem; padding: 0.55rem 0.75rem;"
                  required
                >
                  <option :value="null" disabled>— Choose a class —</option>
                  <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                </select>
              </div>
            </div>

            <div class="modal-footer-custom">
              <button type="button" class="btn-cancel" @click="$emit('close')">Cancel</button>
              <button
                type="submit"
                class="btn-submit"
                :disabled="submitting || !classId"
                style="background: #ca8a04;"
              >
                <template v-if="submitting">
                  <span class="spinner-border spinner-border-sm" role="status"></span>
                  Assigning...
                </template>
                <template v-else>
                  <i class="bi bi-check-lg me-1"></i>
                  Assign
                </template>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { SchoolClass } from '@/services/studentService'

defineProps<{
  show: boolean
  studentName: string
  classId: number | null
  classes: SchoolClass[]
  submitting: boolean
}>()

defineEmits<{
  close: []
  confirm: []
  'update:classId': [value: number]
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

.btn-cancel { background: #f3f4f6; color: #374151; }
.btn-cancel:hover { background: #e5e7eb; }
.btn-submit { color: white; }
.btn-submit:hover { opacity: 0.9; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content-panel,
.modal-leave-to .modal-content-panel { transform: scale(0.9); }
</style>
