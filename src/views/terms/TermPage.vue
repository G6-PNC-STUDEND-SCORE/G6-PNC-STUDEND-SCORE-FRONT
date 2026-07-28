<template>
  <div class="terms-page">
    <LoadingState v-if="loading && terms.length === 0" message="Loading terms..." />

    <div v-else-if="error" class="d-flex align-items-center gap-2 p-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.875rem;">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <div v-else class="term-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search by name..."
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <CalendarDays :size="16" />
              <span>Academic Year</span>
              <select v-model="filters.academic_year_id" class="filter-select">
                <option :value="null">All</option>
                <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.name }}</option>
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
            Add Term
          </button>
          <span class="count-badge">
            {{ totalTerms }} term{{ totalTerms !== 1 ? 's' : '' }}
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

      <div v-if="filteredTerms.length === 0" class="empty-container">
        <EmptyState
          title="No terms found"
          :message="searchQuery ? 'Try a different search term.' : 'No terms match the current filter.'"
        >
          <template #icon><Inbox :size="24" /></template>
        </EmptyState>
      </div>

      <div v-else class="table-wrap">
        <DataTable
          :columns="columns"
          :data="pagination.paginatedItems.value"
          :row-key="(row) => (row as TermItem).id"
          :row-class="(row) => ({ 'row-selected': selectedIds.includes((row as TermItem).id) })"
          @row-dblclick="(row) => canUpdate && openEditModal(row as TermItem)"
        >
          <template v-if="canDelete" #header-check>
            <div class="col-check" @click.stop @dblclick.stop>
              <input type="checkbox" class="table-checkbox" :checked="isAllPageSelected" :indeterminate="isIndeterminate" @change="toggleSelectAll" />
            </div>
          </template>
          <template v-if="canDelete" #cell-check="{ row }">
            <div class="col-check" @click.stop @dblclick.stop>
              <input type="checkbox" class="table-checkbox" :checked="selectedIds.includes((row as TermItem).id)" @change="toggleSelectTerm((row as TermItem).id)" />
            </div>
          </template>
          <template #cell-index="{ index }">
            <span class="col-index">{{ (pagination.currentPage.value - 1) * pagination.pageSize.value + index + 1 }}</span>
          </template>
          <template #cell-name="{ row }">
            <div class="term-cell">
              <div class="term-avatar" style="background: #059669;">
                <ListOrdered :size="14" />
              </div>
              <span class="term-name">{{ (row as TermItem).name }}</span>
            </div>
          </template>
          <template #cell-number="{ row }">
            <span class="meta-cell">Term {{ (row as TermItem).term_number || '—' }}</span>
          </template>
          <template #cell-year="{ row }">
            <span class="meta-cell">{{ getYearName(row as TermItem) }}</span>
          </template>
          <template #cell-start="{ row }">
            <span class="meta-cell">{{ (row as TermItem).start_date ? formatDate((row as TermItem).start_date!) : '—' }}</span>
          </template>
          <template #cell-end="{ row }">
            <span class="meta-cell">{{ (row as TermItem).end_date ? formatDate((row as TermItem).end_date!) : '—' }}</span>
          </template>
          <template #cell-actions="{ row }">
            <div class="actions-cell" @click.stop @dblclick.stop>
              <button v-if="canUpdate" class="act-btn" @click="openEditModal(row as TermItem)" title="Edit">
                <Pencil :size="15" />
              </button>
              <button v-if="canDelete" class="act-btn act-danger" @click="confirmDelete(row as TermItem)" title="Delete">
                <Trash2 :size="15" />
              </button>
            </div>
          </template>
        </DataTable>
      </div>

      <div v-if="filteredTerms.length > 0" class="pagination-bar">
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
          {{ (pagination.currentPage.value - 1) * pagination.pageSize.value + 1 }}-{{ Math.min(pagination.currentPage.value * pagination.pageSize.value, filteredTerms.length) }} of {{ filteredTerms.length }}
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
          <h3>{{ isEditMode ? 'Edit Term' : 'Add New Term' }}</h3>
          <p>{{ isEditMode ? 'Update term information' : 'Create a new academic term' }}</p>
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
            <label class="form-label"><BookOpen :size="15" class="field-icon" /> Term Name <span class="req">*</span></label>
            <div class="input-wrap">
              <input v-model="formData.name" type="text" class="styled-input" :class="{ err: formError && !formData.name.trim() }" placeholder="e.g. Term 1, Semester 1" required />
            </div>
            <span v-if="formError && !formData.name.trim()" class="field-err">Name is required</span>
          </div>

          <div class="section-divider"></div>

          <div class="row-2">
            <div class="form-group">
              <label class="form-label"><Hash :size="15" class="field-icon" /> Term Number <span class="req">*</span></label>
              <div class="input-wrap">
                <input v-model.number="formData.term_number" type="number" min="1" class="styled-input" :class="{ err: formError && !formData.term_number }" placeholder="e.g. 1" required />
              </div>
              <span v-if="formError && !formData.term_number" class="field-err">Term number is required</span>
            </div>
            <div class="form-group">
              <label class="form-label"><CalendarDays :size="15" class="field-icon" /> Academic Year <span class="req">*</span></label>
              <div class="input-wrap">
                <select v-model.number="formData.academic_year_id" class="styled-input" required>
                  <option :value="null" disabled>— Select —</option>
                  <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.name }}</option>
                </select>
              </div>
              <span v-if="formError && !formData.academic_year_id" class="field-err">Academic year is required</span>
            </div>
          </div>

          <div class="section-divider"></div>

          <div class="row-2">
            <div class="form-group">
              <label class="form-label"><CalendarDays :size="15" class="field-icon" /> Start Date</label>
              <div class="input-wrap"><input v-model="formData.start_date" type="date" class="styled-input" /></div>
            </div>
            <div class="form-group">
              <label class="form-label"><CalendarDays :size="15" class="field-icon" /> End Date</label>
              <div class="input-wrap"><input v-model="formData.end_date" type="date" class="styled-input" /></div>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" @click="closeFormModal">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="formSubmitting">
            <span v-if="formSubmitting" class="spinner-sm"></span>
            <Check v-else :size="16" />
            <span>{{ isEditMode ? 'Save Changes' : 'Create Term' }}</span>
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
  Check, Inbox, Trash, CalendarDays, BookOpen, Hash, ListOrdered,
} from '@lucide/vue'
import { http } from '@/services/apiHttp'
import type { ApiResponse } from '@/types'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import { usePagination } from '@/composables/usePagination'
import { useSearchFilters } from '@/composables/useSearchFilters'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { usePermission } from '@/composables/usePermission'

interface TermItem {
  id: number
  name: string
  term_number?: number
  academic_year_id?: number
  start_date?: string | null
  end_date?: string | null
  academicYear?: { id: number; name: string }
}
interface AcademicYearItem { id: number; name: string; year?: number }

const toast = useToast()
const { confirm } = useConfirm()
const { hasPermission } = usePermission()
const canCreate = computed(() => hasPermission('create-terms'))
const canUpdate = computed(() => hasPermission('update-terms'))
const canDelete = computed(() => hasPermission('delete-terms'))

const loading = ref(false)
const error = ref<string | null>(null)
const terms = ref<TermItem[]>([])
const academicYears = ref<AcademicYearItem[]>([])
const formSubmitting = ref(false)
const formError = ref<string | null>(null)

let resetPage = () => {}
const { searchQuery, filters } = useSearchFilters(
  { academic_year_id: null as number | null },
  () => resetPage()
)

const filteredTerms = computed(() => {
  let list = terms.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(t => (t.name || '').toLowerCase().includes(q))
  }
  if (filters.academic_year_id !== null) {
    list = list.filter(t => t.academic_year_id === filters.academic_year_id)
  }
  return list
})

const totalTerms = computed(() => filteredTerms.value.length)

const pagination = usePagination<TermItem>({
  items: filteredTerms,
  pageSizeOptions: [10, 25, 50],
  initialPageSize: 10,
})
resetPage = pagination.resetPage

const columns = computed(() => [
  ...(canDelete.value ? [{ key: 'check', label: '', width: '48px' }] : []),
  { key: 'index', label: '#', width: '64px' },
  { key: 'name', label: 'Name' },
  { key: 'number', label: 'Term #' },
  { key: 'year', label: 'Academic Year' },
  { key: 'start', label: 'Start Date' },
  { key: 'end', label: 'End Date' },
  { key: 'actions', label: 'Actions', width: '90px' },
])

function getYearName(term: TermItem): string {
  return term.academicYear?.name || '—'
}

const showFormModal = ref(false)
const isEditMode = ref(false)
const editingTerm = ref<TermItem | null>(null)

const initialForm = () => ({
  name: '',
  term_number: 1,
  academic_year_id: null as number | null,
  start_date: '',
  end_date: '',
})
const formData = reactive(initialForm())

function openCreateModal() {
  isEditMode.value = false; editingTerm.value = null
  Object.assign(formData, initialForm()); formError.value = null; showFormModal.value = true
}

function openEditModal(term: TermItem) {
  isEditMode.value = true; editingTerm.value = term
  formData.name = term.name
  formData.term_number = term.term_number || 1
  formData.academic_year_id = term.academic_year_id || null
  formData.start_date = term.start_date || ''
  formData.end_date = term.end_date || ''
  formError.value = null; showFormModal.value = true
}

function closeFormModal() { showFormModal.value = false; editingTerm.value = null }

async function handleSubmit() {
  if (!formData.name.trim()) { formError.value = 'Name is required'; return }
  if (!formData.term_number) { formError.value = 'Term number is required'; return }
  if (!formData.academic_year_id) { formError.value = 'Academic year is required'; return }
  formSubmitting.value = true; formError.value = null
  const payload = { name: formData.name, term_number: formData.term_number, academic_year_id: formData.academic_year_id, start_date: formData.start_date || null, end_date: formData.end_date || null }
  try {
    if (isEditMode.value && editingTerm.value) {
      const res = await http.put<ApiResponse<TermItem>>(`/terms/${editingTerm.value.id}`, payload)
      if (res.data.success) { toast.success('Term updated successfully'); closeFormModal(); await loadData() }
      else { formError.value = res.data.message || 'Failed to update' }
    } else {
      const res = await http.post<ApiResponse<TermItem>>('/terms', payload)
      if (res.data.success) { toast.success('Term created successfully'); closeFormModal(); await loadData() }
      else { formError.value = res.data.message || 'Failed to create' }
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    formError.value = err.response?.data?.message || err.message || 'Operation failed'
  } finally { formSubmitting.value = false }
}

async function confirmDelete(term: TermItem) {
  const ok = await confirm({ title: 'Delete Term', message: `Are you sure you want to delete "${term.name}"? This action cannot be undone.`, confirmLabel: 'Delete', danger: true })
  if (!ok) return
  try {
    const res = await http.delete(`/terms/${term.id}`)
    if (res.data.success) { toast.success('Term deleted successfully'); await loadData() }
    else { toast.error(res.data.message || 'Failed to delete') }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    toast.error(err.response?.data?.message || err.message || 'Failed to delete')
  }
}

const selectedIds = ref<number[]>([])
const isAllPageSelected = computed(() => pagination.paginatedItems.value.length > 0 && pagination.paginatedItems.value.every((t: any) => selectedIds.value.includes(t.id)))
const isIndeterminate = computed(() => { const some = pagination.paginatedItems.value.some((t: any) => selectedIds.value.includes(t.id)); return some && !isAllPageSelected.value })

function toggleSelectAll() {
  if (isAllPageSelected.value) { const pageIds = new Set(pagination.paginatedItems.value.map((t: any) => t.id)); selectedIds.value = selectedIds.value.filter(id => !pageIds.has(id)) }
  else { const currentIds = new Set(selectedIds.value); pagination.paginatedItems.value.forEach((t: any) => currentIds.add(t.id)); selectedIds.value = Array.from(currentIds) }
}
function toggleSelectTerm(id: number) { const idx = selectedIds.value.indexOf(id); idx === -1 ? selectedIds.value.push(id) : selectedIds.value.splice(idx, 1) }
function clearSelection() { selectedIds.value = [] }

async function confirmBulkDelete() {
  const count = selectedIds.value.length
  const ok = await confirm({ title: 'Delete Terms', message: `Are you sure you want to delete ${count} term(s)?`, confirmLabel: `Delete ${count} term(s)`, danger: true })
  if (!ok) return
  const idsToDelete = [...selectedIds.value]
  try {
    const results = await Promise.allSettled(idsToDelete.map(id => http.delete(`/terms/${id}`)))
    const allOk = results.every(r => r.status === 'fulfilled')
    if (allOk) { toast.success(`${idsToDelete.length} term(s) deleted successfully`); clearSelection(); await loadData() }
    else { toast.error('Failed to delete some terms') }
  } catch { toast.error('Failed to delete terms') }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function loadData() {
  loading.value = true; error.value = null
  try {
    const [termsRes, yearsRes] = await Promise.all([
      http.get<ApiResponse<TermItem[]>>('/terms'),
      http.get<ApiResponse<AcademicYearItem[]>>('/academic-years'),
    ])
    if (termsRes.data.success) terms.value = (termsRes.data.data || []) as TermItem[]
    else error.value = termsRes.data.message || 'Failed to load terms'
    if (yearsRes.data.success) academicYears.value = (yearsRes.data.data || []) as AcademicYearItem[]
  } catch { error.value = 'Failed to load data' }
  finally { loading.value = false }
}

onMounted(loadData)
</script>

<style scoped>
.terms-page {
  height: calc(100vh - 96px); width: calc(100% + 12px); margin-top: -6px; margin-left: -6px;
  display: flex; flex-direction: column; overflow: hidden; font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}
.term-card {
  background: #fff; border: 1px solid #e9ecef; border-radius: 16px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); flex: 1; height: 1px;
  display: flex; flex-direction: column; min-height: 0; transition: box-shadow 0.25s ease;
}
.term-card:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
.table-wrap { width: 100%; overflow: auto; flex: 1; min-height: 0; }
.table-wrap :deep(.data-table-wrapper) { border: none; border-radius: 0; box-shadow: none; }
.col-check { text-align: center; }
.table-checkbox { width: 16px; height: 16px; accent-color: #2563eb; cursor: pointer; display: block; margin: 0 auto; }
.col-index { color: #94a3b8; font-weight: 600; }
.actions-cell { text-align: center; white-space: nowrap; }
.term-cell { display: flex; align-items: center; gap: 8px; }
.term-avatar { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; box-shadow: 0 2px 6px rgba(5,150,105,0.25); }
.term-name { font-weight: 600; color: #0f172a; font-size: 0.85rem; }
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
select.styled-input { cursor: pointer; appearance: auto; }
.section-divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 14px 0 16px; }
.error-alert { display: flex; align-items: center; padding: 10px 14px; font-size: 0.8125rem; color: #991b1b; background: #fef2f2; border-radius: 10px; margin-bottom: 16px; border-left: 4px solid #ef4444; }
.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 24px 20px; }
.empty-container { display: flex; align-items: center; justify-content: center; flex: 1; padding: 3rem; }
.table-wrap::-webkit-scrollbar { width: 4px; height: 4px; }
.table-wrap::-webkit-scrollbar-track { background: transparent; }
.table-wrap::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
.table-wrap::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
