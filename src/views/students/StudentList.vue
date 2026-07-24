<template>
  <div class="student-card">
    <!-- Search & Filter Bar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
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
            <VenusAndMars :size="16" />
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
      </div>

      <div class="toolbar-right">
        <button
          class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold"
          style="border-radius: 0.625rem; background: #2563eb; padding: 0.35rem 0.875rem; font-size: 0.8125rem; flex-shrink: 0;"
          @click="$emit('add')"
        >
          <Plus :size="15" />
          Add Student
        </button>

        <span class="count-badge">
          {{ students.length }} student{{ students.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Bulk Action Bar -->
    <div v-if="someSelected" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} selected</span>
        <div class="bulk-actions">
          <button class="bulk-delete-btn" @click="$emit('bulkDelete', [...selectedIds]); selectedIds = []" title="Delete selected students">
            <Trash2 :size="16" />
            Delete Selected
          </button>
          <button class="bulk-clear-btn" @click="selectedIds = []" title="Clear selection">Clear Selection</button>
        </div>
      </div>

    <!-- ── Empty State (no data) ── -->
    <div v-if="students.length === 0" class="empty-container">
      <div class="empty-box">
        <Inbox :size="40" />
        <h5>No students found</h5>
        <p>{{ props.searchQuery ? 'Try a different search term.' : 'No students match the current filter.' }}</p>
      </div>
    </div>

    <!-- ── Table (with data) ── -->
    <div v-else class="table-wrap">
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
            <th class="col-index">#</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Class</th>
            <th>Generation</th>
            <th>Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(student, index) in paginatedStudents"
            :key="student.id"            class="student-row"
            :class="{ 'row-selected': selectedIds.includes(student.id) }"
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
              <span class="id-cell">{{ student.id }}</span>
            </td>
            <td>
              <div class="student-cell">
                <div
                  v-if="student.profile_photo_url"
                  class="avatar-img"
                >
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
              <span class="meta-cell">{{ student.user?.gender || '—' }}</span>
            </td>
            <td>
              <span v-if="student.class" class="class-cell">
                <Building2 :size="14" />
                {{ student.class.name }}
              </span>
              <span v-else class="class-empty">
                <Minus :size="14" />
                Not assigned
              </span>
            </td>
            <td>
              <span class="meta-cell">{{ student.generation?.name || '—' }}</span>
            </td>
            <td class="py-3">
              <span
                class="status-badge"
                :class="(student.user?.status || '') === 'active' ? 'badge-active' : 'badge-inactive'"
              >
                {{ (student.user?.status || '') === 'active' ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="col-actions" @click.stop>
              <div class="td-actions">
                <button class="act-btn" title="View Details" @click="$emit('view', student)">
                  <Eye :size="15" />
                </button>
                <button class="act-btn" title="Edit" @click="$emit('edit', student)">
                  <Pencil :size="15" />
                </button>
                <button class="act-btn" title="Assign Class" @click="$emit('assign', student)">
                  <ArrowRightFromLine :size="15" />
                </button>
                <button class="act-btn act-danger" title="Delete" @click="$emit('delete', student)">
                  <Trash2 :size="15" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="students.length > 0" class="pagination-bar">
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
          <ChevronLeft :size="16" />
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
          <ChevronRight :size="16" />
        </button>
      </div>

      <div class="pagination-total">
        {{ students.length > 0 ? (currentPage - 1) * pageSize + 1 : 0 }}-{{ Math.min(currentPage * pageSize, students.length) }} of {{ students.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Student } from '@/services/studentService'
import {
  Search,
  VenusAndMars,
  Inbox,
  Building2,
  Minus,
  Eye,
  Pencil,
  ArrowRightFromLine,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from '@lucide/vue'


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

const allSelected = computed(() =>
  paginatedStudents.value.length > 0 &&
  paginatedStudents.value.every((s) => selectedIds.value.includes(s.id))
)

const someSelected = computed(() => selectedIds.value.length > 0)

// Expose selectedIds for parent to read after bulk delete
defineExpose({ selectedIds })

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

defineEmits<{
  'update:searchQuery': [value: string]
  'update:genderFilter': [value: string]
  view: [student: Student]
  edit: [student: Student]
  assign: [student: Student]
  delete: [student: Student]
  bulkDelete: [ids: number[]]
  add: []}>()
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
  flex: 1;
  height: 1px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: box-shadow 0.25s ease;
}

.student-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

/* ==================== Toolbar ==================== */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.search-box {
  position: relative;
  width: 260px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
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

.filter-label :deep(svg) { color: #94a3b8; }

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
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.table-wrap::-webkit-scrollbar { width: 4px; height: 4px; }
.table-wrap::-webkit-scrollbar-track { background: transparent; }
.table-wrap::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
.table-wrap::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

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
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.col-check {
  width: 48px;
  text-align: center;
  padding: 12px 8px !important;
}

.student-table thead th.col-check,
.student-table tbody td.col-check {
  text-align: center;
  padding: 12px 8px !important;
  vertical-align: middle;
}

.col-index {
  width: 60px;
  text-align: center;
  padding: 10px 8px !important;
}

.student-table thead th.col-index,
.student-table tbody td.col-index {
  text-align: center;
  padding: 10px 8px !important;
  vertical-align: middle;
}

.id-cell {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.row-check {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
  cursor: pointer;
  display: block;
  margin: 0 auto;
}

.col-actions {
  text-align: center;
  width: 130px;
}

.td-actions {
  white-space: nowrap;
  text-align: center;
}

.act-btn {
  background: none;
  border: none;
  padding: 5px 6px;
  border-radius: 6px;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.15s;
}

.act-btn:hover { background: #f1f5f9; color: #3b82f6; }
.act-danger:hover { background: #fef2f2; color: #ef4444; }

.student-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f3f5;
  color: #475569;
  vertical-align: middle;
  font-weight: 500;
}

.student-table tbody tr:last-child td { border-bottom: none; }

.empty-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.empty-container .empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #94a3b8;
}

.empty-container .empty-box h5 {
  font-weight: 700;
  color: #64748b;
  margin: 0;
  font-size: 1rem;
}

.empty-container .empty-box p {
  font-size: 0.85rem;
  margin: 0;
}

.student-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  background: #2563eb;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
}

.avatar-img {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
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
  font-size: 0.85rem;
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

.student-row {
  transition: background 0.2s ease, border-left 0.2s ease;
  border-left: 3px solid transparent;
}

.student-row:hover { background: #f8fafc; border-left-color: #2563eb; }

.row-selected {
  background: #f0f5ff !important;
  border-left-color: #2563eb !important;
}

.meta-cell {
  font-size: 0.8125rem;
  color: #64748b;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 100px;
  letter-spacing: 0.01em;
}

.badge-active { background: #dbeafe; color: #1d4ed8; }
.badge-inactive { background: #f1f5f9; color: #64748b; }

/* ==================== td-actions (icon buttons) ==================== */


/* ==================== Bulk Action Bar ==================== */
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.bulk-count {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #991b1b;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.bulk-delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  background: #ef4444;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.bulk-delete-btn:hover { background: #dc2626; }

.bulk-clear-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.bulk-clear-btn:hover { background: #f8fafc; border-color: #cbd5e1; }

/* ==================== Pagination ==================== */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  font-size: 0.8125rem;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
  margin-top: auto;
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
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
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
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.78rem;
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

@media (max-width: 768px) {
  .col-actions {
    width: 100px;
  }
}
</style>
