<template>
  <div :class="['users-page', { 'dark-mode': isDark }]">
    <div v-if="loading && users.length === 0" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 2.5rem; height: 2.5rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 loading-text">Loading users...</p>
    </div>

    <div v-else-if="error" class="d-flex align-items-center gap-2 p-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.875rem;">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <div v-else class="user-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search by name or email..."
              @input="applyFilters"
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
        </div>

        <div class="toolbar-right">
          <button
            v-if="canCreate"
            class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold add-user-btn"
            @click="openCreateModal"
          >
            <Plus :size="15" />
            Add User
          </button>

          <span class="count-badge">
            {{ totalUsers }} user{{ totalUsers !== 1 ? 's' : '' }}
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

      <div v-if="users.length === 0" class="empty-container">
        <div class="empty-box">
          <Inbox :size="40" />
          <h5>No users found</h5>
          <p>{{ searchQuery ? 'Try a different search term.' : 'No users match the current filter.' }}</p>
        </div>
      </div>

      <div v-else class="table-wrap">
        <table class="user-table data-table-base">
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
              <th>Role</th>
              <th>Gender</th>
              <th>Status</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <TransitionGroup name="row" tag="tbody">
            <tr
              v-for="(user, index) in users"
              :key="user.id"
              class="data-row"
              :class="[{ 'row-selected': selectedIds.includes(user.id) }]"
              @dblclick="canUpdate && openEditModal(user)"
            >
              <td v-if="canDelete" class="col-check" @dblclick.stop>
                <input
                  type="checkbox"
                  class="table-checkbox"
                  :checked="selectedIds.includes(user.id)"
                  @change="toggleSelectUser(user.id)"
                />
              </td>
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
                      <button v-if="canUpdate" class="action-item edit" @click="openEditModal(user); openDropdownId = null">
                        <Pencil :size="16" />
                        <span>Edit</span>
                      </button>
                      <div v-if="canUpdate && canDelete" class="dropdown-divider"></div>
                      <button v-if="canDelete" class="action-item delete" @click="openDeleteModal(user); openDropdownId = null">
                        <Trash2 :size="16" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </Transition>
                </div>
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>

      <div v-if="users.length > 0" class="pagination-bar">
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

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showFormModal" :class="['modal-overlay', { 'dark-mode': isDark }]" @click.self="closeFormModal">
          <div class="modal-content-panel">
            <div class="modal-head">
              <div class="modal-icon" :class="isEditing ? 'icon-edit' : 'icon-create'">
                <SquarePen v-if="isEditing" :size="18" />
                <UserPlus v-else :size="18" />
              </div>
              <div>
                <h3>{{ isEditing ? 'Edit User' : 'Add New User' }}</h3>
                <p>{{ isEditing ? 'Update user information and role' : 'Fill in the new user details' }}</p>
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
                      placeholder="user@example.com"
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

                <div class="form-group">
                  <label class="form-label">
                    <ShieldCheck :size="15" class="field-icon" />
                    Role <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <select v-model="form.role_id" class="styled-input" required>
                      <option :value="null" disabled>— Select a role —</option>
                      <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
                    </select>
                  </div>
                  <span v-if="formError && !form.role_id" class="field-err">Please select a role</span>
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
                  <span>{{ isEditing ? 'Save Changes' : 'Create User' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" :class="['modal-overlay', { 'dark-mode': isDark }]" @click.self="closeDeleteModal">
          <div class="modal-content-panel" style="max-width: 400px;">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>Delete User</h3>
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
                <span style="vertical-align: middle;">The user, their profile, and all associated data will be permanently removed.</span>
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
        <div v-if="showBulkDeleteModal" :class="['modal-overlay', { 'dark-mode': isDark }]" @click.self="closeBulkDeleteModal">
          <div class="modal-content-panel" style="max-width: 400px;">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>Delete Users</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeBulkDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">
                Are you sure you want to delete <strong>{{ selectedIds.length }} user(s)</strong>?
              </p>
              <p class="del-warning">
                <AlertTriangle :size="14" style="vertical-align: middle; margin-right: 4px;" />
                <span style="vertical-align: middle;">These users, their profiles, and all associated data will be permanently removed.</span>
              </p>
            </div>              <div class="modal-foot">
              <button type="button" class="btn btn-ghost" @click="closeBulkDeleteModal">Cancel</button>
              <button type="button" class="btn btn-danger" :disabled="formSubmitting" @click="handleBulkDelete">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>Delete {{ selectedIds.length }} user(s)</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetailsModal && detailUser" :class="['modal-overlay', { 'dark-mode': isDark }]" @click.self="closeDetailsModal">
          <div class="modal-content-panel" style="max-width: 460px;">
            <div class="modal-head">
              <div class="modal-icon icon-info">
                <IdCard :size="18" />
              </div>
              <div>
                <h3>User Details</h3>
                <p>Complete information about this user</p>
              </div>
              <button class="modal-x" @click="closeDetailsModal">&times;</button>
            </div>

            <div class="modal-body-custom">
              <div class="d-flex align-items-center gap-3 mb-4 pb-3 detail-separator" style="border-bottom: 1px solid #f1f5f9;">
                <div
                  class="d-flex align-items-center justify-content-center rounded-3 fw-bold text-white flex-shrink-0 shadow-sm detail-avatar"
                  :style="{ width: '54px', height: '54px', fontSize: '1.125rem', background: '#2563eb' }"
                >
                  {{ getInitials(detailUser.name) }}
                </div>
                <div>
                  <h6 class="mb-1 fw-bold detail-name" style="color: #0f172a;">{{ detailUser.name }}</h6>
                  <span class="role-badge" :class="getRoleBadgeClass(detailUser.role?.slug || '')">
                    {{ detailUser.role?.name || '—' }}
                  </span>
                </div>
              </div>

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

            <div class="modal-foot">
              <button type="button" class="btn btn-primary" style="flex: 1;" @click="closeDetailsModal">
                <CheckCircle :size="16" class="me-1" />Close
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Users, Plus, AlertTriangle, Search, ShieldCheck, ToggleLeft, MoreVertical, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, X, SquarePen, UserPlus, User as UserIcon, Mail, Lock, VenusAndMars, Check, IdCard, CheckCircle, AlertCircle, Trash, Inbox } from '@lucide/vue'
import { ref, computed, onMounted, onUnmounted, TransitionGroup, type Component } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { usePermission } from '@/composables/usePermission'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import type { User } from '@/services/userService'

const store = useUserStore()
const { users, roles, loading, error, totalUsers, lastPage } = storeToRefs(store)
const { success: toastSuccess, error: toastError } = useToast()

const { hasPermission } = usePermission()
const canCreate = computed(() => hasPermission('create-users'))
const canUpdate = computed(() => hasPermission('update-users'))
const canDelete = computed(() => hasPermission('delete-users'))

const formSubmitting = ref(false)
const formError = ref<string | null>(null)

const searchQuery = ref('')
const roleFilter = ref<number | ''>('')
const statusFilter = ref('')

function applyFilters() {
  currentPage.value = 1
  loadUsers()
}

const currentPage = ref(1)
const perPage = ref(10)
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

const openDropdownId = ref<number | null>(null)

function toggleDropdown(id: number) {
  openDropdownId.value = openDropdownId.value === id ? null : id
}

function handleClickOutside(e: Event) {
  const target = e.target as HTMLElement
  if (!target.closest('.action-dropdown') && !target.closest('.action-trigger')) {
    openDropdownId.value = null
  }
}

window.addEventListener('click', handleClickOutside)
onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

const showFormModal = ref(false)
const isEditing = ref(false)
const showDeleteModal = ref(false)
const showDetailsModal = ref(false)
const deleteTarget = ref<User | null>(null)
const detailUser = ref<User | null>(null)
const editingUser = ref<User | null>(null)

const initialForm = () => ({
  name: '',
  email: '',
  password: '',
  role_id: null as number | null,
  gender: '' as string,
  status: 'active' as string,
})

const form = ref(initialForm())

async function loadUsers() {
  const params: Record<string, string | number> = {
    page: currentPage.value,
    per_page: perPage.value,
  }
  if (searchQuery.value) params.search = searchQuery.value
  if (roleFilter.value) params.role_id = roleFilter.value
  if (statusFilter.value) params.status = statusFilter.value

  await store.fetchUsers(params)
}

async function init() {
  await store.init()
}

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
      const result = await store.updateUser(editingUser.value.id, {
        name: form.value.name,
        email: form.value.email,
        role_id: form.value.role_id!,
        gender: form.value.gender || undefined,
        status: form.value.status,
        ...(form.value.password ? { password: form.value.password } : {}),
      })
      if (result.success) {
        showToast(result.message || 'User updated successfully')
        closeFormModal()
      } else {
        formError.value = result.message
      }
    } else {
      const payload = {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        role_id: form.value.role_id!,
        gender: form.value.gender || undefined,
        status: form.value.status,
      }
      const result = await store.createUser(payload)
      if (result.success) {
        showToast(result.message || 'User created successfully')
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
  const targetId = deleteTarget.value.id
  try {
    const result = await store.deleteUser(targetId)
    if (result.success) {
      lastPage.value = Math.max(1, Math.ceil(totalUsers.value / perPage.value))
      showToast('User deleted successfully')
      closeDeleteModal()
      if (users.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
        loadUsers()
      }
    } else {
      showToast(result.message || 'Failed to delete user', 'error')
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    showToast(err.response?.data?.message || err.message || 'Failed to delete user', 'error')
  } finally {
    formSubmitting.value = false
  }
}

function viewUser(user: User) {
  detailUser.value = user
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  detailUser.value = null
}

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

function getAvatarClass(): string {
  return ''
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
  if (type === 'error') { toastError(message) } else { toastSuccess(message) }
}

const selectedIds = ref<number[]>([])

const isAllPageSelected = computed(() => {
  return users.value.length > 0 && users.value.every(u => selectedIds.value.includes(u.id))
})

const isIndeterminate = computed(() => {
  const some = users.value.some(u => selectedIds.value.includes(u.id))
  return some && !isAllPageSelected.value
})

function toggleSelectAll() {
  if (isAllPageSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !users.value.some(u => u.id === id))
  } else {
    const currentIds = new Set(selectedIds.value)
    users.value.forEach(u => currentIds.add(u.id))
    selectedIds.value = Array.from(currentIds)
  }
}

function toggleSelectUser(id: number) {
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

const showBulkDeleteModal = ref(false)

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
      lastPage.value = Math.max(1, Math.ceil(totalUsers.value / perPage.value))
      showToast('User deleted successfully')
      closeBulkDeleteModal()
      clearSelection()
      if (users.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
        loadUsers()
      }
    } else {
      showToast(result.message || 'Failed to delete users', 'error')
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    showToast(err.response?.data?.message || err.message || 'Failed to delete users', 'error')
  } finally {
    formSubmitting.value = false
  }
}

onMounted(() => {
  init()
})
</script>

<style scoped>

.users-page {
  
  height: calc(100vh - 96px);
  width: calc(100% + 12px);
  margin-top: -6px;
  margin-left: -6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}


.user-card {
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

.user-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}



.col-check {
  width: 48px;
  text-align: center;
  padding: 10px 8px !important;
}

.user-table thead th.col-check,
.user-table tbody td.col-check {
  text-align: center;
  padding: 10px 8px !important;
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

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  background: #2563eb;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
}

.user-name {
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

.role-admin { background: #dbeafe; color: #1d4ed8; }
.role-teacher { background: #dbeafe; color: #1d4ed8; }
.role-student { background: #dbeafe; color: #1d4ed8; }

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
.action-item.edit:hover { background: #eff6ff; color: #1d4ed8; }
.action-item.delete:hover { background: #fef2f2; color: #dc2626; }

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 8px;
}

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
.icon-info { background: #dbeafe; color: #2563eb; }

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

  @media (max-width: 768px) {
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-box { max-width: 100%; }
  .filter-group { flex-wrap: wrap; }
  .pagination-bar { flex-direction: column; align-items: center; gap: 8px; }
  .pagination-info { width: 100%; justify-content: center; }
  .modal-content-panel { width: 100%; margin: 0 8px; }
  .gender-toggle, .status-toggle { flex-wrap: wrap; }
}

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

.add-user-btn {
  border-radius: 0.625rem;
  padding: 0.35rem 0.875rem;
  font-size: 0.8125rem;
  flex-shrink: 0;
}

.loading-text {
  color: #6b7280;
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
  margin: 8px 0 0;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 6px;
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

/* ──────────────────────────────────────────────
   Dark mode — polished, modern look
   ────────────────────────────────────────────── */
.dark-mode .user-card {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
.dark-mode .user-card:hover { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); }
.dark-mode .user-name { color: #f1f5f9; }
.dark-mode .email-cell { color: #94a3b8; }
.dark-mode .user-cell { color: #e2e8f0; }
.dark-mode .data-row { border-left-color: transparent; }
.dark-mode .data-row:hover { border-left-color: #3b82f6; }
.dark-mode .user-table tbody td { color: #cbd5e1; }
.dark-mode .col-index { color: #64748b; }
.dark-mode .avatar {
  background: linear-gradient(135deg, #3b82f6, #7c3aed);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}
.dark-mode .modal-card { background: #1e293b; }
.dark-mode .modal-head h3 { color: #f1f5f9; }
.dark-mode .modal-head p { color: #94a3b8; }
.dark-mode .modal-x { color: #64748b; }
.dark-mode .modal-x:hover { color: #cbd5e1; }
.dark-mode .styled-input {
  background: rgba(51, 65, 85, 0.5);
  border-color: #475569;
  color: #e2e8f0;
}
.dark-mode .styled-input:hover { border-color: #64748b; }
.dark-mode .styled-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
.dark-mode .styled-input::placeholder { color: #64748b; }
.dark-mode .styled-input.err { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15); }
.dark-mode select.styled-input {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
}
.dark-mode .form-label { color: #e2e8f0; }
.dark-mode .field-icon { color: #64748b; }
.dark-mode .field-hint { color: #64748b; }
.dark-mode .section-divider { background: linear-gradient(to right, transparent, #334155, transparent); }
.dark-mode .load-state { color: #94a3b8; }
.dark-mode .msg-error { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border-left-color: #ef4444; }
.dark-mode .loading-text { color: #94a3b8; }
.dark-mode .empty-box h5 { color: #94a3b8; }
.dark-mode .empty-box p { color: #64748b; }
.dark-mode .btn-ghost { background: rgba(51, 65, 85, 0.5); color: #cbd5e1; }
.dark-mode .btn-ghost:hover { background: rgba(71, 85, 105, 0.5); }
.dark-mode .icon-create { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.dark-mode .icon-edit { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.dark-mode .icon-info { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.dark-mode .icon-danger { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
.dark-mode .modal-body-custom { color: #cbd5e1; }
.dark-mode .modal-body { color: #cbd5e1; }
.dark-mode .field-err { color: #fca5a5; }
.dark-mode .error-alert { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border-left-color: #ef4444; }
.dark-mode .del-text { color: #cbd5e1; }
.dark-mode .del-warning { color: #fca5a5; background: rgba(239, 68, 68, 0.1); }

/* Action dropdown */
.dark-mode .action-trigger {
  background: rgba(51, 65, 85, 0.4);
  color: #94a3b8;
}
.dark-mode .action-trigger:hover {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}
.dark-mode .action-menu {
  background: #1e293b;
  border-color: #475569;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}
.dark-mode .action-item { color: #cbd5e1; }
.dark-mode .action-item.view:hover { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.dark-mode .action-item.edit:hover { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.dark-mode .action-item.delete:hover { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }
.dark-mode .dropdown-divider { background: #334155; }

/* Role badges */
.dark-mode .role-admin { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.dark-mode .role-teacher { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
.dark-mode .role-student { background: rgba(16, 185, 129, 0.2); color: #4ade80; }

/* Detail modal */
.dark-mode .detail-avatar { background: linear-gradient(135deg, #3b82f6, #7c3aed) !important; }
.dark-mode .detail-name { color: #f1f5f9 !important; }
.dark-mode .detail-separator { border-bottom-color: #334155 !important; }
.dark-mode .detail-row { border-bottom-color: #334155; }
.dark-mode .detail-label { color: #64748b; }
.dark-mode .detail-value { color: #e2e8f0; }
.dark-mode .d-flex.align-items-center.gap-3.mb-4.pb-3 { border-bottom-color: #334155 !important; }
.badge.bg-light.text-dark { transition: background 0.3s ease, color 0.3s ease; }
.dark-mode .badge.bg-light.text-dark { background: rgba(51, 65, 85, 0.5) !important; color: #e2e8f0 !important; }
</style>
