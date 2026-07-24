<template>
  <div class="teacher-card">
    <!-- Toolbar: Search & Filters -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
          <input
            :value="searchQuery"
            @input="onSearchInput"
            type="text"
            class="search-input"
            placeholder="Search by name or email..."
          />
          <button v-if="searchQuery" class="search-clear" @click="clearSearch">
            <X :size="14" />
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <!-- Department Filter -->
        <div class="filter-group">
          <label class="filter-label">
            <Building2 :size="16" />
            <select
              :value="departmentFilter"
              @change="emit('update:departmentFilter', ($event.target as HTMLSelectElement).value); currentPage = 1; emitSearch()"
              class="filter-select"
            >
              <option value="">All Departments</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
          </label>
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <label class="filter-label">
            <Activity :size="16" />
            <select
              :value="statusFilter"
              @change="emit('update:statusFilter', ($event.target as HTMLSelectElement).value); currentPage = 1; emitSearch()"
              class="filter-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
        </div>

        <!-- Gender Filter -->
        <div class="filter-group">
          <label class="filter-label">
            <VenusAndMars :size="16" />
            <select
              :value="genderFilter"
              @change="emit('update:genderFilter', ($event.target as HTMLSelectElement).value); currentPage = 1; emitSearch()"
              class="filter-select"
            >
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>
        </div>

        <span class="count-badge">
          {{ total }} teacher{{ total !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Bulk Action Bar -->
    <Transition name="bulk-slide">
      <div v-if="selectedIds.length > 0" class="bulk-bar">
        <div class="bulk-left">
          <div class="bulk-check-icon">
            <CheckCheck :size="18" />
          </div>
          <span class="bulk-count-label">
            <strong>{{ selectedIds.length }}</strong> selected
          </span>
        </div>
        <div class="bulk-right">
          <button class="bulk-btn bulk-btn-clear" @click="selectedIds = []">
            <X :size="15" />
            <span>Clear</span>
          </button>
          <button class="bulk-btn bulk-btn-delete" @click="emitBulkDelete">
            <Trash2 :size="15" />
            <span>Delete Selected</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Table -->
    <div class="table-wrap">
      <table class="teacher-table">
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
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Gender</th>
            <th>Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="teachers.length === 0">
            <td colspan="7" class="empty-state">
              <Users :size="28" class="empty-icon" />
              <span>{{ searchQuery ? `No teachers matching "${searchQuery}"` : 'No teachers found' }}</span>
              <button v-if="searchQuery || departmentFilter || statusFilter || genderFilter" class="empty-state-btn" @click="clearAllFilters">
                <X :size="14" />
                Clear filters
              </button>
            </td>
          </tr>
          <tr
            v-for="teacher in teachers"
            :key="teacher.id"
            class="teacher-row"
          >
            <td class="col-check">
              <input
                type="checkbox"
                class="row-check"
                :checked="selectedIds.includes(teacher.id)"
                @change="toggleRow(teacher.id)"
                :aria-label="`Select ${teacher.user?.name || teacher.id}`"
              />
            </td>
            <td>
              <div class="teacher-cell">
                <div class="avatar">{{ getInitials(teacher.user?.name || '') }}</div>
                <span class="teacher-name">{{ teacher.user?.name || '—' }}</span>
              </div>
            </td>
            <td class="td-email">{{ teacher.user?.email || '—' }}</td>
            <td>
              <span v-if="teacher.department" class="dept-badge">
                <Building2 :size="14" />
                {{ teacher.department.name }}
              </span>
              <span v-else class="dept-empty">—</span>
            </td>
            <td>
              <span
                class="gender-badge"
                :class="(teacher.user?.gender || '') === 'Male' ? 'badge-male' : 'badge-female'"
              >
                {{ teacher.user?.gender || '—' }}
              </span>
            </td>
            <td>
              <span
                class="status-badge"
                :class="'badge-' + (teacher.user?.status || 'inactive')"
              >
                {{ formatStatus(teacher.user?.status) }}
              </span>
            </td>
            <td class="col-actions" @click.stop>
              <div class="action-dropdown">
                <button
                  class="action-trigger"
                  :title="`Actions for ${teacher.user?.name || teacher.id}`"
                  @click="toggleDropdown(teacher.id)"
                >
                  <MoreVertical :size="18" />
                </button>
                <Transition name="dropdown">
                  <div v-if="openDropdownId === teacher.id" class="action-menu">
                    <button class="action-item view" @click="emit('view', teacher); openDropdownId = null">
                      <Eye :size="16" />
                      <span>View Details</span>
                    </button>
                    <button class="action-item edit" @click="emit('edit', teacher); openDropdownId = null">
                      <Pencil :size="16" />
                      <span>Edit</span>
                    </button>
                    <div class="dropdown-divider"></div>
                    <button class="action-item delete" @click="emit('delete', teacher); openDropdownId = null">
                      <Trash2 :size="16" />
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
            :class="{ active: perPage === size }"
            @click="emit('update:perPage', size); currentPage = 1"
          >
            {{ size }}
          </button>
        </div>
      </div>

      <div class="pagination-pages">
        <button
          class="page-nav"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
          aria-label="Previous page"
        >
          <ChevronLeft :size="16" />
        </button>

        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            class="page-btn"
            :class="{ active: currentPage === page }"
            @click="goToPage(page as number)"
          >
            {{ page }}
          </button>
          <span v-else class="page-dots">…</span>
        </template>

        <button
          class="page-nav"
          :disabled="currentPage >= lastPage"
          @click="goToPage(currentPage + 1)"
          aria-label="Next page"
        >
          <ChevronRight :size="16" />
        </button>
      </div>

      <div class="pagination-total">
        {{ from }}-{{ to }} of {{ total }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Teacher, TeacherDepartment } from '@/services/teacherService'
import {
  Search,
  X,
  Building2,
  Activity,
  VenusAndMars,
  Users,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from '@lucide/vue'

// ─── Props ─────────────────────────────────────────────────────────
const props = defineProps<{
  teachers: Teacher[]
  departments: TeacherDepartment[]
  searchQuery: string
  departmentFilter: string
  statusFilter: string
  genderFilter: string
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  from: number
  to: number
}>()

// ─── Emits ─────────────────────────────────────────────────────────
const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:departmentFilter': [value: string]
  'update:statusFilter': [value: string]
  'update:genderFilter': [value: string]
  'update:currentPage': [value: number]
  'update:perPage': [value: number]
  view: [teacher: Teacher]
  edit: [teacher: Teacher]
  delete: [teacher: Teacher]
  bulkDelete: [ids: number[]]
  search: []
  clearSearch: []
  clearAllFilters: []
}>()

// ─── Local State ───────────────────────────────────────────────────
const selectedIds = ref<number[]>([])
const openDropdownId = ref<number | null>(null)
const searchInput = ref(props.searchQuery)
const pageSizeOptions = [10, 25, 50]
let searchDebounce: ReturnType<typeof setTimeout> | null = null

// ─── Computed ──────────────────────────────────────────────────────
const allSelected = computed(() =>
  props.teachers.length > 0 &&
  props.teachers.every((t) => selectedIds.value.includes(t.id))
)

const someSelected = computed(() => selectedIds.value.length > 0)

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = props.lastPage
  const current = props.currentPage

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

// ─── Synced currentPage ───────────────────────────────────────────
const currentPage = ref(props.currentPage)
watch(() => props.currentPage, (val) => { currentPage.value = val })
watch(currentPage, (val) => {
  if (val !== props.currentPage) emit('update:currentPage', val)
})

// ─── Search ────────────────────────────────────────────────────────
function onSearchInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:searchQuery', val)
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    currentPage.value = 1
    emit('search')
  }, 350)
}

function emitSearch() {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    emit('search')
  }, 150)
}

function clearSearch() {
  emit('update:searchQuery', '')
  currentPage.value = 1
  emit('clearSearch')
}

function clearAllFilters() {
  emit('update:searchQuery', '')
  emit('update:departmentFilter', '')
  emit('update:statusFilter', '')
  emit('update:genderFilter', '')
  currentPage.value = 1
  emit('clearAllFilters')
}

// ─── Selection ─────────────────────────────────────────────────────
function toggleRow(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)
}

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter(
      (id) => !props.teachers.some((t) => t.id === id)
    )
  } else {
    const ids = props.teachers.map((t) => t.id)
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...ids]))
  }
}

// ─── Pagination ────────────────────────────────────────────────────
function goToPage(page: number) {
  if (page < 1 || page > props.lastPage) return
  currentPage.value = page
  emit('update:currentPage', page)
}

// ─── Dropdown ──────────────────────────────────────────────────────
function toggleDropdown(id: number) {
  openDropdownId.value = openDropdownId.value === id ? null : id
}

function handleClickOutside() {
  openDropdownId.value = null
}

// ─── Bulk Delete ───────────────────────────────────────────────────
function emitBulkDelete() {
  if (selectedIds.value.length === 0) return
  emit('bulkDelete', [...selectedIds.value])
  selectedIds.value = []
}

// ─── Helpers ───────────────────────────────────────────────────────
function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatStatus(status?: string | null): string {
  if (!status) return 'Inactive'
  switch (status) {
    case 'active': return 'Active'
    case 'inactive': return 'Inactive'
    case 'suspended': return 'Suspended'
    default: return status
  }
}

// ─── Lifecycle ─────────────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  if (searchDebounce) clearTimeout(searchDebounce)
})
</script>

<style scoped>
/* ==================== Card ==================== */
.teacher-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  transition: box-shadow 0.25s ease;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.teacher-card:hover {
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
}

.toolbar-left { display: flex; align-items: center; flex-shrink: 0; }
.toolbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }

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
  padding: 0.6rem 2.2rem 0.6rem 2.4rem;
  font-size: 0.8125rem;
  font-family: inherit;
  color: #1f2937;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.search-input::placeholder { color: #9ca3af; }
.search-input:hover { border-color: #cbd5e1; }
.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.15s;
}
.search-clear:hover { color: #475569; background: #f1f5f9; }

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

/* ==================== Bulk Action Bar ==================== */
.bulk-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
  flex-wrap: wrap;
}

.bulk-left { display: flex; align-items: center; gap: 10px; }
.bulk-check-icon {
  width: 32px; height: 32px; border-radius: 50%;
  background: #2563eb; color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.bulk-count-label { font-size: 0.85rem; color: #475569; font-weight: 500; }
.bulk-count-label strong { font-size: 1rem; font-weight: 700; color: #1e293b; }
.bulk-right { display: flex; align-items: center; gap: 8px; }

.bulk-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0.4rem 0.85rem; border: 1px solid #e2e8f0;
  border-radius: 8px; font-size: 0.8rem; font-weight: 600;
  font-family: inherit; cursor: pointer; transition: all 0.15s ease;
  white-space: nowrap;
}
.bulk-btn-clear { background: #fff; color: #64748b; }
.bulk-btn-clear:hover { background: #f1f5f9; color: #475569; }
.bulk-btn-delete { background: #ef4444; color: #fff; border-color: #ef4444; }
.bulk-btn-delete:hover { background: #dc2626; border-color: #dc2626; }

/* ==================== Table ==================== */
.table-wrap {
  width: 100%;
  overflow-x: auto;
  flex: 1;
}

.teacher-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

.teacher-table thead th {
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
  text-align: center;
  padding-right: 16px !important;
}

.teacher-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f3f5;
  color: #334155;
  vertical-align: middle;
}

.teacher-table tbody tr:last-child td { border-bottom: none; }

.empty-state {
  text-align: center;
  padding: 48px 16px !important;
  color: #9ca3af;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon { margin: 0 auto; }

.empty-state-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 7px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.empty-state-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

.teacher-row {
  transition: background 0.2s ease, border-left 0.2s ease;
  border-left: 3px solid transparent;
}

.teacher-row:hover {
  background: #eff6ff;
  border-left-color: #2563eb;
}

.teacher-cell {
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

.teacher-name {
  font-weight: 600;
  color: #0f172a;
}

.td-email {
  color: #64748b;
  font-size: 0.82rem;
}

.dept-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #374151;
  font-size: 0.82rem;
}

.dept-empty {
  color: #9ca3af;
  font-style: italic;
}

/* Gender badge */
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
.badge-male { background: #dbeafe; color: #1d4ed8; }
.badge-female { background: #fce7f3; color: #be185d; }

.gender-badge::before {
  content: '';
  display: inline-block;
  width: 6px; height: 6px; border-radius: 50%;
  margin-right: 6px;
}
.badge-male::before { background: #3b82f6; }
.badge-female::before { background: #ec4899; }

/* Status badge */
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
.badge-active { background: #dcfce7; color: #15803d; }
.badge-inactive { background: #f1f5f9; color: #64748b; }
.badge-suspended { background: #fef3c7; color: #a16207; }

.status-badge::before {
  content: '';
  display: inline-block;
  width: 7px; height: 7px; border-radius: 50%;
  margin-right: 7px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}
.badge-active::before { background: #22c55e; }
.badge-inactive::before { background: #94a3b8; }
.badge-suspended::before { background: #eab308; }

/* ==================== Action Dropdown ==================== */
.action-dropdown {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
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
}

.action-trigger:hover {
  background: #eef2ff;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.action-menu {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: calc(100% + 6px);
  min-width: 190px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 100;
  animation: dropIn 0.18s ease-out;
}

@keyframes dropIn {
  from { opacity: 0; transform: scale(0.92) translateY(-6px) translateX(-50%); }
  to { opacity: 1; transform: scale(1) translateY(0) translateX(-50%); }
}

.dropdown-enter-active { transition: all 0.18s ease-out; }
.dropdown-leave-active { transition: all 0.12s ease-in; }
.dropdown-enter-from { opacity: 0; transform: scale(0.92) translateY(-6px) translateX(-50%); }
.dropdown-leave-to { opacity: 0; transform: scale(0.95) translateY(-3px) translateX(-50%); }

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

.action-item.view:hover { background: #f0f5ff; color: #2563eb; }
.action-item.edit:hover { background: #e0f2fe; color: #0369a1; }
.action-item.delete:hover { background: #fef2f2; color: #dc2626; }

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
  flex-shrink: 0;
}

.pagination-info { display: flex; align-items: center; gap: 8px; color: #64748b; }
.rows-label { font-weight: 500; white-space: nowrap; }
.rows-selector { display: flex; gap: 2px; background: #f1f5f9; border-radius: 8px; padding: 2px; }

.rows-btn {
  padding: 4px 10px; border: none; background: transparent;
  color: #64748b; border-radius: 6px; cursor: pointer;
  font-size: 0.75rem; font-weight: 600; font-family: inherit;
  transition: all 0.15s ease;
}
.rows-btn:hover { color: #334155; }
.rows-btn.active { background: #fff; color: #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

.pagination-pages { display: flex; align-items: center; gap: 2px; }

.page-nav {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #e2e8f0; background: #fff; color: #64748b;
  border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
}
.page-nav:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; background: #f0f5ff; }
.page-nav:disabled { opacity: 0.4; cursor: not-allowed; }

.page-btn {
  min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: #475569;
  border-radius: 8px; cursor: pointer; font-size: 0.8125rem;
  font-weight: 500; font-family: inherit; transition: all 0.15s ease;
}
.page-btn:hover:not(.active) { background: #f1f5f9; color: #2563eb; }
.page-btn.active { background: #2563eb; color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(37,99,235,0.25); }

.page-dots { width: 24px; text-align: center; color: #94a3b8; font-size: 0.875rem; letter-spacing: 1px; }

.pagination-total { color: #64748b; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }

/* ==================== Transitions ==================== */
.bulk-slide-enter-active { transition: all 0.25s ease-out; }
.bulk-slide-leave-active { transition: all 0.15s ease-in; }
.bulk-slide-enter-from, .bulk-slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}
.bulk-slide-enter-from .bulk-check-icon,
.bulk-slide-leave-to .bulk-check-icon { transform: scale(0.5); }

/* ==================== Responsive ==================== */
@media (max-width: 768px) {
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-box { width: 100%; max-width: 100%; }
  .toolbar-right { width: 100%; justify-content: space-between; }
  .pagination-bar { flex-direction: column; align-items: center; gap: 8px; }
  .pagination-info { width: 100%; justify-content: center; }
  .action-menu { right: auto; left: 0; }
}
</style>