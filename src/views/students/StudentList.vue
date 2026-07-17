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
          placeholder="Search by name..."
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">
          <i class="bi bi-gender-ambiguous"></i>
          <span>Gender</span>
          <select
            :value="genderFilter"
            @change="$emit('update:genderFilter', ($event.target as HTMLSelectElement).value)"
            class="filter-select"
          >
            <option value="">All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
      </div>

      <span class="count-badge">
        {{ students.length }} student{{ students.length !== 1 ? 's' : '' }}
      </span>
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
              No students found
            </td>
          </tr>
          <tr
            v-for="student in paginatedStudents"
            :key="student.id"
            class="student-row"
            :class="(student.user?.gender || '') === 'Male' ? 'row-male' : 'row-female'"
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
            <td class="col-index">{{ student.id }}</td>
            <td>
              <div class="student-cell">
                <div v-if="student.profile_photo_url" class="avatar-img">
                  <img
                    :src="student.profile_photo_url"
                    :alt="student.user?.name || 'Student'"
                    class="photo-img"
                  />
                </div>
                <div v-else class="avatar">
                  {{ getInitials(student.user?.name || '') }}
                </div>
                <span class="student-name">{{ student.user?.name }}</span>
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
            <td class="py-3">
              <span
                class="status-badge"
                :class="
                  (student.user?.status || '') === 'active' ? 'badge-active' : 'badge-inactive'
                "
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
                    <button
                      class="action-item view"
                      @click="
                        $emit('view', student)
                        openDropdownId = null
                      "
                    >
                      <i class="bi bi-eye"></i>
                      <span>View Details</span>
                    </button>
                    <button
                      class="action-item edit"
                      @click="
                        $emit('edit', student)
                        openDropdownId = null
                      "
                    >
                      <i class="bi bi-pencil"></i>
                      <span>Edit</span>
                    </button>
                    <button
                      class="action-item assign"
                      @click="
                        $emit('assign', student)
                        openDropdownId = null
                      "
                    >
                      <i class="bi bi-box-arrow-in-right"></i>
                      <span>Assign Class</span>
                    </button>
                    <div class="dropdown-divider"></div>
                    <button
                      class="action-item delete"
                      @click="
                        $emit('delete', student)
                        openDropdownId = null
                      "
                    >
                      <i class="bi bi-trash3"></i>
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
            @click="
              pageSize = size
              currentPage = 1
            "
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
        {{ (currentPage - 1) * pageSize + 1 }}-{{
          Math.min(currentPage * pageSize, students.length)
        }}
        of {{ students.length }}
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
const pageSizeOptions = [10, 25, 50]
const selectedIds = ref<number[]>([])

const props = defineProps<{
  students: Student[]
  searchQuery: string
  genderFilter: string
  getInitials: (name: string) => string
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.students.length / pageSize.value)))

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.students.slice(start, end)
})

const allSelected = computed(
  () =>
    paginatedStudents.value.length > 0 &&
    paginatedStudents.value.every((s) => selectedIds.value.includes(s.id)),
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
      (id) => !paginatedStudents.value.some((s) => s.id === id),
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
function handleClickOutside() {
  openDropdownId.value = null
}

window.addEventListener('click', handleClickOutside)
onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

function clearSelection() {
  selectedIds.value = []
}

defineExpose({ clearSelection })

defineEmits<{
  'update:searchQuery': [value: string]
  'update:genderFilter': [value: string]
  view: [student: Student]
  edit: [student: Student]
  assign: [student: Student]
  delete: [student: Student]
  'bulk-delete': [ids: number[]]
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
  flex: 1 1 320px;
  max-width: 520px;
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

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:hover {
  border-color: #cbd5e1;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.filter-group {
  display: flex;
  align-items: center;
}

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

.filter-label:hover {
  border-color: #cbd5e1;
}

.filter-label i {
  font-size: 0.85rem;
  color: #94a3b8;
}

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

.student-table tbody tr:last-child td {
  border-bottom: none;
}

.empty-state {
  text-align: center;
  padding: 48px 16px !important;
  color: #9ca3af;
}

.student-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
}

.avatar-img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.student-name {
  font-weight: 600;
  color: #0f172a;
}

.class-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #374151;
}

.class-empty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-style: italic;
  color: #9ca3af;
}

/* ==================== Rows ==================== */
.student-row {
  transition:
    background 0.2s ease,
    border-left 0.2s ease;
  border-left: 3px solid transparent;
}

.row-male:hover,
.row-female:hover {
  background: #eff6ff;
  border-left-color: #2563eb;
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
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
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
