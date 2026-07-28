<template>
  <div class="subject-page">
    <LoadingState v-if="loading && subjects.length === 0" message="Loading subjects..." />

    <div v-else-if="store.error" class="d-flex align-items-center gap-2 p-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.875rem;">
      <AlertTriangle :size="16" />
      {{ store.error }}
      <button class="btn-close ms-auto" @click="store.clearMessages()"></button>
    </div>

    <div v-else class="subject-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input v-model="searchQuery" type="text" class="search-input" placeholder="Search by name, teacher, class, or term..." />
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <ToggleLeft :size="16" />
              <span>Status</span>
              <select v-model="filters.status" class="filter-select">
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <CalendarDays :size="16" />
              <span>Term</span>
              <select v-model="filters.term_id" class="filter-select">
                <option :value="null">All</option>
                <option v-for="term in terms" :key="term.id" :value="term.id">{{ term.name }}</option>
              </select>
            </label>
          </div>
        </div>
        <div class="toolbar-right">
          <button v-if="canCreate" class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold" style="border-radius: 0.625rem; background: #2563eb; padding: 0.35rem 0.875rem; font-size: 0.8125rem; flex-shrink: 0;" @click="openAddModal">
            <Plus :size="15" />
            Add Subject
          </button>
          <span class="count-badge">{{ totalSubjects }} subject{{ totalSubjects !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <div v-if="canDelete && selectedIds.length > 0" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} selected</span>
        <button class="bulk-delete-btn" @click="confirmBulkDelete"><Trash :size="16" /> Delete Selected</button>
        <button class="bulk-clear-btn" @click="clearSelection">Clear Selection</button>
      </div>

      <div v-if="filteredSubjects.length === 0" class="empty-container">
        <EmptyState title="No subjects found" :message="searchQuery ? 'Try a different search term.' : 'No subjects match the current filter.'">
          <template #icon><Inbox :size="24" /></template>
        </EmptyState>
      </div>

      <div v-else class="table-wrap">
        <DataTable :columns="columns" :data="pagination.paginatedItems.value" :row-key="(row) => (row as SubjectWithTerms).id" :row-class="(row) => ({ 'row-selected': selectedIds.includes((row as SubjectWithTerms).id) })" @row-dblclick="(row) => canUpdate && openEditModal(row as SubjectWithTerms)">
          <template v-if="canDelete" #header-check>
            <div class="col-check" @click.stop @dblclick.stop>
              <input type="checkbox" class="table-checkbox" :checked="isAllPageSelected" :indeterminate="isIndeterminate" @change="toggleSelectAll" />
            </div>
          </template>
          <template v-if="canDelete" #cell-check="{ row }">
            <div class="col-check" @click.stop @dblclick.stop>
              <input type="checkbox" class="table-checkbox" :checked="selectedIds.includes((row as SubjectWithTerms).id)" @change="toggleSelectSubject((row as SubjectWithTerms).id)" />
            </div>
          </template>
          <template #cell-index="{ index }">
            <span class="col-index">{{ (pagination.currentPage.value - 1) * pagination.pageSize.value + index + 1 }}</span>
          </template>
          <template #cell-name="{ row }">
            <div class="subject-cell" @click="canUpdate && openEditModal(row as SubjectWithTerms)">
              <div class="subj-avatar" style="background: #2563eb;"><BookOpen :size="14" /></div>
              <span class="subj-name">{{ (row as SubjectWithTerms).name }}</span>
            </div>
          </template>
          <template #cell-teacher="{ row }">
            <div v-if="teacherNamesForSubject(row as SubjectWithTerms).length === 0" class="meta-cell">—</div>
            <div v-else class="teacher-stack">
              <span class="meta-cell">{{ teacherNamesForSubject(row as SubjectWithTerms).slice(0, 2).join(' & ') }}</span>
              <span v-if="teacherNamesForSubject(row as SubjectWithTerms).length > 2" class="teacher-more-chip" :title="teacherNamesForSubject(row as SubjectWithTerms).join(', ')">+{{ teacherNamesForSubject(row as SubjectWithTerms).length - 2 }} more</span>
            </div>
          </template>
          <template #cell-class="{ row }">
            <div v-if="classNamesForSubject(row as SubjectWithTerms).length === 0" class="meta-cell">—</div>
            <div v-else class="teacher-stack">
              <span class="meta-cell">{{ classNamesForSubject(row as SubjectWithTerms).slice(0, 2).join(', ') }}</span>
              <span v-if="classNamesForSubject(row as SubjectWithTerms).length > 2" class="teacher-more-chip" :title="classNamesForSubject(row as SubjectWithTerms).join(', ')">+{{ classNamesForSubject(row as SubjectWithTerms).length - 2 }} more</span>
            </div>
          </template>
          <template #cell-terms="{ row }">
            <div class="tog-group" @click.stop>
              <button v-for="term in terms" :key="term.id" v-if="canUpdate" class="tog" :class="{ 'tog-on': (row as SubjectWithTerms).term_ids.includes(term.id) }" @click="toggleTerm(row as SubjectWithTerms, term.id)">
                <CheckCircle v-if="(row as SubjectWithTerms).term_ids.includes(term.id)" :size="14" />
                <Circle v-else :size="14" />
                <span>{{ term.name }}</span>
              </button>
            </div>
          </template>
          <template #cell-status="{ row }">
            <span class="status-badge" :class="((row as SubjectWithTerms).status || '').toLowerCase() === 'active' ? 'badge-active' : 'badge-inactive'">{{ (row as SubjectWithTerms).status }}</span>
          </template>
          <template #cell-actions="{ row }">
            <div class="actions-cell" @click.stop @dblclick.stop>
              <button v-if="canUpdate" class="act-btn" @click="openEditModal(row as SubjectWithTerms)" title="Edit"><Pencil :size="15" /></button>
              <button v-if="canDelete" class="act-btn act-danger" @click="confirmDelete(row as SubjectWithTerms)" title="Delete"><Trash2 :size="15" /></button>
            </div>
          </template>
        </DataTable>
      </div>

      <div v-if="filteredSubjects.length > 0" class="pagination-bar">
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
        <div class="pagination-total">{{ (pagination.currentPage.value - 1) * pagination.pageSize.value + 1 }}-{{ Math.min(pagination.currentPage.value * pagination.pageSize.value, filteredSubjects.length) }} of {{ filteredSubjects.length }}</div>
      </div>
    </div>

    <!-- Form Modal -->
    <Modal v-model="showFormModal" maxWidth="580px">
      <div class="modal-head">
        <div class="modal-icon" :class="isEditMode ? 'icon-edit' : 'icon-create'">
          <SquarePen v-if="isEditMode" :size="18" />
          <Plus v-else :size="18" />
        </div>
        <div>
          <h3>{{ isEditMode ? 'Edit Subject' : 'Add New Subject' }}</h3>
          <p>{{ isEditMode ? `Editing: ${formData.name}` : 'Fill in the details to create a new subject.' }}</p>
        </div>
        <button class="modal-x" @click="closeFormModal">&times;</button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="modal-body-custom">
          <div v-if="formError" class="error-alert"><AlertTriangle :size="16" class="me-2" /> {{ formError }}</div>

          <div class="form-group">
            <label class="form-label"><BookOpen :size="15" class="field-icon" /> Subject Name <span class="req">*</span></label>
            <div class="input-wrap"><input v-model="formData.name" type="text" class="styled-input" :class="{ err: formError && !formData.name.trim() }" placeholder="e.g. Web Development" required /></div>
            <span v-if="formError && !formData.name.trim()" class="field-err">Name is required</span>
          </div>

          <div class="section-divider"></div>

          <div class="row-2 row-2-equal">
            <div class="form-group">
              <label class="form-label"><Users :size="15" class="field-icon" /> Teachers</label>
              <div v-if="teachers.length" class="check-list">
                <label v-for="t in teachers" :key="t.id" class="check-item" :class="{ 'check-item-on': formData.teacher_ids.includes(t.id) }">
                  <input type="checkbox" :value="t.id" :checked="formData.teacher_ids.includes(t.id)" @change="toggleFormTeacher(t.id)" />
                  <span class="check-dot"></span>
                  <span class="check-label">{{ t.name }}</span>
                </label>
              </div>
              <p v-else class="field-hint">No teachers available yet.</p>
              <p v-if="formData.teacher_ids.length" class="field-count">{{ formData.teacher_ids.length }} selected</p>
            </div>
            <div class="form-group">
              <label class="form-label"><Layers :size="15" class="field-icon" /> Classes</label>
              <div v-if="classes.length" class="check-list">
                <label v-for="c in classes" :key="c.id" class="check-item" :class="{ 'check-item-on': formData.class_ids.includes(c.id) }">
                  <input type="checkbox" :value="c.id" :checked="formData.class_ids.includes(c.id)" @change="toggleFormClass(c.id)" />
                  <span class="check-dot"></span>
                  <span class="check-label">{{ c.name }}</span>
                </label>
              </div>
              <p v-else class="field-hint">No classes available yet.</p>
              <p v-if="formData.class_ids.length" class="field-count">{{ formData.class_ids.length }} selected</p>
            </div>
          </div>

          <div class="section-divider"></div>

          <div class="form-group">
            <label class="form-label"><ToggleLeft :size="15" class="field-icon" /> Status</label>
            <div class="input-wrap">
              <select v-model="formData.status" class="styled-input">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="section-divider"></div>

          <div class="form-group">
            <label class="form-label"><CalendarDays :size="15" class="field-icon" /> Assign to Terms</label>
            <div class="term-chips">
              <button v-for="term in terms" :key="term.id" type="button" class="term-chip" :class="{ 'term-chip-on': formData.term_ids.includes(term.id) }" @click="toggleFormTerm(term.id)">
                <CheckCircle v-if="formData.term_ids.includes(term.id)" :size="13" />
                <Circle v-else :size="13" />
                <span>{{ term.name }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn btn-ghost" @click="closeFormModal">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="formSubmitting">
            <span v-if="formSubmitting" class="spinner-sm"></span>
            <Check v-else :size="16" />
            <span>{{ isEditMode ? 'Save Changes' : 'Create Subject' }}</span>
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSubjectStore } from '@/stores/subject'
import { useAuthStore } from '@/stores/auth'
import type { Subject } from '@/services/subjectService'
import { subjectService } from '@/services/subjectService'
import { classService } from '@/services/classService'
import { subjectTermService, type SubjectWithTerms, type TermInfo } from '@/services/subjectTermService'
import {
  BookOpen, Pencil, Trash2, Trash, Plus, AlertTriangle, CheckCircle, Search, ToggleLeft, X,
  Inbox, Circle, SquarePen, ChevronLeft, ChevronRight, Users, Layers, CalendarDays, Check,
} from '@lucide/vue'
import { cacheService } from '@/services/cacheService'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import { usePagination } from '@/composables/usePagination'
import { useSearchFilters } from '@/composables/useSearchFilters'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { usePermission } from '@/composables/usePermission'

const CACHE_KEY = 'subject-terms'
const toast = useToast()
const { confirm } = useConfirm()
const { hasPermission } = usePermission()
const store = useSubjectStore()
const canCreate = computed(() => hasPermission('create-subjects'))
const canUpdate = computed(() => hasPermission('update-subjects'))
const canDelete = computed(() => hasPermission('delete-subjects'))

const loading = ref(false)
const subjects = ref<SubjectWithTerms[]>([])
const terms = ref<(TermInfo & { term_number?: number })[]>([])
const teachers = ref<{ id: number; name: string }[]>([])
const classes = ref<{ id: number; name: string }[]>([])
const formSubmitting = ref(false)
const formError = ref<string | null>(null)
const pendingChanges = reactive<Record<number, number[]>>({})
const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>()

let resetPage = () => {}
const { searchQuery, filters } = useSearchFilters(
  { status: '', term_id: null as number | null },
  () => resetPage()
)

const filteredSubjects = computed(() => {
  let r = subjects.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    r = r.filter(s => {
      const name = (s.name || '').toLowerCase()
      const teachersStr = teacherNamesForSubject(s).join(' ').toLowerCase()
      const classesStr = classNamesForSubject(s).join(' ').toLowerCase()
      const termNames = (s.terms || []).map(t => t.name).join(' ').toLowerCase()
      return name.includes(q) || teachersStr.includes(q) || classesStr.includes(q) || termNames.includes(q)
    })
  }
  if (filters.status) r = r.filter(s => s.status?.toLowerCase() === filters.status.toLowerCase())
  if (filters.term_id !== null) r = r.filter(s => s.term_ids.includes(filters.term_id as number))
  return r
})

const totalSubjects = computed(() => filteredSubjects.value.length)

const pagination = usePagination<SubjectWithTerms>({
  items: filteredSubjects,
  pageSizeOptions: [10, 25, 50],
  initialPageSize: 10,
})
resetPage = pagination.resetPage

const columns = computed(() => [
  ...(canDelete.value ? [{ key: 'check', label: '', width: '48px' }] : []),
  { key: 'index', label: '#', width: '64px' },
  { key: 'name', label: 'Subject' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'class', label: 'Class' },
  { key: 'terms', label: 'Terms' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', width: '90px' },
])

function teacherName(t: { id: number; user?: { name?: string | null } | null }): string {
  return t.user?.name || `Teacher #${t.id}`
}
function teacherNamesForSubject(subj: SubjectWithTerms): string[] {
  if (subj.teachers && subj.teachers.length) return subj.teachers.map(teacherName)
  const single = subj.teacher?.user?.name
  return single ? [single] : []
}
function classNamesForSubject(subj: SubjectWithTerms): string[] {
  const names: string[] = []
  if (subj.offerings && subj.offerings.length) {
    for (const o of subj.offerings) {
      const name = (o as any).class?.name
      if (name && !names.includes(name)) names.push(name)
    }
  }
  if (names.length === 0 && (subj as any).class?.name) names.push((subj as any).class.name)
  return names
}

const showFormModal = ref(false)
const isEditMode = ref(false)
const editingSubject = ref<SubjectWithTerms | null>(null)

const formData = reactive({
  name: '',
  teacher_ids: [] as number[],
  class_ids: [] as number[],
  status: 'Active' as 'Active' | 'Inactive',
  term_ids: [] as number[],
})

function resetForm() {
  formData.name = ''; formData.teacher_ids = []; formData.class_ids = []; formData.status = 'Active'; formData.term_ids = []
}
function openAddModal() { isEditMode.value = false; editingSubject.value = null; resetForm(); formError.value = null; showFormModal.value = true }
function openEditModal(s: SubjectWithTerms) {
  isEditMode.value = true; editingSubject.value = s
  formData.name = s.name
  formData.teacher_ids = Array.isArray(s.teacher_ids) ? [...s.teacher_ids] : Array.isArray(s.teachers) ? s.teachers.map((t: { id: number }) => t.id) : []
  const offeringClassIds = (s.offerings || []).map((o: any) => o.class_id).filter((id: any) => id != null)
  formData.class_ids = offeringClassIds.length ? [...new Set(offeringClassIds)] : []
  formData.status = typeof s.status === 'string' && s.status.toLowerCase() === 'active' ? 'Active' : 'Inactive'
  formData.term_ids = Array.isArray(s.term_ids) ? [...s.term_ids] : Array.isArray(s.terms) ? s.terms.map((t: any) => t.id) : []
  formError.value = null; showFormModal.value = true
}
function closeFormModal() { showFormModal.value = false; editingSubject.value = null }

function toggleFormTerm(tid: number) { const i = formData.term_ids.indexOf(tid); i >= 0 ? formData.term_ids.splice(i, 1) : formData.term_ids.push(tid) }
function toggleFormTeacher(tid: number) { const i = formData.teacher_ids.indexOf(tid); i >= 0 ? formData.teacher_ids.splice(i, 1) : formData.teacher_ids.push(tid) }
function toggleFormClass(cid: number) { const i = formData.class_ids.indexOf(cid); i >= 0 ? formData.class_ids.splice(i, 1) : formData.class_ids.push(cid) }

async function handleSubmit() {
  if (!formData.name.trim()) { formError.value = 'Subject name is required'; return }
  formSubmitting.value = true; formError.value = null
  const newTermIds = [...formData.term_ids]
  try {
    if (isEditMode.value && editingSubject.value) {
      await store.updateSubject(editingSubject.value.id, { name: formData.name, class_ids: formData.class_ids, status: formData.status, teacher_ids: formData.teacher_ids })
      if (!store.error) {
        toast.success('Subject updated successfully')
        closeFormModal(); await loadTermData()
        if (newTermIds.length || editingSubject.value.term_ids?.length) {
          await subjectTermService.syncSubject(editingSubject.value.id, newTermIds)
          await loadTermData()
        }
      } else { formError.value = store.error }
    } else {
      await store.createSubject({ name: formData.name, class_ids: formData.class_ids, status: formData.status, teacher_ids: formData.teacher_ids, term_ids: formData.term_ids })
      if (!store.error) {
        toast.success('Subject created successfully')
        closeFormModal(); await loadTermData()
        if (newTermIds.length) {
          const subj = subjects.value.find((s: any) => s.name === formData.name)
          if (subj) await subjectTermService.syncSubject(subj.id, newTermIds)
          await loadTermData()
        }
      } else { formError.value = store.error }
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    formError.value = err.response?.data?.message || err.message || 'Operation failed'
  } finally { formSubmitting.value = false; store.clearMessages() }
}

function toggleTerm(subj: SubjectWithTerms, tid: number) {
  const i = subj.term_ids.indexOf(tid)
  i >= 0 ? subj.term_ids.splice(i, 1) : subj.term_ids.push(tid)
  pendingChanges[subj.id] = [...subj.term_ids]
  debouncedSave(subj.id)
}
function debouncedSave(sid: number) {
  if (debounceTimers.has(sid)) clearTimeout(debounceTimers.get(sid))
  debounceTimers.set(sid, setTimeout(async () => {
    const ids = pendingChanges[sid]
    if (!ids) return
    try {
      await subjectTermService.syncSubject(sid, ids)
      delete pendingChanges[sid]
    } catch (err: any) {
      delete pendingChanges[sid]
      if (err?.response?.status === 404) {
        subjects.value = subjects.value.filter(s => s.id !== sid)
        cacheService.remove(CACHE_KEY)
        toast.error('This subject no longer exists — it has been removed from the list.')
        return
      }
      await loadTermData()
      toast.error('Auto-save failed. Please try toggling the term again.')
    }
  }, 800))
}

async function confirmDelete(subj: SubjectWithTerms) {
  const ok = await confirm({ title: 'Delete Subject', message: `Are you sure you want to delete "${subj.name}"? This action cannot be undone.`, confirmLabel: 'Delete', danger: true })
  if (!ok) return
  const targetId = subj.id
  await store.deleteSubject(targetId)
  if (!store.error) {
    subjects.value = subjects.value.filter(s => s.id !== targetId)
    toast.success('Subject deleted successfully')
  } else { toast.error(store.error || 'Failed to delete') }
}

const selectedIds = ref<number[]>([])
const isAllPageSelected = computed(() => pagination.paginatedItems.value.length > 0 && pagination.paginatedItems.value.every((s: any) => selectedIds.value.includes(s.id)))
const isIndeterminate = computed(() => { const some = pagination.paginatedItems.value.some((s: any) => selectedIds.value.includes(s.id)); return some && !isAllPageSelected.value })

function toggleSelectAll() {
  if (isAllPageSelected.value) { const pageIds = new Set(pagination.paginatedItems.value.map((s: any) => s.id)); selectedIds.value = selectedIds.value.filter(id => !pageIds.has(id)) }
  else { const currentIds = new Set(selectedIds.value); pagination.paginatedItems.value.forEach((s: any) => currentIds.add(s.id)); selectedIds.value = Array.from(currentIds) }
}
function toggleSelectSubject(id: number) { const idx = selectedIds.value.indexOf(id); idx === -1 ? selectedIds.value.push(id) : selectedIds.value.splice(idx, 1) }
function clearSelection() { selectedIds.value = [] }

async function confirmBulkDelete() {
  const count = selectedIds.value.length
  const ok = await confirm({ title: 'Delete Subjects', message: `Are you sure you want to delete ${count} subject(s)?`, confirmLabel: `Delete ${count} subject(s)`, danger: true })
  if (!ok) return
  const idsToDelete = [...selectedIds.value]
  try {
    const results = await Promise.allSettled(idsToDelete.map(id => store.deleteSubject(id)))
    const allOk = results.every(r => r.status === 'fulfilled')
    if (allOk) {
      toast.success(`${idsToDelete.length} subject(s) deleted successfully`)
      subjects.value = subjects.value.filter(s => !idsToDelete.includes(s.id))
      clearSelection()
    } else { toast.error('Failed to delete some subjects') }
  } catch { toast.error('Failed to delete subjects') }
}

function applyTermData(data: { subjects: SubjectWithTerms[]; terms: TermInfo[] }) {
  subjects.value = data.subjects
  terms.value = data.terms.map((t, i) => ({ ...t, term_number: i + 1 }))
}

async function loadTermData() {
  try {
    const res = await subjectTermService.getAll()
    if (res.success) { applyTermData(res.data); cacheService.set(CACHE_KEY, res.data, 24 * 60 * 60_000) }
  } catch { /* ignore */ }
}

async function fetchTeachers() {
  if (!hasPermission('view-teachers')) { teachers.value = []; return }
  try {
    const r = await subjectService.getTeachers()
    if (r.success) teachers.value = (r.data as { id: number; name: string }[]) || []
  } catch { teachers.value = [] }
}

async function fetchClasses() {
  try {
    const r = await classService.getClasses()
    if (r.success) classes.value = Array.isArray(r.data) ? r.data : []
  } catch { classes.value = [] }
}

onMounted(async () => {
  const cached = cacheService.get<{ subjects: SubjectWithTerms[]; terms: TermInfo[] }>(CACHE_KEY)
  if (cached) applyTermData(cached)
  else loading.value = true
  await Promise.all([loadTermData(), fetchTeachers(), fetchClasses()])
  loading.value = false
})
</script>

<style scoped>
.subject-page {
  height: calc(100vh - 96px); width: calc(100% + 12px); margin-top: -6px; margin-left: -6px;
  display: flex; flex-direction: column; overflow: hidden; font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}
.subject-card {
  background: #fff; border: 1px solid #e9ecef; border-radius: 16px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); flex: 1; height: 1px;
  display: flex; flex-direction: column; min-height: 0; transition: box-shadow 0.25s ease;
}
.subject-card:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
.table-wrap { width: 100%; overflow: auto; flex: 1; min-height: 0; }
.table-wrap :deep(.data-table-wrapper) { border: none; border-radius: 0; box-shadow: none; }
.col-check { text-align: center; }
.table-checkbox { width: 16px; height: 16px; accent-color: #2563eb; cursor: pointer; display: block; margin: 0 auto; }
.col-index { color: #94a3b8; font-weight: 600; }
.actions-cell { text-align: center; white-space: nowrap; }
.subject-cell { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.subj-avatar { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; box-shadow: 0 2px 6px rgba(37,99,235,0.25); }
.subj-name { font-weight: 600; color: #0f172a; font-size: 0.85rem; }
.meta-cell { font-size: 0.8125rem; color: #64748b; }
.teacher-stack { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.teacher-more-chip { display: inline-flex; align-items: center; padding: 1px 8px; border-radius: 10px; background: #eff6ff; color: #2563eb; font-size: 0.7rem; font-weight: 600; cursor: help; }
.tog-group { display: flex; gap: 4px; flex-wrap: wrap; }
.tog { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border: 1.5px solid #e2e8f0; border-radius: 16px; background: #fff; color: #94a3b8; font-size: 0.72rem; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.tog:hover { border-color: #93c5fd; background: #f8faff; color: #3b82f6; }
.tog-on { border-color: #2563eb; background: #eff6ff; color: #2563eb; font-weight: 600; }
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
.row-2-equal > * { min-width: 0; }
.modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 24px 20px; }
.empty-container { display: flex; align-items: center; justify-content: center; flex: 1; padding: 3rem; }
.term-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.term-chip { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border: 1.5px solid #e2e8f0; border-radius: 20px; background: #fff; color: #94a3b8; font-size: 0.78rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; font-family: inherit; }
.term-chip:hover { border-color: #93c5fd; background: #f8faff; color: #3b82f6; }
.term-chip-on { border-color: #2563eb; background: #eff6ff; color: #2563eb; font-weight: 600; box-shadow: 0 1px 3px rgba(37,99,235,0.1); }
.check-list { display: flex; flex-direction: column; max-height: 160px; overflow-y: auto; border: 1.5px solid #e2e8f0; border-radius: 10px; background: #fff; padding: 4px; gap: 1px; }
.check-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 7px; cursor: pointer; font-size: 0.82rem; font-weight: 500; color: #475569; transition: all 0.15s ease; margin: 0; position: relative; }
.check-item:hover { background: #f8fafc; }
.check-item-on { background: #f0f5ff; color: #1d4ed8; }
.check-item input[type="checkbox"] { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
.check-dot { width: 16px; height: 16px; border-radius: 4px; border: 2px solid #cbd5e1; flex-shrink: 0; transition: all 0.18s ease; display: flex; align-items: center; justify-content: center; background: #fff; }
.check-item-on .check-dot { background: #2563eb; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.15); }
.check-dot::after { content: ''; display: none; width: 5px; height: 9px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg) translateY(-1px); }
.check-item-on .check-dot::after { display: block; }
.check-label { flex: 1; }
.field-hint { font-size: 0.75rem; color: #94a3b8; margin: 6px 0 0; font-weight: 500; font-style: italic; }
.field-count { font-size: 0.72rem; color: #2563eb; margin: 5px 0 0; font-weight: 600; }
.table-wrap::-webkit-scrollbar { width: 4px; height: 4px; }
.table-wrap::-webkit-scrollbar-track { background: transparent; }
.table-wrap::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
.table-wrap::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
