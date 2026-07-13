<template>
  <div :class="['data-table-wrapper', { 'dark-mode': isDark }]">
    <div class="table-header" v-if="title || $slots.header">
      <slot name="header">
        <h3 class="table-title">{{ title }}</h3>
      </slot>
    </div>
    
    <div class="table-responsive">
      <table class="table table-hover data-table mb-0">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :style="{ width: col.width }">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="data.length === 0">
            <td :colspan="columns.length" class="text-center text-muted py-4">
              <i class="bi bi-inbox me-1"></i> No data available
            </td>
          </tr>
          <tr v-for="(row, index) in data" :key="index">
            <td v-for="col in columns" :key="col.key">
              <slot :name="`cell-${col.key}`" :row="row" :index="index">
                {{ formatCell(row, col.key) }}
              </slot>
            </td>
          </tr>
        </tbody>
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
}>()

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

function formatCell(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key] ?? ''
}

// Expose slots with dynamic cell names using type assertion
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
  font-size: 0.82rem;
  margin-bottom: 0;
}

.data-table thead th {
  background: #f8fafc;
  color: #334155;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #eef2f7;
  white-space: nowrap;
}

.dark-mode .data-table thead th {
  background: #1e293b;
  color: #e2e8f0;
  border-bottom-color: #334155;
}

.data-table tbody td {
  padding: 0.65rem 0.75rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.dark-mode .data-table tbody td {
  color: #e2e8f0;
  border-bottom-color: #334155;
}

.data-table tbody tr:last-child td {
  border-bottom: 0;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.dark-mode .data-table tbody tr:hover {
  background: rgba(51, 65, 85, 0.3);
}

.table-footer {
  padding: 0.5rem 1rem;
  border-top: 1px solid #eef2f7;
}

.dark-mode .table-footer {
  border-top-color: #334155;
}
</style>
