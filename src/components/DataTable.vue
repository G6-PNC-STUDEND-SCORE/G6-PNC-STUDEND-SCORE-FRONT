<template>
  <div :class="['data-table-wrapper', { 'dark-mode': isDark }]">
    <div class="table-header" v-if="title || $slots.header">
      <slot name="header">
        <h3 class="table-title">{{ title }}</h3>
      </slot>
    </div>
    <div class="table-responsive">
      <table class="data-table mb-0">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :style="{ width: col.width }">
              <slot :name="`header-${col.key}`">{{ col.label }}</slot>
            </th>
          </tr>
        </thead>
        <TransitionGroup name="row" tag="tbody">
          <tr v-if="data.length === 0" key="empty">
            <td :colspan="columns.length" class="text-center text-muted py-4">
              <Inbox :size="16" class="me-1" /> No data available
            </td>
          </tr>
          <tr
            v-for="(row, index) in data"
            :key="rowKey ? rowKey(row, index) : index"
            :class="['data-row', rowClass ? rowClass(row, index) : undefined]"
            @dblclick="$emit('row-dblclick', row, index)"
          >
            <td v-for="col in columns" :key="col.key">
              <slot :name="`cell-${col.key}`" :row="row" :index="index">
                {{ formatCell(row, col.key) }}
              </slot>
            </td>
          </tr>
        </TransitionGroup>
      </table>
    </div>

    <div class="table-footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { useThemeStore } from '@/stores/theme'
import { computed } from 'vue'

defineProps<{
  title?: string
  columns: { key: string; label: string; width?: string }[]
  data: T[]
  rowKey?: (row: T, index: number) => string | number
  rowClass?: (row: T, index: number) => string | Record<string, boolean>
}>()

defineEmits<{
  'row-dblclick': [row: T, index: number]
}>()

import { Inbox } from '@lucide/vue'
import { TransitionGroup } from 'vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

function formatCell(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key] ?? ''
}

defineOptions({
  inheritAttrs: false,
})
</script>

<style scoped>
.data-table-wrapper {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.data-table-wrapper.dark-mode {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.table-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eef2f7;
}

.dark-mode .table-header {
  border-bottom-color: #334155;
}

.table-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.dark-mode .table-title {
  color: #f1f5f9;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
  margin-bottom: 0;
}

.data-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f8fafc;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.dark-mode .data-table thead th {
  background: #1e293b;
  color: #e2e8f0;
  border-bottom-color: #334155;
}

.data-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f3f5;
  color: #475569;
  vertical-align: middle;
  font-weight: 500;
}

.dark-mode .data-table tbody td {
  color: #e2e8f0;
  border-bottom-color: #334155;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-row {
  transition: background 0.2s ease, border-left 0.2s ease;
  border-left: 3px solid transparent;
}

.data-row:hover {
  background: #f8fafc;
  border-left-color: #2563eb;
}

.dark-mode .data-row:hover {
  background: rgba(51, 65, 85, 0.3);
}

:global(.row-selected) {
  background: #f0f5ff !important;
  border-left-color: #2563eb !important;
}

.dark-mode :global(.row-selected) {
  background: rgba(37, 99, 235, 0.15) !important;
}

.table-footer {
  padding: 0.5rem 1rem;
  border-top: 1px solid #eef2f7;
}

.dark-mode .table-footer {
  border-top-color: #334155;
}

:deep(.row-enter-active),
:deep(.row-leave-active) {
  transition: all 0.3s ease;
}

:deep(.row-enter-from) {
  opacity: 0;
  transform: translateX(-20px);
}

:deep(.row-leave-to) {
  opacity: 0;
  transform: translateX(20px);
}

:deep(.row-move) {
  transition: transform 0.3s ease;
}
</style>
