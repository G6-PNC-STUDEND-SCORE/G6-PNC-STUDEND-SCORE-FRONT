<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content-panel" style="max-width: 420px">
          <div class="modal-header-custom">
            <div class="modal-icon" style="background: #fef2f2; color: #ef4444">
              <i class="bi bi-trash3"></i>
            </div>
            <h5 class="mb-1 fw-bold" style="color: #1a1a2e">
              Delete {{ selectedCount }} {{ itemLabel }}{{ selectedCount !== 1 ? 's' : '' }}
            </h5>
            <p class="mb-0" style="font-size: 0.8125rem; color: #6b7280">
              Are you sure you want to delete <strong>{{ selectedCount }}</strong> {{ itemLabel
              }}{{ selectedCount !== 1 ? 's' : '' }}? This action cannot be undone.
            </p>
          </div>
          <div v-if="selectedNames && selectedNames.length > 0" class="selected-names-list">
            <div v-for="name in selectedNames.slice(0, 5)" :key="name" class="selected-name-item">
              <i class="bi bi-dash-circle me-2" style="color: #ef4444; font-size: 0.7rem"></i>
              {{ name }}
            </div>
            <div v-if="selectedNames.length > 5" class="selected-name-more">
              +{{ selectedNames.length - 5 }} more
            </div>
          </div>
          <div class="modal-footer-custom">
            <button type="button" class="btn-cancel" @click="$emit('close')">Cancel</button>
            <button
              type="button"
              class="btn-submit"
              :disabled="submitting"
              style="background: #ef4444"
              @click="$emit('confirm')"
            >
              <template v-if="submitting">
                <span class="spinner-border spinner-border-sm" role="status"></span>
                Deleting...
              </template>
              <template v-else>
                <i class="bi bi-trash3 me-1"></i>
                Delete {{ selectedCount }}
              </template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  selectedCount: number
  selectedNames?: string[]
  itemLabel: string
  submitting: boolean
}>()

defineEmits<{
  close: []
  confirm: []
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
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header-custom {
  padding: 28px 28px 8px;
  text-align: center;
}
.modal-header-custom h5 {
  font-size: 1.1rem;
}
.modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin: 0 auto 12px;
}

.selected-names-list {
  padding: 4px 28px 8px;
  max-height: 180px;
  overflow-y: auto;
}

.selected-name-item {
  display: flex;
  align-items: center;
  font-size: 0.8125rem;
  color: #4b5563;
  padding: 3px 0;
}

.selected-name-more {
  font-size: 0.75rem;
  color: #9ca3af;
  padding: 3px 0 3px 20px;
}

.modal-footer-custom {
  display: flex;
  gap: 8px;
  padding: 8px 28px 28px;
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
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}
.btn-cancel:hover {
  background: #e5e7eb;
}
.btn-submit {
  color: white;
}
.btn-submit:hover {
  opacity: 0.9;
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-enter-active {
  transition: all 0.2s ease-out;
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
  transform: scale(0.9);
}
</style>
