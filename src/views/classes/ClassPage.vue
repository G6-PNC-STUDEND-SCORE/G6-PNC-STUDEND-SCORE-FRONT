<template>
  <div class="classes-page">
    <!-- Loading State (only on initial load) -->
    <LoadingState v-if="loading && classes.length === 0" message="Loading classes..." />

    <!-- Error State -->
    <div v-else-if="error" class="d-flex align-items-center gap-2 p-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.875rem;">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <!-- Class List Card -->
    <div v-else class="class-card">
      <!-- Search & Filter Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search by name, generation, or room..."
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <ToggleLeft :size="16" />
              <span>Status</span>
              <select v-model="filters.status" class="filter-select">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <CalendarDays :size="16" />
              <span>Generation</span>
              <select v-model="filters.generation" class="filter-select">
                <option value="">All</option>
                <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.name }}</option>
              </select>
            </label>
          </div>
        </div>

        <div class="toolbar-right">
          <button
            class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold"
            style="border-radius: 0.625rem; background: #2563eb; padding: 0.35rem 0.875rem; font-size: 0.8125rem; flex-shrink: 0;"
            @click="openCreateModal"
          >
            <Plus :size="15" />
            Add Class
          </button>

          <span class="count-badge">
            {{ totalClasses }} class{{ totalClasses !== 1 ? 'es' : '' }}
          </span>
        </div>
      </div>

      <!-- Bulk Action Bar -->
      <div v-if="selectedIds.length > 0" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} selected</span>
        <button class="bulk-delete-btn" @click="confirmBulkDelete">
          <Trash :size="16" />
          Delete Selected
        </button>
        <button class="bulk-clear-btn" @click="clearSelection">Clear Selection</button>
      </div>

      <!-- Empty State (no data) -->
      <div v-if="filteredClasses.length === 0" class="empty-container">
        <EmptyState
          title="No classes found"
          :message="searchQuery ? 'Try a different search term.' : 'No classes match the current filter.'"
        >
          <template #icon><Inbox :size="24" /></template>
        </EmptyState>
      </div>

      <!-- Table (with data) -->
      <div v-else class="table-wrap">
        <DataTable
          :columns="columns"
          :data="pagination.paginatedItems.value"
          :row-key="(row) => (row as SchoolClass).id"
          :row-class="(row) => rowClassFor(row as SchoolClass)"
          @row-dblclick="(row) => openEditModal(row as SchoolClass)"
        >
          <template #header-check>
            <div class="col-check" @click.stop @dblclick.stop>
              <input
                type="checkbox"
                class="table-checkbox"
                :checked="isAllPageSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
              />
            </div>
          </template>
          <template #cell-check="{ row }">
            <div class="col-check" @click.stop @dblclick.stop>
              <input
                type="checkbox"
                class="table-checkbox"
                :checked="selectedIds.includes((row as SchoolClass).id)"
                @change="toggleSelectClass((row as SchoolClass).id)"
              />
            </div>
          </template>
          <template #cell-index="{ index }">
            <span class="col-index">{{ (pagination.currentPage.value - 1) * pagination.pageSize.value + index + 1 }}</span>
          </template>
          <template #cell-name="{ row }">
            <div class="class-cell">
              <div class="class-avatar" :style="{ background: getClassAvatarBg() }">
                <Users :size="16" />
              </div>
              <span class="class-name">{{ (row as SchoolClass).name }}</span>
            </div>
          </template>
          <template #cell-generation="{ row }">
            <span class="meta-cell">{{ generationLabel(row as SchoolClass) }}</span>
          </template>
          <template #cell-room="{ row }">
            <span class="meta-cell">{{ (row as SchoolClass).room || '—' }}</span>
          </template>
          <template #cell-status="{ row }">
            <span
              class="status-badge"
              :class="(row as SchoolClass).is_active ? 'badge-active' : 'badge-inactive'"
            >
              {{ (row as SchoolClass).is_active ? 'Active' : 'Inactive' }}
            </span>
          </template>
          <template #cell-actions="{ row }">
            <div class="actions-cell" @click.stop @dblclick.stop>
              <button class="act-btn" @click="openEditModal(row as SchoolClass)" title="Edit">
                <Pencil :size="15" />
              </button>
              <button class="act-btn act-danger" @click="confirmDelete(row as SchoolClass)" title="Delete">
                <Trash2 :size="15" />
              </button>
            </div>
          </template>
        </DataTable>
      </div>

      <!-- Pagination (only when data exists) -->
      <div v-if="filteredClasses.length > 0" class="pagination-bar">
        <div class="pagination-info">
          <span class="rows-label">Rows per page:</span>
          <div class="rows-selector">
            <button
              v-for="size in pagination.pageSizeOptions"
              :key="size"
              class="rows-btn"
              :class="{ active: pagination.pageSize.value === size }"
              @click="pagination.changePageSize(size)"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <div class="pagination-pages">
          <button
            class="page-nav"
            :disabled="pagination.currentPage.value <= 1"
            @click="pagination.changePage(pagination.currentPage.value - 1)"
            aria-label="Previous page"
          >
            <ChevronLeft :size="16" />
          </button>

          <template v-for="(page, idx) in pagination.visiblePages.value" :key="'vp-' + idx">
            <button
              v-if="page !== '...'"
              class="page-btn"
              :class="{ active: pagination.currentPage.value === page }"
              @click="pagination.changePage(page as number)"
            >
              {{ page }}
            </button>
            <span v-else class="page-dots">…</span>
          </template>

          <button
            class="page-nav"
            :disabled="pagination.currentPage.value >= pagination.totalPages.value"
            @click="pagination.changePage(pagination.currentPage.value + 1)"
            aria-label="Next page"
          >
            <ChevronRight :size="16" />
          </button>
        </div>

        <div class="pagination-total">
          {{ (pagination.currentPage.value - 1) * pagination.pageSize.value + 1 }}-{{ Math.min(pagination.currentPage.value * pagination.pageSize.value, filteredClasses.length) }} of {{ filteredClasses.length }}
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal v-model="showFormModal">
      <div class="modal-head">
        <div class="modal-icon" :class="isEditMode ? 'icon-edit' : 'icon-create'">
          <SquarePen v-if="isEditMode" :size="18" />
          <Plus v-else :size="18" />
        </div>
        <div>
          <h3>{{ isEditMode ? 'Edit Class' : 'Add New Class' }}</h3>
          <p>{{ isEditMode ? 'Update class information' : 'Fill in the new class details' }}</p>
        </div>
        <button class="modal-x" @click="closeFormModal">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="modal-body-custom">
          <!-- Error Alert -->
          <div v-if="formError" class="error-alert">
            <AlertTriangle :size="16" class="me-2" />
            {{ formError }}
          </div>

          <!-- Class Name -->
          <div class="form-group">
            <label class="form-label">
              <Users :size="14" class="me-1" />
              Class Name
            </label>
            <div class="input-wrapper">
              <input
                v-model="formData.name"
                type="text"
                class="modern-input"
                placeholder="e.g. Class A"
                required
              />
            </div>
          </div>

          <!-- Generation -->
          <div class="form-group">
            <label class="form-label">
              <CalendarDays :size="14" class="me-1" />
              Generation
            </label>
            <div class="input-wrapper">
              <select v-model.number="formData.generation_id" class="modern-input" required>
                <option :value="null">— Select generation —</option>
                <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.name }}</option>
              </select>
            </div>
          </div>

          <!-- Room -->
          <div class="form-group">
            <label class="form-label">
              <DoorOpen :size="14" class="me-1" />
              Room
            </label>
            <div class="input-wrapper">
              <input
                v-model="formData.room"
                type="text"
                class="modern-input"
                placeholder="e.g. B12"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label">
              <FileText :size="14" class="me-1" />
              Description
            </label>
            <div class="input-wrapper">
              <textarea
                v-model="formData.description"
                class="modern-input"
                placeholder="Optional notes..."
                rows="3"
                style="resize: vertical; min-height: 60px;"
              ></textarea>
            </div>
          </div>

          <!-- Status -->
          <div class="form-group">
            <label class="form-label">
              <ToggleLeft :size="14" class="me-1" />
              Status
            </label>
            <div class="input-wrapper">
              <select v-model="formData.is_active" class="modern-input">
                <option :value="true">Active</option>
                <option :value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" @click="closeFormModal">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="formSubmitting">
            <span v-if="formSubmitting" class="spinner-sm"></span>
            <Check v-else :size="16" />
            <span>{{ isEditMode ? 'Save Changes' : 'Create Class' }}</span>
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Users, Plus, AlertTriangle, Search, ToggleLeft, Pencil, Trash2, ChevronLeft, ChevronRight, SquarePen,
  Check, Inbox, Trash, CalendarDays, DoorOpen, FileText,
} from '@lucide/vue'
import { useClassStore } from '@/stores/class'
import type { SchoolClass } from '@/services/classService'
import { getAcademicYears } from '@/services/academicYearService'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import { usePagination } from '@/composables/usePagination'
import { useSearchFilters } from '@/composables/useSearchFilters'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

// ─── Store ────────────────────────────────────────────────────────────
const store = useClassStore()
const { classes, loading, error, totalClasses } = storeToRefs(store)

// ─── Shared UI composables ──────────────────────────────────────────
const toast = useToast()
const { confirm } = useConfirm()

// ─── Local State ──────────────────────────────────────────────────────
const formSubmitting = ref(false)
const formError = ref<string | null>(null)
const academicYears = ref<{ id: number; name: string }[]>([])

// ─── Search & Filters ─────────────────────────────────────────────────
let resetPage = () => {}
const { searchQuery, filters } = useSearchFilters(
  { status: '', generation: '' as number | '' },
  () => resetPage()
)

// ─── Client-Side Filtering ────────────────────────────────────────────
const filteredClasses = computed(() => {
  let list = classes.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(c => {
      const name = (c.name || '').toLowerCase()
      const generation = (c.academicYear?.name || c.generation?.name || c.generation?.year || '').toLowerCase()
      const room = (c.room || '').toLowerCase()
      return name.includes(q) || generation.includes(q) || room.includes(q)
    })
  }
  if (filters.status === 'active') list = list.filter(c => c.is_active === true)
  if (filters.status === 'inactive') list = list.filter(c => c.is_active === false)
  if (filters.generation !== '') {
    const gid = filters.generation as number
    list = list.filter(c => (c.academicYear?.id || c.generation?.id) === gid)
  }
  return list
})

// ─── Pagination ────────────────────────────────────────────────────────
const pagination = usePagination<SchoolClass>({
  items: filteredClasses,
  pageSizeOptions: [10, 25, 50],
  initialPageSize: 10,
})
resetPage = pagination.resetPage

// ─── Table columns ──────────────────────────────────────────────────
const columns = [
  { key: 'check', label: '', width: '48px' },
  { key: 'index', label: '#', width: '64px' },
  { key: 'name', label: 'Class Name' },
  { key: 'generation', label: 'Generation' },
  { key: 'room', label: 'Room' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', width: '90px' },
]

function generationLabel(cls: SchoolClass): string {
  return cls.academicYear?.name || cls.generation?.name || cls.generation?.year || '—'
}

function rowClassFor(cls: SchoolClass) {
  return { 'class-row': true, 'row-selected': selectedIds.value.includes(cls.id) }
}

// ─── Modal State ──────────────────────────────────────────────────────
const showFormModal = ref(false)
const isEditMode = ref(false)
const editingClass = ref<SchoolClass | null>(null)

// ─── Form State ───────────────────────────────────────────────────────
const initialForm = () => ({
  name: '',
  generation_id: null as number | null,
  room: '',
  description: '',
  is_active: true,
})

const formData = reactive(initialForm())

// ─── API Helpers ────────────────────────────────────────────────────
async function loadAcademicYears() {
  try {
    const r = await getAcademicYears()
    if (r.success && Array.isArray(r.data)) academicYears.value = r.data
  } catch {
    academicYears.value = []
  }
}

// ─── Create / Edit ────────────────────────────────────────────────────
function openCreateModal() {
  isEditMode.value = false
  editingClass.value = null
  Object.assign(formData, initialForm())
  formError.value = null
  showFormModal.value = true
}

function openEditModal(cls: SchoolClass) {
  isEditMode.value = true
  editingClass.value = cls
  formData.name = cls.name
  // Use academicYear?.id because the API returns generation data
  // under the 'academicYear' key (not as 'generation_id')
  formData.generation_id = cls.academicYear?.id ?? null
  formData.room = cls.room ?? ''
  formData.description = cls.description ?? ''
  formData.is_active = cls.is_active
  formError.value = null
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  editingClass.value = null
}

async function handleSubmit() {
  if (!formData.name.trim()) {
    formError.value = 'Class name is required'
    return
  }
  if (!formData.generation_id) {
    formError.value = 'Please select a generation'
    return
  }

  formSubmitting.value = true
  formError.value = null

  try {
    if (isEditMode.value && editingClass.value) {
      const ok = await store.updateClass(editingClass.value.id, {
        name: formData.name,
        generation_id: formData.generation_id,
        room: formData.room || undefined,
        description: formData.description || undefined,
        is_active: formData.is_active,
      })
      if (ok) {
        toast.success('Class updated successfully')
        closeFormModal()
      } else {
        formError.value = store.error || 'Failed to update class'
      }
    } else {
      const ok = await store.createClass({
        name: formData.name,
        generation_id: formData.generation_id,
        room: formData.room || undefined,
        description: formData.description || undefined,
        is_active: formData.is_active,
      } as Partial<SchoolClass>)
      if (ok) {
        toast.success('Class created successfully')
        closeFormModal()
      } else {
        formError.value = store.error || 'Failed to create class'
      }
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    formError.value = err.response?.data?.message || err.message || 'Operation failed'
  } finally {
    formSubmitting.value = false
  }
}

// ─── Delete ─────────────────────────────────────────────────────────────
async function confirmDelete(cls: SchoolClass) {
  const ok = await confirm({
    title: 'Delete Class',
    message: `Are you sure you want to delete "${cls.name}"? The class and all associated data will be permanently removed.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return

  try {
    const deleted = await store.deleteClass(cls.id)
    if (deleted) {
      toast.success('Class deleted successfully')
      if (pagination.paginatedItems.value.length === 0 && pagination.currentPage.value > 1) {
        pagination.changePage(pagination.currentPage.value - 1)
      }
    } else {
      toast.error(store.error || 'Failed to delete class')
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    toast.error(err.response?.data?.message || err.message || 'Failed to delete class')
  }
}

// ─── Multi-Select & Bulk Delete ───────────────────────────────────────
const selectedIds = ref<number[]>([])

const isAllPageSelected = computed(() => {
  return pagination.paginatedItems.value.length > 0 &&
    pagination.paginatedItems.value.every(c => selectedIds.value.includes(c.id))
})

const isIndeterminate = computed(() => {
  const some = pagination.paginatedItems.value.some(c => selectedIds.value.includes(c.id))
  return some && !isAllPageSelected.value
})

function toggleSelectAll() {
  if (isAllPageSelected.value) {
    const pageIds = new Set(pagination.paginatedItems.value.map(c => c.id))
    selectedIds.value = selectedIds.value.filter(id => !pageIds.has(id))
  } else {
    const currentIds = new Set(selectedIds.value)
    pagination.paginatedItems.value.forEach(c => currentIds.add(c.id))
    selectedIds.value = Array.from(currentIds)
  }
}

function toggleSelectClass(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(idx, 1)
  }
}

function clearSelection() {
  selectedIds.value = []
}

async function confirmBulkDelete() {
  const count = selectedIds.value.length
  const ok = await confirm({
    title: 'Delete Classes',
    message: `Are you sure you want to delete ${count} class(es)? These classes and all associated data will be permanently removed.`,
    confirmLabel: `Delete ${count} class(es)`,
    danger: true,
  })
  if (!ok) return

  const idsToDelete = [...selectedIds.value]
  try {
    const results = await Promise.allSettled(idsToDelete.map(id => store.deleteClass(id)))
    const allOk = results.every(r => r.status === 'fulfilled')
    if (allOk) {
      toast.success(`${idsToDelete.length} class(es) deleted successfully`)
      clearSelection()
      if (pagination.paginatedItems.value.length === 0 && pagination.currentPage.value > 1) {
        pagination.changePage(pagination.currentPage.value - 1)
      }
    } else {
      toast.error('Failed to delete some classes')
    }
  } catch (e: unknown) {
    const err = e as { message?: string }
    toast.error(err.message || 'Failed to delete classes')
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────
function getClassAvatarBg(): string {
  return '#2563eb'
}

// ─── Lifecycle ─────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([store.fetchClasses(), loadAcademicYears()])
})
</script>

<style scoped>
/* ==================== Page Layout ==================== */
.classes-page {
  height: calc(100vh - 96px);
  width: calc(100% + 12px);
  margin-top: -6px;
  margin-left: -6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

/* ==================== Card ==================== */
.class-card {
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

.class-card:hover {
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
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
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

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
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

/* ==================== Table ==================== */
.table-wrap {
  width: 100%;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.table-wrap :deep(.data-table-wrapper) {
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.table-wrap :deep(.data-table thead th) {
  position: sticky;
  top: 0;
  z-index: 2;
}

.col-check {
  text-align: center;
}

.table-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
  cursor: pointer;
  display: block;
  margin: 0 auto;
}

.col-index {
  color: #94a3b8;
  font-weight: 600;
}

.actions-cell {
  text-align: center;
  white-space: nowrap;
}

.empty-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.class-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.class-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.class-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9rem;
}

.meta-cell {
  font-size: 0.8125rem;
  color: #64748b;
}

.table-wrap :deep(.class-row) {
  transition: background 0.2s ease, border-left 0.2s ease;
  border-left: 3px solid transparent;
}

.table-wrap :deep(.class-row:hover) { background: #f8fafc; border-left-color: #2563eb; }

.table-wrap :deep(.row-selected) {
  background: #f0f5ff !important;
  border-left-color: #2563eb !important;
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

.rows-label { font-weight: 500; white-space: nowrap; }

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

.rows-btn:hover { color: #334155; }
.rows-btn.active { background: #fff; color: #2563eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }

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

.page-nav:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; background: #f0f5ff; }
.page-nav:disabled { opacity: 0.4; cursor: not-allowed; }

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

.page-btn:hover:not(.active) { background: #f1f5f9; color: #2563eb; }
.page-btn.active { background: #2563eb; color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25); }

.page-dots { width: 24px; text-align: center; color: #94a3b8; font-size: 0.875rem; letter-spacing: 1px; }
.pagination-total { color: #64748b; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }

/* ==================== Form Modal Styles ==================== */
.modal-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 24px 0;
  position: relative;
}
.modal-head h3 { font-size: 1.05rem; font-weight: 700; margin: 0 0 2px; }
.modal-head p { font-size: 0.82rem; color: #64748b; margin: 0; }

.modal-x {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}
.modal-x:hover { color: #475569; }

.modal-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.icon-create { background: #dbeafe; color: #2563eb; }
.icon-edit { background: #fef3c7; color: #d97706; }

.modal-body-custom { padding: 16px 24px 20px; }

.form-group { margin-bottom: 14px; }

.form-label { display: block; font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 5px; }
.form-label :deep(svg) { color: #94a3b8; }
.input-wrapper { position: relative; }

.modern-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 0.88rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  color: #0f172a;
  background: #fff;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s;
  appearance: none;
  box-sizing: border-box;
}

.modern-input:hover { border-color: #9ca3af; }
.modern-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
.modern-input::placeholder { color: #94a3b8; }

select.modern-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 2.4rem;
}

.error-alert {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-size: 0.8125rem;
  color: #991b1b;
  background: #fef2f2;
  border-radius: 10px;
  margin-bottom: 16px;
  border-left: 4px solid #ef4444;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 24px 20px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem 1.125rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-family: inherit;
  white-space: nowrap;
}
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost { background: #f1f5f9; color: #475569; }
.btn-ghost:hover { background: #e2e8f0; }

/* ── Spinner ── */
.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ==================== Scrollbar ==================== */
.table-wrap::-webkit-scrollbar { width: 4px; height: 4px; }
.table-wrap::-webkit-scrollbar-track { background: transparent; }
.table-wrap::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
.table-wrap::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
