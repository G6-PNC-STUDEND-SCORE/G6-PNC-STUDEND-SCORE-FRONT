<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" :class="['modal-overlay', { 'dark-mode': isDark }]" @click.self="$emit('update:modelValue', false)">
        <div class="modal-content-panel" :style="maxWidth ? { maxWidth } : {}">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

defineProps<{
  modelValue: boolean
  maxWidth?: string
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  padding: 1rem;
}

.modal-content-panel {
  background: #fff;
  border-radius: 16px;
  width: 480px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modal-in 0.25s ease-out;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  transition: background 0.3s ease;
}

@keyframes modal-in {
  0% { opacity: 0; transform: scale(0.92) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-content-panel::-webkit-scrollbar { width: 4px; }
.modal-content-panel::-webkit-scrollbar-track { background: transparent; }
.modal-content-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content-panel,
.modal-leave-to .modal-content-panel { transform: scale(0.92) translateY(10px); }

.modal-enter-active .modal-content-panel,
.modal-leave-active .modal-content-panel { transition: transform 0.25s ease-out; }

/* Dark mode */
.dark-mode .modal-overlay {
  background: rgba(0, 0, 0, 0.65);
}
.dark-mode .modal-content-panel {
  background: #1e293b;
}
.dark-mode .modal-content-panel::-webkit-scrollbar-thumb { background: #475569; }
</style>
