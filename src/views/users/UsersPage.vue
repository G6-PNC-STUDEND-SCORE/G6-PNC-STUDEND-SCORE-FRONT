<template>
  <div class="px-4 py-4">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <Users :size="22" />
        </div>
        <div>
          <h2 class="page-title">Users</h2>
          <p class="page-subtitle">Manage all system users — admins, teachers, and students</p>
        </div>
      </div>
      <button
        class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold"
        style="border-radius: 0.625rem; background: #2563eb; padding: 0.5rem 1.125rem; font-size: 0.875rem;"
        @click="openCreateModal"
      >
        <Plus :size="16" />
        Add User
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 2.5rem; height: 2.5rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2" style="color: #6b7280;">Loading users...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="d-flex align-items-center gap-2 p-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.875rem;">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <!-- User List -->
    <div v-else class="user-card">
      <!-- Search & Filter Toolbar -->
      <div class="toolbar">
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
            <ShieldCheck :size="16" />
            <span>Role</span>
            <select v-model="roleFilter" class="filter-select" @change="applyFilters">
              <option value="">All Roles</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </label>
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

        <span class="count-badge">
          {{ totalUsers }} user{{ totalUsers !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Table -->
      <div class="table-wrap">
        <table class="user-table">
          <thead>
            <tr>
              <th class="col-index">#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Gender</th>
              <th>Status</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="users.length === 0">
              <td colspan="7" class="empty-state">
                <Users :size="28" class="d-block mb-2" style="margin: 0 auto;" />
                No users found
              </td>
            </tr>
            <tr
              v-for="(user, index) in users"
              :key="user.id"
              class="user-row"
              :class="getRowClass(user)"
            >
              <td class="col-index">{{ pagination.from + index }}</td>
              <td>
                <div class="user-cell">
                  <div class="avatar" :class="getAvatarClass(user)">
                    {{ getInitials(user.name) }}
                  </div>
                  <span class="user-name">{{ user.name }}</span>
                </div>
              </td>
              <td>
                <span class="email-cell">{{ user.email }}</span>
              </td>
              <td>
                <span class="role-badge" :class="getRoleBadgeClass(user.role?.slug || '')">
                  {{ user.role?.name || '—' }}
                </span>
              </td>
              <td>
                <span
                  class="gender-badge"
                  :class="getGenderClass(user.gender || '')"
                >
                  {{ user.gender || '—' }}
                </span>
              </td>
              <td>
                <span
                  class="status-badge"
                  :class="getStatusClass(user.status)"
                >
                  {{ user.status }}
                </span>
              </td>
              <td class="col-actions" @click.stop>
                <div class="action-dropdown">
                  <button
                    class="action-trigger"
                    :title="`Actions for ${user.name}`"
                    @click="toggleDropdown(user.id)"
                  >
                    <MoreVertical :size="18" />
                  </button>
                  <Transition name="dropdown">
                    <div v-if="openDropdownId === user.id" class="action-menu">
                      <button class="action-item view" @click="viewUser(user); openDropdownId = null">
                        <Eye :size="16" />
                        <span>View Details</span>
                      </button>
                      <button class="action-item edit" @click="openEditModal(user); openDropdownId = null">
                        <Pencil :size="16" />
                        <span>Edit</span>
                      </button>
                      <div class="dropdown-divider"></div>
                      <button class="action-item delete" @click="openDeleteModal(user); openDropdownId = null">
                        <Trash2 :size="16" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </Transition>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-bar">
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
          {{ pagination.from }}-{{ pagination.to }} of {{ totalUsers }}
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
          <div class="modal-content-panel">
            <!-- Header -->
            <div class="modal-header-custom">
              <button class="modal-close-btn" @click="closeFormModal" aria-label="Close">
                <X :size="14" />
              </button>
              <div class="modal-icon" :class="isEditing ? 'icon-edit' : 'icon-create'">
                <SquarePen v-if="isEditing" :size="22" />
                <UserPlus v-else :size="22" />
              </div>
              <h5 class="mb-1 fw-bold">{{ isEditing ? 'Edit User' : 'Add New User' }}</h5>
              <p class="modal-subtitle">{{ isEditing ? 'Update user information and role' : 'Fill in the new user details' }}</p>
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
                    Full Name <span class="text-danger">*</span>
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
                    Email Address <span class="text-danger">*</span>
                  </label>
                  <div class="input-wrapper">
                    <input
                      v-model="form.email"
                      type="email"
                      class="modern-input"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                </div>

                <!-- Password -->
                <div class="form-group">
                  <label class="form-label">
                    <Lock :size="14" class="me-1" />
                    Password {{ isEditing ? '' : '<span class="text-danger">*</span>' }}
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

                <!-- Role -->
                <div class="form-group">
                  <label class="form-label">
                    <ShieldCheck :size="14" class="me-1" />
                    Role <span class="text-danger">*</span>
                  </label>
                  <div class="input-wrapper">
                    <select v-model="form.role_id" class="modern-input" required>
                      <option :value="null" disabled>— Select a role —</option>
                      <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
                    </select>
                  </div>
                </div>

                <!-- Phone -->
                <div class="form-group">
                  <label class="form-label">
                    <Phone :size="14" class="me-1" />
                    Phone Number
                  </label>
                  <div class="input-wrapper">
                    <input
                      v-model="form.phone"
                      type="text"
                      class="modern-input"
                      placeholder="e.g. +855 12 345 678"
                    />
                  </div>
                </div>

                <!-- Gender -->
                <div class="form-group">
                  <label class="form-label">
                    <VenusAndMars :size="14" class="me-1" />
                    Gender
                  </label>
                  <div class="gender-toggle">
                    <label class="gender-option" :class="{ active: form.gender === 'Male', 'male-active': form.gender === 'Male' }">
                      <input type="radio" :checked="form.gender === 'Male'" @change="form.gender = 'Male'" class="visually-hidden" />
                      <span class="gender-dot male"></span>
                      <span class="gender-text">Male</span>
                    </label>
                    <label class="gender-option" :class="{ active: form.gender === 'Female', 'female-active': form.gender === 'Female' }">
                      <input type="radio" :checked="form.gender === 'Female'" @change="form.gender = 'Female'" class="visually-hidden" />
                      <span class="gender-dot female"></span>
                      <span class="gender-text">Female</span>
                    </label>
                    <label class="gender-option" :class="{ active: form.gender === 'Other', 'other-active': form.gender === 'Other' }">
                      <input type="radio" :checked="form.gender === 'Other'" @change="form.gender = 'Other'" class="visually-hidden" />
                      <span class="gender-dot other"></span>
                      <span class="gender-text">Other</span>
                    </label>
                  </div>
                </div>

                <!-- Status -->
                <div class="form-group">
                  <label class="form-label">
                    <ToggleLeft :size="14" class="me-1" />
                    Status <span class="text-danger">*</span>
                  </label>
                  <div class="status-toggle">
                    <label class="status-option" :class="{ active: form.status === 'active', 'active-on': form.status === 'active' }">
                      <input type="radio" :checked="form.status === 'active'" @change="form.status = 'active'" class="visually-hidden" />
                      <span class="status-dot active"></span>
                      <span class="status-text">Active</span>
                    </label>
                    <label class="status-option" :class="{ active: form.status === 'inactive', 'inactive-on': form.status === 'inactive' }">
                      <input type="radio" :checked="form.status === 'inactive'" @change="form.status = 'inactive'" class="visually-hidden" />
                      <span class="status-dot inactive"></span>
                      <span class="status-text">Inactive</span>
                    </label>
                    <label class="status-option" :class="{ active: form.status === 'suspended', 'suspended-on': form.status === 'suspended' }">
                      <input type="radio" :checked="form.status === 'suspended'" @change="form.status = 'suspended'" class="visually-hidden" />
                      <span class="status-dot suspended"></span>
                      <span class="status-text">Suspended</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="modal-footer-custom">
                <button type="button" class="btn-outline" @click="closeFormModal">Cancel</button>
                <button type="submit" class="btn-primary-custom" :disabled="formSubmitting">
                  <template v-if="formSubmitting">
                    <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                    {{ isEditing ? 'Saving...' : 'Creating...' }}
                  </template>
                  <template v-else>
                    <Check :size="16" class="me-1" />
                    {{ isEditing ? 'Save Changes' : 'Create User' }}
                  </template>
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
            <div class="modal-header-custom">
              <div class="modal-icon" style="background: #fef2f2; color: #ef4444;">
                <Trash2 :size="24" />
              </div>
              <h5 class="mb-1 fw-bold" style="color: #1a1a2e;">Delete User</h5>
              <p class="mb-0" style="font-size: 0.8125rem; color: #6b7280;">
                Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>? This action cannot be undone.
              </p>
            </div>
            <div class="modal-footer-custom">
              <button type="button" class="btn-cancel" @click="closeDeleteModal">Cancel</button>
              <button type="button" class="btn-submit" :disabled="formSubmitting" style="background: #ef4444;" @click="handleDelete">
                <template v-if="formSubmitting">
                  <span class="spinner-border spinner-border-sm" role="status"></span>
                  Deleting...
                </template>
                <template v-else>
                  <Trash2 :size="16" class="me-1" />
                  Delete
                </template>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- View Details Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetailsModal && detailUser" class="modal-overlay" @click.self="closeDetailsModal">
          <div class="modal-content-panel" style="max-width: 460px;">
            <div class="modal-header-custom">
              <button class="modal-close-btn" @click="closeDetailsModal" aria-label="Close">
                <X :size="14" />
              </button>
              <div class="modal-icon" style="background: linear-gradient(135deg, #eef2ff, #dbeafe); color: #2563eb;">
                <IdCard :size="24" />
              </div>
              <h5 class="mb-1 fw-bold">User Details</h5>
              <p class="modal-subtitle">Complete information about this user</p>
            </div>

            <div class="modal-body-custom">
              <!-- User Avatar & Name -->
              <div class="d-flex align-items-center gap-3 mb-4 pb-3" style="border-bottom: 1px solid #f1f5f9;">
                <div
                  class="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0 shadow-sm"
                  :style="{ width: '54px', height: '54px', fontSize: '1.125rem', background: getAvatarGradient(detailUser) }"
                >
                  {{ getInitials(detailUser.name) }}
                </div>
                <div>
                  <h6 class="mb-1 fw-bold" style="color: #0f172a;">{{ detailUser.name }}</h6>
                  <span class="role-badge" :class="getRoleBadgeClass(detailUser.role?.slug || '')">
                    {{ detailUser.role?.name || '—' }}
                  </span>
                </div>
              </div>

              <!-- Detail Rows -->
              <div class="detail-row">
                <span class="detail-label">User ID</span>
                <span class="detail-value">
                  <span class="badge bg-light text-dark rounded-pill px-3 py-2">#{{ detailUser.id }}</span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ detailUser.email }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Phone</span>
                <span class="detail-value">{{ detailUser.phone || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Gender</span>
                <span class="detail-value">
                  <component :is="getGenderIconComponent(detailUser.gender || '')" :size="14" class="me-1" />
                  {{ detailUser.gender || '—' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Role</span>
                <span class="detail-value">
                  <span class="role-badge" :class="getRoleBadgeClass(detailUser.role?.slug || '')">
                    {{ detailUser.role?.name || '—' }}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value">
                  <span class="status-badge" :class="getStatusClass(detailUser.status)">
                    {{ detailUser.status }}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Last Login</span>
                <span class="detail-value">{{ formatDate(detailUser.last_login_at) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Created</span>
                <span class="detail-value">{{ formatFullDate(detailUser.created_at) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Updated</span>
                <span class="detail-value">{{ formatFullDate(detailUser.updated_at) }}</span>
              </div>
            </div>

            <div class="modal-footer-custom">
              <button type="button" class="btn-primary-custom" style="flex: 1;" @click="closeDetailsModal">
                <CheckCircle :size="16" class="me-1" />Close
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
          <CheckCircle v-if="toast.type === 'success'" :size="16" class="me-2" />
          <AlertCircle v-else :size="16" class="me-2" />
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Users, Plus, AlertTriangle, Search, ShieldCheck, ToggleLeft, MoreVertical, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, X, SquarePen, UserPlus, User as UserIcon, Mail, Lock, Phone, VenusAndMars, Check, IdCard, CheckCircle, AlertCircle } from '@lucide/vue'
import { ref, computed, onMounted, onUnmounted, type Component } from 'vue'
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  type User,
  type UserRole,
} from '@/services/userService'

// ─── Data ──────────────────────────────────────────────────────────────
const users = ref<User[]>([])
const roles = ref<UserRole[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const formSubmitting = ref(false)
const formError = ref<string | null>(null)

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

// ─── Search & Filters ─────────────────────────────────────────────────
const searchQuery = ref('')
const roleFilter = ref<number | ''>('')
const statusFilter = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadUsers()
  }, 400)
}

function applyFilters() {
  currentPage.value = 1
  loadUsers()
}

// ─── Pagination ────────────────────────────────────────────────────────
const currentPage = ref(1)
const perPage = ref(10)
const lastPage = ref(1)
const totalUsers = ref(0)
const pageSizeOptions = [10, 25, 50]

const pagination = computed(() => {
  const total = totalUsers.value
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
  loadUsers()
}

function changePerPage(size: number) {
  perPage.value = size
  currentPage.value = 1
  loadUsers()
}

// ─── Dropdown ─────────────────────────────────────────────────────────
const openDropdownId = ref<number | null>(null)

function toggleDropdown(id: number) {
  openDropdownId.value = openDropdownId.value === id ? null : id
}

function handleClickOutside() {
  openDropdownId.value = null
}

window.addEventListener('click', handleClickOutside)
onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

// ─── Modal State ──────────────────────────────────────────────────────
const showFormModal = ref(false)
const isEditing = ref(false)
const showDeleteModal = ref(false)
const showDetailsModal = ref(false)
const deleteTarget = ref<User | null>(null)
const detailUser = ref<User | null>(null)
const editingUser = ref<User | null>(null)

// ─── Form State ───────────────────────────────────────────────────────
const initialForm = () => ({
  name: '',
  email: '',
  password: '',
  role_id: null as number | null,
  phone: '',
  gender: '' as string,
  status: 'active' as string,
})

const form = ref(initialForm())

// ─── API Calls ────────────────────────────────────────────────────────
async function loadUsers() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, string | number> = {
      page: currentPage.value,
      per_page: perPage.value,
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (roleFilter.value) params.role_id = roleFilter.value
    if (statusFilter.value) params.status = statusFilter.value

    const res = await getUsers(params)
    users.value = res.data.data
    currentPage.value = res.data.current_page
    lastPage.value = res.data.last_page
    totalUsers.value = res.data.total
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err.response?.data?.message || err.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  try {
    const res = await getRoles()
    roles.value = res.data
  } catch {
    // Silently fail
  }
}

async function init() {
  await Promise.all([loadUsers(), loadRoles()])
}

// ─── Create / Edit ────────────────────────────────────────────────────
function openCreateModal() {
  isEditing.value = false
  editingUser.value = null
  form.value = initialForm()
  formError.value = null
  showFormModal.value = true
}

function openEditModal(user: User) {
  isEditing.value = true
  editingUser.value = user
  form.value = {
    name: user.name,
    email: user.email,
    password: '',
    role_id: user.role?.id ?? null,
    phone: user.phone || '',
    gender: user.gender || '',
    status: user.status,
  }
  formError.value = null
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  editingUser.value = null
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
  if (!form.value.role_id) {
    formError.value = 'Please select a role'
    return
  }
  if (!isEditing.value && (!form.value.password || form.value.password.length < 8)) {
    formError.value = 'Password must be at least 8 characters'
    return
  }

  formSubmitting.value = true
  formError.value = null

  try {
    if (isEditing.value && editingUser.value) {
      const res = await updateUser(editingUser.value.id, {
        name: form.value.name,
        email: form.value.email,
        role_id: form.value.role_id!,
        phone: form.value.phone || undefined,
        gender: form.value.gender || undefined,
        status: form.value.status,
        ...(form.value.password ? { password: form.value.password } : {}),
      })
      showToast(res.message || 'User updated successfully')
      closeFormModal()
      loadUsers()
    } else {
      const payload = {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        role_id: form.value.role_id!,
        phone: form.value.phone || undefined,
        gender: form.value.gender || undefined,
        status: form.value.status,
      }
      const res = await createUser(payload)
      showToast(res.message || 'User created successfully')
      closeFormModal()
      loadUsers()
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    formError.value = err.response?.data?.message || err.message || 'Operation failed'
  } finally {
    formSubmitting.value = false
  }
}

// ─── Delete ─────────────────────────────────────────────────────────────
function openDeleteModal(user: User) {
  deleteTarget.value = user
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deleteTarget.value = null
}

async function handleDelete() {
  if (!deleteTarget.value) return
  formSubmitting.value = true
  try {
    const res = await deleteUser(deleteTarget.value.id)
    showToast(res.message || 'User deleted successfully')
    closeDeleteModal()
    loadUsers()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    showToast(err.response?.data?.message || err.message || 'Failed to delete user', 'error')
  } finally {
    formSubmitting.value = false
  }
}

// ─── View Details ──────────────────────────────────────────────────────
function viewUser(user: User) {
  detailUser.value = user
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  detailUser.value = null
}

// ─── Helpers ───────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const safeName = name || ''
  const parts = safeName.split(' ').filter(Boolean)
  return parts.length >= 2
    ? (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
    : safeName.substring(0, 2).toUpperCase()
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

function getRowClass(user: User): string {
  if (user.role?.slug === 'admin') return 'row-admin'
  if (user.role?.slug === 'teacher') return 'row-teacher'
  if (user.role?.slug === 'student') return 'row-student'
  return ''
}

function getAvatarClass(user: User): string {
  if (user.role?.slug === 'admin') return 'avatar-admin'
  if (user.role?.slug === 'teacher') return 'avatar-teacher'
  if (user.role?.slug === 'student') return 'avatar-student'
  return ''
}

function getAvatarGradient(user: User): string {
  if (user.role?.slug === 'admin') return 'linear-gradient(135deg, #7c3aed, #6d28d9)'
  if (user.role?.slug === 'teacher') return 'linear-gradient(135deg, #2563eb, #1d4ed8)'
  if (user.role?.slug === 'student') return 'linear-gradient(135deg, #059669, #047857)'
  return 'linear-gradient(135deg, #6366f1, #4f46e5)'
}

function getRoleBadgeClass(slug: string): string {
  if (slug === 'admin') return 'role-admin'
  if (slug === 'teacher') return 'role-teacher'
  if (slug === 'student') return 'role-student'
  return ''
}

function getGenderClass(gender: string): string {
  if (gender === 'Male') return 'badge-male'
  if (gender === 'Female') return 'badge-female'
  if (gender === 'Other') return 'badge-other'
  return ''
}

const genderIconMap: Record<string, Component> = {
  'Male': Users,
  'Female': Users,
}

function getGenderIconComponent(gender: string): Component {
  return genderIconMap[gender] || Users
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
/* ==================== Page Header ==================== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff, #dbeafe);
  color: #2563eb;
  border-radius: 12px;
  flex-shrink: 0;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
  font-weight: 400;
}

/* ==================== Card ==================== */
.user-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  transition: box-shadow 0.25s ease;
}

.user-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

/* ==================== Toolbar ==================== */
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
}

.search-box {
  position: relative;
  flex: 1 1 260px;
  max-width: 340px;
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
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.4rem 0.85rem;
  border-radius: 100px;
  white-space: nowrap;
}

/* ==================== Table ==================== */
.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

.user-table thead th {
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
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.col-index {
  width: 64px;
  color: #94a3b8;
  font-weight: 600;
}

.col-actions {
  text-align: right;
  padding-right: 20px !important;
  width: 80px;
}

.user-table tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f5;
  color: #334155;
  vertical-align: middle;
}

.user-table tbody tr:last-child td { border-bottom: none; }

.empty-state {
  text-align: center;
  padding: 48px 16px !important;
  color: #9ca3af;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.avatar-admin {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
}

.avatar-teacher {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
}

.avatar-student {
  background: linear-gradient(135deg, #059669, #047857);
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);
}

.user-name {
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

.user-row {
  transition: background 0.2s ease, border-left 0.2s ease;
  border-left: 3px solid transparent;
}

.user-row:hover { background: #f8fafc; }

.row-admin:hover { border-left-color: #7c3aed; background: #f5f3ff; }
.row-teacher:hover { border-left-color: #2563eb; background: #eff6ff; }
.row-student:hover { border-left-color: #059669; background: #ecfdf5; }

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 100px;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;
}

.role-admin { background: #ede9fe; color: #6d28d9; }
.role-teacher { background: #dbeafe; color: #1d4ed8; }
.role-student { background: #d1fae5; color: #047857; }

.gender-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 100px;
  letter-spacing: 0.01em;
}

.badge-male { background: #dbeafe; color: #1d4ed8; }
.badge-female { background: #fce7f3; color: #be185d; }
.badge-other { background: #f3e8ff; color: #7c3aed; }

.gender-badge::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

.badge-male::before { background: #3b82f6; }
.badge-female::before { background: #ec4899; }
.badge-other::before { background: #a855f7; }

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 100px;
  letter-spacing: 0.01em;
}

.badge-active { background: #dcfce7; color: #15803d; }
.badge-inactive { background: #f1f5f9; color: #64748b; }
.badge-suspended { background: #fef2f2; color: #dc2626; }

.status-badge::before {
  content: '';
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 7px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}

.badge-active::before { background: #22c55e; }
.badge-inactive::before { background: #94a3b8; }
.badge-suspended::before { background: #ef4444; }

.action-dropdown {
  position: relative;
  display: inline-flex;
}

.action-trigger {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-trigger:hover {
  background: #eef2ff;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.action-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 170px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 100;
  animation: dropIn 0.18s ease-out;
  transform-origin: top right;
}

@keyframes dropIn {
  from { opacity: 0; transform: scale(0.92) translateY(-6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.dropdown-enter-active { transition: all 0.18s ease-out; }
.dropdown-leave-active { transition: all 0.12s ease-in; }
.dropdown-enter-from { opacity: 0; transform: scale(0.92) translateY(-6px); }
.dropdown-leave-to { opacity: 0; transform: scale(0.95) translateY(-3px); }

.action-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: "Inter", "Noto Sans Khmer", sans-serif;
  transition: all 0.15s ease;
  text-align: left;
  color: #374151;
}

.action-item.view:hover { background: #f0f5ff; color: #2563eb; }
.action-item.edit:hover { background: #e0f2fe; color: #0369a1; }
.action-item.delete:hover { background: #fef2f2; color: #dc2626; }

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 8px;
}

/* ==================== Pagination ==================== */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  font-size: 0.8125rem;
  gap: 12px;
  flex-wrap: wrap;
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
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.page-nav:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; background: #f0f5ff; }
.page-nav:disabled { opacity: 0.4; cursor: not-allowed; }

.page-btn {
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8125rem;
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
  border-radius: 20px;
  width: 480px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
  animation: modalBounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

@keyframes modalBounce {
  0% { transform: scale(0.92) translateY(12px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

.modal-header-custom { padding: 28px 32px 16px; text-align: center; position: relative; }

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }

.modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.icon-create { background: linear-gradient(135deg, #eef2ff, #dbeafe); color: #2563eb; }
.icon-edit { background: linear-gradient(135deg, #e0f2fe, #bae6fd); color: #0369a1; }

.modal-header-custom h5 { font-size: 1.1rem; color: #0f172a; letter-spacing: -0.01em; }
.modal-subtitle { font-size: 0.8125rem; color: #64748b; margin: 0; }

.modal-body-custom { padding: 0 32px 8px; }

.form-group { margin-bottom: 18px; }

.form-label { display: block; font-size: 0.8125rem; font-weight: 600; color: #334155; margin-bottom: 6px; }
.form-label :deep(svg) { color: #94a3b8; }
.input-wrapper { position: relative; }

.modern-input {
  width: 100%;
  padding: 0.65rem 0.875rem;
  font-size: 0.875rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  color: #0f172a;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
  appearance: none;
  box-sizing: border-box;
}

.modern-input:hover { background: #fff; border-color: #cbd5e1; }
.modern-input:focus { background: #fff; border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
.modern-input::placeholder { color: #94a3b8; }

select.modern-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.gender-toggle, .status-toggle { display: flex; gap: 8px; }

.gender-option, .status-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0.6rem 0.5rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
}

.gender-option:hover, .status-option:hover { background: #f1f5f9; border-color: #cbd5e1; }

.gender-option.active.male-active { background: #eff6ff; color: #1d4ed8; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12); }
.gender-option.active.female-active { background: #fdf2f8; color: #be185d; border-color: #ec4899; box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.12); }
.gender-option.active.other-active { background: #f3e8ff; color: #7c3aed; border-color: #a855f7; box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.12); }

.status-option.active.active-on { background: #ecfdf5; color: #15803d; border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12); }
.status-option.active.inactive-on { background: #f8fafc; color: #64748b; border-color: #94a3b8; box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.12); }
.status-option.active.suspended-on { background: #fef2f2; color: #dc2626; border-color: #ef4444; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12); }

.gender-dot, .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.gender-dot.male { background: #3b82f6; }
.gender-dot.female { background: #ec4899; }
.gender-dot.other { background: #a855f7; }
.status-dot.active { background: #22c55e; }
.status-dot.inactive { background: #94a3b8; }
.status-dot.suspended { background: #ef4444; }
.gender-text, .status-text { font-size: 0.75rem; }

.error-alert {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.8125rem;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
  margin-bottom: 20px;
}

.modal-footer-custom {
  display: flex;
  gap: 10px;
  padding: 16px 32px 28px;
}

.modal-footer-custom button {
  flex: 1;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.btn-cancel { background: #f3f4f6; color: #374151; }
.btn-cancel:hover { background: #e5e7eb; }
.btn-submit { color: white; }
.btn-submit:hover { opacity: 0.9; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-outline { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0 !important; }
.btn-outline:hover { background: #e2e8f0; border-color: #cbd5e1 !important; }

.btn-primary-custom {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
}

.btn-primary-custom:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4); }
.btn-primary-custom:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 0.8125rem; color: #64748b; font-weight: 500; }
.detail-value { font-size: 0.8125rem; color: #0f172a; font-weight: 600; }

.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  z-index: 99999;
  animation: slideInRight 0.3s ease-out;
}

.toast-notification.success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.toast-notification.error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from, .toast-leave-to { transform: translateX(100%); opacity: 0; }

.modal-enter-active { transition: all 0.25s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content-panel, .modal-leave-to .modal-content-panel { transform: scale(0.92) translateY(12px); }

.modal-content-panel::-webkit-scrollbar { width: 4px; }
.modal-content-panel::-webkit-scrollbar-track { background: transparent; }
.modal-content-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

@media (max-width: 768px) {
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-box { max-width: 100%; }
  .filter-group { flex-wrap: wrap; }
  .filter-label { flex: 1; }
  .count-badge { margin-left: 0; }
}
</style>
