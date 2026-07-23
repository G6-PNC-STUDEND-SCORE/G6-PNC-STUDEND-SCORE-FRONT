<template>
  <div class="teachers-page">
    <!-- Loading State -->
    <div v-if="loading && teachers.length === 0" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 2.5rem; height: 2.5rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2" style="color: #6b7280;">Loading teachers...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="d-flex align-items-center gap-2 p-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.875rem;">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <!-- Teacher List Card -->
    <div v-else class="teacher-card">
      <!-- Store Success Message -->
      <div v-if="store.successMessage" class="d-flex align-items-center gap-2 p-3" style="font-size: 0.85rem; font-weight: 500; background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; border-bottom: 1px solid #a7f3d0;">
        <CheckCircle :size="18" />
        {{ store.successMessage }}
        <button class="ms-auto bg-transparent border-0 p-0" style="font-size: 1.2rem; color: #065f46; opacity: 0.5; cursor: pointer; line-height: 1;" @click="store.clearMessages()">&times;</button>
      </div>

      <!-- Search & Filter Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search by name or email..."
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

      <!-- Bulk Action Bar -->
      <div v-if="selectedIds.length > 0" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} selected</span>
        <button class="bulk-delete-btn" @click="openBulkDeleteModal">
          <Trash :size="16" />
          Delete Selected
        </button>
        <button class="bulk-clear-btn" @click="clearSelection">Clear Selection</button>
      </div>

      <!-- ── Empty State (no data) ── -->
      <div v-if="teachers.length === 0" class="empty-container">
        <div class="empty-box">
          <Inbox :size="40" />
          <h5>No teachers found</h5>
          <p>{{ searchQuery ? 'Try a different search term.' : 'No teachers match the current filter.' }}</p>
        </div>
      </div>

      <!-- ── Table (with data) ── -->
      <div v-else class="table-wrap">
        <table class="teacher-table">
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
              class="teacher-row"
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

      <!-- Pagination -->
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

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
          <div class="modal-content-panel">
            <!-- Header -->
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
                <!-- Error Alert -->
                <div v-if="formError" class="error-alert">
                  <AlertTriangle :size="16" class="me-2" />
                  {{ formError }}
                </div>

                <!-- Full Name -->
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

                <!-- Email -->
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

                <!-- Password -->
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

                <!-- Gender -->
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

                <!-- Status -->
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

              <!-- Footer -->
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

    <!-- Delete Confirmation Modal -->
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

    <!-- Bulk Delete Confirmation Modal -->
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

    <!-- View Details Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetailsModal && detailTeacher" class="modal-overlay" @click.self="closeDetailsModal">
          <div class="details-card">
            <!-- Profile Header -->
            <div class="details-header">
              <div class="details-avatar">
                {{ getInitials(detailTeacher.name) }}
              </div>
              <div class="details-header-info">
                <h3 class="details-name">{{ detailTeacher.name }}</h3>
                <div class="details-header-meta">
                  <span class="details-role-tag">
                    <UserCheck :size="12" />
                    {{ detailTeacher.role?.name || 'Teacher' }}
                  </span>
                  <span class="status-badge" :class="getStatusClass(detailTeacher.status)">
                    {{ detailTeacher.status }}
                  </span>
                </div>
              </div>
              <button class="modal-x" @click="closeDetailsModal">&times;</button>
            </div>

            <!-- Detail Sections -->
            <div class="details-body">
              <div class="detail-section">
                <div class="detail-section-title">
                  <span>Account Information</span>
                </div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-item-icon">
                      <UserCheck :size="14" />
                    </div>
                    <div class="detail-item-content">
                      <span class="detail-item-label">Teacher ID</span>
                      <span class="detail-item-value">#{{ detailTeacher.id }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-item-icon">
                      <Mail :size="14" />
                    </div>
                    <div class="detail-item-content">
                      <span class="detail-item-label">Email</span>
                      <span class="detail-item-value">{{ detailTeacher.email }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-item-icon">
                      <VenusAndMars :size="14" />
                    </div>
                    <div class="detail-item-content">
                      <span class="detail-item-label">Gender</span>
                      <span class="detail-item-value">{{ detailTeacher.gender || '—' }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-item-icon">
                      <ToggleLeft :size="14" />
                    </div>
                    <div class="detail-item-content">
                      <span class="detail-item-label">Status</span>
                      <span class="detail-item-value">
                        <span class="status-badge" :class="getStatusClass(detailTeacher.status)">
                          {{ detailTeacher.status }}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <div class="detail-section-title">
                  <span>Activity</span>
                </div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-item-icon">
                      <LogIn :size="14" />
                    </div>
                    <div class="detail-item-content">
                      <span class="detail-item-label">Last Login</span>
                      <span class="detail-item-value">{{ formatDate(detailTeacher.last_login_at) }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-item-icon">
                      <Calendar :size="14" />
                    </div>
                    <div class="detail-item-content">
                      <span class="detail-item-label">Created</span>
                      <span class="detail-item-value">{{ formatFullDate(detailTeacher.created_at) }}</span>
                    </div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-item-icon">
                      <Clock :size="14" />
                    </div>
                    <div class="detail-item-content">
                      <span class="detail-item-label">Last Updated</span>
                      <span class="detail-item-value">{{ formatFullDate(detailTeacher.updated_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="details-footer">
              <button type="button" class="btn btn-primary" @click="closeDetailsModal">
                <CheckCircle :size="16" />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast-notification" :class="toast.type">
          <div class="toast-icon">
            <CheckCircle v-if="toast.type === 'success'" :size="18" />
            <AlertCircle v-else :size="18" />
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="toast.show = false">&times;</button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  UserCheck, Plus, AlertTriangle, Search, ToggleLeft,  Eye, Pencil, Trash2, ChevronLeft, ChevronRight, SquarePen, UserPlus,
  User as UserIcon, Mail, Lock, VenusAndMars, Check,
  CheckCircle, AlertCircle, Trash, Inbox,
  LogIn, Calendar, Clock,
} from '@lucide/vue'
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { getRoles, type User, type UserRole, type CreateUserPayload, type UpdateUserPayload } from '@/services/userService'

// ─── Store ────────────────────────────────────────────────────────────
const store = useUserStore()
const { users, loading, error, totalUsers, lastPage } = storeToRefs(store)

// ─── Local State ──────────────────────────────────────────────────────
const formSubmitting = ref(false)
const formError = ref<string | null>(null)
const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })
const teacherRoleId = ref<number | null>(null)

// ─── Search & Filters ─────────────────────────────────────────────────
const searchQuery = ref('')
const statusFilter = ref('')
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

// ─── Pagination ────────────────────────────────────────────────────────
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

// (Dropdown removed — using direct icon buttons instead)

// ─── Modal State ──────────────────────────────────────────────────────
const showFormModal = ref(false)
const isEditing = ref(false)
const showDeleteModal = ref(false)
const showDetailsModal = ref(false)
const showBulkDeleteModal = ref(false)
const deleteTarget = ref<User | null>(null)
const detailTeacher = ref<User | null>(null)
const editingTeacher = ref<User | null>(null)

// ─── Form State ───────────────────────────────────────────────────────
const initialForm = () => ({
  name: '',
  email: '',
  password: '',
  gender: '' as string,
  status: 'active' as string,
})

const form = ref(initialForm())

// ─── Data Helpers ─────────────────────────────────────────────────────
const teachers = computed(() => users.value)
const totalTeachers = computed(() => totalUsers.value)

async function getTeacherRoleId(): Promise<number | null> {
  if (teacherRoleId.value) return teacherRoleId.value
  try {
    const res = await getRoles()
    if (res.success) {
      const teacherRole = res.data.find((r: UserRole) => r.slug === 'teacher')
      if (teacherRole) {
        teacherRoleId.value = teacherRole.id
        return teacherRole.id
      }
    }
  } catch { /* ignore */ }
  return null
}

// ─── API Calls ────────────────────────────────────────────────────────
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

  await store.fetchUsers(params)
}

async function init() {
  // Only fetch roles first (avoid loading all users), then get teacherRoleId
  await store.fetchRoles()
  await getTeacherRoleId()
  if (teacherRoleId.value) {
    currentPage.value = 1
    await loadTeachers()
  }
}

// ─── Create / Edit ────────────────────────────────────────────────────
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

// ─── Delete ─────────────────────────────────────────────────────────────
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

// ─── View Details ──────────────────────────────────────────────────────
function viewTeacher(teacher: User) {
  detailTeacher.value = teacher
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  detailTeacher.value = null
}

// ─── Multi-Select & Bulk Delete ───────────────────────────────────────
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

// ─── Helpers ───────────────────────────────────────────────────────────
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
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// ─── Lifecycle ─────────────────────────────────────────────────────────
onMounted(() => {
  init()
})
</script>

<style scoped>
/* ==================== Page Layout ==================== */
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

/* ==================== Card ==================== */
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
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
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

.teacher-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f3f5;
  color: #475569;
  vertical-align: middle;
  font-weight: 500;
}

.teacher-table tbody tr:last-child td { border-bottom: none; }

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
  font-weight: 500;
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

.teacher-row {
  transition: background 0.2s ease, border-left 0.2s ease;
  border-left: 3px solid transparent;
}

.teacher-row:hover { background: #f8fafc; border-left-color: #2563eb; }

.row-selected {
  background: #f0f5ff !important;
  border-left-color: #2563eb !important;
}

.gender-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 100px;
  letter-spacing: 0.01em;
}

.badge-male { background: #dbeafe; color: #1d4ed8; }
.badge-female { background: #dbeafe; color: #1d4ed8; }
.badge-other { background: #dbeafe; color: #1d4ed8; }

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
.badge-suspended { background: #fef2f2; color: #dc2626; }

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

.act-btn {
  background: none; border: none; padding: 5px 6px;
  border-radius: 6px; cursor: pointer; color: #94a3b8;
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

/* ==================== Modal Styles ==================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  padding: 1rem;
}

.modal-content-panel {
  background: #fff;
  border-radius: 16px;
  width: 480px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modal-in 0.25s ease-out;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

@keyframes modal-in { 0%{opacity:0;transform:scale(0.92)translateY(10px)} 100%{opacity:1;transform:scale(1)translateY(0)} }

/* ── Modal Head ── */
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
.modal-body { padding: 16px 24px 0; }

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
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
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

/* ==================== Details Card (View Teacher) ==================== */
.details-card {
  background: #fff;
  border-radius: 16px;
  width: 480px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modal-in 0.25s ease-out;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.details-header {
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%);
  padding: 24px 24px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.details-avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.details-header-info {
  flex: 1;
  min-width: 0;
}

.details-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.details-header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.details-role-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.details-header .status-badge {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(4px);
  color: #fff !important;
}

.details-header .modal-x {
  color: rgba(255, 255, 255, 0.6);
  top: 12px;
  right: 16px;
}
.details-header .modal-x:hover { color: #fff; }

.details-body {
  padding: 0;
}

.detail-section {
  padding: 20px 24px 12px;
}

.detail-section + .detail-section {
  border-top: 1px solid #f1f5f9;
}

.detail-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.detail-section-title span {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  transition: background 0.15s ease;
}

.detail-item:hover {
  background: #f8fafc;
}

.detail-item-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detail-item-content {
  flex: 1;
  min-width: 0;
}

.detail-item-label {
  display: block;
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-item-value {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f172a;
}

.detail-item-value .status-badge {
  font-size: 0.7rem;
  padding: 1px 8px;
}

.details-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 24px 20px;
  border-top: 1px solid #f1f5f9;
}

.details-footer .btn-primary {
  min-width: 100px;
  justify-content: center;
}

/* ==================== Toast Styles ==================== */
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  z-index: 99999;
  max-width: 400px;
  animation: toastPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-left: 4px solid transparent;
}

.toast-notification.success {
  background: #ecfdf5;
  color: #065f46;
  border-left-color: #10b981;
  border-top: 1px solid #a7f3d0;
  border-right: 1px solid #a7f3d0;
  border-bottom: 1px solid #a7f3d0;
}

.toast-notification.error {
  background: #fef2f2;
  color: #991b1b;
  border-left-color: #ef4444;
  border-top: 1px solid #fecaca;
  border-right: 1px solid #fecaca;
  border-bottom: 1px solid #fecaca;
}

.toast-icon {
  display: flex;
  flex-shrink: 0;
}

.toast-notification.success .toast-icon svg {
  color: #10b981;
}

.toast-notification.error .toast-icon svg {
  color: #ef4444;
}

.toast-message {
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  color: inherit;
  opacity: 0.5;
  padding: 0;
}

.toast-close:hover {
  opacity: 1;
}

/* ==================== Transitions ==================== */
.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content-panel,
.modal-leave-to .modal-content-panel { transform: scale(0.92) translateY(10px); }

.modal-enter-active .modal-content-panel,
.modal-leave-active .modal-content-panel { transition: transform 0.25s ease-out; }

.toast-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(40px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateX(40px) scale(0.95); }

/* ==================== Scrollbar ==================== */
.table-wrap::-webkit-scrollbar { width: 4px; height: 4px; }
.table-wrap::-webkit-scrollbar-track { background: transparent; }
.table-wrap::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
.table-wrap::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
