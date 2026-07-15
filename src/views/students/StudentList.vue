<template>
  <div class="student-card">
    <!-- Search & Filter Bar -->
    <div class="toolbar">
      <div class="search-box">
        <i class="bi bi-search search-icon"></i>
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          class="search-input"
          placeholder="Search by name, ID, class..."
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">
          <i class="bi bi-funnel-fill"></i>
          <span>Filter</span>
          <select
            :value="combinedFilter"
            @change="$emit('update:combinedFilter', ($event.target as HTMLSelectElement).value)"
            class="filter-select"
          >
            <option value="">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="male_active">Active Male</option>
            <option value="male_inactive">Inactive Male</option>
            <option value="female_active">Active Female</option>
            <option value="female_inactive">Inactive Female</option>
          </select>
        </label>
      </div>

      <span class="count-badge">
        {{ students.length }} student{{ students.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Bulk Action Bar -->
    <Transition name="bulk-slide">
      <div v-if="selectedIds.length > 0" class="bulk-bar">
        <div class="bulk-left">
          <div class="bulk-check-icon">
            <i class="bi bi-check-circle-fill"></i>
          </div>
          <span class="bulk-count">
            <strong>{{ selectedIds.length }}</strong> student{{ selectedIds.length !== 1 ? 's' : '' }} selected
          </span>
        </div>
        <div class="bulk-right">
          <button class="bulk-btn bulk-delete" @click="handleBulkDeleteClick">
            <i class="bi bi-trash3"></i>
            <span>Delete Selected</span>
          </button>
          <button class="bulk-btn bulk-cancel" @click="clearSelection">
            <i class="bi bi-x-lg"></i>
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Table -->
    <div class="table-wrap">
      <table class="student-table">
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
            <th>Name</th>
            <th>Gender</th>
            <th>Class</th>
            <th>Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="students.length === 0">
              <td colspan="7" class="empty-state">
              <i class="bi bi-people fs-1 d-block mb-2"></i>
              <span class="empty-text">No students found</span>
            </td>
          </tr>
          <tr
            v-for="student in paginatedStudents"
            :key="student.id"
            class="student-row"
            :class="{
              'row-male': (student.user?.gender || '') === 'Male',
              'row-female': (student.user?.gender || '') === 'Female',
              'row-selected': selectedIds.includes(student.id)
            }"
          >
            <td class="col-check">
              <input
                type="checkbox"
                class="row-check"
                :checked="selectedIds.includes(student.id)"
                @change="toggleRow(student.id)"
                :aria-label="`Select ${student.user?.name || student.id}`"
              />
            </td>
            <td class="col-index">
              <span class="id-label">#{{ student.id }}</span>
            </td>
            <td>
              <div class="student-info">
                <span class="student-name">{{ student.user?.name }}</span>
                <span v-if="student.studentNumberSequence?.student_number" class="student-number">
                  {{ student.studentNumberSequence.student_number }}
                </span>
              </div>
            </td>
            <td>
              <span
                class="gender-badge"
                :class="(student.user?.gender || '') === 'Male' ? 'badge-male' : 'badge-female'"
              >
                {{ student.user?.gender || '—' }}
              </span>
            </td>
            <td>
              <span v-if="student.class" class="class-cell">
                <i class="bi bi-building"></i>
                {{ student.class.name }}
              </span>
              <span v-else class="class-empty">
                <i class="bi bi-dash"></i>
                Not assigned
              </span>
            </td>
            <td>
              <span
                class="status-badge"
                :class="(student.user?.status || '') === 'active' ? 'badge-active' : 'badge-inactive'"
              >
                {{ (student.user?.status || '') === 'active' ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="col-actions" @click.stop>
              <div class="action-dropdown">
                <button
                  class="action-trigger"
                  :title="`Actions for ${student.user?.name || student.id}`"
                  @click="toggleDropdown(student.id)"
                >
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <Transition name="dropdown">
                  <div v-if="openDropdownId === student.id" class="action-menu">
                    <button class="action-item view" @click="$emit('view', student); openDropdownId = null">
                      <i class="bi bi-eye"></i>
                      <span>View Details</span>
                    </button>
                    <button class="action-item edit" @click="$emit('edit', student); openDropdownId = null">
                      <i class="bi bi-pencil-square"></i>
                      <span>Edit</span>
                    </button>
                    <button class="action-item assign" @click="$emit('assign', student); openDropdownId = null">
                      <i class="bi bi-box-arrow-in-right"></i>
                      <span>Assign Class</span>
                    </button>
                    <div class="dropdown-divider"></div>
                    <button class="action-item delete" @click="$emit('delete', student); openDropdownId = null">
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
        {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, students.length) }} of {{ students.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { Student } from '@/services/studentService'

const openDropdownId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 25]
const selectedIds = ref<number[]>([])

const props = defineProps<{
  students: Student[]
  searchQuery: string
  combinedFilter: string
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.students.length / pageSize.value)))

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.students.slice(start, end)
})

const allSelected = computed(() =>
  paginatedStudents.value.length > 0 &&
  paginatedStudents.value.every((s) => selectedIds.value.includes(s.id))
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
      (id) => !paginatedStudents.value.some((s) => s.id === id)
    )
  } else {
    const ids = paginatedStudents.value.map((s) => s.id)
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
function clearSelection() {
  selectedIds.value = []
}

function handleBulkDeleteClick() {
  const ids = [...selectedIds.value]
  selectedIds.value = []
  emit('deleteSelected', ids)
}

function handleClickOutside() {
  openDropdownId.value = null
}

window.addEventListener('click', handleClickOutside)
onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:combinedFilter': [value: string]
  view: [student: Student]
  edit: [student: Student]
  assign: [student: Student]
  delete: [student: Student]
  deleteSelected: [ids: number[]]
}>()
</script>

<style scoped>
/* ==================== Card ==================== */
.student-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  transition: box-shadow 0.25s ease;
}

.student-card:hover {
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

.student-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

.student-table thead th {
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
  width: 72px;
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

thead th.col-actions,
tbody td.col-actions {
  text-align: center;
  width: 60px;
}

.col-check {
  width: 44px;
  padding-left: 20px !important;
}

.row-check {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
  cursor: pointer;
}

.student-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f3f5;
  color: #334155;
  vertical-align: middle;
}

.student-table tbody tr:last-child td { border-bottom: none; }

.empty-state {
  text-align: center;
  padding: 56px 16px !important;
  color: #94a3b8;
}

.empty-text {
  font-size: 0.9rem;
  font-weight: 500;
}

.student-name {
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-number {
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.id-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}

.class-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #374151;
  font-size: 0.8125rem;
}

.class-empty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-style: italic;
  color: #9ca3af;
  font-size: 0.8125rem;
}

/* ==================== Bulk Action Bar ==================== */
.bulk-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-bottom: 1px solid #bfdbfe;
  gap: 12px;
  flex-wrap: wrap;
  animation: bulkFadeIn 0.25s ease-out;
}

@keyframes bulkFadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.bulk-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bulk-check-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: #fff;
  border-radius: 50%;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.bulk-count {
  font-size: 0.875rem;
  color: #1e40af;
}

.bulk-count strong {
  font-weight: 700;
}

.bulk-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bulk-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bulk-delete {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.bulk-delete:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.bulk-cancel {
  background: #fff;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.bulk-cancel:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
}

.bulk-slide-enter-active { transition: all 0.25s ease-out; }
.bulk-slide-leave-active { transition: all 0.15s ease-in; }
.bulk-slide-enter-from { opacity: 0; transform: translateY(-10px); }
.bulk-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ==================== Rows ==================== */
.student-row {
  transition: background 0.2s ease, border-left 0.2s ease;
  border-left: 3px solid transparent;
}

.row-male:hover {
  background: #eff6ff;
  border-left-color: #3b82f6;
}

.row-female:hover {
  background: #fdf2f8;
  border-left-color: #ec4899;
}

.row-selected {
  background: #eff6ff !important;
  border-left-color: #2563eb !important;
}

/* ==================== Gender Badge ==================== */
.gender-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 100px;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;
}

.badge-male {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-female {
  background: #fce7f3;
  color: #be185d;
}

.gender-badge::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

.badge-male::before {
  background: #3b82f6;
}

.badge-female::before {
  background: #ec4899;
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
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  color: #94a3b8;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.05rem;
}

.action-trigger:hover {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
}

.action-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 200px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.14);
  padding: 8px;
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
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: "Inter", "Noto Sans Khmer", sans-serif;
  transition: all 0.15s ease;
  text-align: left;
  color: #374151;
}

.action-item i {
  font-size: 1.05rem;
  width: 20px;
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

.action-item.assign:hover {
  background: #fef9c3;
  color: #854d0e;
}

.action-item.delete:hover {
  background: #fef2f2;
  color: #dc2626;
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 6px 8px;
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
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }

  .action-menu {
    right: auto;
    left: 0;
  }
}
</style>
