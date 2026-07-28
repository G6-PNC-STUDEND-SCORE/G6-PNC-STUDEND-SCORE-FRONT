<template>
  <Modal :model-value="confirmState.show" max-width="420px" @update:model-value="cancel">
    <div :class="{ 'dark-mode': isDark }">
      <div class="modal-head">
        <div class="modal-icon" :class="confirmState.danger ? 'icon-danger' : 'icon-default'">
          <AlertTriangle :size="20" />
        </div>
        <div class="modal-title-group">
          <h3 :class="{ 'title-danger': confirmState.danger }">{{ confirmState.title }}</h3>
          <p class="confirm-message">{{ confirmState.message }}</p>
        </div>
        <button class="modal-x" @click="cancel">&times;</button>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-ghost" @click="cancel">{{ confirmState.cancelLabel }}</button>
        <button
          type="button"
          :class="confirmState.danger ? 'btn btn-danger' : 'btn btn-primary'"
          @click="accept"
        >
          {{ confirmState.confirmLabel }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { AlertTriangle } from '@lucide/vue'
import Modal from './Modal.vue'
import { useConfirm } from '@/composables/useConfirm'

const { confirmState, accept, cancel } = useConfirm()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
</script>

<style scoped>
.modal-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 24px 24px 0;
  position: relative;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.modal-title-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-head h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
  line-height: 1.4;
  letter-spacing: -0.01em;
  transition: color 0.3s ease;
}
.title-danger { color: #dc2626 !important; }

.modal-x {
  position: absolute;
  top: 18px;
  right: 18px;
  background: none;
  border: none;
  font-size: 1.4rem;
  font-weight: 300;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 6px;
  transition: all 0.15s ease;
}
.modal-x:hover { color: #475569; background: #f1f5f9; }

.modal-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon-danger { background: #fef2f2; color: #ef4444; }
.icon-default { background: #eff6ff; color: #2563eb; }

.confirm-message {
  font-size: 0.875rem;
  color: #475569;
  margin: 0;
  line-height: 1.5;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 24px 24px;
}

/* Dark mode */
.dark-mode .modal-head h3 { color: #f1f5f9; }
.dark-mode .title-danger { color: #fca5a5 !important; }
.dark-mode .modal-x { color: #64748b; }
.dark-mode .modal-x:hover { color: #cbd5e1; background: rgba(51, 65, 85, 0.5); }
.dark-mode .icon-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.dark-mode .icon-default { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.dark-mode .confirm-message { color: #cbd5e1; }
</style>
