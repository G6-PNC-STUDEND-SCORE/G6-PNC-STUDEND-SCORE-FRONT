<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toast.show" class="toast-notification" :class="toast.type">
        <div class="toast-icon">
          <CheckCircle v-if="toast.type === 'success'" :size="18" />
          <AlertCircle v-else :size="18" />
        </div>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="hide">&times;</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle, AlertCircle } from '@lucide/vue'
import { useToast } from '@/composables/useToast'

const { toast, hide } = useToast()
</script>

<style scoped>
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  z-index: 99999;
  max-width: 400px;
  animation: toastPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-left: 4px solid transparent;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.toast-notification.success {
  background: #ecfdf5;
  color: #065f46;
  border-left-color: #10b981;
  border-top: 1px solid #a7f3d0;
  border-right: 1px solid #a7f3d0;
  border-bottom: 1px solid #a7f3d0;
}

.toast-notification.error {
  background: #fef2f2;
  color: #991b1b;
  border-left-color: #ef4444;
  border-top: 1px solid #fecaca;
  border-right: 1px solid #fecaca;
  border-bottom: 1px solid #fecaca;
}

.toast-icon { display: flex; flex-shrink: 0; }
.toast-notification.success .toast-icon svg { color: #10b981; }
.toast-notification.error .toast-icon svg { color: #ef4444; }
.toast-message { flex: 1; }

.toast-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  color: inherit;
  opacity: 0.5;
  padding: 0;
}
.toast-close:hover { opacity: 1; }

.toast-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(40px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateX(40px) scale(0.95); }
</style>

<!-- Global dark mode styles for toast (teleported to body, needs global) -->
<style>
html.dark .toast-notification.success {
  background: rgba(16, 185, 129, 0.12);
  color: #6ee7b7;
  border-left-color: #10b981;
  border-top: 1px solid rgba(16, 185, 129, 0.2);
  border-right: 1px solid rgba(16, 185, 129, 0.2);
  border-bottom: 1px solid rgba(16, 185, 129, 0.2);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

html.dark .toast-notification.error {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border-left-color: #ef4444;
  border-top: 1px solid rgba(239, 68, 68, 0.2);
  border-right: 1px solid rgba(239, 68, 68, 0.2);
  border-bottom: 1px solid rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}
</style>
