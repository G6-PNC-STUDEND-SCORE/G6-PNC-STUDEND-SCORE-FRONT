<template>
  <div class="academic-years-page">
    <LoadingState v-if="loading && academicYears.length === 0" message="Loading academic years..." />

    <div v-else-if="error" class="d-flex align-items-center gap-2 p-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.875rem;">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <div v-else class="ay-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search by name or year..."
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <ToggleLeft :size="16" />
              <span>Status</span>
              <select v-model="filters.status" class="filter-select">
                <option value="">All</option>
                <option value="current">Current</option>
                <option value="past">Past</option>
              </select>
            </label>
          </div>
        </div>
        <div class="toolbar-right">
          <button
            v-if="canCreate"
            class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold"
            style="border-radius: 0.625rem; background: #2563eb; padding: 0.35rem 0.875rem; font-size: 0.8125rem; flex-shrink: 0;"
            @click="openCreateModal"
          >
            <Plus :size="15" />
            Add Academic Year
          </button>
          <span class="count-badge">
            {{ totalYears }} year{{ totalYears !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <div v-if="canDelete && selectedIds.length > 0" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} selected</span>
        <button class="bulk-delete-btn" @click="confirmBulkDelete">
          <Trash :size="16" />
          Delete Selected
        </button>
        <button class="bulk-clear-btn" @click="clearSelection">Clear Selection</button>
      </div>

      <div v-if="filteredYears.length === 0" class="empty-container">
        <EmptyState
          title="No academic years found"
          :message="searchQuery ? 'Try a different search term.' : 'No academic years match the current filter.'"
        >
          <template #icon><Inbox :size="24" /></template>
        </EmptyState>
      </div>

      <div v-else class="table-wrap">
        <DataTable
          :columns="columns"
          :data="pagination.paginatedItems.value"
          :row-key="(row) => (row as AcademicYear).id"
          :row-class="(row) => ({ 'row-selected': selectedIds.includes((row as AcademicYear).id) })"
          @row-dblclick="(row) => canUpdate && openEditModal(row as AcademicYear)"
        >
          <template v-if="canDelete" #header-check>
            <div class="col-check" @click.stop @dblclick.stop>
              <input type="checkbox" class="table-checkbox" :checked="isAllPageSelected" :indeterminate="isIndeterminate" @change="toggleSelectAll" />
            </div>
          </template>
          <template v-if="canDelete" #cell-check="{ row }">
            <div class="col-check" @click.stop @dblclick.stop>
              <input type="checkbox" class="table-checkbox" :checked="selectedIds.includes((row as AcademicYear).id)" @change="toggleSelectYear((row as AcademicYear).id)" />
            </div>
          </template>
          <template #cell-index="{ index }">
            <span class="col-index">{{ (pagination.currentPage.value - 1) * pagination.pageSize.value + index + 1 }}</span>
          </template>
          <template #cell-name="{ row }">
            <div class="ay-cell">
              <div class="ay-avatar" style="background: #2563eb;">
                <CalendarDays :size="14" />
              </div>
              <span class="ay-name">{{ (row as AcademicYear).name }}</span>
            </div>
          </template>
          <template #cell-year="{ row }">
            <span class="meta-cell">{{ (row as AcademicYear).year }}</span>
          </template>
          <template #cell-start="{ row }">
            <span class="meta-cell">{{ (row as AcademicYear).start_date ? formatDate((row as AcademicYear).start_date!) : '—' }}</span>
          </template>
          <template #cell-end="{ row }">
            <span class="meta-cell">{{ (row as AcademicYear).end_date ? formatDate((row as AcademicYear).end_date!) : '—' }}</span>
          </template>
          <template #cell-status="{ row }">
            <span class="status-badge" :class="(row as AcademicYear).is_current ? 'badge-active' : 'badge-inactive'">
              {{ (row as AcademicYear).is_current ? 'Current' : 'Past' }}
            </span>
          </template>
          <template #cell-actions="{ row }">
            <div class="actions-cell" @click.stop @dblclick.stop>
              <button v-if="canUpdate" class="act-btn" @click="openEditModal(row as AcademicYear)" title="Edit">
                <Pencil :size="15" />
              </button>
              <button v-if="canDelete" class="act-btn act-danger" @click="confirmDelete(row as AcademicYear)" title="Delete">
                <Trash2 :size="15" />
              </button>
            </div>
          </template>
        </DataTable>
      </div>

      <div v-if="filteredYears.length > 0" class="pagination-bar">
        <div class="pagination-info">
          <span class="rows-label">Rows per page:</span>
          <div class="rows-selector">
            <button v-for="size in pagination.pageSizeOptions" :key="size" class="rows-btn" :class="{ active: pagination.pageSize.value === size }" @click="pagination.changePageSize(size)">{{ size }}</button>
          </div>
        </div>
        <div class="pagination-pages">
          <button class="page-nav" :disabled="pagination.currentPage.value <= 1" @click="pagination.changePage(pagination.currentPage.value - 1)"><ChevronLeft :size="16" /></button>
          <template v-for="(page, idx) in pagination.visiblePages.value" :key="'vp-' + idx">
            <button v-if="page !== '...'" class="page-btn" :class="{ active: pagination.currentPage.value === page }" @click="pagination.changePage(page as number)">{{ page }}</button>
            <span v-else class="page-dots">…</span>
          </template>
          <button class="page-nav" :disabled="pagination.currentPage.value >= pagination.totalPages.value" @click="pagination.changePage(pagination.currentPage.value + 1)"><ChevronRight :size="16" /></button>
        </div>
        <div class="pagination-total">
          {{ (pagination.currentPage.value - 1) * pagination.pageSize.value + 1 }}-{{ Math.min(pagination.currentPage.value * pagination.pageSize.value, filteredYears.length) }} of {{ filteredYears.length }}
        </div>
      </div>
    </div>

    <Modal v-model="showFormModal" maxWidth="560px">
      <div class="modal-head">
        <div class="modal-icon" :class="isEditMode ? 'icon-edit' : 'icon-create'">
          <SquarePen v-if="isEditMode" :size="18" />
          <Plus v-else :size="18" />
        </div>
        <div>
          <h3>{{ isEditMode ? 'Edit Academic Year' : 'Add New Academic Year' }}</h3>
          <p>{{ isEditMode ? 'Update academic year information' : 'Create a new academic school year' }}</p>
        </div>
        <button class="modal-x" @click="closeFormModal">&times;</button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="modal-body-custom">
          <div v-if="formError" class="error-alert">
            <AlertTriangle :size="16" class="me-2" />
            {{ formError }}
          </div>

          <div class="form-group">
            <label class="form-label"><CalendarDays :size="15" class="field-icon" /> Year <span class="req">*</span></label>
            <div class="input-wrap">
              <input v-model.number="formData.year" type="number" min="2000" max="2100" class="styled-input" :class="{ err: formError && !formData.year }" placeholder="e.g. 2026" required />
            </div>
            <span v-if="formError && !formData.year" class="field-err">Year is required</span>
          </div>

          <div class="section-divider"></div>

          <div class="form-group">
            <label class="form-label"><BookOpen :size="15" class="field-icon" /> Name <span class="req">*</span></label>
            <div class="input-wrap">
              <input v-model="formData.name" type="text" class="styled-input" :class="{ err: formError && !formData.name.trim() }" placeholder="e.g. Academic Year 2025-2026" required />
            </div>
            <span v-if="formError && !formData.name.trim()" class="field-err">Name is required</span>
          </div>

          <div class="section-divider"></div>

          <div class="row-2">
            <div class="form-group">
              <label class="form-label"><CalendarDays :size="15" class="field-icon" /> Start Date</label>
              <div class="input-wrap">
                <input v-model="formData.start_date" type="date" class="styled-input" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label"><CalendarDays :size="15" class="field-icon" /> End Date</label>
              <div class="input-wrap">
                <input v-model="formData.end_date" type="date" class="styled-input" />
              </div>
            </div>
          </div>

          <div class="section-divider"></div>

          <div class="form-group">
            <label class="form-label"><ToggleLeft :size="15" class="field-icon" /> Current Year</label>
            <label class="toggle-switch">
              <input type="checkbox" v-model="formData.is_current" />
              <span class="toggle-slider"></span>
              <span class="toggle-label-text">{{ formData.is_current ? 'Yes - Currently active' : 'No' }}</span>
            </label>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" @click="closeFormModal">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="formSubmitting">
            <span v-if="formSubmitting" class="spinner-sm"></span>
            <Check v-else :size="16" />
            <span>{{ isEditMode ? 'Save Changes' : 'Create Year' }}</span>
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import {
  Plus, AlertTriangle, Search, ToggleLeft, Pencil, Trash2, ChevronLeft, ChevronRight, SquarePen,
  Check, Inbox, Trash, CalendarDays, BookOpen,
} from '@lucide/vue'
import type { AcademicYear, ApiResponse } from '@/types'
import { http } from '@/services/apiHttp'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import { usePagination } from '@/composables/usePagination'
import { useSearchFilters } from '@/composables/useSearchFilters'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { usePermission } from '@/composables/usePermission'

const toast = useToast()
const { confirm } = useConfirm()
const { hasPermission } = usePermission()
const canCreate = computed(() => hasPermission('create-academic-years'))
const canUpdate = computed(() => hasPermission('update-academic-years'))
const canDelete = computed(() => hasPermission('delete-academic-years'))

const loading = ref(false)
const error = ref<string | null>(null)
const academicYears = ref<AcademicYear[]>([])
const formSubmitting = ref(false)
const formError = ref<string | null>(null)

let resetPage = () => {}
const { searchQuery, filters } = useSearchFilters(
  { status: '' },
  () => resetPage()
)

const filteredYears = computed(() => {
  let list = academicYears.value as any[]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(y => (y.name || '').toLowerCase().includes(q) || String(y.year || '').includes(q))
  }
  if (filters.status === 'current') list = list.filter(y => y.is_current)
  if (filters.status === 'past') list = list.filter(y => !y.is_current)
  return list
})

const totalYears = computed(() => filteredYears.value.length)

const pagination = usePagination<any>({
  items: filteredYears,
  pageSizeOptions: [10, 25, 50],
  initialPageSize: 10,
})
resetPage = pagination.resetPage

const columns = computed(() => [
  ...(canDelete.value ? [{ key: 'check', label: '', width: '48px' }] : []),
  { key: 'index', label: '#', width: '64px' },
  { key: 'name', label: 'Name' },
  { key: 'year', label: 'Year' },
  { key: 'start', label: 'Start Date' },
  { key: 'end', label: 'End Date' },
  { key: 'status', label: 'Current' },
  { key: 'actions', label: 'Actions', width: '90px' },
])

const showFormModal = ref(false)
const isEditMode = ref(false)
const editingYear = ref<AcademicYear | null>(null)

const initialForm = () => ({
  year: new Date().getFullYear(),
  name: '',
  start_date: '',
  end_date: '',
  is_current: false,
})
const formData = reactive(initialForm())

function openCreateModal() {
  isEditMode.value = false
  editingYear.value = null
  Object.assign(formData, initialForm())
  formError.value = null
  showFormModal.value = true
}

function openEditModal(year: AcademicYear) {
  isEditMode.value = true
  editingYear.value = year
  formData.year = year.year || new Date().getFullYear()
  formData.name = year.name || ''
  formData.start_date = year.start_date || ''
  formData.end_date = year.end_date || ''
  formData.is_current = !!year.is_current
  formError.value = null
  showFormModal.value = true
}

function closeFormModal() { showFormModal.value = false; editingYear.value = null }

async function handleSubmit() {
  if (!formData.year) { formError.value = 'Year is required'; return }
  if (!formData.name.trim()) { formError.value = 'Name is required'; return }
  formSubmitting.value = true; formError.value = null
  const payload = { year: formData.year, name: formData.name, start_date: formData.start_date || null, end_date: formData.end_date || null, is_current: formData.is_current }
  try {
    if (isEditMode.value && editingYear.value) {
      const res = await http.put<ApiResponse<AcademicYear>>(`/academic-years/${editingYear.value.id}`, payload)
      if (res.data.success) { toast.success('Academic year updated successfully'); closeFormModal(); await loadData() }
      else { formError.value = res.data.message || 'Failed to update' }
    } else {
      const res = await http.post<ApiResponse<AcademicYear>>('/academic-years', payload)
      if (res.data.success) { toast.success('Academic year created successfully'); closeFormModal(); await loadData() }
      else { formError.value = res.data.message || 'Failed to create' }
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    formError.value = err.response?.data?.message || err.message || 'Operation failed'
  } finally { formSubmitting.value = false }
}

async function confirmDelete(year: AcademicYear) {
  const ok = await confirm({ title: 'Delete Academic Year', message: `Are you sure you want to delete "${year.name}"? This action cannot be undone.`, confirmLabel: 'Delete', danger: true })
  if (!ok) return
  try {
    const res = await http.delete(`/academic-years/${year.id}`)
    if (res.data.success) { toast.success('Academic year deleted successfully'); await loadData() }
    else { toast.error(res.data.message || 'Failed to delete') }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    toast.error(err.response?.data?.message || err.message || 'Failed to delete')
  }
}

const selectedIds = ref<number[]>([])
const isAllPageSelected = computed(() => pagination.paginatedItems.value.length > 0 && pagination.paginatedItems.value.every((y: any) => selectedIds.value.includes(y.id)))
const isIndeterminate = computed(() => { const some = pagination.paginatedItems.value.some((y: any) => selectedIds.value.includes(y.id)); return some && !isAllPageSelected.value })

function toggleSelectAll() {
  if (isAllPageSelected.value) { const pageIds = new Set(pagination.paginatedItems.value.map((y: any) => y.id)); selectedIds.value = selectedIds.value.filter(id => !pageIds.has(id)) }
  else { const currentIds = new Set(selectedIds.value); pagination.paginatedItems.value.forEach((y: any) => currentIds.add(y.id)); selectedIds.value = Array.from(currentIds) }
}
function toggleSelectYear(id: number) { const idx = selectedIds.value.indexOf(id); idx === -1 ? selectedIds.value.push(id) : selectedIds.value.splice(idx, 1) }
function clearSelection() { selectedIds.value = [] }

async function confirmBulkDelete() {
  const count = selectedIds.value.length
  const ok = await confirm({ title: 'Delete Academic Years', message: `Are you sure you want to delete ${count} year(s)?`, confirmLabel: `Delete ${count} year(s)`, danger: true })
  if (!ok) return
  const idsToDelete = [...selectedIds.value]
  try {
    const results = await Promise.allSettled(idsToDelete.map(id => http.delete(`/academic-years/${id}`)))
    const allOk = results.every(r => r.status === 'fulfilled')
    if (allOk) { toast.success(`${idsToDelete.length} year(s) deleted successfully`); clearSelection(); await loadData() }
    else { toast.error('Failed to delete some academic years') }
  } catch { toast.error('Failed to delete academic years') }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function loadData() {
  loading.value = true; error.value = null
  try {
    const res = await http.get<ApiResponse<AcademicYear[]>>('/academic-years')
    if (res.data.success) academicYears.value = (res.data.data || []) as AcademicYear[]
    else error.value = res.data.message || 'Failed to load'
  } catch { error.value = 'Failed to load academic years' }
  finally { loading.value = false }
}

onMounted(loadData)
</script>

<style scoped>
.academic-years-page {
  height: calc(100vh - 96px); width: calc(100% + 12px); margin-top: -6px; margin-left: -6px;
  display: flex; flex-direction: column; overflow: hidden; font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}
.ay-card {
  background: #fff; border: 1px solid #e9ecef; border-radius: 16px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); flex: 1; height: 1px;
  display: flex; flex-direction: column; min-height: 0; transition: box-shadow 0.25s ease;
}
.ay-card:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
.table-wrap { width: 100%; overflow: auto; flex: 1; min-height: 0; }
.table-wrap :deep(.data-table-wrapper) { border: none; border-radius: 0; box-shadow: none; }
.col-check { text-align: center; }
.table-checkbox { width: 16px; height: 16px; accent-color: #2563eb; cursor: pointer; display: block; margin: 0 auto; }
.col-index { color: #94a3b8; font-weight: 600; }
.actions-cell { text-align: center; white-space: nowrap; }
.ay-cell { display: flex; align-items: center; gap: 8px; }
.ay-avatar { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; box-shadow: 0 2px 6px rgba(37,99,235,0.25); }
.ay-name { font-weight: 600; color: #0f172a; font-size: 0.85rem; }
.meta-cell { font-size: 0.8125rem; color: #64748b; }
.modal-head { display: flex; align-items: center; gap: 14px; padding: 20px 24px 0; position: relative; }
.modal-head h3 { font-size: 1.05rem; font-weight: 700; margin: 0 0 2px; }
.modal-head p { font-size: 0.82rem; color: #64748b; margin: 0; }
.modal-x { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; line-height: 1; padding: 4px; }
.modal-x:hover { color: #475569; }
.modal-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.icon-create { background: #dbeafe; color: #2563eb; }
.icon-edit { background: #fef3c7; color: #d97706; }
.modal-body-custom { padding: 16px 24px 20px; }
.form-group { margin-bottom: 0; }
.form-label { display: flex; align-items: center; gap: 6px; font-size: 0.81rem; font-weight: 600; color: #374151; margin-bottom: 7px; }
.field-icon { color: #94a3b8; flex-shrink: 0; }
.req { color: #ef4444; font-weight: 700; }
.field-err { display: block; font-size: 0.75rem; color: #ef4444; margin-top: 4px; font-weight: 500; }
.input-wrap { position: relative; }
.styled-input { width: 100%; padding: 10px 12px; font-size: 0.88rem; font-family: inherit; color: #0f172a; background: #fff; border: 1.5px solid #d1d5db; border-radius: 10px; outline: none; transition: all 0.2s ease; box-sizing: border-box; }
.styled-input:hover { border-color: #9ca3af; }
.styled-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.styled-input.err { border-color: #ef4444; }
.section-divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 14px 0 16px; }
.error-alert { display: flex; align-items: center; padding: 10px 14px; font-size: 0.8125rem; color: #991b1b; background: #fef2f2; border-radius: 10px; margin-bottom: 16px; border-left: 4px solid #ef4444; }
.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 24px 20px; }
.empty-container { display: flex; align-items: center; justify-content: center; flex: 1; padding: 3rem; }
.toggle-switch { display: flex; align-items: center; gap: 10px; cursor: pointer; margin: 4px 0; }
.toggle-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.toggle-slider { position: relative; width: 44px; height: 24px; background: #e2e8f0; border-radius: 12px; transition: all 0.2s ease; flex-shrink: 0; }
.toggle-slider::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.toggle-switch input:checked + .toggle-slider { background: #2563eb; }
.toggle-switch input:checked + .toggle-slider::after { left: 23px; }
.toggle-label-text { font-size: 0.82rem; color: #64748b; font-weight: 500; }
.table-wrap::-webkit-scrollbar { width: 4px; height: 4px; }
.table-wrap::-webkit-scrollbar-track { background: transparent; }
.table-wrap::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
.table-wrap::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
