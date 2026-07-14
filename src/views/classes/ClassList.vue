<template>
  <div class="class-card">
    <!-- Search & Filter Bar -->
    <div class="toolbar">
      <div class="search-box">
        <i class="bi bi-search search-icon"></i>
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          class="search-input"
          placeholder="Search by name..."
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">
          <i class="bi bi-activity"></i>
          <span>Status</span>
          <select
            :value="statusFilter"
            @change="$emit('update:statusFilter', ($event.target as HTMLSelectElement).value)"
            class="filter-select"
          >
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
      </div>

      <span class="count-badge">
        {{ classes.length }} class{{ classes.length !== 1 ? 'es' : '' }}
      </span>
    </div>

    <!-- Table -->
    <div class="table-wrap">
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
            <th class="col-index">ID</th>
            <th>Class</th>
            <th>Generation</th>
            <th>Teacher</th>
            <th>Students</th>
            <th>Room</th>
            <th>Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="classes.length === 0">
            <td colspan="9" class="empty-state">
              <i class="bi bi-journal-bookmark fs-1 d-block mb-2"></i>
              No classes found
            </td>
          </tr>
          <tr
            v-for="classItem in paginatedClasses"
            :key="classItem.id"
            class="class-row"
            :class="classItem.status === 'Active' ? 'row-active' : 'row-inactive'"
          >
            <td class="col-check">
              <input
                type="checkbox"
                class="row-check"
                :checked="selectedIds.includes(classItem.id)"
                @change="toggleRow(classItem.id)"
                :aria-label="`Select ${classItem.name}`"
              />
            </td>
            <td class="col-index">{{ classItem.id }}</td>
            <td>
              <div class="class-cell">
                <div class="class-icon">
                  <i class="bi bi-journal-bookmark"></i>
                </div>
                <span class="class-name">{{ classItem.name }}</span>
              </div>
            </td>
            <td>{{ classItem.generation?.year || '—' }}</td>
            <td>{{ classItem.teacher?.name || 'No Teacher' }}</td>
            <td>{{ classItem.students }}</td>
            <td>{{ classItem.room }}</td>
            <td>
              <span
                class="status-badge"
                :class="classItem.status === 'Active' ? 'badge-active' : 'badge-inactive'"
              >
                {{ classItem.status }}
              </span>
            </td>
            <td class="col-actions" @click.stop>
              <div class="action-dropdown">
                <button
                  class="action-trigger"
                  :title="`Actions for ${classItem.name}`"
                  @click="toggleDropdown(classItem.id)"
                >
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <Transition name="dropdown">
                  <div v-if="openDropdownId === classItem.id" class="action-menu">
                    <button class="action-item view" @click="$emit('view', classItem); openDropdownId = null">
                      <i class="bi bi-eye"></i>
                      <span>View Details</span>
                    </button>
                    <button class="action-item edit" @click="$emit('edit', classItem); openDropdownId = null">
                      <i class="bi bi-pencil"></i>
                      <span>Edit</span>
                    </button>
                    <div class="dropdown-divider"></div>
                    <button class="action-item delete" @click="$emit('delete', classItem); openDropdownId = null">
                      <i class="bi bi-trash"></i>
                      <span>Delete</span>
                    </button>
                  </div>
                </Transition>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-bar">
      <div class="pagination-info">
        <span class="rows-label">Rows per page:</span>
        <div class="rows-selector">
          <button
            v-for="size in pageSizeOptions"
            :key="size"
            class="rows-btn"
            :class="{ active: pageSize === size }"
            @click="pageSize = size; currentPage = 1"
          >
            {{ size }}
          </button>
        </div>
      </div>

      <div class="pagination-pages">
        <button
          class="page-nav"
          :disabled="currentPage <= 1"
          @click="currentPage--"
          aria-label="Previous page"
        >
          <i class="bi bi-chevron-left"></i>
        </button>

        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            class="page-btn"
            :class="{ active: currentPage === page }"
            @click="currentPage = page as number"
          >
            {{ page }}
          </button>
          <span v-else class="page-dots">…</span>
        </template>

        <button
          class="page-nav"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
          aria-label="Next page"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <div class="pagination-total">
        {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, classes.length) }} of {{ classes.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { Class } from '@/services/classService'

const openDropdownId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 25, 50]
const selectedIds = ref<number[]>([])

const props = defineProps<{
  classes: Class[]
  searchQuery: string
  statusFilter: string
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.classes.length / pageSize.value)))

const paginatedClasses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.classes.slice(start, end)
})

const allSelected = computed(() =>
  paginatedClasses.value.length > 0 &&
  paginatedClasses.value.every((c) => selectedIds.value.includes(c.id))
)

const someSelected = computed(() => selectedIds.value.length > 0)

function toggleRow(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)
}

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter(
      (id) => !paginatedClasses.value.some((c) => c.id === id)
    )
  } else {
    const ids = paginatedClasses.value.map((c) => c.id)
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...ids]))
  }
}

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)

  return pages
})

function toggleDropdown(id: number) {
  openDropdownId.value = openDropdownId.value === id ? null : id
}

// Close dropdown when clicking outside
function handleClickOutside() {
  openDropdownId.value = null
}

window.addEventListener('click', handleClickOutside)
onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

defineEmits<{
  'update:searchQuery': [value: string]
  'update:statusFilter': [value: string]
  view: [classItem: Class]
  edit: [classItem: Class]
  delete: [classItem: Class]
}>()
</script>

<style scoped>
/* ==================== Card ==================== */
.class-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  transition: box-shadow 0.25s ease;
}

.class-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

/* ==================== Toolbar ==================== */
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
}

.search-box {
  position: relative;
  flex: 1 1 260px;
  max-width: 340px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 0.9rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.9rem 0.6rem 2.4rem;
  font-size: 0.8125rem;
  font-family: inherit;
  color: #1f2937;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input::placeholder { color: #9ca3af; }

.search-input:hover { border-color: #cbd5e1; }

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.filter-group { display: flex; align-items: center; }

.filter-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.4rem 0.5rem 0.4rem 0.75rem;
  transition: all 0.2s ease;
}

.filter-label:hover { border-color: #cbd5e1; }

.filter-label i { font-size: 0.85rem; color: #94a3b8; }

.filter-select {
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  font-family: inherit;
  font-weight: 600;
  color: #334155;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  outline: none;
}

.count-badge {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.4rem 0.85rem;
  border-radius: 100px;
  white-space: nowrap;
}

/* ==================== Table ==================== */
.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.class-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

.class-table thead th {
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
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.col-index {
  width: 64px;
  color: #94a3b8;
  font-weight: 600;
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

.col-actions {
  text-align: right;
  padding-right: 20px !important;
}

.class-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f3f5;
  color: #334155;
  vertical-align: middle;
}

.class-table tbody tr:last-child td { border-bottom: none; }

.empty-state {
  text-align: center;
  padding: 48px 16px !important;
  color: #9ca3af;
}

.class-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.class-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
}

.class-name {
  font-weight: 600;
  color: #0f172a;
}

/* ==================== Rows ==================== */
.class-row {
  transition: background 0.2s ease, border-left 0.2s ease;
  border-left: 3px solid transparent;
}

.row-active:hover,
.row-inactive:hover {
  background: #eff6ff;
  border-left-color: #2563eb;
}

/* ==================== Status Badge ==================== */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 100px;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;
}

.badge-active {
  background: #dcfce7;
  color: #15803d;
}

.badge-inactive {
  background: #f1f5f9;
  color: #64748b;
}

.status-badge::before {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 7px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}

.badge-active::before {
  background: #22c55e;
}

.badge-inactive::before {
  background: #94a3b8;
}

/* ==================== Action Dropdown ==================== */
.action-dropdown {
  position: relative;
  display: inline-flex;
}

.action-trigger {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.action-trigger:hover {
  background: #eef2ff;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.action-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 190px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 100;
  animation: dropIn 0.18s ease-out;
  transform-origin: top right;
}

@keyframes dropIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(-6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dropdown-enter-active {
  transition: all 0.18s ease-out;
}
.dropdown-leave-active {
  transition: all 0.12s ease-in;
}
.dropdown-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(-6px);
}
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-3px);
}

.action-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: "Inter", "Noto Sans Khmer", sans-serif;
  transition: all 0.15s ease;
  text-align: left;
  color: #374151;
}

.action-item i {
  font-size: 1rem;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.action-item.view:hover {
  background: #f0f5ff;
  color: #2563eb;
}

.action-item.edit:hover {
  background: #e0f2fe;
  color: #0369a1;
}

.action-item.delete:hover {
  background: #fef2f2;
  color: #dc2626;
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 8px;
}

/* ==================== Pagination ==================== */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  font-size: 0.8125rem;
  gap: 12px;
  flex-wrap: wrap;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
}

.rows-label {
  font-weight: 500;
  white-space: nowrap;
}

.rows-selector {
  display: flex;
  gap: 2px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 2px;
}

.rows-btn {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.15s ease;
}

.rows-btn:hover {
  color: #334155;
}

.rows-btn.active {
  background: #fff;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 2px;
}

.page-nav {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.75rem;
}

.page-nav:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
  background: #f0f5ff;
}

.page-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.15s ease;
}

.page-btn:hover:not(.active) {
  background: #f1f5f9;
  color: #2563eb;
}

.page-btn.active {
  background: #2563eb;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.page-dots {
  width: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
  letter-spacing: 1px;
}

.pagination-total {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .pagination-bar {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .pagination-info {
    width: 100%;
    justify-content: center;
  }
}

/* ==================== Responsive ==================== */
@media (max-width: 768px) {
  .action-trigger {
    width: 30px;
    height: 30px;
    font-size: 0.875rem;
  }

  .action-menu {
    right: auto;
    left: 0;
  }
}
</style>
