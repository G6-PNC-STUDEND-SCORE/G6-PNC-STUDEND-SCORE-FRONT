<template>
  <div class="teachers-page">
    <div v-if="loading && teachers.length === 0" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 2.5rem; height: 2.5rem;">
        <span class="visually-hidden">{{ t('app.loading') }}</span>
      </div>
      <p class="mt-2" style="color: #6b7280;">{{ t('teachers.loading') }}</p>
    </div>

    <div v-else-if="error" class="d-flex align-items-center gap-2 p-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.875rem;">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <div v-else class="teacher-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="t('teachers.searchPlaceholder')"
              @input="onSearchInput"
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <ToggleLeft :size="16" />
              <span>{{ t('teachers.status') }}</span>
              <select v-model="statusFilter" class="filter-select" @change="applyFilters">
                <option value="">{{ t('app.all') }}</option>
                <option value="active">{{ t('common.active') }}</option>
                <option value="inactive">{{ t('common.inactive') }}</option>
                <option value="suspended">{{ t('common.suspended') }}</option>
              </select>
            </label>
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <VenusAndMars :size="16" />
              <span>{{ t('teachers.gender') }}</span>
              <select v-model="genderFilter" class="filter-select" @change="applyFilters">
                <option value="">{{ t('app.all') }}</option>
                <option value="Male">{{ t('common.male') }}</option>
                <option value="Female">{{ t('common.female') }}</option>
                <option value="Other">{{ t('common.other') }}</option>
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
            {{ t('teachers.addTeacher') }}
          </button>

          <span class="count-badge">
            {{ totalTeachers }} {{ totalTeachers !== 1 ? t('teachers.teachersLabel') : t('teachers.teacherLabel') }}
          </span>
        </div>
      </div>

      <div v-if="canDelete && selectedIds.length > 0" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} {{ t('app.selected') }}</span>
        <button class="bulk-delete-btn" @click="openBulkDeleteModal">
          <Trash :size="16" />
          {{ t('teachers.deleteSelected') }}
        </button>
        <button class="bulk-clear-btn" @click="clearSelection">{{ t('teachers.clearSelection') }}</button>
      </div>

      <div v-if="teachers.length === 0" class="empty-container">
        <div class="empty-box">
          <Inbox :size="40" />
          <h5>{{ t('teachers.noTeachers') }}</h5>
          <p>{{ searchQuery ? t('app.tryDifferentSearch') : t('app.noMatchFilter') }}</p>
        </div>
      </div>

      <div v-else class="table-wrap">
        <table class="teacher-table data-table-base">
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
              <th>{{ t('teachers.name') }}</th>
              <th>{{ t('teachers.email') }}</th>
              <th>{{ t('teachers.gender') }}</th>
              <th>{{ t('teachers.status') }}</th>
              <th class="col-actions">{{ t('teachers.actions') }}</th>
            </tr>
          </thead>
          <TransitionGroup name="row" tag="tbody">
            <tr
              v-for="(teacher, index) in teachers"
              :key="teacher.id"
              class="data-row"
              :class="{ 'row-selected': selectedIds.includes(teacher.id) }"
              @dblclick="canUpdate && openEditModal(teacher)"
            >
              <td v-if="canDelete" class="col-check" @dblclick.stop>
                <input
                  type="checkbox"
                  class="table-checkbox"
                  :checked="selectedIds.includes(teacher.id)"
                  @change="toggleSelectTeacher(teacher.id)"
                />
              </td>
              <td class="col-index">{{ pagination.from + index }}</td>
              <td>
                <div class="teacher-cell">
                  <div class="teacher-avatar">
                    <UserCheck :size="16" />
                  </div>
                  <span class="teacher-name">{{ teacher.name }}</span>
                </div>
              </td>
              <td>
                <span class="email-cell">{{ teacher.email }}</span>
              </td>
              <td>
                <span class="gender-badge" :class="getGenderClass(teacher.gender || '')">
                  {{ translateGender(teacher.gender) }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(teacher.status)">
                  {{ translateStatus(teacher.status) }}
                </span>
              </td>
              <td class="col-actions" @click.stop>
                <div class="td-actions">
                  <button class="act-btn" @click="viewTeacher(teacher)" :title="t('teachers.viewDetails')">
                    <Eye :size="15" />
                  </button>
                  <button v-if="canUpdate" class="act-btn" @click="openEditModal(teacher)" :title="t('common.edit')">
                    <Pencil :size="15" />
                  </button>
                  <button v-if="canDelete" class="act-btn act-danger" @click="openDeleteModal(teacher)" :title="t('common.delete')">
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>

      <div v-if="teachers.length > 0" class="pagination-bar">
        <div class="pagination-info">
          <span class="rows-label">{{ t('app.rowsPerPage') }}</span>
          <div class="rows-selector">
            <button
              v-for="size in pageSizeOptions"
              :key="size"
              class="rows-btn"
              :class="{ active: perPage === size }"
              @click="changePerPage(size)"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <div class="pagination-pages">
          <button
            class="page-nav"
            :disabled="currentPage <= 1"
            @click="changePage(currentPage - 1)"
            :aria-label="t('app.previous')"
          >
            <ChevronLeft :size="16" />
          </button>

          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="page !== '...'"
              class="page-btn"
              :class="{ active: currentPage === page }"
              @click="changePage(page as number)"
            >
              {{ page }}
            </button>
            <span v-else class="page-dots">…</span>
          </template>

          <button
            class="page-nav"
            :disabled="currentPage >= lastPage"
            @click="changePage(currentPage + 1)"
            :aria-label="t('app.next')"
          >
            <ChevronRight :size="16" />
          </button>
        </div>

        <div class="pagination-total">
          {{ pagination.from }}-{{ pagination.to }} {{ t('app.of') }} {{ totalTeachers }}
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
          <div class="modal-content-panel">
            <div class="modal-head">
              <div class="modal-icon" :class="isEditing ? 'icon-edit' : 'icon-create'">
                <SquarePen v-if="isEditing" :size="18" />
                <UserPlus v-else :size="18" />
              </div>
              <div>
                <h3>{{ isEditing ? t('teachers.editTeacher') : t('teachers.addNewTeacher') }}</h3>
                <p>{{ isEditing ? t('teachers.editTeacherDesc') : t('teachers.createTeacherDesc') }}</p>
              </div>
              <button class="modal-x" @click="closeFormModal">&times;</button>
            </div>

            <form @submit.prevent="handleFormSubmit">
              <div class="modal-body-custom">
                <div v-if="formError" class="error-alert">
                  <AlertTriangle :size="16" class="me-2" />
                  {{ formError }}
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <UserIcon :size="15" class="field-icon" />
                    {{ t('teachers.fullName') }} <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <input
                      v-model="form.name"
                      type="text"
                      class="styled-input"
                      :class="{ err: formError && !form.name.trim() }"
                      :placeholder="t('teachers.namePlaceholder')"
                      required
                    />
                  </div>
                  <span v-if="formError && !form.name.trim()" class="field-err">{{ t('teachers.nameRequired') }}</span>
                </div>

                <div class="section-divider"></div>

                <div class="form-group">
                  <label class="form-label">
                    <Mail :size="15" class="field-icon" />
                    {{ t('teachers.emailAddress') }} <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <input
                      v-model="form.email"
                      type="email"
                      class="styled-input"
                      :class="{ err: formError && !form.email.trim() }"
                      :placeholder="t('teachers.emailPlaceholder')"
                      required
                    />
                  </div>
                  <span v-if="formError && !form.email.trim()" class="field-err">{{ t('teachers.emailRequired') }}</span>
                </div>

                <div class="section-divider"></div>

                <div class="form-group">
                  <label class="form-label">
                    <Lock :size="15" class="field-icon" />
                    {{ t('teachers.password') }} <span v-if="!isEditing" class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <input
                      v-model="form.password"
                      type="password"
                      class="styled-input"
                      :class="{ err: formError && !isEditing && (!form.password || form.password.length < 8) }"
                      :placeholder="isEditing ? t('teachers.passwordKeepPlaceholder') : t('teachers.passwordPlaceholder')"
                      :required="!isEditing"
                      minlength="8"
                    />
                  </div>
                  <p v-if="isEditing" class="field-hint">{{ t('teachers.passwordHint') }}</p>
                  <span v-if="formError && !isEditing && (!form.password || form.password.length < 8)" class="field-err">{{ t('teachers.passwordRequired') }}</span>
                </div>

                <div class="section-divider"></div>

                <div class="row-2 row-2-equal">
                  <div class="form-group">
                    <label class="form-label">
                      <VenusAndMars :size="15" class="field-icon" />
                      {{ t('teachers.gender') }}
                    </label>
                    <div class="input-wrap">
                      <select v-model="form.gender" class="styled-input">
                        <option value="">{{ t('teachers.selectGender') }}</option>
                        <option value="Male">{{ t('common.male') }}</option>
                        <option value="Female">{{ t('common.female') }}</option>
                        <option value="Other">{{ t('common.other') }}</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      <ToggleLeft :size="15" class="field-icon" />
                      {{ t('teachers.status') }} <span class="req">*</span>
                    </label>
                    <div class="input-wrap">
                      <select v-model="form.status" class="styled-input" required>
                        <option value="active">{{ t('common.active') }}</option>
                        <option value="inactive">{{ t('common.inactive') }}</option>
                        <option value="suspended">{{ t('common.suspended') }}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="closeFormModal">{{ t('app.cancel') }}</button>
                <button type="submit" class="btn btn-primary" :disabled="formSubmitting">
                  <span v-if="formSubmitting" class="spinner-sm"></span>
                  <Check v-else :size="16" />
                  <span>{{ isEditing ? t('teachers.saveChanges') : t('teachers.createTeacher') }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
          <div class="modal-content-panel" style="max-width: 400px;">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>{{ t('teachers.deleteTeacher') }}</h3>
                <p>{{ t('teachers.cannotUndo') }}</p>
              </div>
              <button class="modal-x" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">
                {{ t('teachers.deleteConfirm') }} <strong>{{ deleteTarget?.name }}</strong>?
              </p>
              <p class="del-warning">
                <AlertTriangle :size="14" style="vertical-align: middle; margin-right: 4px;" />
                <span style="vertical-align: middle;">{{ t('teachers.deleteWarning') }}</span>
              </p>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" @click="closeDeleteModal">{{ t('app.cancel') }}</button>
              <button type="button" class="btn btn-danger" :disabled="formSubmitting" @click="handleDelete">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>{{ t('common.delete') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showBulkDeleteModal" class="modal-overlay" @click.self="closeBulkDeleteModal">
          <div class="modal-content-panel" style="max-width: 400px;">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>{{ t('teachers.deleteTeachers') }}</h3>
                <p>{{ t('teachers.cannotUndo') }}</p>
              </div>
              <button class="modal-x" @click="closeBulkDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">
                {{ t('teachers.deleteBulkPrompt', { count: selectedIds.length }) }}
              </p>
              <p class="del-warning">
                <AlertTriangle :size="14" style="vertical-align: middle; margin-right: 4px;" />
                <span style="vertical-align: middle;">{{ t('teachers.deleteBulkMessage') }}</span>
              </p>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" @click="closeBulkDeleteModal">{{ t('app.cancel') }}</button>
              <button type="button" class="btn btn-danger" :disabled="formSubmitting" @click="handleBulkDelete">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>{{ t('teachers.deleteBulkBtn', { count: selectedIds.length }) }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetailsModal && detailTeacher" class="modal-overlay" @click.self="closeDetailsModal">
          <div class="modal-content-panel" style="max-width: 820px;">
            <div class="modal-head">
              <button class="modal-x" @click="closeDetailsModal">&times;</button>
            </div>

            <div class="modal-body-custom">
              <div class="info-header">
                <div class="info-avatar">{{ getInitials(detailTeacher.name) }}</div>
                <div class="info-heading">
                  <h4>{{ detailTeacher.name }}</h4>
                  <span class="info-role">{{ detailTeacher.role?.name || t('teachers.role') }}</span>
                </div>
              </div>

              <div class="info-card">
                <div class="info-row">
                  <span class="info-label"><Mail :size="14" /> {{ t('teachers.email') }}</span>
                  <span class="info-value">{{ detailTeacher.email }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><VenusAndMars :size="14" /> {{ t('teachers.gender') }}</span>
                  <span class="info-value">{{ translateGender(detailTeacher.gender) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><BookOpen :size="14" /> {{ t('teachers.subjects') }}</span>
                  <span v-if="teacherSubjects" class="info-value">{{ teacherSubjects.join(', ') }}</span>
                  <span v-else class="info-value">—</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><Users :size="14" /> {{ t('teachers.classes') }}</span>
                  <span v-if="teacherClasses" class="info-value">{{ teacherClasses.join(', ') }}</span>
                  <span v-else class="info-value">—</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><ToggleLeft :size="14" /> {{ t('teachers.status') }}</span>
                  <span class="info-value" :class="'status-' + detailTeacher.status">{{ translateStatus(detailTeacher.status) }}</span>
                </div>
                <div class="info-row info-row-last">
                  <span class="info-label"><Calendar :size="14" /> {{ t('teachers.created') }}</span>
                  <span class="info-value">{{ formatFullDate(detailTeacher.created_at) }}</span>
                </div>
              </div>
            </div>

            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" @click="closeDetailsModal">{{ t('app.close') }}</button>
              <button type="button" class="btn btn-primary" @click="openEditFromDetails">
                <Pencil :size="15" />
                <span>{{ t('teachers.editTeacher') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  UserCheck, Plus, AlertTriangle, Search, ToggleLeft, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, SquarePen, UserPlus,
  User as UserIcon, Mail, Lock, VenusAndMars, Check,
  AlertCircle, Trash, Inbox, BookOpen, Users,
  Calendar,
} from '@lucide/vue'
import { ref, computed, onMounted, TransitionGroup } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import type { User, UserRole, CreateUserPayload, UpdateUserPayload } from '@/services/userService'
import { getUser } from '@/services/userService'
import { usePermission } from '@/composables/usePermission'

const { t } = useI18n()
const store = useUserStore()
const { users, loading, error, totalUsers, lastPage } = storeToRefs(store)
const { success: toastSuccess, error: toastError } = useToast()
const { hasPermission } = usePermission()
const canCreate = computed(() => hasPermission('create-teachers'))
const canUpdate = computed(() => hasPermission('update-teachers'))
const canDelete = computed(() => hasPermission('delete-teachers'))

const formSubmitting = ref(false)
const formError = ref<string | null>(null)
const teacherRoleId = ref<number | null>(null)

const searchQuery = ref('')
const statusFilter = ref('')
const genderFilter = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadTeachers()
  }, 400)
}

function applyFilters() {
  currentPage.value = 1
  loadTeachers()
}

const currentPage = ref(1)
const perPage = ref(10)
const pageSizeOptions = [10, 25, 50, 75, 100]

const pagination = computed(() => {
  const total = totalTeachers.value
  const page = currentPage.value
  const size = perPage.value
  const from = (page - 1) * size + 1
  const to = Math.min(page * size, total)
  return { from, to }
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = lastPage.value
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

function changePage(page: number) {
  currentPage.value = page
  loadTeachers()
}

function changePerPage(size: number) {
  perPage.value = size
  currentPage.value = 1
  loadTeachers()
}

const showFormModal = ref(false)
const isEditing = ref(false)
const showDeleteModal = ref(false)
const showDetailsModal = ref(false)
const showBulkDeleteModal = ref(false)
const deleteTarget = ref<User | null>(null)
const detailTeacher = ref<User | null>(null)
const editingTeacher = ref<User | null>(null)

const initialForm = () => ({
  name: '',
  email: '',
  password: '',
  gender: '' as string,
  status: 'active' as string,
})

const form = ref(initialForm())

const teachers = computed(() => users.value)
const totalTeachers = computed(() => totalUsers.value)

const teacherSubjects = computed(() => {
  const t = (detailTeacher.value as any)?.teacher
  const offerings = t?.offerings
  if (!offerings?.length) return null
  const subjects = [...new Set(offerings.map((o: any) => o.subject?.name).filter(Boolean))]
  return subjects.length ? subjects : null
})

const teacherClasses = computed(() => {
  const t = (detailTeacher.value as any)?.teacher
  const offerings = t?.offerings
  if (!offerings?.length) return null
  const classes = [...new Set(offerings.map((o: any) => o.class?.name).filter(Boolean))]
  return classes.length ? classes : null
})

async function getTeacherRoleId(): Promise<number | null> {
  if (teacherRoleId.value) return teacherRoleId.value
  await store.fetchRoles()
  const teacherRole = store.roles.find((r: UserRole) => r.slug === 'teacher')
  if (teacherRole) {
    teacherRoleId.value = teacherRole.id
    return teacherRole.id
  }
  return null
}

async function loadTeachers() {
  const roleId = await getTeacherRoleId()
  if (!roleId) return

  const params: Record<string, string | number> = {
    page: currentPage.value,
    per_page: perPage.value,
    role_id: roleId,
  }
  if (searchQuery.value) params.search = searchQuery.value
  if (statusFilter.value) params.status = statusFilter.value
  if (genderFilter.value) params.gender = genderFilter.value

  await store.fetchUsers(params)
}

async function init() {
  await store.fetchRoles()
  await getTeacherRoleId()
  if (teacherRoleId.value) {
    currentPage.value = 1
    await loadTeachers()
  }
}

function openCreateModal() {
  isEditing.value = false
  editingTeacher.value = null
  form.value = initialForm()
  formError.value = null
  showFormModal.value = true
}

function openEditModal(teacher: User) {
  isEditing.value = true
  editingTeacher.value = teacher
  form.value = {
    name: teacher.name,
    email: teacher.email,
    password: '',
    gender: teacher.gender || '',
    status: teacher.status,
  }
  formError.value = null
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  editingTeacher.value = null
}

async function handleFormSubmit() {
  if (!form.value.name.trim()) {
    formError.value = t('teachers.nameRequired')
    return
  }
  if (!form.value.email.trim()) {
    formError.value = t('teachers.emailRequired')
    return
  }
  if (!isEditing.value && (!form.value.password || form.value.password.length < 8)) {
    formError.value = t('teachers.passwordRequired')
    return
  }

  const roleId = teacherRoleId.value
  if (!roleId) {
    formError.value = 'Role not found. Contact admin.'
    return
  }

  formSubmitting.value = true
  formError.value = null

  try {
    if (isEditing.value && editingTeacher.value) {
      const payload: UpdateUserPayload = {
        name: form.value.name,
        email: form.value.email,
        role_id: roleId,
        gender: form.value.gender || undefined,
        status: form.value.status,
      }
      if (form.value.password) payload.password = form.value.password

      const result = await store.updateUser(editingTeacher.value.id, payload)
      if (result.success) {
        showToast(result.message || t('teachers.updatedSuccess'))
        closeFormModal()
      } else {
        formError.value = result.message
      }
    } else {
      const payload: CreateUserPayload = {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        role_id: roleId,
        gender: form.value.gender || undefined,
        status: form.value.status,
      }
      const result = await store.createUser(payload)
      if (result.success) {
        showToast(result.message || t('teachers.createdSuccess'))
        closeFormModal()
      } else {
        formError.value = result.message
      }
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    formError.value = err.response?.data?.message || err.message || t('messages.operationFailed')
  } finally {
    formSubmitting.value = false
  }
}

function openDeleteModal(teacher: User) {
  deleteTarget.value = teacher
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deleteTarget.value = null
}

async function handleDelete() {
  if (!deleteTarget.value) return
  formSubmitting.value = true
  const targetId = deleteTarget.value.id
  try {
    const result = await store.deleteUser(targetId)
    if (result.success) {
      lastPage.value = Math.max(1, Math.ceil(totalTeachers.value / perPage.value))
      showToast(t('teachers.deletedSuccess'))
      closeDeleteModal()
      if (teachers.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
        loadTeachers()
      }
    } else {
      showToast(result.message || t('teachers.deleteFailed'), 'error')
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    showToast(err.response?.data?.message || err.message || t('teachers.deleteFailed'), 'error')
  } finally {
    formSubmitting.value = false
  }
}

async function viewTeacher(teacher: User) {
  try {
    const res = await getUser(teacher.id)
    detailTeacher.value = res.data
  } catch {
    detailTeacher.value = teacher
  }
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  detailTeacher.value = null
}

function openEditFromDetails() {
  if (detailTeacher.value) {
    const teacher = detailTeacher.value
    closeDetailsModal()
    openEditModal(teacher)
  }
}

const selectedIds = ref<number[]>([])

const isAllPageSelected = computed(() => {
  return teachers.value.length > 0 && teachers.value.every(t => selectedIds.value.includes(t.id))
})

const isIndeterminate = computed(() => {
  const some = teachers.value.some(t => selectedIds.value.includes(t.id))
  return some && !isAllPageSelected.value
})

function toggleSelectAll() {
  if (isAllPageSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !teachers.value.some(t => t.id === id))
  } else {
    const currentIds = new Set(selectedIds.value)
    teachers.value.forEach(t => currentIds.add(t.id))
    selectedIds.value = Array.from(currentIds)
  }
}

function toggleSelectTeacher(id: number) {
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

function openBulkDeleteModal() {
  showBulkDeleteModal.value = true
}

function closeBulkDeleteModal() {
  showBulkDeleteModal.value = false
}

async function handleBulkDelete() {
  if (selectedIds.value.length === 0) return
  formSubmitting.value = true
  const idsToDelete = [...selectedIds.value]
  try {
    const result = await store.bulkDeleteUsers(idsToDelete)
    if (result.success) {
      lastPage.value = Math.max(1, Math.ceil(totalTeachers.value / perPage.value))
      showToast(t('teachers.bulkDeletedSuccess', { count: idsToDelete.length }))
      closeBulkDeleteModal()
      clearSelection()
      if (teachers.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
        loadTeachers()
      }
    } else {
      showToast(result.message || t('teachers.bulkDeleteFailed'), 'error')
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    showToast(err.response?.data?.message || err.message || t('teachers.bulkDeleteFailed'), 'error')
  } finally {
    formSubmitting.value = false
  }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `${diffMins}m ago`
    }
    return `${diffHours}h ago`
  }
  if (diffDays < 7) return `${diffDays}d ago`

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function formatFullDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function translateGender(gender: string | null | undefined): string {
  if (gender === 'Male') return t('common.male')
  if (gender === 'Female') return t('common.female')
  if (gender === 'Other') return t('common.other')
  return '—'
}

function translateStatus(status: string | null | undefined): string {
  if (status === 'active') return t('common.active')
  if (status === 'inactive') return t('common.inactive')
  if (status === 'suspended') return t('common.suspended')
  return status || '—'
}

function getGenderClass(gender: string): string {
  if (gender === 'Male') return 'badge-male'
  if (gender === 'Female') return 'badge-female'
  if (gender === 'Other') return 'badge-other'
  return ''
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getStatusClass(status: string): string {
  if (status === 'active') return 'badge-active'
  if (status === 'inactive') return 'badge-inactive'
  if (status === 'suspended') return 'badge-suspended'
  return ''
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  if (type === 'error') { toastError(message) } else { toastSuccess(message) }
}

onMounted(() => {
  init()
})
</script>

<style scoped>

.teachers-page {
  height: calc(100vh - 96px);
  width: calc(100% + 12px);
  margin-top: -6px;
  margin-left: -6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.teacher-card {
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

.teacher-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.col-check {
  width: 48px;
  text-align: center;
  padding: 12px 8px !important;
}

.teacher-table thead th.col-check,
.teacher-table tbody td.col-check {
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

.col-actions {
  text-align: center;
  width: 110px;
}

.teacher-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.teacher-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
}

.teacher-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.85rem;
}

.email-cell {
  font-size: 0.8125rem;
  color: #64748b;
}

.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 4px 0 0;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 100px;
  letter-spacing: 0.01em;
}

.role-teacher { background: #dbeafe; color: #1d4ed8; }

.td-actions { white-space: nowrap; text-align: center; }

.form-group { margin-bottom: 0; }

.form-label {
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

.field-err {
  display: block;
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 4px;
  font-weight: 500;
}

.input-wrap {
  position: relative;
}

.styled-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.88rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  color: #0f172a;
  background: #fff;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
  appearance: none;
  box-sizing: border-box;
}

.styled-input:hover { border-color: #9ca3af; }
.styled-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}
.styled-input::placeholder { color: #adb5bd; }

.styled-input.err {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
}

select.styled-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.section-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e2e8f0, transparent);
  margin: 14px 0 16px;
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.row-2-equal > * {
  min-width: 0;
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

.del-text {
  font-size: 0.9rem;
  color: #475569;
  margin: 0;
}

.del-warning {
  font-size: 0.75rem;
  color: #ef4444;
  background: #fef2f2;
  padding: 8px 12px;
  border-radius: 8px;
  line-height: 1.4;
  margin: 8px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.modal-content-panel {
  position: relative;
}

.modal-body-custom {
  padding-bottom: 16px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 0 24px;
}

.info-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.info-heading h4 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px;
}

.info-role {
  font-size: 0.82rem;
  color: #94a3b8;
  font-weight: 500;
}

.info-card {
  background: #f8fafc;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e9ecef;
}

.info-row-last {
  border-bottom: none;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.83rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.info-label svg {
  color: #94a3b8;
  flex-shrink: 0;
}

.info-value {
  font-size: 0.88rem;
  font-weight: 500;
  color: #0f172a;
  text-align: right;
  max-width: 65%;
  overflow-wrap: break-word;
}

.status-active { color: #16a34a; font-weight: 600; }
.status-inactive { color: #94a3b8; font-weight: 600; }
.status-suspended { color: #dc2626; font-weight: 600; }
</style>
