<template>
  <div class="teachers-page">
    <div v-if="loading && teachers.length === 0" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 2.5rem; height: 2.5rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2" style="color: #6b7280;">Loading teachers...</p>
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
              placeholder="Search by name, email, or gender..."
              @input="onSearchInput"
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <ToggleLeft :size="16" />
              <span>Status</span>
              <select v-model="statusFilter" class="filter-select" @change="applyFilters">
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          </div>
          <div class="filter-group">
            <label class="filter-label">
              <VenusAndMars :size="16" />
              <span>Gender</span>
              <select v-model="genderFilter" class="filter-select" @change="applyFilters">
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
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
            Add Teacher
          </button>

          <span class="count-badge">
            {{ totalTeachers }} teacher{{ totalTeachers !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <div v-if="canDelete && selectedIds.length > 0" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} selected</span>
        <button class="bulk-delete-btn" @click="openBulkDeleteModal">
          <Trash :size="16" />
          Delete Selected
        </button>
        <button class="bulk-clear-btn" @click="clearSelection">Clear Selection</button>
      </div>

      <div v-if="teachers.length === 0" class="empty-container">
        <div class="empty-box">
          <Inbox :size="40" />
          <h5>No teachers found</h5>
          <p>{{ searchQuery ? 'Try a different search term.' : 'No teachers match the current filter.' }}</p>
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
              <th>Name</th>
              <th>Email</th>
              <th>Gender</th>
              <th>Status</th>
              <th class="col-actions">Actions</th>
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
                  {{ teacher.gender || '—' }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(teacher.status)">
                  {{ teacher.status }}
                </span>
              </td>
              <td class="col-actions" @click.stop>
                <div class="td-actions">
                  <button class="act-btn" @click="viewTeacher(teacher)" title="View Details">
                    <Eye :size="15" />
                  </button>
                  <button v-if="canUpdate" class="act-btn" @click="openEditModal(teacher)" title="Edit">
                    <Pencil :size="15" />
                  </button>
                  <button v-if="canDelete" class="act-btn act-danger" @click="openDeleteModal(teacher)" title="Delete">
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
          <span class="rows-label">Rows per page:</span>
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
            aria-label="Previous page"
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
            aria-label="Next page"
          >
            <ChevronRight :size="16" />
          </button>
        </div>

        <div class="pagination-total">
          {{ pagination.from }}-{{ pagination.to }} of {{ totalTeachers }}
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
                <h3>{{ isEditing ? 'Edit Teacher' : 'Add New Teacher' }}</h3>
                <p>{{ isEditing ? 'Update teacher information' : 'Fill in the new teacher details' }}</p>
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
                    Full Name <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <input
                      v-model="form.name"
                      type="text"
                      class="styled-input"
                      :class="{ err: formError && !form.name.trim() }"
                      placeholder="e.g. John Smith"
                      required
                    />
                  </div>
                  <span v-if="formError && !form.name.trim()" class="field-err">Full name is required</span>
                </div>

                <div class="section-divider"></div>

                <div class="form-group">
                  <label class="form-label">
                    <Mail :size="15" class="field-icon" />
                    Email Address <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <input
                      v-model="form.email"
                      type="email"
                      class="styled-input"
                      :class="{ err: formError && !form.email.trim() }"
                      placeholder="teacher@example.com"
                      required
                    />
                  </div>
                  <span v-if="formError && !form.email.trim()" class="field-err">Email is required</span>
                </div>

                <div class="section-divider"></div>

                <div class="form-group">
                  <label class="form-label">
                    <Lock :size="15" class="field-icon" />
                    Password <span v-if="!isEditing" class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <input
                      v-model="form.password"
                      type="password"
                      class="styled-input"
                      :class="{ err: formError && !isEditing && (!form.password || form.password.length < 8) }"
                      :placeholder="isEditing ? 'Leave blank to keep current' : 'Min. 8 characters'"
                      :required="!isEditing"
                      minlength="8"
                    />
                  </div>
                  <p v-if="isEditing" class="field-hint">Leave blank to keep the current password</p>
                  <span v-if="formError && !isEditing && (!form.password || form.password.length < 8)" class="field-err">Password must be at least 8 characters</span>
                </div>

                <div class="section-divider"></div>

                <div class="row-2 row-2-equal">
                  <div class="form-group">
                    <label class="form-label">
                      <VenusAndMars :size="15" class="field-icon" />
                      Gender
                    </label>
                    <div class="input-wrap">
                      <select v-model="form.gender" class="styled-input">
                        <option value="">— Select gender —</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      <ToggleLeft :size="15" class="field-icon" />
                      Status <span class="req">*</span>
                    </label>
                    <div class="input-wrap">
                      <select v-model="form.status" class="styled-input" required>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="closeFormModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="formSubmitting">
                  <span v-if="formSubmitting" class="spinner-sm"></span>
                  <Check v-else :size="16" />
                  <span>{{ isEditing ? 'Save Changes' : 'Create Teacher' }}</span>
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
                <h3>Delete Teacher</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">
                Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>?
              </p>
              <p class="del-warning">
                <AlertTriangle :size="14" style="vertical-align: middle; margin-right: 4px;" />
                <span style="vertical-align: middle;">This teacher and all associated data will be permanently removed.</span>
              </p>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" @click="closeDeleteModal">Cancel</button>
              <button type="button" class="btn btn-danger" :disabled="formSubmitting" @click="handleDelete">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>Delete</span>
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
                <h3>Delete Teachers</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeBulkDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">
                Are you sure you want to delete <strong>{{ selectedIds.length }} teacher(s)</strong>?
              </p>
              <p class="del-warning">
                <AlertTriangle :size="14" style="vertical-align: middle; margin-right: 4px;" />
                <span style="vertical-align: middle;">These teachers and all associated data will be permanently removed.</span>
              </p>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" @click="closeBulkDeleteModal">Cancel</button>
              <button type="button" class="btn btn-danger" :disabled="formSubmitting" @click="handleBulkDelete">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>Delete {{ selectedIds.length }} teacher(s)</span>
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
                  <span class="info-role">{{ detailTeacher.role?.name || 'Teacher' }}</span>
                </div>
              </div>

              <div class="info-card">
                <div class="info-row">
                  <span class="info-label"><Mail :size="14" /> Email</span>
                  <span class="info-value">{{ detailTeacher.email }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><VenusAndMars :size="14" /> Gender</span>
                  <span class="info-value">{{ detailTeacher.gender || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><BookOpen :size="14" /> Subjects</span>
                  <span v-if="teacherSubjects" class="info-value">{{ teacherSubjects.join(', ') }}</span>
                  <span v-else class="info-value">—</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><Users :size="14" /> Classes</span>
                  <span v-if="teacherClasses" class="info-value">{{ teacherClasses.join(', ') }}</span>
                  <span v-else class="info-value">—</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><ToggleLeft :size="14" /> Status</span>
                  <span class="info-value" :class="'status-' + detailTeacher.status">{{ detailTeacher.status }}</span>
                </div>
                <div class="info-row info-row-last">
                  <span class="info-label"><Calendar :size="14" /> Created</span>
                  <span class="info-value">{{ formatFullDate(detailTeacher.created_at) }}</span>
                </div>
              </div>
            </div>

            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" @click="closeDetailsModal">Close</button>
              <button type="button" class="btn btn-primary" @click="openEditFromDetails">
                <Pencil :size="15" />
                <span>Edit Teacher</span>
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
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import type { User, UserRole, CreateUserPayload, UpdateUserPayload } from '@/services/userService'
import { getUser } from '@/services/userService'
import { usePermission } from '@/composables/usePermission'

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
const pageSizeOptions = [10, 25, 50]

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
    formError.value = 'Name is required'
    return
  }
  if (!form.value.email.trim()) {
    formError.value = 'Email is required'
    return
  }
  if (!isEditing.value && (!form.value.password || form.value.password.length < 8)) {
    formError.value = 'Password must be at least 8 characters'
    return
  }

  const roleId = teacherRoleId.value
  if (!roleId) {
    formError.value = 'Teacher role not found. Please contact admin.'
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
        showToast(result.message || 'Teacher updated successfully')
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
        showToast(result.message || 'Teacher created successfully')
        closeFormModal()
      } else {
        formError.value = result.message
      }
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    formError.value = err.response?.data?.message || err.message || 'Operation failed'
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
      showToast('Teacher deleted successfully')
      closeDeleteModal()
      if (teachers.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
        loadTeachers()
      }
    } else {
      showToast(result.message || 'Failed to delete teacher', 'error')
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    showToast(err.response?.data?.message || err.message || 'Failed to delete teacher', 'error')
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
      showToast(`${idsToDelete.length} teacher(s) deleted successfully`)
      closeBulkDeleteModal()
      clearSelection()
      if (teachers.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
        loadTeachers()
      }
    } else {
      showToast(result.message || 'Failed to delete teachers', 'error')
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    showToast(err.response?.data?.message || err.message || 'Failed to delete teachers', 'error')
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
  display: flex;
  flex-direction: column;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.teachers-page::-webkit-scrollbar {
  width: 6px;
}

.teachers-page::-webkit-scrollbar-track {
  background: transparent;
}

.teachers-page::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

@media (min-width: 768px) and (max-width: 991.98px) {
  .teacher-card {
    border-radius: 14px;
  }

  .teacher-table thead th,
  .teacher-table tbody td {
    white-space: nowrap;
    padding: 7px 8px;
    font-size: 0.78rem;
  }

  .teacher-table thead th {
    font-size: 0.65rem;
    padding: 7px 8px;
  }

  .col-check {
    width: 40px;
    padding: 7px 6px !important;
  }

  .teacher-table thead th.col-check,
  .teacher-table tbody td.col-check {
    padding: 7px 6px !important;
  }

  .col-index {
    width: 48px;
  }

  .col-actions {
    width: 90px;
  }

  .teacher-avatar {
    width: 24px;
    height: 24px;
    border-radius: 6px;
  }

  .teacher-avatar :deep(svg) {
    width: 13px;
    height: 13px;
  }

  .teacher-name {
    font-size: 0.78rem;
  }

  .email-cell {
    font-size: 0.75rem;
  }

  .td-actions {
    display: flex;
    gap: 2px;
    justify-content: center;
  }

  .td-actions .act-btn {
    width: 26px;
    height: 26px;
    padding: 0;
  }

  .td-actions .act-btn :deep(svg) {
    width: 13px;
    height: 13px;
  }

  .pagination-bar {
    padding: 6px 14px;
    gap: 8px;
    font-size: 0.75rem;
  }

  .pagination-info {
    gap: 4px;
  }

  .rows-label {
    font-size: 0.72rem;
  }

  .rows-btn {
    padding: 3px 8px;
    font-size: 0.68rem;
  }

  .page-nav {
    width: 26px;
    height: 26px;
  }

  .page-nav :deep(svg) {
    width: 14px;
    height: 14px;
  }

  .page-btn {
    min-width: 26px;
    height: 26px;
    font-size: 0.72rem;
  }

  .page-dots {
    width: 20px;
    font-size: 0.78rem;
  }

  .pagination-total {
    font-size: 0.68rem;
  }

  .toolbar {
    padding: 12px 14px;
    gap: 8px;
  }

  .toolbar-left {
    gap: 6px;
  }

  .search-box {
    width: 160px;
  }

  .search-input {
    padding: 0.5rem 0.75rem 0.5rem 2.2rem;
    font-size: 0.75rem;
  }

  .filter-label {
    padding: 0.3rem 0.35rem 0.3rem 0.55rem;
    font-size: 0.72rem;
    gap: 5px;
  }

  .filter-label :deep(svg) {
    width: 14px;
    height: 14px;
  }

  .filter-select {
    font-size: 0.72rem;
    padding: 0.1rem 0.35rem;
  }

  .count-badge {
    font-size: 0.68rem;
    padding: 0.25rem 0.65rem;
  }

  .toolbar-right .btn {
    font-size: 0.75rem !important;
    padding: 0.3rem 0.65rem !important;
  }

  .toolbar-right .btn :deep(svg) {
    width: 14px;
    height: 14px;
  }

  .bulk-bar {
    padding: 8px 14px;
    gap: 8px;
  }

  .bulk-delete-btn,
  .bulk-clear-btn {
    font-size: 0.72rem;
    padding: 4px 10px;
  }
}


.teacher-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  transition: box-shadow 0.25s ease;
}

.teacher-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.table-wrap::-webkit-scrollbar {
  height: 6px;
}

.table-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.table-wrap::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.table-wrap::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
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

@media (max-width: 768px) {
  .teacher-card {
    border-radius: 12px;
  }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 12px 14px;
  }
  .toolbar-left {
    flex-direction: column;
    width: 100%;
  }
  .toolbar-right {
    width: 100%;
    justify-content: flex-start;
  }
  .search-box {
    width: 100%;
    max-width: 100%;
  }
  .filter-group {
    width: 100%;
  }
  .filter-label {
    width: 100%;
  }
  .pagination-bar {
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
  }
  .pagination-info {
    width: 100%;
    justify-content: center;
  }
  .col-actions {
    width: 80px;
  }
  .table-wrap {
    overflow-x: auto;
  }
  .modal-content-panel {
    max-width: 100% !important;
    margin: 0 8px;
    border-radius: 12px;
  }
  .row-2 {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .info-header {
    flex-wrap: wrap;
    gap: 12px;
  }
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .info-value {
    text-align: left;
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .teachers-page {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
  .teacher-card {
    border-radius: 10px;
  }
  .toolbar {
    padding: 10px 12px;
    gap: 8px;
  }
  .toolbar-left {
    gap: 8px;
  }
  .search-box {
    min-width: 0;
  }
  .search-input {
    font-size: 0.9rem;
    padding: 0.5rem 0.7rem 0.5rem 2.2rem;
  }
  .filter-select {
    font-size: 0.85rem;
  }
  .teacher-name {
    font-size: 0.8rem;
  }
  .email-cell {
    font-size: 0.75rem;
  }
  .col-index {
    width: 40px;
    font-size: 0.75rem;
  }
  .col-actions {
    width: 60px;
  }
  .pagination-bar {
    padding: 6px 10px;
    gap: 6px;
  }
  .modal-content-panel {
    margin: 0 4px;
    border-radius: 10px;
  }
}
</style>
