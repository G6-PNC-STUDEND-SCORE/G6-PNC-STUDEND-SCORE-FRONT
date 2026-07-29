<template>
  <div class="student-card">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
          <input
            :value="searchQuery"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
            type="text"
            class="search-input"
:placeholder="t('students.searchPlaceholder')"
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">
            <VenusAndMars :size="16" />
            <span>{{ t('students.gender') }}</span>
            <select
              :value="genderFilter"
              @change="$emit('update:genderFilter', ($event.target as HTMLSelectElement).value)"
              class="filter-select"
            >
              <option value="">{{ t('common.all') }}</option>
              <option value="Male">{{ t('students.male') }}</option>
              <option value="Female">{{ t('students.female') }}</option>
            </select>
          </label>
        </div>
        <div class="filter-group">
          <label class="filter-label">
            <Users :size="16" />
            <span>Generation</span>
            <select
              :value="generationFilter"
              @change="$emit('update:generationFilter', ($event.target as HTMLSelectElement).value === '' ? '' : Number(($event.target as HTMLSelectElement).value))"
              class="filter-select"
            >
              <option value="">All</option>
              <option v-for="gen in generations" :key="gen.id" :value="gen.id">{{ gen.name }}</option>
            </select>
          </label>
        </div>
      </div>

      <div class="toolbar-right">
        <button
          v-if="canCreate"
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

    <div v-if="canDelete && someSelected" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} selected</span>
        <div class="bulk-actions">
          <button class="bulk-delete-btn" @click="$emit('bulkDelete', [...selectedIds]); selectedIds = []" title="Delete selected students">
            <Trash2 :size="16" />
            Delete Selected
          </button>
          <button class="bulk-clear-btn" @click="selectedIds = []" title="Clear selection">Clear Selection</button>
        </div>
      </div>

    <div v-if="students.length === 0" class="empty-container">
      <div class="empty-box">
        <Inbox :size="40" />
        <h5>No students found</h5>
        <p>{{ props.searchQuery ? 'Try a different search term.' : 'No students match the current filter.' }}</p>
      </div>
    </div>

    <div v-else class="table-wrap">
      <table class="student-table data-table-base">
        <thead>
          <tr>
            <th v-if="canDelete" class="col-check">
              <input
                type="checkbox"
                class="table-checkbox"
                :checked="allSelected"
                :indeterminate="someSelected && !allSelected"
                @change="toggleAll"
                aria-label="Select all"
              />
            </th>
            <th class="col-index">#</th>
            <th>Name</th>
            <th class="col-student-id">ID</th>
            <th>Gender</th>
            <th>Class</th>
            <th>Generation</th>
            <th>Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <TransitionGroup name="row" tag="tbody">
          <tr
            v-for="(student, index) in paginatedStudents"
            :key="student.id"
            class="data-row"
            :class="{ 'row-selected': selectedIds.includes(student.id) }"
          >
            <td v-if="canDelete" class="col-check">
              <input
                type="checkbox"
                class="table-checkbox"
                :checked="selectedIds.includes(student.id)"
                @change="toggleRow(student.id)"
                :aria-label="`Select ${student.user?.name || student.id}`"
              />
            </td>
            <td class="col-index">
              <span class="id-cell">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
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
            <td class="col-student-id">
              <span v-if="student.student_id_number" class="id-number-cell">{{ student.student_id_number }}</span>
              <span v-else class="meta-cell">—</span>
            </td>
            <td>
              <span class="meta-cell">{{ student.user?.gender || '—' }}</span>
            </td>
            <td>
              <span v-if="student.class" class="class-cell">
                {{ student.class.name }}
              </span>
              <span v-else class="meta-cell">—</span>
            </td>
            <td>
              <span class="meta-cell">{{ student.generation?.name || '—' }}</span>
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
              <div class="td-actions">
                <button class="act-btn" title="View Details" @click="$emit('view', student)">
                  <Eye :size="15" />
                </button>
                <button v-if="canUpdate" class="act-btn" title="Edit" @click="$emit('edit', student)">
                  <Pencil :size="15" />
                </button>
                <button v-if="canDelete" class="act-btn act-danger" title="Delete" @click="$emit('delete', student)">
                  <Trash2 :size="15" />
                </button>
              </div>
            </td>
          </tr>
        </TransitionGroup>
      </table>
    </div>

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
        {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, students.length) }} of {{ students.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TransitionGroup } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import type { Student } from '@/services/studentService'
import {
  Search,
  VenusAndMars,
  Users,
  Inbox,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from '@lucide/vue'
import type { Generation } from '@/types'
import { usePermission } from '@/composables/usePermission'

const { hasPermission } = usePermission()
const canCreate = computed(() => hasPermission('create-students'))
const canUpdate = computed(() => hasPermission('update-students'))
const canDelete = computed(() => hasPermission('delete-students'))

const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 25, 50, 75, 100]
const selectedIds = ref<number[]>([])

const props = defineProps<{
  students: Student[]
  searchQuery: string
  genderFilter: string
  generationFilter: number | ''
  generations: Generation[]
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
  'update:generationFilter': [value: number | '']
  view: [student: Student]
  edit: [student: Student]
  assign: [student: Student]
  delete: [student: Student]
  bulkDelete: [ids: number[]]
  add: []}>()
</script>

<style scoped>

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

.col-check {
  width: 48px;
  text-align: center;
  padding: 10px 8px !important;
}

.student-table thead th.col-check,
.student-table tbody td.col-check {
  text-align: center;
  padding: 10px 8px !important;
  vertical-align: middle;
}

.col-index {
  width: 64px;
  color: #94a3b8;
  font-weight: 600;
}

.id-cell {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.table-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
  cursor: pointer;
  display: block;
  margin: 0 auto;
}


.col-actions {
  text-align: center;
  width: 110px;
}

.td-actions {
  white-space: nowrap;
  text-align: center;
}



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

.col-student-id {
  width: 130px;
  white-space: nowrap;
  padding: 10px 14px !important;
}

.student-table thead th.col-student-id,
.student-table tbody td.col-student-id {
  padding: 10px 14px !important;
  vertical-align: middle;
}

.id-number-cell {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  white-space: nowrap;
}

.class-cell {
  font-size: 0.8125rem;
  color: #64748b;
}

.meta-cell {
  font-size: 0.8125rem;
  color: #64748b;
}







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

.row-enter-active,
.row-leave-active {
  transition: all 0.3s ease;
}

.row-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.row-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.row-move {
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .col-actions {
    width: 100px;
  }
}

/* ════════════════════════════════════════
   DARK MODE — STUDENT LIST
   ════════════════════════════════════════ */
.dark-mode .student-card {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.dark-mode .student-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.dark-mode .toolbar {
  background: transparent;
  border-bottom-color: #334155;
}

.dark-mode .search-box {
  background: transparent;
}

.dark-mode .search-input {
  background: #1e293b;
  border-color: #475569;
  color: #e2e8f0;
}

.dark-mode .search-input::placeholder {
  color: #64748b;
}

.dark-mode .search-input:hover {
  border-color: #64748b;
}

.dark-mode .search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.dark-mode .search-icon {
  color: #64748b;
}

.dark-mode .filter-label {
  background: transparent;
  border-color: #475569;
  color: #94a3b8;
}

.dark-mode .filter-label:hover {
  border-color: #64748b;
}

.dark-mode .filter-label :deep(svg) {
  color: #64748b;
}

.dark-mode .filter-select {
  color: #cbd5e1;
}

.dark-mode .filter-select option {
  background: #1e293b;
  color: #e2e8f0;
}

.dark-mode .count-badge {
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
}

.dark-mode .table-wrap {
  border-top: 1px solid transparent;
}

.dark-mode .student-table thead th {
  background: rgba(15, 23, 42, 0.3);
  color: #94a3b8;
  border-bottom-color: #334155;
}

.dark-mode .student-table tbody tr {
  border-bottom-color: #2a3a4e;
}

.dark-mode .student-table tbody tr:hover {
  background: rgba(51, 65, 85, 0.3);
}

.dark-mode .data-row.row-selected {
  background: rgba(59, 130, 246, 0.08);
}

.dark-mode .student-name {
  color: #f1f5f9;
}

.dark-mode .avatar {
  background: #2563eb;
}

.dark-mode .meta-cell {
  color: #94a3b8;
}

.dark-mode .class-cell {
  color: #94a3b8;
}

.dark-mode .id-number-cell {
  color: #94a3b8;
}

.dark-mode .id-cell {
  color: #64748b;
}

.dark-mode .col-index {
  color: #64748b;
}

.dark-mode .table-checkbox {
  accent-color: #3b82f6;
}

.dark-mode .pagination-bar {
  background: rgba(15, 23, 42, 0.2);
  border-top-color: #334155;
}

.dark-mode .pagination-info {
  color: #94a3b8;
}

.dark-mode .rows-label {
  color: #94a3b8;
}

.dark-mode .rows-selector {
  background: rgba(51, 65, 85, 0.4);
}

.dark-mode .rows-btn {
  color: #94a3b8;
}

.dark-mode .rows-btn:hover {
  color: #cbd5e1;
}

.dark-mode .rows-btn.active {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.dark-mode .page-nav {
  background: transparent;
  border-color: #475569;
  color: #94a3b8;
}

.dark-mode .page-nav:hover:not(:disabled) {
  border-color: #60a5fa;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
}

.dark-mode .page-nav:disabled {
  opacity: 0.3;
  border-color: #334155;
}

.dark-mode .page-btn {
  color: #94a3b8;
}

.dark-mode .page-btn:hover:not(.active) {
  background: rgba(51, 65, 85, 0.4);
  color: #93c5fd;
}

.dark-mode .page-btn.active {
  background: #2563eb;
  color: #fff;
}

.dark-mode .page-dots {
  color: #64748b;
}

.dark-mode .pagination-total {
  color: #94a3b8;
}

.dark-mode .bulk-bar {
  background: rgba(239, 68, 68, 0.08);
  border-bottom-color: rgba(239, 68, 68, 0.2);
}

.dark-mode .bulk-count {
  color: #fca5a5;
}

.dark-mode .bulk-delete-btn {
  background: rgba(239, 68, 68, 0.8);
}

.dark-mode .bulk-delete-btn:hover {
  background: #dc2626;
}

.dark-mode .bulk-clear-btn {
  background: rgba(51, 65, 85, 0.5);
  border-color: #475569;
  color: #94a3b8;
}

.dark-mode .bulk-clear-btn:hover {
  background: rgba(51, 65, 85, 0.7);
  border-color: #64748b;
}

.dark-mode .empty-container .empty-box {
  color: #64748b;
}

.dark-mode .empty-container .empty-box h5 {
  color: #94a3b8;
}

.dark-mode .td-actions .act-btn {
  background: rgba(51, 65, 85, 0.4);
  border-color: #475569;
  color: #94a3b8;
}

.dark-mode .td-actions .act-btn:hover {
  background: rgba(51, 65, 85, 0.6);
  border-color: #60a5fa;
  color: #60a5fa;
}

.dark-mode .td-actions .act-danger:hover {
  border-color: #f87171;
  color: #f87171;
}

.dark-mode .student-table thead th.col-check,
.dark-mode .student-table tbody td.col-check {
  background: transparent;
}

.dark-mode .btn-primary {
  background: #2563eb;
  border-color: #2563eb;
}

.dark-mode .table-wrap::-webkit-scrollbar-thumb {
  background: #475569;
}

.dark-mode .table-wrap::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>

<!-- ════════════════════════════════════════
     DARK MODE — NON-SCOPED
     (scoped styles can't reach .dark-mode on parent)
     ════════════════════════════════════════ -->
<style>
.dark-mode .student-card {
  background: #1e293b !important;
  border-color: #334155 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
}

.dark-mode .student-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
}

.dark-mode .toolbar {
  border-bottom-color: #334155 !important;
}

.dark-mode .search-input {
  background: #1e293b !important;
  border-color: #475569 !important;
  color: #e2e8f0 !important;
}

.dark-mode .search-input::placeholder {
  color: #64748b !important;
}

.dark-mode .search-input:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
}

.dark-mode .search-icon {
  color: #64748b !important;
}

.dark-mode .filter-label {
  border-color: #475569 !important;
  color: #94a3b8 !important;
}

.dark-mode .filter-select {
  color: #cbd5e1 !important;
}

.dark-mode .filter-select option {
  background: #1e293b !important;
  color: #e2e8f0 !important;
}

.dark-mode .count-badge {
  background: rgba(59, 130, 246, 0.12) !important;
  color: #93c5fd !important;
}

.dark-mode .student-table thead th {
  background: rgba(15, 23, 42, 0.3) !important;
  color: #94a3b8 !important;
  border-bottom-color: #334155 !important;
}

.dark-mode .student-table tbody tr {
  border-bottom-color: #2a3a4e !important;
}

.dark-mode .student-table tbody tr:hover {
  background: rgba(51, 65, 85, 0.3) !important;
}

.dark-mode .data-row.row-selected {
  background: rgba(59, 130, 246, 0.08) !important;
}

.dark-mode .student-name {
  color: #f1f5f9 !important;
}

.dark-mode .meta-cell {
  color: #94a3b8 !important;
}

.dark-mode .class-cell {
  color: #94a3b8 !important;
}

.dark-mode .id-number-cell {
  color: #94a3b8 !important;
}

.dark-mode .id-cell {
  color: #64748b !important;
}

.dark-mode .col-index {
  color: #64748b !important;
}

.dark-mode .table-checkbox {
  accent-color: #3b82f6 !important;
}

.dark-mode .pagination-bar {
  background: rgba(15, 23, 42, 0.2) !important;
  border-top-color: #334155 !important;
}

.dark-mode .pagination-info {
  color: #94a3b8 !important;
}

.dark-mode .rows-selector {
  background: rgba(51, 65, 85, 0.4) !important;
}

.dark-mode .rows-btn {
  color: #94a3b8 !important;
}

.dark-mode .rows-btn.active {
  background: rgba(59, 130, 246, 0.15) !important;
  color: #93c5fd !important;
}

.dark-mode .page-nav {
  background: transparent !important;
  border-color: #475569 !important;
  color: #94a3b8 !important;
}

.dark-mode .page-nav:hover:not(:disabled) {
  border-color: #60a5fa !important;
  color: #60a5fa !important;
  background: rgba(59, 130, 246, 0.1) !important;
}

.dark-mode .page-btn {
  color: #94a3b8 !important;
}

.dark-mode .page-btn:hover:not(.active) {
  background: rgba(51, 65, 85, 0.4) !important;
  color: #93c5fd !important;
}

.dark-mode .page-btn.active {
  background: #2563eb !important;
  color: #fff !important;
}

.dark-mode .page-dots {
  color: #64748b !important;
}

.dark-mode .pagination-total {
  color: #94a3b8 !important;
}

.dark-mode .bulk-bar {
  background: rgba(239, 68, 68, 0.08) !important;
  border-bottom-color: rgba(239, 68, 68, 0.2) !important;
}

.dark-mode .bulk-count {
  color: #fca5a5 !important;
}

.dark-mode .bulk-delete-btn {
  background: rgba(239, 68, 68, 0.8) !important;
}

.dark-mode .bulk-delete-btn:hover {
  background: #dc2626 !important;
}

.dark-mode .bulk-clear-btn {
  background: rgba(51, 65, 85, 0.5) !important;
  border-color: #475569 !important;
  color: #94a3b8 !important;
}

.dark-mode .empty-box {
  color: #64748b !important;
}

.dark-mode .empty-box h5 {
  color: #94a3b8 !important;
}

.dark-mode .td-actions .act-btn {
  background: rgba(51, 65, 85, 0.4) !important;
  border-color: #475569 !important;
  color: #94a3b8 !important;
}

.dark-mode .td-actions .act-btn:hover {
  background: rgba(51, 65, 85, 0.6) !important;
  border-color: #60a5fa !important;
  color: #60a5fa !important;
}

.dark-mode .td-actions .act-danger:hover {
  border-color: #f87171 !important;
  color: #f87171 !important;
}

.dark-mode .status-badge {
  border-color: #475569 !important;
}

.dark-mode .badge-active {
  background: rgba(16, 185, 129, 0.12) !important;
  color: #34d399 !important;
}

.dark-mode .badge-inactive {
  background: rgba(100, 116, 139, 0.15) !important;
  color: #94a3b8 !important;
}

.dark-mode .btn-primary {
  background: #2563eb !important;
  border-color: #2563eb !important;
}
</style>
