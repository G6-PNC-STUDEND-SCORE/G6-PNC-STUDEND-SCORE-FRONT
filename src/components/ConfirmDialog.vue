<template>
  <Modal :model-value="confirmState.show" max-width="400px" @update:model-value="cancel">
    <div class="modal-head">
      <div class="modal-icon" :class="confirmState.danger ? 'icon-danger' : 'icon-default'">
        <AlertTriangle :size="20" />
      </div>
      <div>
        <h3 :class="{ 'title-danger': confirmState.danger }">{{ confirmState.title }}</h3>
      </div>
      <button class="modal-x" @click="cancel">&times;</button>
    </div>
    <div class="modal-body">
      <p class="confirm-message">{{ confirmState.message }}</p>
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
  </Modal>
</template>

<script setup lang="ts">
import { AlertTriangle } from '@lucide/vue'
import Modal from './Modal.vue'
import { useConfirm } from '@/composables/useConfirm'

const { confirmState, accept, cancel } = useConfirm()
</script>

<style scoped>
.modal-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 24px 0;
  position: relative;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}
.modal-head h3 { font-size: 1.05rem; font-weight: 700; margin: 0; color: #0f172a; }
.title-danger { color: #dc2626 !important; }

.modal-x {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}
.modal-x:hover { color: #475569; }

.modal-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.icon-danger { background: #fef2f2; color: #ef4444; }
.icon-default { background: #eff6ff; color: #2563eb; }

.modal-body { padding: 16px 24px 0; }
.confirm-message { font-size: 0.9rem; color: #475569; margin: 0; }

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 20px 24px;
}
</style>
