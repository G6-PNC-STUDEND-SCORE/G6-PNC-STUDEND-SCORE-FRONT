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

      <div v-if="selectedIds.length > 0" class="bulk-bar">
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
              <th>Name</th>
              <th>Email</th>
              <th>Gender</th>
              <th>Status</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(teacher, index) in teachers"
              :key="teacher.id"
              class="data-row"
              :class="{ 'row-selected': selectedIds.includes(teacher.id) }"
              @dblclick="openEditModal(teacher)"
            >
              <td class="col-check" @dblclick.stop>
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
                  <button class="act-btn" @click="openEditModal(teacher)" title="Edit">
                    <Pencil :size="15" />
                  </button>
                  <button class="act-btn act-danger" @click="openDeleteModal(teacher)" title="Delete">
                    <Trash2 :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
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
                    <UserIcon :size="14" class="me-1" />
                    Full Name
                  </label>
                  <div class="input-wrapper">
                    <input
                      v-model="form.name"
                      type="text"
                      class="modern-input"
                      placeholder="e.g. John Smith"
                      required
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Mail :size="14" class="me-1" />
                    Email Address
                  </label>
                  <div class="input-wrapper">
                    <input
                      v-model="form.email"
                      type="email"
                      class="modern-input"
                      placeholder="teacher@example.com"
                      required
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <Lock :size="14" class="me-1" />
                    Password
                  </label>
                  <div class="input-wrapper">
                    <input
                      v-model="form.password"
                      type="password"
                      class="modern-input"
                      :placeholder="isEditing ? 'Leave blank to keep current' : 'Min. 8 characters'"
                      :required="!isEditing"
                      minlength="8"
                    />
                  </div>
                  <p v-if="isEditing" class="field-hint">Leave blank to keep the current password</p>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <VenusAndMars :size="14" class="me-1" />
                    Gender
                  </label>
                  <div class="input-wrapper">
                    <select v-model="form.gender" class="modern-input">
                      <option value="">— Select gender —</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <ToggleLeft :size="14" class="me-1" />
                    Status
                  </label>
                  <div class="input-wrapper">
                    <select v-model="form.status" class="modern-input" required>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
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
              <div class="modal-icon" style="background: #fef2f2; color: #ef4444;">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3 style="color: #dc2626;">Delete Teacher</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p style="font-size: 0.9rem; color: #475569; margin: 0;">
                Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>?
              </p>
              <p style="font-size: 0.75rem; color: #ef4444; background: #fef2f2; padding: 8px 12px; border-radius: 8px; margin: 8px 0 0;">
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
              <div class="modal-icon" style="background: #fef2f2; color: #ef4444;">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3 style="color: #dc2626;">Delete Teachers</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeBulkDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p style="font-size: 0.9rem; color: #475569; margin: 0;">
                Are you sure you want to delete <strong>{{ selectedIds.length }} teacher(s)</strong>?
              </p>
              <p style="font-size: 0.75rem; color: #ef4444; background: #fef2f2; padding: 8px 12px; border-radius: 8px; line-height: 1.4; margin: 8px 0 0;">
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
          <div class="modal-content-panel">
            <div class="modal-head">
              <div class="modal-icon icon-view">
                <UserCheck :size="18" />
              </div>
              <div>
                <h3>{{ detailTeacher.name }}</h3>
                <p>{{ detailTeacher.role?.name || 'Teacher' }} &middot; <span class="status-badge" :class="getStatusClass(detailTeacher.status)">{{ detailTeacher.status }}</span></p>
              </div>
              <button class="modal-x" @click="closeDetailsModal">&times;</button>
            </div>

            <div class="modal-body-custom">
              <div class="form-group">
                <label class="form-label">
                  <UserCheck :size="14" class="me-1" />
                  Teacher ID
                </label>
                <div class="detail-value">#{{ detailTeacher.id }}</div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <Mail :size="14" class="me-1" />
                  Email Address
                </label>
                <div class="detail-value">{{ detailTeacher.email }}</div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <VenusAndMars :size="14" class="me-1" />
                  Gender
                </label>
                <div class="detail-value">{{ detailTeacher.gender || '—' }}</div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <Clock :size="14" class="me-1" />
                  Last Login
                </label>
                <div class="detail-value">{{ formatDate(detailTeacher.last_login_at) }}</div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <Calendar :size="14" class="me-1" />
                  Created
                </label>
                <div class="detail-value">{{ formatFullDate(detailTeacher.created_at) }}</div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <Clock :size="14" class="me-1" />
                  Last Updated
                </label>
                <div class="detail-value">{{ formatFullDate(detailTeacher.updated_at) }}</div>
              </div>
            </div>

            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" @click="closeDetailsModal">Close</button>
              <button type="button" class="btn btn-primary" @click="openEditModal(detailTeacher)">
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
  AlertCircle, Trash, Inbox,
  Calendar, Clock,
} from '@lucide/vue'
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import type { User, UserRole, CreateUserPayload, UpdateUserPayload } from '@/services/userService'

const store = useUserStore()
const { users, loading, error, totalUsers, lastPage } = storeToRefs(store)
const { success: toastSuccess, error: toastError } = useToast()

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

function viewTeacher(teacher: User) {
  detailTeacher.value = teacher
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  detailTeacher.value = null
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
  gap: 12px;
}

.teacher-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
}

.teacher-name {
  font-weight: 600;
  color: #0f172a;
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


.detail-value {
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #0f172a;
  line-height: 1.4;
}

.icon-view {
  background: #eff6ff;
  color: #2563eb;
}

</style>
