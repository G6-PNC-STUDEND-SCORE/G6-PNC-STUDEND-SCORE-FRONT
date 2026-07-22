<template>
  <div class="students-page">
    <!-- ── Store Messages ── -->
    <div v-if="error" class="msg msg-error">
      <AlertTriangle :size="16" />
      {{ error }}
      <button class="msg-close" @click="error = null">&times;</button>
    </div>
    <div v-if="successMessage" class="msg msg-success">
      <CheckCircle :size="16" />
      {{ successMessage }}
      <button class="msg-close" @click="successMessage = ''">&times;</button>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading && students.length === 0" class="load-state">
      <div class="spinner"></div>
      <span>Loading students…</span>
    </div>

    <!-- ── Content ── -->
    <template v-else>
      <div class="student-card">
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
              <button v-if="searchQuery" class="tb-clear" @click="clearSearch">
                <X :size="14" />
              </button>
            </div>
            <div class="filter-group">
              <label class="filter-label">
                <VenusAndMars :size="16" />
                <span>Gender</span>
                <select v-model="genderFilter" class="filter-select" @change="applyFilters">
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>
              <label class="filter-label">
                <ToggleLeft :size="16" />
                <span>Status</span>
                <select v-model="statusFilter" class="filter-select" @change="applyFilters">
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
              Add Student
            </button>

            <span class="count-badge">
              {{ totalStudents }} student{{ totalStudents !== 1 ? 's' : '' }}
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

        <!-- Table + Empty State -->
        <div class="table-area">
          <div class="table-wrap" v-show="students.length > 0">
            <table class="student-table">
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
                  <th>Class</th>
                  <th>Status</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(student, index) in students"
                  :key="student.id"
                  class="student-row"
                  :class="{ 'row-selected': selectedIds.includes(student.id) }"
                >
                  <td class="col-check" @click.stop>
                    <input
                      type="checkbox"
                      class="table-checkbox"
                      :checked="selectedIds.includes(student.id)"
                      @change="toggleSelectStudent(student.id)"
                    />
                  </td>
                  <td class="col-index">{{ pagination.from + index }}</td>
                  <td>
                    <div class="student-cell">
                      <div
                        v-if="student.profile_photo_url"
                        class="student-avatar-img"
                      >
                        <img
                          :src="student.profile_photo_url"
                          :alt="student.user?.name || 'Student'"
                          class="photo-img"
                        />
                      </div>
                      <div v-else class="student-avatar">
                        {{ getInitials(student.user?.name || '') }}
                      </div>
                      <span class="student-name">{{ student.user?.name }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="meta-val">{{ student.user?.email || '—' }}</span>
                  </td>
                  <td>
                    <span
                      class="gender-badge"
                      :class="getGenderClass(student.user?.gender || '')"
                    >
                      {{ student.user?.gender || '—' }}
                    </span>
                  </td>
                  <td>
                    <span v-if="student.class" class="class-cell">
                      <Building2 :size="14" />
                      {{ student.class.name }}
                    </span>
                    <span v-else class="class-empty">
                      <Minus :size="14" />
                      Not assigned
                    </span>
                  </td>
                  <td>
                    <span
                      class="status-badge"
                      :class="getStatusClass(student.user?.status || '')"
                    >
                      {{ student.user?.status || '—' }}
                    </span>
                  </td>
                  <td class="col-actions" @click.stop>
                    <div class="action-dropdown">
                      <button
                        class="action-trigger"
                        :title="`Actions for ${student.user?.name || student.id}`"
                        @click="toggleDropdown(student.id)"
                      >
                        <MoreVertical :size="18" />
                      </button>
                      <Transition name="dropdown">
                        <div v-if="openDropdownId === student.id" class="action-menu">
                          <button class="action-item view" @click="viewStudent(student); openDropdownId = null">
                            <Eye :size="16" />
                            <span>View Details</span>
                          </button>
                          <button class="action-item edit" @click="openEditModal(student); openDropdownId = null">
                            <Pencil :size="16" />
                            <span>Edit</span>
                          </button>
                          <button class="action-item assign" @click="openAssignModal(student); openDropdownId = null">
                            <ArrowRightFromLine :size="16" />
                            <span>Assign Class</span>
                          </button>
                          <div class="dropdown-divider"></div>
                          <button class="action-item delete" @click="openDeleteModal(student); openDropdownId = null">
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

          <!-- ═══ Empty State ═══ -->
          <div class="empty-state-standalone" v-show="students.length === 0">
            <div class="empty-state-inner">
              <div class="empty-state-icon-box">
                <div class="empty-state-icon-ring">
                  <SearchX :size="28" />
                </div>
              </div>
              <div class="empty-state-texts">
                <h5 class="empty-state-title">No students found</h5>
                <p class="empty-state-desc">
                  <template v-if="searchQuery">We couldn't find any students matching "<strong>{{ searchQuery }}</strong>". Try adjusting your search or filters.</template>
                  <template v-else>There are no students to display yet. Create your first student to get started.</template>
                </p>
              </div>
              <button v-if="searchQuery || genderFilter || statusFilter" class="empty-state-btn" @click="clearAllFilters">
                <X :size="14" />
                <span>Clear all filters</span>
              </button>
            </div>
          </div>
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

            <template v-for="page in visiblePages" :key="'vp-' + page">
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
            {{ totalStudents > 0 ? pagination.from : 0 }}-{{ pagination.to }} of {{ totalStudents }}
          </div>
        </div>
      </div>
    </template>

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
                <h3>{{ isEditing ? 'Edit Student' : 'Add New Student' }}</h3>
                <p>{{ isEditing ? 'Update student information' : 'Fill in the new student details' }}</p>
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

                <!-- Email (only for create) -->
                <div v-if="!isEditing" class="form-group">
                  <label class="form-label">
                    <Mail :size="14" class="me-1" />
                    Email Address
                  </label>
                  <div class="input-wrapper">
                    <input
                      v-model="form.email"
                      type="email"
                      class="modern-input"
                      placeholder="student@example.com"
                      required
                    />
                  </div>
                </div>

                <!-- Password (only for create) -->
                <div v-if="!isEditing" class="form-group">
                  <label class="form-label">
                    <Lock :size="14" class="me-1" />
                    Password
                  </label>
                  <div class="input-wrapper">
                    <input
                      v-model="form.password"
                      type="password"
                      class="modern-input"
                      placeholder="Min. 8 characters"
                      required
                      minlength="8"
                    />
                  </div>
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
                    </select>
                  </div>
                </div>

                <!-- Class -->
                <div class="form-group">
                  <label class="form-label">
                    <Building2 :size="14" class="me-1" />
                    Class
                  </label>
                  <div class="input-wrapper">
                    <select v-model="form.class_id" class="modern-input">
                      <option :value="null">— No class —</option>
                      <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
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
                  <span>{{ isEditing ? 'Save Changes' : 'Create Student' }}</span>
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
                <h3 style="color: #dc2626;">Delete Student</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body" style="padding: 16px 24px 20px;">
              <p style="font-size: 0.9rem; color: #475569; margin: 0;">
                Are you sure you want to delete <strong>{{ deleteTarget?.user?.name }}</strong>?
              </p>
              <p style="font-size: 0.75rem; color: #ef4444; background: #fef2f2; padding: 8px 12px; border-radius: 8px; margin: 8px 0 0;">
                <AlertTriangle :size="14" style="vertical-align: middle; margin-right: 4px;" />
                <span style="vertical-align: middle;">The student, their profile, and all associated data will be permanently removed.</span>
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
                <h3 style="color: #dc2626;">Delete Students</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeBulkDeleteModal">&times;</button>
            </div>
            <div class="modal-body" style="padding: 16px 24px 20px;">
              <p style="font-size: 0.9rem; color: #475569; margin: 0;">
                Are you sure you want to delete <strong>{{ selectedIds.length }} student(s)</strong>?
              </p>
              <p style="font-size: 0.75rem; color: #ef4444; background: #fef2f2; padding: 8px 12px; border-radius: 8px; line-height: 1.4; margin: 8px 0 0;">
                <AlertTriangle :size="14" style="vertical-align: middle; margin-right: 4px;" />
                <span style="vertical-align: middle;">These students, their profiles, and all associated data will be permanently removed.</span>
              </p>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" @click="closeBulkDeleteModal">Cancel</button>
              <button type="button" class="btn btn-danger" :disabled="formSubmitting" @click="handleBulkDelete">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>Delete {{ selectedIds.length }} student(s)</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Assign Class Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAssignModal" class="modal-overlay" @click.self="closeAssignModal">
          <div class="modal-content-panel" style="max-width: 400px;">
            <div class="modal-head">
              <div class="modal-icon" style="background: #fef3c7; color: #d97706;">
                <ArrowRightFromLine :size="20" />
              </div>
              <div>
                <h3>Assign to Class</h3>
                <p>Assign {{ assignTarget?.user?.name }} to a class</p>
              </div>
              <button class="modal-x" @click="closeAssignModal">&times;</button>
            </div>
            <form @submit.prevent="handleAssign">
              <div class="modal-body" style="padding: 16px 24px 20px;">
                <div class="form-group">
                  <label class="form-label">Select Class</label>
                  <div class="input-wrapper">
                    <select v-model="assignForm.class_id" class="modern-input" required>
                      <option :value="null" disabled>— Choose a class —</option>
                      <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="closeAssignModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="formSubmitting || !assignForm.class_id">
                  <span v-if="formSubmitting" class="spinner-sm"></span>
                  <Check v-else :size="16" />
                  <span>Assign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- View Details Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetailsModal && detailStudent" class="modal-overlay" @click.self="closeDetailsModal">
          <div class="modal-content-panel" style="max-width: 460px;">
            <div class="modal-head">
              <div class="modal-icon" style="background: #dbeafe; color: #2563eb;">
                <IdCard :size="18" />
              </div>
              <div>
                <h3>Student Details</h3>
                <p>Complete information about this student</p>
              </div>
              <button class="modal-x" @click="closeDetailsModal">&times;</button>
            </div>

            <div class="modal-body-custom">
              <!-- Student Avatar & Name -->
              <div class="d-flex align-items-center gap-3 mb-4 pb-3" style="border-bottom: 1px solid #f1f5f9;">
                <div
                  v-if="detailStudent.profile_photo_url"
                  class="detail-avatar-img-wrapper"
                >
                  <img :src="detailStudent.profile_photo_url" :alt="detailStudent.user?.name || 'Student'" class="detail-avatar-img" />
                </div>
                <div
                  v-else
                  class="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0 shadow-sm"
                  :style="{ width: '54px', height: '54px', fontSize: '1.125rem', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }"
                >
                  {{ getInitials(detailStudent.user?.name || '') }}
                </div>
                <div>
                  <h6 class="mb-1 fw-bold" style="color: #0f172a;">{{ detailStudent.user?.name }}</h6>
                  <span class="gender-badge" :class="getGenderClass(detailStudent.user?.gender || '')">
                    {{ detailStudent.user?.gender || '—' }}
                  </span>
                </div>
              </div>

              <!-- Detail Rows -->
              <div class="detail-row">
                <span class="detail-label">Student ID</span>
                <span class="detail-value">
                  <span class="badge bg-light text-dark rounded-pill px-3 py-2">#{{ detailStudent.id }}</span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Student ID Number</span>
                <span class="detail-value">{{ detailStudent.studentNumberSequence?.student_number || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ detailStudent.user?.email || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Gender</span>
                <span class="detail-value">{{ detailStudent.user?.gender || '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Class</span>
                <span class="detail-value">{{ detailStudent.class?.name || 'Not assigned' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value">
                  <span class="status-badge" :class="getStatusClass(detailStudent.user?.status || '')">
                    {{ detailStudent.user?.status || '—' }}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Created</span>
                <span class="detail-value">{{ formatFullDate(detailStudent.created_at) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Updated</span>
                <span class="detail-value">{{ formatFullDate(detailStudent.updated_at) }}</span>
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
import { Plus, AlertTriangle, Search, VenusAndMars, ToggleLeft, MoreVertical, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, X, SquarePen, UserPlus, User as UserIcon, Mail, Lock, Check, IdCard, CheckCircle, AlertCircle, Trash, SearchX, Building2, Minus, ArrowRightFromLine } from '@lucide/vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkDeleteStudents,
  assignStudentToClass,
  type Student,
  type SchoolClass,
} from '@/services/studentService'
import { classService } from '@/services/classService'

// ─── Data ────────────────────────────────────────────────────────────
const students = ref<Student[]>([])
const classes = ref<SchoolClass[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const successMessage = ref('')
const formSubmitting = ref(false)
const formError = ref<string | null>(null)
const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

// ─── Search & Filters ─────────────────────────────────────────────────
const searchQuery = ref('')
const genderFilter = ref('')
const statusFilter = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadStudents()
  }, 700)
}

function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
  loadStudents()
}

function clearAllFilters() {
  searchQuery.value = ''
  genderFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  loadStudents()
}

function applyFilters() {
  currentPage.value = 1
  loadStudents()
}

// ─── Pagination ────────────────────────────────────────────────────────
const currentPage = ref(1)
const perPage = ref(10)
const pageSizeOptions = [5, 10, 25, 50]
const totalStudents = ref(0)
const lastPage = ref(1)

const pagination = computed(() => {
  const total = totalStudents.value
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
  loadStudents()
}

function changePerPage(size: number) {
  perPage.value = size
  currentPage.value = 1
  loadStudents()
}

// ─── Dropdown ─────────────────────────────────────────────────────────
const openDropdownId = ref<number | null>(null)

function toggleDropdown(id: number) {
  openDropdownId.value = openDropdownId.value === id ? null : id
}

function handleClickOutside(e: Event) {
  const target = e.target as HTMLElement
  if (!target.closest('.action-dropdown') && !target.closest('.action-menu') && !target.closest('.action-trigger')) {
    openDropdownId.value = null
  }
}

window.addEventListener('click', handleClickOutside)
onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

// ─── Modal State ──────────────────────────────────────────────────────
const showFormModal = ref(false)
const isEditing = ref(false)
const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const showAssignModal = ref(false)
const showDetailsModal = ref(false)
const deleteTarget = ref<Student | null>(null)
const assignTarget = ref<Student | null>(null)
const detailStudent = ref<Student | null>(null)
const editingStudent = ref<Student | null>(null)

// ─── Form State ───────────────────────────────────────────────────────
const initialForm = () => ({
  name: '',
  email: '',
  password: '',
  gender: '' as string,
  class_id: null as number | null,
  status: 'active' as string,
})

const form = ref(initialForm())
const assignForm = ref({ class_id: null as number | null })

// ─── API Calls ────────────────────────────────────────────────────────
async function loadStudents() {
  try {
    const res = await getStudents()
    // Client-side filtering for search/filters
    let filtered = res.students

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      filtered = filtered.filter((s) => {
        const name = s.user?.name || ''
        const email = s.user?.email || ''
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q)
      })
    }

    if (genderFilter.value) {
      filtered = filtered.filter((s) => s.user?.gender === genderFilter.value)
    }

    if (statusFilter.value) {
      filtered = filtered.filter((s) => s.user?.status === statusFilter.value)
    }

    // Sort by newest first
    filtered.sort((a, b) => b.id - a.id)

    totalStudents.value = filtered.length
    lastPage.value = Math.max(1, Math.ceil(filtered.length / perPage.value))

    // Apply pagination
    const start = (currentPage.value - 1) * perPage.value
    const end = start + perPage.value
    students.value = filtered.slice(start, end)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err.response?.data?.message || err.message || 'Failed to load students'
  } finally {
    loading.value = false
  }
}

async function loadClasses() {
  try {
    const response = await classService.getClasses()
    if (response.success) {
      const data = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean) as SchoolClass[]
      classes.value = data
    }
  } catch {
    // Non-critical; silently ignore
  }
}

async function init() {
  loading.value = true
  await Promise.all([loadStudents(), loadClasses()])
  loading.value = false
}

// ─── Create / Edit ────────────────────────────────────────────────────
function openCreateModal() {
  isEditing.value = false
  editingStudent.value = null
  form.value = initialForm()
  formError.value = null
  showFormModal.value = true
}

function openEditModal(student: Student) {
  isEditing.value = true
  editingStudent.value = student
  form.value = {
    name: student.user?.name ?? '',
    email: '',
    password: '',
    gender: student.user?.gender || '',
    class_id: student.class_id ?? null,
    status: student.user?.status || 'active',
  }
  formError.value = null
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  editingStudent.value = null
}

async function handleFormSubmit() {
  if (!form.value.name.trim()) {
    formError.value = 'Name is required'
    return
  }
  if (!isEditing.value && !form.value.email.trim()) {
    formError.value = 'Email is required'
    return
  }
  if (!isEditing.value && (!form.value.password || form.value.password.length < 8)) {
    formError.value = 'Password must be at least 8 characters'
    return
  }

  formSubmitting.value = true
  formError.value = null

  try {
    if (isEditing.value && editingStudent.value) {
      const res = await updateStudent(editingStudent.value.id, {
        name: form.value.name,
        gender: form.value.gender || undefined,
        status: form.value.status,
        class_id: form.value.class_id,
      })
      const index = students.value.findIndex((s) => s.id === editingStudent.value!.id)
      if (index !== -1) students.value[index] = res.student
      showToast('Student updated successfully')
      closeFormModal()
    } else {
      await createStudent({
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        gender: form.value.gender || undefined,
        status: form.value.status,
        class_id: form.value.class_id,
      })
      showToast('Student created successfully')
      closeFormModal()
      // Reload to get fresh data with pagination
      await loadStudents()
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    formError.value = err.response?.data?.message || err.message || 'Operation failed'
  } finally {
    formSubmitting.value = false
  }
}

// ─── Delete ─────────────────────────────────────────────────────────────
function openDeleteModal(student: Student) {
  deleteTarget.value = student
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
    const res = await deleteStudent(targetId)
    showToast(res.message || 'Student deleted successfully')
    closeDeleteModal()
    await loadStudents()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string }
    const msg = err.response?.data?.message || err.message || ''
    if (err.response?.status === 404 || msg.toLowerCase().includes('not found')) {
      showToast('Student deleted successfully')
      closeDeleteModal()
      await loadStudents()
    } else {
      showToast(msg || 'Failed to delete student', 'error')
    }
  } finally {
    formSubmitting.value = false
  }
}

// ─── Bulk Delete ──────────────────────────────────────────────────────
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
    const res = await bulkDeleteStudents(idsToDelete)
    showToast(res.message || 'Student deleted successfully')
    closeBulkDeleteModal()
    clearSelection()
    await loadStudents()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    showToast(err.response?.data?.message || err.message || 'Failed to delete students', 'error')
  } finally {
    formSubmitting.value = false
  }
}

// ─── Assign Class ─────────────────────────────────────────────────────
function openAssignModal(student: Student) {
  assignTarget.value = student
  assignForm.value = { class_id: student.class_id ?? null }
  showAssignModal.value = true
}

function closeAssignModal() {
  showAssignModal.value = false
  assignTarget.value = null
}

async function handleAssign() {
  if (!assignTarget.value || !assignForm.value.class_id) return
  formSubmitting.value = true
  try {
    const res = await assignStudentToClass(assignTarget.value.id, assignForm.value.class_id)
    const index = students.value.findIndex((s) => s.id === assignTarget.value!.id)
    if (index !== -1) students.value[index] = res.student
    showToast('Student assigned to class successfully')
    closeAssignModal()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    showToast(err.response?.data?.message || err.message || 'Failed to assign class', 'error')
  } finally {
    formSubmitting.value = false
  }
}

// ─── View Details ──────────────────────────────────────────────────────
function viewStudent(student: Student) {
  detailStudent.value = student
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  detailStudent.value = null
}

// ─── Helpers ───────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const safeName = name || ''
  const parts = safeName.split(' ').filter(Boolean)
  return parts.length >= 2
    ? (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
    : safeName.substring(0, 2).toUpperCase()
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
  return ''
}

function getStatusClass(status: string): string {
  if (status === 'active') return 'badge-active'
  if (status === 'inactive') return 'badge-inactive'
  return ''
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// ─── Multi-Select & Bulk Delete ───────────────────────────────────────
const selectedIds = ref<number[]>([])

const isAllPageSelected = computed(() => {
  return students.value.length > 0 && students.value.every(s => selectedIds.value.includes(s.id))
})

const isIndeterminate = computed(() => {
  const some = students.value.some(s => selectedIds.value.includes(s.id))
  return some && !isAllPageSelected.value
})

function toggleSelectAll() {
  if (isAllPageSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !students.value.some(s => s.id === id))
  } else {
    const currentIds = new Set(selectedIds.value)
    students.value.forEach(s => currentIds.add(s.id))
    selectedIds.value = Array.from(currentIds)
  }
}

function toggleSelectStudent(id: number) {
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

// ─── Lifecycle ─────────────────────────────────────────────────────────
onMounted(() => {
  init()
})
</script>

<style scoped>
/* ==================== Page Layout ==================== */
.students-page {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.msg {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.msg-error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
.msg-success { background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }
.msg-close { margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; opacity: 0.5; padding: 0 4px; }
.msg-close:hover { opacity: 1; }

.load-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 4rem;
  color: #64748b;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

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

/* ==================== Card ==================== */
.student-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  flex: 1;
  height: 1px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: box-shadow 0.25s ease;
  position: relative;
}

.student-card:hover {
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

.tb-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
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

/* ==================== Table Area ==================== */
.table-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

/* ==================== Table ==================== */
.table-wrap {
  width: 100%;
  overflow: auto;
  flex: 1;
  min-height: 0;
  height: 1px;
  max-height: calc(100vh - 200px);
  min-height: 100px;
}

.student-table {
  width: 100%;
  height: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

.student-table thead th {
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

.student-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f3f5;
  color: #475569;
  vertical-align: middle;
  font-weight: 500;
}

.student-table tbody td.col-actions {
  overflow: visible;
}

.student-table tbody tr:last-child td { border-bottom: none; }

.col-check {
  width: 48px;
  text-align: center;
  vertical-align: middle;
}

.student-table thead th.col-check,
.student-table tbody td.col-check {
  text-align: center;
  vertical-align: middle;
  padding: 12px 8px !important;
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
  text-align: right;
  width: 80px;
  padding-right: 20px !important;
}

.row-selected {
  background: #f0f5ff !important;
  border-left-color: #2563eb !important;
}

/* ==================== Empty State ==================== */
.empty-state-standalone {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  min-height: 200px;
}

.empty-state-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  max-width: 400px;
}

.empty-state-icon-box {
  margin-bottom: 4px;
}

.empty-state-icon-ring {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
  position: relative;
}

.empty-state-icon-ring::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid rgba(37, 99, 235, 0.08);
}

.empty-state-texts {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.empty-state-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
}

.empty-state-desc {
  font-size: 0.8375rem;
  color: #94a3b8;
  margin: 0;
  max-width: 380px;
  line-height: 1.6;
}

.empty-state-desc strong {
  color: #64748b;
  font-weight: 600;
}

.empty-state-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.55rem 1.25rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.2s ease;
  margin-top: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.empty-state-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1f2937;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.empty-state-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* ==================== Cells ==================== */
.student-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.675rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.3);
}

.student-avatar-img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.student-name {
  font-weight: 500;
  color: #0f172a;
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-val {
  font-size: 0.8125rem;
  color: #64748b;
}

.class-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #374151;
  font-size: 0.8125rem;
}

.class-empty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-style: italic;
  color: #9ca3af;
  font-size: 0.8125rem;
}

.student-row {
  transition: background 0.2s ease;
}

.student-row:hover { background: #f8fafc; }

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
.badge-female { background: #fce7f3; color: #be185d; }

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 100px;
  letter-spacing: 0.01em;
}

.badge-active { background: #dcfce7; color: #16a34a; }
.badge-inactive { background: #f1f5f9; color: #64748b; }

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

/* ==================== Action Dropdown ==================== */
.action-dropdown {
  position: relative;
  display: inline-flex;
}

.action-trigger {
  width: 30px;
  height: 30px;
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
  background: #e5e7eb;
  color: #4b5563;
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
  font-family: inherit;
  transition: all 0.15s ease;
  text-align: left;
  color: #374151;
}

.action-item:hover { background: #f0f5ff; color: #2563eb; }
.action-item.edit:hover { background: #fef3c7; color: #d97706; }
.action-item.view:hover { background: #dbeafe; color: #2563eb; }
.action-item.assign:hover { background: #fef9c3; color: #854d0e; }
.action-item.delete { color: #ef4444; }
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
  font-size: 0.8125rem;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
  margin-top: auto;
}

.pagination-info { display: flex; align-items: center; gap: 8px; color: #64748b; }
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

.pagination-pages { display: flex; align-items: center; gap: 2px; }

.page-nav {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid #e2e8f0;
  background: #fff; color: #64748b;
  border-radius: 8px; cursor: pointer;
  transition: all 0.15s ease;
}
.page-nav:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; background: #f0f5ff; }
.page-nav:disabled { opacity: 0.4; cursor: not-allowed; }

.page-btn {
  min-width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: #475569;
  border-radius: 8px; cursor: pointer;
  font-size: 0.8125rem; font-weight: 500;
  font-family: inherit; transition: all 0.15s ease;
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
  font-family: inherit;
}

@keyframes modal-in { 0%{opacity:0;transform:scale(0.92)translateY(10px)} 100%{opacity:1;transform:scale(1)translateY(0)} }

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
.modal-body { padding: 16px 24px; }

.form-group { margin-bottom: 14px; }

.form-label { display: block; font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 5px; }
.form-label :deep(svg) { color: #94a3b8; }
.input-wrapper { position: relative; }

.modern-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 0.88rem;
  font-family: inherit;
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

.detail-avatar-img-wrapper {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.detail-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ==================== Toast ==================== */
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

.toast-icon { display: flex; flex-shrink: 0; }
.toast-notification.success .toast-icon svg { color: #10b981; }
.toast-notification.error .toast-icon svg { color: #ef4444; }

.toast-message { flex: 1; line-height: 1.4; }

.toast-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.5;
  margin-left: auto;
  padding: 0 4px;
  line-height: 1;
}
.toast-close:hover { opacity: 1; }

@keyframes toastPop {
  0% { opacity: 0; transform: scale(0.85) translateY(-10px); }
  60% { transform: scale(1.03) translateY(2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from, .toast-leave-to { transform: translateX(100%); opacity: 0; }

.modal-enter-active { transition: all 0.25s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
