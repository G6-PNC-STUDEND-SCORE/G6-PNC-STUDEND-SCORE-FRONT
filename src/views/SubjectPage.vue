<template>
  <div class="page-container">
    <!-- ── Toast ── -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast-bar" :class="toast.type">
        <component :is="toastIconComponent" :size="16" />
        <span>{{ toast.message }}</span>
        <button class="toast-close" @click="toast.show = false">&times;</button>
      </div>
    </Transition>

    <!-- ── Store Messages ── -->
    <div v-if="store.error" class="msg msg-error">
      <AlertTriangle :size="16" />
      {{ store.error }}
      <button class="msg-close" @click="store.clearMessages()">&times;</button>
    </div>
    <!-- Success messages are shown via toast popups instead -->


    <!-- ── Loading ── -->
    <div v-if="loading" class="load-state">
      <div class="spinner"></div>
      <span>Loading subjects…</span>
    </div>

    <!-- ── Card (always visible when not loading) ── -->
    <div v-else class="table-wrap">
      <!-- Toolbar - always visible inside card -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              class="search-input"
              placeholder="Search subjects..."
            />
            <button v-if="searchQuery" class="tb-clear" @click="searchQuery = ''; handleSearch()">
              <X :size="14" />
            </button>
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <ToggleLeft :size="16" />
              <span>Status</span>
              <select v-model="statusFilter" @change="handleFilter" class="filter-select">
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>
        </div>
        <div class="toolbar-right">
          <button
            class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold"
            style="border-radius: 0.625rem; background: #2563eb; padding: 0.35rem 0.875rem; font-size: 0.8125rem; flex-shrink: 0;"
            @click="openAddModal"
          >
            <Plus :size="15" />
            Add Subject
          </button>
          <span class="count-badge">
            {{ subjects.length }} subject{{ subjects.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <!-- Bulk Action Bar -->
      <div v-if="selectedIds.length > 0" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} selected</span>
        <button class="bulk-delete-btn" @click="showBulkDeleteModal = true">
          <Trash :size="16" />
          Delete Selected
        </button>
        <button class="bulk-clear-btn" @click="clearSelection">Clear Selection</button>
      </div>

      <!-- ── Empty State (no data) ── -->
      <div v-if="filteredSubjects.length === 0" class="empty-container">
        <div class="empty-box">
          <Inbox :size="40" />
          <h5>No subjects found</h5>
          <p>{{ searchQuery ? 'Try a different search term.' : 'No subjects match the current filter.' }}</p>
        </div>
      </div>

      <!-- ── Table (with data) ── -->
      <div v-else class="tbl-scroll">
        <table class="tbl">
          <thead>
            <tr>
              <th class="col-check">
                <input
                  type="checkbox"
                  class="table-checkbox"
                  :checked="isAllPageSelected"
                  :indeterminate="isIndeterminate"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="col-index">#</th>
              <th class="th-subject">Subject</th>
              <th class="th-teacher">Teacher</th>
              <th class="th-class">Class</th>
              <th class="th-terms">Terms</th>
              <th class="th-status">Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <TransitionGroup name="row" tag="tbody">
            <tr v-for="(subject, index) in paginatedSubjects" :key="subject.id" :class="{ 'row-selected': selectedIds.includes(subject.id) }">
              <td class="col-check" @click.stop>
                <input
                  type="checkbox"
                  class="table-checkbox"
                  :checked="selectedIds.includes(subject.id)"
                  @change="toggleSelectSubject(subject.id)"
                />
              </td>
              <td class="col-index">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <!-- Subject -->
              <td class="td-subject" @click="openEditModal(subject)">
                <div class="subj-avatar" :style="{ background: subjectIconBg(subject.name) }">
                  <BookOpen :size="16" />
                </div>
                <span class="subj-name">{{ subject.name }}</span>
              </td>
              <!-- Teacher -->
              <td class="td-meta" @click="openEditModal(subject)">
                <div v-if="teacherNamesForSubject(subject).length === 0" class="meta-val">—</div>
                <div v-else class="teacher-stack">
                  <span class="meta-val">{{ teacherNamesForSubject(subject).slice(0, 2).join(' & ') }}</span>
                  <span
                    v-if="teacherNamesForSubject(subject).length > 2"
                    class="teacher-more-chip"
                    :title="teacherNamesForSubject(subject).join(', ')"
                  >
                    +{{ teacherNamesForSubject(subject).length - 2 }} more
                  </span>
                </div>
              </td>
              <!-- Class -->
              <td class="td-meta" @click="openEditModal(subject)">
                <div v-if="classNamesForSubject(subject).length === 0" class="meta-val">—</div>
                <div v-else class="teacher-stack">
                  <span class="meta-val">{{ classNamesForSubject(subject).slice(0, 2).join(', ') }}</span>
                  <span
                    v-if="classNamesForSubject(subject).length > 2"
                    class="teacher-more-chip"
                    :title="classNamesForSubject(subject).join(', ')"
                  >
                    +{{ classNamesForSubject(subject).length - 2 }} more
                  </span>
                </div>
              </td>
              <!-- Term Toggles -->
              <td class="td-terms">
                <div class="tog-group" @click.stop>
                  <button
                    v-for="term in terms"
                    :key="term.id"
                    class="tog"
                    :class="{ 'tog-on': subject.term_ids.includes(term.id) }"
                    @click="toggleTerm(subject, term.id)"
                  >
                    <CheckCircle v-if="subject.term_ids.includes(term.id)" :size="14" />
                    <Circle v-else :size="14" />
                    <span>{{ term.name }}</span>
                  </button>
                </div>
              </td>
              <!-- Status -->
              <td class="td-status">
                <span class="pill" :class="(subject.status || '').toLowerCase() === 'active' ? 'pill-on' : 'pill-off'">
                  {{ subject.status }}
                </span>
              </td>
              <!-- Actions -->
              <td class="td-actions">
                <button class="act-btn" @click.stop="openEditModal(subject)" title="Edit">
                  <Pencil :size="15" />
                </button>
                <button class="act-btn act-danger" @click.stop="confirmDelete(subject)" title="Delete">
                  <Trash2 :size="15" />
                </button>
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredSubjects.length > 0" class="pagination-bar">
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

          <template v-for="(page, idx) in visiblePages" :key="'vp-' + idx">
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
          {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredSubjects.length) }} of {{ filteredSubjects.length }}
        </div>
      </div>
    </div>

    <!-- ── Add / Edit Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="overlay" @click.self="closeModal">
          <div class="modal-card">
            <div class="modal-head">
              <div class="modal-icon" :class="isEditMode ? 'icon-edit' : 'icon-add'">
                <SquarePen v-if="isEditMode" :size="20" />
                <CirclePlus v-else :size="20" />
              </div>
              <div>
                <h3>{{ isEditMode ? 'Edit Subject' : 'New Subject' }}</h3>
                <p>{{ isEditMode && store.currentSubject ? `Editing: ${store.currentSubject.name}` : 'Fill in the details to create a new subject.' }}</p>
              </div>
              <button class="modal-x" @click="closeModal">&times;</button>
            </div>
            <form @submit.prevent="handleSubmit" class="modal-body">
              <!-- Name -->
              <div class="field">
                <label>Subject Name <span class="req">*</span></label>
                <input
                  v-model="formData.name"
                  :class="{ err: errors.name }"
                  placeholder="e.g. Web Development"
                  required
                />
                <span v-if="errors.name" class="field-err">{{ errors.name }}</span>
              </div>
              <!-- Teacher (multi-select via checkbox list) -->
              <div class="field">
                <label>Teachers <span class="opt">(optional — pick one or more)</span></label>
                <div v-if="teachers.length" class="teacher-checklist">
                  <label
                    v-for="t in teachers"
                    :key="t.id"
                    class="teacher-check"
                    :class="{ 'teacher-check-on': formData.teacher_ids.includes(t.id) }"
                  >
                    <input
                      type="checkbox"
                      :value="t.id"
                      :checked="formData.teacher_ids.includes(t.id)"
                      @change="toggleFormTeacher(t.id)"
                    />
                    <span class="teacher-check-name">{{ t.name }}</span>
                  </label>
                </div>
                <p v-else class="field-hint">No teachers available yet.</p>
                <p v-if="formData.teacher_ids.length" class="field-hint">
                  {{ formData.teacher_ids.length }} teacher{{ formData.teacher_ids.length > 1 ? 's' : '' }} selected
                </p>
              </div>
              <div class="row-2">
                <!-- Classes (multi-select via checkbox list) -->
                <div class="field">
                  <label>Classes <span class="opt">(optional — pick one or more)</span></label>
                  <div v-if="classes.length" class="teacher-checklist">
                    <label
                      v-for="c in classes"
                      :key="c.id"
                      class="teacher-check"
                      :class="{ 'teacher-check-on': formData.class_ids.includes(c.id) }"
                    >
                      <input
                        type="checkbox"
                        :value="c.id"
                        :checked="formData.class_ids.includes(c.id)"
                        @change="toggleFormClass(c.id)"
                      />
                      <span class="teacher-check-name">{{ c.name }}</span>
                    </label>
                  </div>
                  <p v-else class="field-hint">No classes available yet.</p>
                  <p v-if="formData.class_ids.length" class="field-hint">
                    {{ formData.class_ids.length }} class{{ formData.class_ids.length > 1 ? 'es' : '' }} selected
                  </p>
                </div>
                <!-- Status -->
                <div class="field">
                  <label>Status</label>
                  <select v-model="formData.status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <!-- Term assignment -->
              <div class="field">
                <label>Assign to Terms</label>
                <div class="tog-group tog-form">
                  <button
                    v-for="term in terms"
                    :key="term.id"
                    type="button"
                    class="tog"
                    :class="{ 'tog-on': formData.term_ids.includes(term.id) }"
                    @click="toggleFormTerm(term.id)"
                  >
                    <CheckCircle v-if="formData.term_ids.includes(term.id)" :size="14" />
                    <Circle v-else :size="14" />
                    <span>{{ term.name }}</span>
                  </button>
                </div>
              </div>
              <!-- Footer -->
              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="store.loading">
                  <span v-if="store.loading" class="spinner-sm"></span>
                  {{ isEditMode ? 'Update Subject' : 'Create Subject' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="overlay" @click.self="closeDeleteModal">
          <div class="modal-card modal-sm">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>Delete Subject</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">Are you sure you want to delete <strong>{{ subjectToDelete?.name }}</strong>?</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeDeleteModal">Cancel</button>
              <button class="btn btn-danger" @click="handleDelete" :disabled="store.loading">
                <span v-if="store.loading" class="spinner-sm"></span>
                Delete
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Bulk Delete Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showBulkDeleteModal" class="overlay" @click.self="closeBulkDeleteModal">
          <div class="modal-card modal-sm">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>Delete Subjects</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeBulkDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">Are you sure you want to delete <strong>{{ selectedIds.length }} subject(s)</strong>?</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeBulkDeleteModal">Cancel</button>
              <button class="btn btn-danger" @click="handleBulkDelete" :disabled="store.loading">
                <span v-if="store.loading" class="spinner-sm"></span>
                Delete {{ selectedIds.length }} subject(s)
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch, type Component } from 'vue'
import { useSubjectStore } from '@/stores/subject'
import type { Subject } from '@/services/subjectService'
import { subjectService } from '@/services/subjectService'
import { classService } from '@/services/classService'
import {
  subjectTermService,
  type SubjectWithTerms,
  type TermInfo,
} from '@/services/subjectTermService'
import {
  BookOpen,
  Pencil,
  Trash2,
  Trash,
  Plus,
  AlertTriangle,
  CheckCircle,
  Search,
  ToggleLeft,
  X,
  Inbox,
  Circle,
  SquarePen,
  CirclePlus,
  ChevronLeft,
  ChevronRight,
} from '@lucide/vue'
import { cacheService } from '@/services/cacheService'

const CACHE_KEY = 'subject-terms'

// ─── Pagination ───────────────────────────────────────────────────
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 25, 50]

const totalPages = computed(() => Math.max(1, Math.ceil(filteredSubjects.value.length / pageSize.value)))

const paginatedSubjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredSubjects.value.slice(start, end)
})

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

// ─── Store ─────────────────────────────────────────────────────────
const store = useSubjectStore()
const searchQuery = ref('')
const statusFilter = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Term State ────────────────────────────────────────────────────
const loading = ref(false)
const subjects = ref<SubjectWithTerms[]>([])
const terms = ref<(TermInfo & { term_number?: number })[]>([])
const pendingChanges = reactive<Record<number, number[]>>({})
const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>()

const toast = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
  icon: CheckCircle,
})

const toastIconComponent = computed(() => toast.type === 'success' ? CheckCircle : AlertTriangle)

// ─── CRUD State ────────────────────────────────────────────────────
const teachers = ref<{ id: number; name: string }[]>([])
const classes = ref<{ id: number; name: string }[]>([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const subjectToDelete = ref<Subject | null>(null)

const formData = reactive({
  name: '',
  teacher_ids: [] as number[],
  class_ids: [] as number[],
  status: 'Active' as 'Active' | 'Inactive',
  term_ids: [] as number[],
})

const errors = reactive({ name: '', class_ids: '' })

// ─── Multi-Select & Bulk Delete ────────────────────────────────
const selectedIds = ref<number[]>([])
const showBulkDeleteModal = ref(false)

const isAllPageSelected = computed(() => {
  return paginatedSubjects.value.length > 0 && paginatedSubjects.value.every(s => selectedIds.value.includes(s.id))
})

const isIndeterminate = computed(() => {
  const some = paginatedSubjects.value.some(s => selectedIds.value.includes(s.id))
  return some && !isAllPageSelected.value
})

function toggleSelectAll() {
  if (isAllPageSelected.value) {
    const pageIds = new Set(paginatedSubjects.value.map(s => s.id))
    selectedIds.value = selectedIds.value.filter(id => !pageIds.has(id))
  } else {
    const currentIds = new Set(selectedIds.value)
    paginatedSubjects.value.forEach(s => currentIds.add(s.id))
    selectedIds.value = Array.from(currentIds)
  }
}

function toggleSelectSubject(id: number) {
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

function closeBulkDeleteModal() {
  showBulkDeleteModal.value = false
}

async function handleBulkDelete() {
  if (selectedIds.value.length === 0) return
  const idsToDelete = [...selectedIds.value]
  try {
    const results = await Promise.allSettled(idsToDelete.map(id => store.deleteSubject(id)))
    const allOk = results.every(r => r.status === 'fulfilled')
    if (allOk) {
      store.clearMessages()
      showToast('Subjects deleted successfully')
      // Also remove from local list
      subjects.value = subjects.value.filter(s => !idsToDelete.includes(s.id))
      showBulkDeleteModal.value = false
      clearSelection()
      if (paginatedSubjects.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } else {
      store.clearMessages()
      showToast('Failed to delete some subjects', 'error')
    }
  } catch {
    showToast('Failed to delete subjects', 'error')
  }
}

// ─── Teacher list helpers ──────────────────────────────────────────
function teacherName(t: { id: number; user?: { name?: string | null } | null }): string {
  return t.user?.name || `Teacher #${t.id}`
}

function teacherNamesForSubject(subj: SubjectWithTerms): string[] {
  if (subj.teachers && subj.teachers.length) {
    return subj.teachers.map(teacherName)
  }
  // Fallback to old single teacher shape for compatibility.
  const single = subj.teacher?.user?.name
  return single ? [single] : []
}

function classNamesForSubject(subj: SubjectWithTerms): string[] {
  const classNames: string[] = []
  if (subj.offerings && subj.offerings.length) {
    for (const o of subj.offerings) {
      const name = (o as any).class?.name
      if (name && !classNames.includes(name)) classNames.push(name)
    }
  }
  if (classNames.length === 0 && (subj as any).class?.name) {
    classNames.push((subj as any).class.name)
  }
  return classNames
}

// ─── Computed ──────────────────────────────────────────────────────
const filteredSubjects = computed(() => {
  let r = subjects.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    r = r.filter((s) => s.name.toLowerCase().includes(q))
  }
  if (statusFilter.value) r = r.filter((s) => s.status?.toLowerCase() === statusFilter.value.toLowerCase())
  return r
})  // ─── Helpers ───────────────────────────────────────────────────────
function getSubjectIcon(_name: string): Component {
  return BookOpen
}

function subjectIconBg(_name: string): string {
  return '#2563eb'
}

// ─── Toast ─────────────────────────────────────────────────────────
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.message = msg
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

// ─── Term Actions ──────────────────────────────────────────────────
function toggleTerm(subj: SubjectWithTerms, tid: number) {
  const i = subj.term_ids.indexOf(tid)
  i >= 0 ? subj.term_ids.splice(i, 1) : subj.term_ids.push(tid)
  pendingChanges[subj.id] = [...subj.term_ids]
  debouncedSave(subj.id)
}

function toggleFormTerm(tid: number) {
  const i = formData.term_ids.indexOf(tid)
  i >= 0 ? formData.term_ids.splice(i, 1) : formData.term_ids.push(tid)
}

function toggleFormTeacher(tid: number) {
  const i = formData.teacher_ids.indexOf(tid)
  i >= 0 ? formData.teacher_ids.splice(i, 1) : formData.teacher_ids.push(tid)
}

function toggleFormClass(cid: number) {
  const i = formData.class_ids.indexOf(cid)
  i >= 0 ? formData.class_ids.splice(i, 1) : formData.class_ids.push(cid)
}

function debouncedSave(sid: number) {
  if (debounceTimers.has(sid)) clearTimeout(debounceTimers.get(sid))
  debounceTimers.set(
    sid,
    setTimeout(async () => {
      const ids = pendingChanges[sid]
      if (!ids) return
      try {
        await subjectTermService.syncSubject(sid, ids)
        delete pendingChanges[sid]
      } catch {
        showToast('Auto-save failed. Use Save Changes button.', 'error')
      }
    }, 800)
  )
}

// ─── Reset page on filter change ───────────────────────────────
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
})

// ─── CRUD ──────────────────────────────────────────────────────────
function handleSearch() {
  currentPage.value = 1
}
function handleFilter() {
  currentPage.value = 1
}

function resetForm() {
  formData.name = ''
  formData.teacher_ids = []
  formData.class_ids = []
  formData.status = 'Active'
  formData.term_ids = []
  errors.name = ''
  errors.class_ids = ''
}

function openAddModal() {
  isEditMode.value = false
  resetForm()
  showModal.value = true
}

function openEditModal(s: any) {
  isEditMode.value = true
  store.currentSubject = s
  formData.name = s.name
  formData.teacher_ids =
    Array.isArray(s.teacher_ids) ? [...s.teacher_ids] :
    Array.isArray(s.teachers) ? s.teachers.map((t: { id: number }) => t.id) :
    s.teacher_id ? [s.teacher_id] : []
  // Collect all unique class IDs from offerings (supports multi-class)
  const offeringClassIds = (s.offerings || [])
    .map((o: any) => o.class_id)
    .filter((id: any) => id != null)
  formData.class_ids = offeringClassIds.length
    ? [...new Set(offeringClassIds)]
    : s.class_id ? [s.class_id] : []
  formData.status = s.status
  // Load current term IDs from the subject
  formData.term_ids = Array.isArray(s.term_ids)
    ? [...s.term_ids]
    : Array.isArray(s.terms)
      ? s.terms.map((t: any) => t.id)
      : []
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  // Don't resetForm() here — let openAddModal / openEditModal reset when
  // the modal is shown again.  This avoids resetting before async work
  // that follows closeModal() (e.g. term sync in handleSubmit) reads formData.
}

function validateForm() {
  let v = true
  if (!formData.name.trim()) { errors.name = 'Name is required'; v = false } else errors.name = ''
  errors.class_ids = ''
  return v
}

async function handleSubmit() {
  if (!validateForm()) return
  if (isEditMode.value && store.currentSubject) {
    await store.updateSubject(store.currentSubject.id, {
      name: formData.name,
      class_ids: formData.class_ids,
      status: formData.status,
      teacher_ids: formData.teacher_ids,
    })
    if (!store.error) {
      const updatedTermIds = [...formData.term_ids]
      const updatedSubjectId = store.currentSubject.id
      closeModal(); await store.fetchSubjects(); await loadTermData()
      // Sync terms if changed
      if (updatedTermIds.length || store.currentSubject.term_ids?.length) {
        await subjectTermService.syncSubject(updatedSubjectId, updatedTermIds)
        await loadTermData()
      }
      store.clearMessages()
      showToast('Subject updated successfully')
    }
  } else {
    const newTermIds = [...formData.term_ids]
    await store.createSubject({
      name: formData.name,
      class_ids: formData.class_ids,
      status: formData.status,
      teacher_ids: formData.teacher_ids,
      term_ids: formData.term_ids,
    })
    if (!store.error) {
      closeModal()
      await store.fetchSubjects()
      await loadTermData()
      store.clearMessages()
      showToast('Subject created successfully')
      // Assign terms to the newly created subject if any were picked.
      // (newTermIds was captured BEFORE closeModal so it's not stale.)
      if (newTermIds.length) {
        const subj = subjects.value.find((s: any) => s.name === formData.name)
        if (subj) await subjectTermService.syncSubject(subj.id, newTermIds)
        await loadTermData()
      }
    }
  }
}

function confirmDelete(s: any) { subjectToDelete.value = s; showDeleteModal.value = true }
function closeDeleteModal() { showDeleteModal.value = false; subjectToDelete.value = null }

async function handleDelete() {
  if (!subjectToDelete.value) return
  const targetId = subjectToDelete.value.id
  await store.deleteSubject(targetId)
  if (!store.error) {
    // Also remove from local subjects list (different from store.subjects)
    subjects.value = subjects.value.filter(s => s.id !== targetId)
    closeDeleteModal()
    store.clearMessages()
    showToast('Subject deleted successfully')
  }
}

// ─── Cache helpers ──────────────────────────────────────────────
function applyTermData(data: { subjects: SubjectWithTerms[]; terms: TermInfo[] }) {
  subjects.value = data.subjects
  terms.value = data.terms.map((t, i) => ({ ...t, term_number: i + 1 }))
}

// ─── Data ──────────────────────────────────────────────────────────
async function loadTermData() {
  try {
    const res = await subjectTermService.getAll()
    if (res.success) {
      applyTermData(res.data)
      cacheService.set(CACHE_KEY, res.data, 24 * 60 * 60_000)
    }
  } catch { /* store handles its own errors */ }
}

async function fetchTeachers() {
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
  if (cached) {
    applyTermData(cached)
  } else {
    loading.value = true
  }
  await Promise.all([
    cached ? Promise.resolve() : loadTermData(),
    fetchTeachers(),
    fetchClasses(),
  ])
  loading.value = false
})
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   GLOBAL
   ══════════════════════════════════════════════════════════════ */
.page-container {
  height: calc(100vh - 96px);
  width: calc(100% + 12px);
  margin-top: -6px;
  margin-left: -6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

/* ══════════════════════════════════════════════════════════════
   BUTTONS
   ══════════════════════════════════════════════════════════════ */
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 0.5rem 1.125rem; border-radius: 10px;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  border: none; transition: all 0.2s; font-family: inherit;
  white-space: nowrap;
}
.btn-primary { background: #2563eb; color: #fff; box-shadow: 0 2px 8px rgba(37,99,235,0.2); }
.btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.btn-ghost { background: #f1f5f9; color: #475569; }
.btn-ghost:hover { background: #e2e8f0; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }

.btn-save {
  background: linear-gradient(135deg, #059669, #047857);
  color: #fff; box-shadow: 0 2px 8px rgba(5,150,105,0.25);
  position: relative;
}
.btn-save:hover:not(:disabled) { background: linear-gradient(135deg, #047857, #065f46); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(5,150,105,0.35); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.save-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: #fbbf24; color: #92400e; font-size: 0.7rem; font-weight: 700;
}

/* ══════════════════════════════════════════════════════════════
   MESSAGES
   ══════════════════════════════════════════════════════════════ */
.msg {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px;
  font-size: 0.85rem; font-weight: 500; margin-bottom: 14px;
}
.msg-error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
.msg-success { background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }
.msg-close { margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; opacity: 0.5; padding: 0 4px; }
.msg-close:hover { opacity: 1; }

/* ══════════════════════════════════════════════════════════════
   TOOLBAR (inside card)
   ══════════════════════════════════════════════════════════════ */
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

.tb-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

.tb-clear:hover { color: #64748b; }

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

/* ══════════════════════════════════════════════════════════════
   BULK ACTION BAR
   ══════════════════════════════════════════════════════════════ */
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
  animation: slideDown 0.2s ease-out;
  flex-shrink: 0;
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

/* ══════════════════════════════════════════════════════════════
   LOADING
   ══════════════════════════════════════════════════════════════ */
.load-state {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 4rem; color: #64748b;
}
.spinner {
  width: 30px; height: 30px;
  border: 3px solid #e2e8f0; border-top-color: #3b82f6;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
.spinner-sm { display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; }
.spin { animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════════════════════════
   CARD
   ══════════════════════════════════════════════════════════════ */
.table-wrap {
  background: #fff; border-radius: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  flex: 1;
  height: 1px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  transition: box-shadow 0.25s ease;
}

.table-wrap:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.tbl-scroll {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.tbl-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
.tbl-scroll::-webkit-scrollbar-track { background: transparent; }
.tbl-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
.tbl-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

.tbl { width: 100%; border-collapse: separate; border-spacing: 0; }

.col-check {
  width: 48px;
  text-align: center;
  padding: 12px 8px !important;
}

.tbl thead th.col-check,
.tbl tbody td.col-check {
  text-align: center;
  padding: 12px 8px !important;
  vertical-align: middle;
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
  width: 64px;
  color: #64748b;
}

.row-selected {
  background: #f0f5ff !important;
  border-left-color: #2563eb !important;
}

.tbl thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 10px 14px;
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #64748b;
  background: #f8fafc; border-bottom: 1px solid #e5e7eb;
  text-align: left; white-space: nowrap;
}

.tbl tbody tr { transition: background 0.2s ease, border-left 0.2s ease; border-left: 3px solid transparent; }
.tbl tbody tr:hover { background: #f8fafc; border-left-color: #2563eb; }
.tbl tbody td { padding: 10px 14px; border-bottom: 1px solid #f1f3f5; }
.tbl tbody tr:last-child td { border-bottom: none; }

.th-actions, .td-actions { width: 80px; text-align: center; }
.th-status, .td-status { width: 90px; }
.th-terms { min-width: 280px; }

.td-subject { cursor: pointer; }
.subj-avatar {
  width: 34px; height: 34px;
  border-radius: 10px;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0; margin-right: 8px; vertical-align: middle;
}

.subj-name { font-weight: 600; font-size: 0.9rem; color: #0f172a; }

.td-meta { cursor: pointer; }
.meta-val { font-size: 0.82rem; color: #64748b; }

.tog-group { display: flex; gap: 4px; flex-wrap: wrap; }

.tog {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border: 1.5px solid #e2e8f0; border-radius: 16px;
  background: #fff; color: #94a3b8; font-size: 0.72rem; font-weight: 500;
  cursor: pointer; transition: all 0.2s; font-family: inherit;
}
.tog:hover { border-color: #93c5fd; background: #f8faff; color: #3b82f6; transform: translateY(-1px); }
.tog-on { border-color: #2563eb; background: #eff6ff; color: #2563eb; font-weight: 600; }

.tog-form .tog { padding: 6px 14px; font-size: 0.8rem; gap: 5px; }
.tog-form { gap: 6px; }

.pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.01em;
}
.pill-on { background: #dbeafe; color: #1d4ed8; }
.pill-off { background: #f1f5f9; color: #64748b; }

.td-actions { white-space: nowrap; }
.act-btn {
  background: none; border: none; padding: 5px 6px;
  border-radius: 6px; cursor: pointer; color: #94a3b8;
  transition: all 0.15s;
}
.act-btn:hover { background: #f1f5f9; color: #3b82f6; }
.act-danger:hover { background: #fef2f2; color: #ef4444; }

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

/* ══════════════════════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════════════════════ */
.overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 16px;
}

.modal-card {
  background: #fff; border-radius: 16px; width: 100%; max-width: 520px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  overflow: hidden; animation: modal-in 0.25s ease-out;
}
.modal-sm { max-width: 380px; }
@keyframes modal-in { 0%{opacity:0;transform:scale(0.92)translateY(10px)} 100%{opacity:1;transform:scale(1)translateY(0)} }

.modal-head {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 20px 24px 0; position: relative;
}
.modal-head h3 { font-size: 1.05rem; font-weight: 700; margin: 0 0 2px; }
.modal-head p { font-size: 0.82rem; color: #64748b; margin: 0; }

.modal-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.icon-add { background: #dbeafe; color: #2563eb; }
.icon-edit { background: #fef3c7; color: #d97706; }
.icon-danger { background: #fee2e2; color: #ef4444; }

.modal-x {
  position: absolute; top: 16px; right: 16px;
  background: none; border: none; font-size: 1.5rem;
  color: #94a3b8; cursor: pointer; line-height: 1; padding: 4px;
}
.modal-x:hover { color: #475569; }

.modal-body {
  padding: 20px 24px 16px;
}

.field {
  margin-bottom: 18px;
}
.field:last-of-type {
  margin-bottom: 0;
}
.field label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}
.req {
  color: #ef4444;
  font-weight: 700;
}
.opt {
  color: #94a3b8;
  font-weight: 400;
  font-size: 0.75rem;
}

.field input, .field select {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.88rem;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
  font-family: inherit;
  background: #fff;
  color: #0f172a;
}
.field input::placeholder {
  color: #adb5bd;
}
.field input:hover, .field select:hover {
  border-color: #9ca3af;
}
.field input:focus, .field select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}
.field input.err, .field select.err {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
}
.field-err {
  display: block;
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 4px;
  font-weight: 500;
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* ── Multi-select checkbox list (Teachers / Classes) ── */
.teacher-checklist {
  display: flex; flex-direction: column;
  max-height: 180px; overflow-y: auto;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  background: #fff;
  padding: 6px;
  gap: 2px;
}
.teacher-checklist::-webkit-scrollbar { width: 4px; }
.teacher-checklist::-webkit-scrollbar-track { background: transparent; }
.teacher-checklist::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }

.teacher-check {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  border-left: 3px solid transparent;
  transition: all 0.15s ease;
  margin: 0;
}
.teacher-check:hover {
  background: #f8fafc;
}
.teacher-check-on {
  background: #f0f5ff;
  color: #1d4ed8;
  border-left-color: #2563eb;
}
.teacher-check-on:hover {
  background: #e8effe;
}
.teacher-check input[type="checkbox"] {
  width: 17px;
  height: 17px;
  accent-color: #2563eb;
  cursor: pointer;
  flex-shrink: 0;
  margin: 0;
}
.teacher-check-name {
  flex: 1;
  font-weight: 500;
}
.field-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin: 6px 0 0;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.teacher-stack {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.teacher-more-chip {
  display: inline-flex; align-items: center;
  padding: 1px 8px; border-radius: 10px;
  background: #eff6ff; color: #2563eb;
  font-size: 0.7rem; font-weight: 600;
  cursor: help;
}

.del-text { font-size: 0.9rem; color: #475569; margin: 0; }

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid #f1f5f9;
  margin-top: 4px;
}

/* ══════════════════════════════════════════════════════════════
   TRANSITIONS
   ══════════════════════════════════════════════════════════════ */
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { transform: translateX(100%); opacity: 0; }

.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.25s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateX(-10px); }

.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card, .modal-leave-to .modal-card { transform: scale(0.92) translateY(10px); }

.row-enter-active, .row-leave-active { transition: all 0.3s ease; }
.row-enter-from { opacity: 0; transform: translateX(-20px); }
.row-leave-to { opacity: 0; transform: translateX(20px); }
.row-move { transition: transform 0.3s ease; }

/* ══════════════════════════════════════════════════════════════
   TOAST BAR
   ══════════════════════════════════════════════════════════════ */
.toast-bar {
  position: fixed; top: 20px; right: 20px; z-index: 99999;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-radius: 10px;
  font-size: 0.85rem; font-weight: 500;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15); max-width: 400px;
}
.toast-bar.success { background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }
.toast-bar.error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
.toast-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; opacity: 0.6; margin-left: auto; padding: 0 4px; }
.toast-close:hover { opacity: 1; }

/* ══════════════════════════════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .page-container { padding: 0.75rem 1rem; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .row-2 { grid-template-columns: 1fr; }
  .pagination-bar { flex-direction: column; align-items: center; gap: 8px; }
  .pagination-info { width: 100%; justify-content: center; }
}

/* ══════════════════════════════════════════════════════════════
   PAGINATION
   ══════════════════════════════════════════════════════════════ */
.pagination-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 20px; border-top: 1px solid #e5e7eb;
  background: #fafbfc; font-family: 'Inter','Noto Sans Khmer',sans-serif;
  font-size: 0.8125rem; gap: 12px; flex-wrap: wrap;
  flex-shrink: 0;
  margin-top: auto;
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
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #e2e8f0; background: #fff; color: #64748b;
  border-radius: 6px; cursor: pointer; transition: all 0.15s ease;
}
.page-nav:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; background: #f0f5ff; }
.page-nav:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn {
  min-width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: #475569;
  border-radius: 6px; cursor: pointer; font-size: 0.78rem;
  font-weight: 500; font-family: inherit; transition: all 0.15s ease;
}
.page-btn:hover:not(.active) { background: #f1f5f9; color: #2563eb; }
.page-btn.active { background: #2563eb; color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(37,99,235,0.25); }
.page-dots { width: 24px; text-align: center; color: #94a3b8; font-size: 0.875rem; letter-spacing: 1px; }
.pagination-total { color: #64748b; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }
</style>
