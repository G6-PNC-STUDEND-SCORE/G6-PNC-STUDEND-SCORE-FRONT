<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toast.show" :class="['toast-notification', toast.type]">
        <div class="toast-icon-wrap" :class="toast.type">
          <CheckCircle v-if="toast.type === 'success'" :size="16" />
          <XCircle v-else :size="16" />
        </div>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="hide" aria-label="Close">
          <X :size="14" />
        </button>
        <div class="toast-progress" :class="toast.type"></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle, XCircle, X } from '@lucide/vue'
import { useToast } from '@/composables/useToast'

const { toast, hide } = useToast()
</script>

<style scoped>
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 30px -5px rgba(0, 0, 0, 0.12);
  z-index: var(--z-toast);
  max-width: 420px;
  animation: toast-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  position: relative;
}

.toast-notification.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.toast-notification.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* ─── Icon ─── */
.toast-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-icon-wrap.success {
  background: rgba(16, 185, 129, 0.15);
}

.toast-icon-wrap.success svg {
  color: #10b981;
}

.toast-icon-wrap.error {
  background: rgba(239, 68, 68, 0.15);
}

.toast-icon-wrap.error svg {
  color: #ef4444;
}

.toast-message {
  flex: 1;
  font-weight: var(--font-weight-semibold);
  line-height: 1.3;
}

/* ─── Close Button ─── */
.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.3;
  padding: 2px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 0.7;
  background: rgba(0, 0, 0, 0.05);
}

/* ─── Progress Bar ─── */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
}

.toast-progress.success {
  background: linear-gradient(to right, #34d399, #10b981);
  animation: toast-progress 3s linear forwards;
}

.toast-progress.error {
  background: linear-gradient(to right, #f87171, #ef4444);
  animation: toast-progress 3s linear forwards;
}

@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}

/* ─── Entrance Animation ─── */
@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translateX(40px) scale(0.92);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.92);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.92);
}
</style>
