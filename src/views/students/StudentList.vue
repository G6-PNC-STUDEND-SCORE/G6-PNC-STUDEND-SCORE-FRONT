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
          placeholder="Search by ID, class, or name..."
        />
      </div>

      <div class="filter-group">
        <div class="gender-search-box">
          <i class="bi bi-gender-ambiguous gender-search-icon"></i>
          <input
            :value="genderFilter"
            @input="$emit('update:genderFilter', ($event.target as HTMLInputElement).value)"
            type="text"
            class="gender-search-input"
            placeholder="Search gender..."
          />
        </div>
        <div class="gender-pills">
          <button
            class="gender-pill"
            :class="{ active: statusFilter === '' }"
            @click="$emit('update:statusFilter', '')"
          >All</button>
          <button
            class="gender-pill"
            :class="{ active: statusFilter === 'active', 'pill-active': statusFilter === 'active' }"
            @click="$emit('update:statusFilter', 'active')"
          >Active</button>
          <button
            class="gender-pill"
            :class="{ active: statusFilter === 'inactive', 'pill-inactive': statusFilter === 'inactive' }"
            @click="$emit('update:statusFilter', 'inactive')"
          >Inactive</button>
        </div>
      </div>

      <div class="count-group">
        <span class="count-badge">
          {{ students.length }} student{{ students.length !== 1 ? 's' : '' }}
        </span>
        <span class="count-badge count-male">
          {{ maleCount }} Male
        </span>
        <span class="count-badge count-female">
          {{ femaleCount }} Female
        </span>
      </div>
    </div>

    <!-- Bulk Action Bar -->
    <Transition name="bulk-bar">
      <div v-if="props.selectedIds.length > 0" class="bulk-action-bar">
        <div class="bulk-action-left">
          <i class="bi bi-check2-square bulk-action-icon"></i>
          <span class="bulk-action-text">
            <strong>{{ props.selectedIds.length }}</strong> student{{ props.selectedIds.length !== 1 ? 's' : '' }} selected
          </span>
        </div>
        <div class="bulk-action-right">
          <button class="bulk-btn bulk-btn-cancel" @click="emit('clearSelection')">
            <i class="bi bi-x-lg"></i>
            Cancel
          </button>
          <button class="bulk-btn bulk-btn-delete" @click="emit('bulkDelete', [...props.selectedIds])">
            <i class="bi bi-trash"></i>
            Delete
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
              No students found
            </td>
          </tr>
          <tr
            v-for="student in paginatedStudents"
            :key="student.id"
            class="student-row"
            :class="student.gender === 'Male' ? 'row-male' : 'row-female'"
          >
            <td class="col-check">
              <input
                type="checkbox"
                class="row-check"
                :checked="props.selectedIds.includes(student.id)"
                @change="toggleRow(student.id)"
                :aria-label="`Select ${student.name}`"
              />
            </td>
            <td class="col-index">{{ student.id }}</td>
            <td>
              <div class="student-cell">
                <div v-if="student.photo" class="avatar-img">
                  <img :src="getPhotoUrl(student.photo)" :alt="student.name" class="avatar-photo" />
                </div>
                <div v-else class="avatar">
                  {{ getInitials(student.name) }}
                </div>
                <span class="student-name">{{ student.name }}</span>
              </div>
            </td>
            <td>
              <span
                class="gender-badge"
                :class="student.gender === 'Male' ? 'badge-male' : 'badge-female'"
              >
                {{ student.gender }}
              </span>
            </td>
            <td>
              <span v-if="student.class" class="class-cell">
                <i class="bi bi-building" style="color: #9ca3af; font-size: 0.8rem;"></i>
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
                :class="student.status === 'active' ? 'badge-active' : 'badge-inactive'"
              >
                {{ student.status === 'active' ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="col-actions" @click.stop>
              <div class="action-dropdown">
                <button
                  class="action-trigger"
                  :title="`Actions for ${student.name}`"
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
                      <i class="bi bi-pencil"></i>
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
import { getPhotoUrl, type Student } from '@/services/studentService'

const openDropdownId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 25, 50]
const props = withDefaults(defineProps<{
  students: Student[]
  searchQuery: string
  genderFilter: string
  statusFilter: string
  selectedIds?: number[]
  maleCount?: number
  femaleCount?: number
  getInitials: (name: string) => string
}>(), {
  selectedIds: () => [],
  maleCount: 0,
  femaleCount: 0,
})

const totalPages = computed(() => Math.max(1, Math.ceil(props.students.length / pageSize.value)))

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.students.slice(start, end)
})

const allSelected = computed(() =>
  paginatedStudents.value.length > 0 &&
  paginatedStudents.value.every((s) => props.selectedIds.includes(s.id))
)

const someSelected = computed(() => props.selectedIds.length > 0)

function toggleRow(id: number) {
  const idx = props.selectedIds.indexOf(id)
  if (idx === -1) emit('update:selectedIds', [...props.selectedIds, id])
  else emit('update:selectedIds', props.selectedIds.filter((i) => i !== id))
}

function toggleAll() {
  if (allSelected.value) {
    emit('update:selectedIds', props.selectedIds.filter(
      (id) => !paginatedStudents.value.some((s) => s.id === id)
    ))
  } else {
    const ids = paginatedStudents.value.map((s) => s.id)
    emit('update:selectedIds', Array.from(new Set([...props.selectedIds, ...ids])))
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

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:genderFilter': [value: string]
  'update:statusFilter': [value: string]
  'update:selectedIds': [ids: number[]]
  view: [student: Student]
  edit: [student: Student]
  assign: [student: Student]
  delete: [student: Student]
  bulkDelete: [ids: number[]]
  clearSelection: []
}>()
</script>

<style scoped>
/* ==================== Card ==================== */
.student-card {
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.05);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  transition: box-shadow 0.25s ease;
}

.student-card:hover {
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05), 0 12px 32px rgba(15, 23, 42, 0.08);
}

/* ==================== Toolbar ==================== */
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(180deg, #fcfdff 0%, #f8fafc 100%);
  border-bottom: 1px solid #eef0f3;
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
  border: 1.5px solid #e5e7eb;
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

.filter-group { display: flex; align-items: center; gap: 8px; }

.gender-search-box {
  position: relative;
  flex: 0 0 auto;
}

.gender-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 0.8rem;
  pointer-events: none;
}

.gender-search-input {
  width: 140px;
  padding: 0.45rem 0.7rem 0.45rem 2rem;
  font-size: 0.78rem;
  font-family: inherit;
  color: #1f2937;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
}

.gender-search-input::placeholder { color: #9ca3af; }

.gender-search-input:hover { border-color: #cbd5e1; }

.gender-search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.gender-pills {
  display: inline-flex;
  gap: 0;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 3px;
}

.gender-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}



/* ==================== Bulk Action Bar ==================== */
.bulk-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%);
  border-bottom: 1px solid #bfdbfe;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.bulk-action-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bulk-action-icon {
  font-size: 1.1rem;
  color: #2563eb;
}

.bulk-action-text {
  font-size: 0.875rem;
  color: #1e40af;
  font-weight: 500;
}

.bulk-action-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bulk-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bulk-btn-cancel {
  background: #fff;
  color: #475569;
  border: 1.5px solid #e2e8f0;
}

.bulk-btn-cancel:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
}

.bulk-btn-delete {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
}

.bulk-btn-delete:hover {
  background: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.bulk-bar-enter-active {
  transition: all 0.25s ease-out;
}
.bulk-bar-leave-active {
  transition: all 0.2s ease-in;
}
.bulk-bar-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}
.bulk-bar-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.gender-pill:hover:not(.active) {
  color: #334155;
  background: rgba(255, 255, 255, 0.6);
}

.gender-pill.active {
  background: #fff;
  color: #2563eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
}

.gender-pill.active.pill-active {
  color: #15803d;
}

.gender-pill.active.pill-inactive {
  color: #64748b;
}

.count-group {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.count-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  background: #eef2ff;
  padding: 0.4rem 0.85rem;
  border-radius: 100px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.count-male {
  color: #1d4ed8;
  background: #dbeafe;
}

.count-female {
  color: #be185d;
  background: #fce7f3;
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
  color: #94a3b8;
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

.student-table tbody tr:last-child td { border-bottom: none; }

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

.avatar,
.avatar-img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar {
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
}

.avatar-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

/* ==================== Action Column ==================== */
.col-actions {
  width: 80px;
  min-width: 80px;
  text-align: center !important;
  padding-right: 20px !important;
}

/* ==================== Action Dropdown ==================== */
.action-dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  min-width: 195px;
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
  padding: 10px 14px;
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
  margin: 6px 10px;
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
    .filter-group {
      flex-wrap: wrap;
    }

    .gender-pill {
      padding: 4px 10px;
      font-size: 0.72rem;
    }

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
