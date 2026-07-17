<template>
  <div class="class-list">
    <!-- Search and Filter -->
    <div class="list-toolbar">
      <div class="search-wrapper">
        <i class="bi bi-search search-icon"></i>
        <input
          :value="searchQuery"
          @input="$emit('update:search-query', ($event.target as HTMLInputElement).value)"
          type="text"
          class="search-input"
          placeholder="Search classes..."
        />
      </div>
      <select
        :value="statusFilter"
        @change="$emit('update:status-filter', ($event.target as HTMLSelectElement).value)"
        class="status-select"
      >
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </div>

    <!-- Floating Delete Button -->
    <Transition name="fab">
      <button
        v-if="selectedIds.length > 0"
        class="fab-delete"
        @click="$emit('bulk-delete', [...selectedIds])"
        :title="`Delete ${selectedIds.length} selected`"
      >
        <i class="bi bi-trash3-fill"></i>
        <span class="fab-badge">{{ selectedIds.length }}</span>
      </button>
    </Transition>

    <!-- Table -->
    <div class="table-wrapper">
      <table class="class-table">
        <thead>
          <tr>
            <th class="col-check">
              <input
                type="checkbox"
                class="row-check"
                :checked="allSelected"
                :indeterminate="someSelected && !allSelected"
                @change="toggleAll"
                aria-label="Select all"
              />
            </th>
            <th>Class Name</th>
            <th>Generation</th>
            <th>Room</th>
            <th>Students</th>
            <th>Teacher</th>
            <th>Status</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="classItem in classes" :key="classItem.id">
            <td class="col-check">
              <input
                type="checkbox"
                class="row-check"
                :checked="selectedIds.includes(classItem.id)"
                @change="toggleRow(classItem.id)"
                :aria-label="`Select ${classItem.name}`"
              />
            </td>
            <td class="fw-semibold text-dark">{{ classItem.name }}</td>
            <td>{{ classItem.generation?.year || classItem.generation || '—' }}</td>
            <td>{{ classItem.room || '—' }}</td>
            <td>{{ classItem.students ?? '—' }}</td>
            <td>{{ classItem.teacher?.name || '—' }}</td>
            <td>
              <span
                class="status-badge"
                :class="classItem.is_active ? 'badge-active' : 'badge-inactive'"
              >
                {{ classItem.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="action-btn view" @click="$emit('view', classItem)" title="View">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="action-btn edit" @click="$emit('edit', classItem)" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  class="action-btn delete"
                  @click="$emit('delete', classItem)"
                  title="Delete"
                >
                  <i class="bi bi-trash3"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!classes.length">
            <td colspan="8" class="empty-row">
              <div class="empty-state">
                <i class="bi bi-inbox empty-icon"></i>
                <p>No classes found</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  classes: Array<{
    id: number
    name: string
    generation?: { year: string } | string | null
    room?: string | null
    students?: number | null
    teacher?: { name: string } | null
    is_active?: boolean
    status?: string
  }>
  searchQuery: string
  statusFilter: string
}>()

const selectedIds = ref<number[]>([])

const allSelected = computed(
  () => props.classes.length > 0 && props.classes.every((c) => selectedIds.value.includes(c.id)),
)

const someSelected = computed(() => selectedIds.value.length > 0)

function toggleRow(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)
}

function toggleAll() {
  if (allSelected.value) {
    const classIds = props.classes.map((c) => c.id)
    selectedIds.value = selectedIds.value.filter((id) => !classIds.includes(id))
  } else {
    const ids = props.classes.map((c) => c.id)
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...ids]))
  }
}

// Expose clearSelection for parent to call after bulk delete
function clearSelection() {
  selectedIds.value = []
}

defineExpose({ clearSelection })
</script>

<style scoped>
.class-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.875rem;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.15s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.status-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  background: #fff;
  cursor: pointer;
  outline: none;
}

.status-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.class-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.class-table thead {
  background: #f8fafc;
}

.class-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid #e2e8f0;
}

.col-check {
  width: 44px;
  padding-left: 18px !important;
  padding-right: 0 !important;
}

.row-check {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
  cursor: pointer;
  vertical-align: middle;
}

.class-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

.class-table tbody tr:hover {
  background: #f8fafc;
}

.class-table tbody tr:last-child td {
  border-bottom: none;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-active {
  background: #dcfce7;
  color: #16a34a;
}

.badge-inactive {
  background: #f1f5f9;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s;
}

.action-btn.view {
  background: #eff6ff;
  color: #2563eb;
}

.action-btn.view:hover {
  background: #dbeafe;
}

.action-btn.edit {
  background: #fef9c3;
  color: #d97706;
}

.action-btn.edit:hover {
  background: #fef3c7;
}

.action-btn.delete {
  background: #fee2e2;
  color: #dc2626;
}

.action-btn.delete:hover {
  background: #fecaca;
}

.empty-row {
  padding: 3rem 1rem !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 2rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.actions-col {
  width: 120px;
  text-align: right;
}

/* ==================== Floating Delete Button ==================== */
.fab-delete {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #2563eb;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 6px 20px rgba(37, 99, 235, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  transition: all 0.2s ease;
  font-size: 1.4rem;
}

.fab-delete:hover {
  background: #1d4ed8;
  transform: scale(1.08);
  box-shadow: 0 8px 28px rgba(37, 99, 235, 0.5);
}

.fab-delete:active {
  transform: scale(0.95);
}

.fab-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 12px;
  background: #dc2626;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  line-height: 1;
}

.fab-enter-active {
  animation: fabIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-leave-active {
  animation: fabOut 0.2s ease-in;
}

@keyframes fabIn {
  from {
    opacity: 0;
    transform: scale(0.5) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fabOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.5) translateY(20px);
  }
}
</style>
