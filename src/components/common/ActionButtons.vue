<template>
  <div class="action-buttons">
    <button
      v-if="showEdit"
      class="action-btn action-btn-edit"
      title="Edit"
      @click="$emit('edit')"
    >
      <Pencil :size="15" />
    </button>
    <button
      v-if="showDelete"
      class="action-btn action-btn-delete"
      title="Delete"
      @click="$emit('delete')"
    >
      <Trash2 :size="15" />
    </button>
    <button
      v-if="showView"
      class="action-btn action-btn-view"
      title="View"
      @click="$emit('view')"
    >
      <Eye :size="15" />
    </button>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { Pencil, Trash2, Eye } from '@lucide/vue'

withDefaults(
  defineProps<{
    showEdit?: boolean
    showDelete?: boolean
    showView?: boolean
  }>(),
  {
    showEdit: false,
    showDelete: false,
    showView: false,
  },
)

defineEmits<{
  edit: []
  delete: []
  view: []
}>()
</script>

<style scoped>
.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn-edit {
  background: #eff6ff;
  color: #2563eb;
}

.action-btn-edit:hover {
  background: #dbeafe;
  color: #1d4ed8;
}

.action-btn-delete {
  background: #fef2f2;
  color: #ef4444;
}

.action-btn-delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.action-btn-view {
  background: #f0fdf4;
  color: #16a34a;
}

.action-btn-view:hover {
  background: #dcfce7;
  color: #15803d;
}
</style>
