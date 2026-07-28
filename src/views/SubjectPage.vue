<template>
  <div class="page-container">
    <div v-if="store.error" class="msg msg-error">
      <AlertTriangle :size="16" />
      {{ store.error }}
      <button class="msg-close" @click="store.clearMessages()">&times;</button>
    </div>


    <div v-if="loading" class="load-state">
      <div class="spinner"></div>
      <span>{{ t('subjects.loading') }}</span>
    </div>

    <div v-else class="subject-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              class="search-input"
              :placeholder="t('subjects.searchPlaceholder')"
            />
            <button v-if="searchQuery" class="tb-clear" @click="searchQuery = ''; handleSearch()">
              <X :size="14" />
            </button>
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <ToggleLeft :size="16" />
              <span>{{ t('subjects.status') }}</span>
              <select v-model="statusFilter" @change="handleFilter" class="filter-select">
                <option value="">{{ t('app.all') }}</option>
                <option value="Active">{{ t('subjects.active') }}</option>
                <option value="Inactive">{{ t('subjects.inactive') }}</option>
              </select>
            </label>
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <CalendarDays :size="16" />
              <span>{{ t('subjects.terms') }}</span>
              <select v-model="termFilter" @change="handleFilter" class="filter-select">
                <option value="">{{ t('app.all') }}</option>
                <option v-for="term in terms" :key="term.id" :value="term.id">{{ term.name }}</option>
              </select>
            </label>
          </div>
        </div>
        <div class="toolbar-right">
          <button
            v-if="canCreate"
            class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold"
            style="border-radius: 0.625rem; background: #2563eb; padding: 0.35rem 0.875rem; font-size: 0.8125rem; flex-shrink: 0;"
            @click="openAddModal"
          >
            <Plus :size="15" />
            {{ t('subjects.addSubject') }}
          </button>
          <span class="count-badge">
            {{ filteredSubjects.length }} / {{ subjects.length }} {{ t('subjects.subject').toLowerCase() }}{{ subjects.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <div v-if="canDelete && selectedIds.length > 0" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} {{ t('app.selected') }}</span>
        <button class="bulk-delete-btn" @click="showBulkDeleteModal = true">
          <Trash :size="16" />
          {{ t('app.deleteSelected') }}
        </button>
        <button class="bulk-clear-btn" @click="clearSelection">{{ t('app.clearSelection') }}</button>
      </div>

      <div v-if="filteredSubjects.length === 0" class="empty-container">
        <div class="empty-box">
          <Inbox :size="40" />
          <h5>{{ t('subjects.noSubjects') }}</h5>
          <p>{{ searchQuery ? t('app.tryDifferentSearch') : t('app.noMatchFilter') }}</p>
        </div>
      </div>

      <div v-else class="table-wrap">
        <table class="subject-table data-table-base">
          <thead>
            <tr>
              <th v-if="canDelete" class="col-check">
                <input
                  type="checkbox"
                  class="table-checkbox"
                  :checked="isAllPageSelected"
                  :indeterminate="isIndeterminate"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="col-index">#</th>
              <th class="th-subject">{{ t('subjects.subject') }}</th>
              <th class="th-teacher">{{ t('subjects.teacher') }}</th>
              <th class="th-class">{{ t('subjects.class') }}</th>
              <th class="th-terms">{{ t('subjects.terms') }}</th>
              <th class="th-status">{{ t('subjects.status') }}</th>
              <th class="th-actions">{{ t('subjects.actions') }}</th>
            </tr>
          </thead>
          <TransitionGroup name="row" tag="tbody">
            <tr v-for="(subject, index) in paginatedSubjects" :key="subject.id" :class="['data-row', { 'row-selected': selectedIds.includes(subject.id) }]">
              <td v-if="canDelete" class="col-check" @click.stop>
                <input
                  type="checkbox"
                  class="table-checkbox"
                  :checked="selectedIds.includes(subject.id)"
                  @change="toggleSelectSubject(subject.id)"
                />
              </td>
              <td class="col-index">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td class="td-subject" @click="canUpdate && openEditModal(subject)">
                <div class="subj-avatar" :style="{ background: subjectIconBg(subject.name) }">
                  <BookOpen :size="14" />
                </div>
                <span class="subj-name">{{ subject.name }}</span>
              </td>
              <td class="td-meta" @click="canUpdate && openEditModal(subject)">
                <div v-if="teacherNamesForSubject(subject).length === 0" class="meta-val">—</div>
                <div v-else class="teacher-stack">
                  <span class="meta-val">{{ teacherNamesForSubject(subject).slice(0, 2).join(' & ') }}</span>
                  <span
                    v-if="teacherNamesForSubject(subject).length > 2"
                    class="teacher-more-chip"
                    :title="teacherNamesForSubject(subject).join(', ')"
                  >
                    +{{ teacherNamesForSubject(subject).length - 2 }} {{ t('subjects.moreTeachers') }}
                  </span>
                </div>
              </td>
              <td class="td-meta" @click="canUpdate && openEditModal(subject)">
                <div v-if="classNamesForSubject(subject).length === 0" class="meta-val">—</div>
                <div v-else class="teacher-stack">
                  <span class="meta-val">{{ classNamesForSubject(subject).slice(0, 2).join(', ') }}</span>
                  <span
                    v-if="classNamesForSubject(subject).length > 2"
                    class="teacher-more-chip"
                    :title="classNamesForSubject(subject).join(', ')"
                  >
                    +{{ classNamesForSubject(subject).length - 2 }} {{ t('subjects.moreClasses') }}
                  </span>
                </div>
              </td>
              <td class="td-terms">
                <div class="tog-group" @click.stop>
                  <button
                    v-for="term in terms"
                    :key="term.id"
                    v-if="canUpdate"
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
              <td class="td-status">
                <span class="status-badge" :class="(subject.status || '').toLowerCase() === 'active' ? 'badge-active' : 'badge-inactive'">
                  {{ subject.status }}
                </span>
              </td>
              <td class="td-actions">
                <button v-if="canUpdate" class="act-btn" @click.stop="openEditModal(subject)" :title="t('common.edit')">
                  <Pencil :size="15" />
                </button>
                <button v-if="canDelete" class="act-btn act-danger" @click.stop="confirmDelete(subject)" :title="t('common.delete')">
                  <Trash2 :size="15" />
                </button>
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>

      <div v-if="filteredSubjects.length > 0" class="pagination-bar">
        <div class="pagination-info">
          <span class="rows-label">{{ t('pagination.rowsPerPage') }}</span>
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
            :aria-label="t('pagination.previous')"
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
            :aria-label="t('pagination.next')"
          >
            <ChevronRight :size="16" />
          </button>
        </div>

        <div class="pagination-total">
          {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredSubjects.length) }} {{ t('app.of') }} {{ filteredSubjects.length }}
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="overlay" @click.self="closeModal">
          <div class="modal-card modal-card-wide">
            <div class="modal-head">
              <div class="modal-icon" :class="isEditMode ? 'icon-edit' : 'icon-add'">
                <SquarePen v-if="isEditMode" :size="20" />
                <CirclePlus v-else :size="20" />
              </div>
              <div>
                <h3>{{ isEditMode ? t('subjects.editSubject') : t('subjects.newSubject') }}</h3>
                <p>{{ isEditMode && store.currentSubject ? `${t('subjects.editSubject')}: ${store.currentSubject.name}` : t('subjects.newSubjectDesc') }}</p>
              </div>
              <button class="modal-x" @click="closeModal">&times;</button>
            </div>
            <form @submit.prevent="handleSubmit" class="modal-body">
              <div class="field">
                <label>
                  <BookOpen :size="15" class="field-icon" />
                  {{ t('subjects.subjectNameLabel') }} <span class="req">*</span>
                </label>
                <div class="input-wrap">
                  <input
                    v-model="formData.name"
                    :class="{ err: errors.name }"
                    :placeholder="t('subjects.namePlaceholder')"
                    required
                  />
                </div>
                <span v-if="errors.name" class="field-err">{{ errors.name }}</span>
              </div>

              <div class="section-divider"></div>

              <div class="row-2 row-2-equal">
                <div class="field">
                  <label>
                    <Users :size="15" class="field-icon" />
                    {{ t('subjects.teachersLabel') }}
                  </label>
                  <div v-if="teachers.length" class="check-list">
                    <label
                      v-for="tchr in teachers"
                      :key="tchr.id"
                      class="check-item"
                      :class="{ 'check-item-on': formData.teacher_ids.includes(tchr.id) }"
                    >
                      <input
                        type="checkbox"
                        :value="tchr.id"
                        :checked="formData.teacher_ids.includes(tchr.id)"
                        @change="toggleFormTeacher(tchr.id)"
                      />
                      <span class="check-dot"></span>
                      <span class="check-label">{{ tchr.name }}</span>
                    </label>
                  </div>
                  <p v-else class="field-hint">{{ t('subjects.noTeachers') }}</p>
                  <p v-if="formData.teacher_ids.length" class="field-count">
                    {{ formData.teacher_ids.length }} {{ t('app.selected') }}
                  </p>
                </div>
                <div class="field">
                  <label>
                    <Layers :size="15" class="field-icon" />
                    {{ t('subjects.classesLabel') }}
                  </label>
                  <div v-if="classes.length" class="check-list">
                    <label
                      v-for="c in classes"
                      :key="c.id"
                      class="check-item"
                      :class="{ 'check-item-on': formData.class_ids.includes(c.id) }"
                    >
                      <input
                        type="checkbox"
                        :value="c.id"
                        :checked="formData.class_ids.includes(c.id)"
                        @change="toggleFormClass(c.id)"
                      />
                      <span class="check-dot"></span>
                      <span class="check-label">{{ c.name }}</span>
                    </label>
                  </div>
                  <p v-else class="field-hint">{{ t('subjects.noClasses') }}</p>
                  <p v-if="formData.class_ids.length" class="field-count">
                    {{ formData.class_ids.length }} {{ t('app.selected') }}
                  </p>
                </div>
              </div>

              <div class="section-divider"></div>

              <div class="field">
                <label>
                  <ToggleLeft :size="15" class="field-icon" />
                  {{ t('subjects.statusLabel') }}
                </label>
                <div class="input-wrap">
                  <select v-model="formData.status" class="modern-input">
                    <option value="Active">{{ t('subjects.active') }}</option>
                    <option value="Inactive">{{ t('subjects.inactive') }}</option>
                  </select>
                </div>
              </div>

              <div class="section-divider"></div>

              <div class="field">
                <label>
                  <CalendarDays :size="15" class="field-icon" />
                  {{ t('subjects.assignTerms') }}
                </label>
                <div class="term-chips">
                  <button
                    v-for="term in terms"
                    :key="term.id"
                    type="button"
                    class="term-chip"
                    :class="{ 'term-chip-on': formData.term_ids.includes(term.id) }"
                    @click="toggleFormTerm(term.id)"
                  >
                    <span class="chip-icon-wrap">
                      <CheckCircle v-if="formData.term_ids.includes(term.id)" :size="13" />
                      <Circle v-else :size="13" />
                    </span>
                    <span>{{ term.name }}</span>
                  </button>
                </div>
              </div>

              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="closeModal">{{ t('common.cancel') }}</button>
                <button type="submit" class="btn btn-primary" :disabled="store.loading">
                  <span v-if="store.loading" class="spinner-sm"></span>
                  <Check v-else :size="16" />
                  {{ isEditMode ? t('subjects.saveChanges') : t('subjects.createSubject') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="overlay" @click.self="closeDeleteModal">
          <div class="modal-card modal-sm">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>{{ t('subjects.deleteSubject') }}</h3>
                <p>{{ t('subjects.cannotUndo') }}</p>
              </div>
              <button class="modal-x" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">{{ t('subjects.confirmDelete') }} <strong>{{ subjectToDelete?.name }}</strong>?</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeDeleteModal">{{ t('common.cancel') }}</button>
              <button class="btn btn-danger" @click="handleDelete" :disabled="store.loading">
                <span v-if="store.loading" class="spinner-sm"></span>
                {{ t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showBulkDeleteModal" class="overlay" @click.self="closeBulkDeleteModal">
          <div class="modal-card modal-sm">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>{{ t('subjects.deleteSubjects') }}</h3>
                <p>{{ t('subjects.cannotUndo') }}</p>
              </div>
              <button class="modal-x" @click="closeBulkDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">{{ t('subjects.confirmDelete') }} <strong>{{ selectedIds.length }} {{ t('subjects.subject').toLowerCase() }}(s)</strong>?</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeBulkDeleteModal">{{ t('common.cancel') }}</button>
              <button class="btn btn-danger" @click="handleBulkDelete" :disabled="store.loading">
                <span v-if="store.loading" class="spinner-sm"></span>
                {{ t('common.delete') }} {{ selectedIds.length }} {{ t('subjects.subject').toLowerCase() }}(s)
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSubjectStore } from '@/stores/subject'
import { useAuthStore } from '@/stores/auth'
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
  Users,
  Layers,
  CalendarDays,
  Check,
} from '@lucide/vue'
import { cacheService } from '@/services/cacheService'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const { success: toastSuccess, error: toastError } = useToast()

const CACHE_KEY = 'subject-terms'

const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 25, 50, 75, 100]

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

const store = useSubjectStore()
const auth = useAuthStore()

const canCreate = computed(() => auth.hasPermission('create-subjects'))
const canUpdate = computed(() => auth.hasPermission('update-subjects'))
const canDelete = computed(() => auth.hasPermission('delete-subjects'))

const searchQuery = ref('')
const statusFilter = ref('')
const termFilter = ref<number | ''>('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const loading = ref(false)
const subjects = ref<SubjectWithTerms[]>([])
const terms = ref<(TermInfo & { term_number?: number })[]>([])
const pendingChanges = reactive<Record<number, number[]>>({})
const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>()

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
      globalShowToast(t('subjects.deletedBulkSuccess'))
      subjects.value = subjects.value.filter(s => !idsToDelete.includes(s.id))
      showBulkDeleteModal.value = false
      clearSelection()
      if (paginatedSubjects.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } else {
      store.clearMessages()
      globalShowToast(t('subjects.deleteFailed'), 'error')
    }
  } catch {
    globalShowToast(t('subjects.deleteFailed'), 'error')
  }
}

function teacherName(tchr: { id: number; user?: { name?: string | null } | null }): string {
  return tchr.user?.name || `Teacher #${tchr.id}`
}

function teacherNamesForSubject(subj: SubjectWithTerms): string[] {
  if (subj.teachers && subj.teachers.length) {
    return subj.teachers.map(teacherName)
  }
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

const filteredSubjects = computed(() => {
  let r = subjects.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    r = r.filter((s) => {
      const name = (s.name || '').toLowerCase()
      const teachers = teacherNamesForSubject(s).join(' ').toLowerCase()
      const classes = classNamesForSubject(s).join(' ').toLowerCase()
      const termNames = (s.terms || []).map(t => t.name).join(' ').toLowerCase()
      return name.includes(q) || teachers.includes(q) || classes.includes(q) || termNames.includes(q)
    })
  }
  if (statusFilter.value) r = r.filter((s) => s.status?.toLowerCase() === statusFilter.value.toLowerCase())
  if (termFilter.value !== '') r = r.filter((s) => s.term_ids.includes(termFilter.value as number))
  return r
})

function subjectIconBg(_name: string): string {
  return '#2563eb'
}

function globalShowToast(msg: string, type: 'success' | 'error' = 'success') {
  type === 'error' ? toastError(msg) : toastSuccess(msg)
}

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
      } catch (err: any) {
        delete pendingChanges[sid]
        if (err?.response?.status === 404) {
          subjects.value = subjects.value.filter(s => s.id !== sid)
          cacheService.remove(CACHE_KEY)
          globalShowToast(t('subjects.noLongerExists'), 'error')
          return
        }
        await loadTermData()
        globalShowToast(t('subjects.deleteFailed'), 'error')
      }
    }, 800)
  )
}

watch([searchQuery, statusFilter, termFilter], () => {
  currentPage.value = 1
})

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
  const offeringClassIds = (s.offerings || [])
    .map((o: any) => o.class_id)
    .filter((id: any) => id != null)
  formData.class_ids = offeringClassIds.length
    ? [...new Set(offeringClassIds)]
    : s.class_id ? [s.class_id] : []
  formData.status = typeof s.status === 'string' && s.status.toLowerCase() === 'active' ? 'Active' : 'Inactive'
  formData.term_ids = Array.isArray(s.term_ids)
    ? [...s.term_ids]
    : Array.isArray(s.terms)
      ? s.terms.map((t: any) => t.id)
      : []
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function validateForm() {
  let v = true
  if (!formData.name.trim()) { errors.name = t('subjects.nameRequired'); v = false } else errors.name = ''
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
      if (updatedTermIds.length || store.currentSubject.term_ids?.length) {
        await subjectTermService.syncSubject(updatedSubjectId, updatedTermIds)
        await loadTermData()
      }
      store.clearMessages()
      globalShowToast(t('subjects.updatedSuccess'))
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
      globalShowToast(t('subjects.createdSuccess'))
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
    subjects.value = subjects.value.filter(s => s.id !== targetId)
    closeDeleteModal()
    store.clearMessages()
    globalShowToast(t('subjects.deletedSuccess'))
  }
}

function applyTermData(data: { subjects: SubjectWithTerms[]; terms: TermInfo[] }) {
  subjects.value = data.subjects
  terms.value = data.terms.map((t, i) => ({ ...t, term_number: i + 1 }))
}

async function loadTermData() {
  try {
    const res = await subjectTermService.getAll()
    if (res.success) {
      applyTermData(res.data)
      cacheService.set(CACHE_KEY, res.data, 24 * 60 * 60_000)
    }
  } catch {  }
}

async function fetchTeachers() {
  if (!auth.hasPermission('view-teachers')) { teachers.value = []; return }
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
    loadTermData(),
    fetchTeachers(),
    fetchClasses(),
  ])
  loading.value = false
})
</script>

<style scoped>

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


.msg {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px;
  font-size: 0.85rem; font-weight: 500; margin-bottom: 14px;
}
.msg-error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
.msg-success { background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }
.msg-close { margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; opacity: 0.5; padding: 0 4px; }
.msg-close:hover { opacity: 1; }


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


.load-state {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 4rem; color: #64748b;
}
.spinner {
  width: 30px; height: 30px;
  border: 3px solid #e2e8f0; border-top-color: #3b82f6;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
.spin { animation: spin 0.7s linear infinite; }


.subject-card {
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

.subject-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.col-check {
  width: 48px;
  text-align: center;
  padding: 12px 8px !important;
}

.subject-table thead th.col-check,
.subject-table tbody td.col-check {
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
  color: #94a3b8;
  font-weight: 600;
}

.th-actions, .td-actions { width: 110px; text-align: center; }
.th-status, .td-status { min-width: 90px; }
.th-terms { min-width: 280px; }


.td-subject { cursor: pointer; }
.subj-avatar {
  width: 28px; height: 28px;
  border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0; margin-right: 8px; vertical-align: middle;
}

.subj-name { font-weight: 600; font-size: 0.85rem; color: #0f172a; }

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

.td-actions { white-space: nowrap; }


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
.modal-card-wide {
  max-width: 580px;
}
.modal-sm { max-width: 380px; }

.modal-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.icon-add { background: #dbeafe; color: #2563eb; }
.icon-edit { background: #fef3c7; color: #d97706; }
.icon-danger { background: #fee2e2; color: #ef4444; }


.section-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e2e8f0, transparent);
  margin: 14px 0 16px;
}


.field {
  margin-bottom: 0;
}

.field label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.81rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 7px;
}

.field-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.req {
  color: #ef4444;
  font-weight: 700;
}


.input-wrap {
  position: relative;
}

.input-wrap input {
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
.input-wrap input::placeholder {
  color: #adb5bd;
}
.input-wrap input:hover {
  border-color: #9ca3af;
}
.input-wrap input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}
.input-wrap input.err {
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
.row-2-equal > * {
  min-width: 0;
}
.row-2-auto {
  align-items: start;
}


.check-list {
  display: flex; flex-direction: column;
  max-height: 160px; overflow-y: auto;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  background: #fff;
  padding: 4px;
  gap: 1px;
}
.check-list::-webkit-scrollbar { width: 4px; }
.check-list::-webkit-scrollbar-track { background: transparent; }
.check-list::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }

.check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  color: #475569;
  transition: all 0.15s ease;
  margin: 0;
  position: relative;
}
.check-item:hover {
  background: #f8fafc;
}
.check-item-on {
  background: #f0f5ff;
  color: #1d4ed8;
}
.check-item-on:hover {
  background: #e8effe;
}

.check-item input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.check-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 2px solid #cbd5e1;
  flex-shrink: 0;
  transition: all 0.18s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.check-item-on .check-dot {
  background: #2563eb;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.check-dot::after {
  content: '';
  display: none;
  width: 5px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translateY(-1px);
}

.check-item-on .check-dot::after {
  display: block;
}

.check-label {
  flex: 1;
}

.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 6px 0 0;
  font-weight: 500;
  font-style: italic;
}

.field-count {
  font-size: 0.72rem;
  color: #2563eb;
  margin: 5px 0 0;
  font-weight: 600;
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


.modern-input {
  width: 100%;
  padding: 0.55rem 0.875rem;
  font-size: 0.875rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  color: #0f172a;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.modern-input:hover {
  background: #fff;
  border-color: #cbd5e1;
}

.modern-input:focus {
  background: #fff;
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}


.term-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.term-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  background: #fff;
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.term-chip:hover {
  border-color: #93c5fd;
  background: #f8faff;
  color: #3b82f6;
}

.term-chip-on {
  border-color: #2563eb;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.1);
}

.chip-icon-wrap {
  display: flex;
  align-items: center;
}

.chip-icon-wrap :deep(svg) {
  flex-shrink: 0;
}


.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card, .modal-leave-to .modal-card { transform: scale(0.92) translateY(10px); }

.row-enter-active, .row-leave-active { transition: all 0.3s ease; }
.row-enter-from { opacity: 0; transform: translateX(-20px); }
.row-leave-to { opacity: 0; transform: translateX(20px); }
.row-move { transition: transform 0.3s ease; }


@media (max-width: 768px) {
  .page-container { padding: 0.75rem 1rem; }
  .row-2 { grid-template-columns: 1fr; }
}
</style>
