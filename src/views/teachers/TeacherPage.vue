<template>
  <div class="page-container">
    <!-- ── Toast ── -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast-bar" :class="toast.type">
        <CheckCircle v-if="toast.type === 'success'" :size="16" />
        <AlertCircle v-else :size="16" />
        <span>{{ toast.message }}</span>
        <button class="toast-close" @click="toast.show = false">&times;</button>
      </div>
    </Transition>

    <!-- ── Header ── -->
    <div class="page-head">
      <div class="page-head-left">
        <div class="page-icon">
          <UserCheck :size="22" />
        </div>
        <div>
          <h1 class="page-title">Teachers</h1>
          <p class="page-desc">Manage teacher profiles, departments, and assignments</p>
        </div>
      </div>
      <div class="page-head-right">
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus :size="16" />
          <span>Add Teacher</span>
        </button>
      </div>
    </div>

    <!-- ── Loading (only on initial page load) ── -->
    <div v-if="initialLoading" class="load-state">
      <div class="spinner"></div>
      <span>Loading teachers…</span>
    </div>

    <!-- ── Teacher List ── -->
    <TeacherList
      v-else
      :teachers="teachers"
      :departments="departments"
      :search-query="searchQuery"
      :department-filter="departmentFilter"
      :status-filter="statusFilter"
      :gender-filter="genderFilter"
      :current-page="meta.current_page"
      :last-page="meta.last_page"
      :per-page="meta.per_page"
      :total="meta.total"
      :from="meta.from"
      :to="meta.to"
      @update:search-query="searchQuery = $event"
      @update:department-filter="departmentFilter = $event"
      @update:status-filter="statusFilter = $event"
      @update:gender-filter="genderFilter = $event"
      @update:current-page="meta.current_page = $event; fetchTeachers()"
      @update:per-page="meta.per_page = $event; meta.current_page = 1; fetchTeachers()"
      @search="fetchTeachers()"
      @clear-search="fetchTeachers()"
      @clear-all-filters="fetchTeachers()"
      @view="openDetailsModal"
      @edit="openEditModal"
      @delete="confirmDelete"
      @bulk-delete="openBulkDeleteModal"
    />

    <!-- ── Create Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCreateModal" class="overlay" @click.self="closeCreateModal">
          <div class="modal-card">
            <div class="modal-head">
              <div class="modal-icon icon-add">
                <CirclePlus :size="20" />
              </div>
              <div>
                <h3>New Teacher</h3>
                <p>Fill in the details to create a new teacher</p>
              </div>
              <button class="modal-x" @click="closeCreateModal">&times;</button>
            </div>
            <form @submit.prevent="handleCreate" class="modal-body">
              <div class="row-2">
                <div class="field">
                  <label>Full Name <span class="req">*</span></label>
                  <input
                    v-model="createForm.name"
                    :class="{ err: createErrors.name }"
                    placeholder="e.g. John Doe"
                    required
                  />
                  <span v-if="createErrors.name" class="field-err">{{ createErrors.name }}</span>
                </div>
                <div class="field">
                  <label>Email <span class="req">*</span></label>
                  <input
                    v-model="createForm.email"
                    type="email"
                    :class="{ err: createErrors.email }"
                    placeholder="john@school.edu"
                    required
                  />
                  <span v-if="createErrors.email" class="field-err">{{ createErrors.email }}</span>
                </div>
              </div>
              <div class="row-2">
                <div class="field">
                  <label>Password</label>
                  <input v-model="createForm.password" type="password" placeholder="Leave blank for default" />
                </div>
                <div class="field">
                  <label>Gender</label>
                  <select v-model="createForm.gender">
                    <option value="">— Select —</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div class="row-2">
                <div class="field">
                  <label>Department</label>
                  <select v-model="createForm.department_id">
                    <option :value="null">— Select —</option>
                    <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                      {{ dept.name }}
                    </option>
                  </select>
                </div>
                <div class="field">
                  <label>Status</label>
                  <select v-model="createForm.status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="closeCreateModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="formSubmitting">
                  <span v-if="formSubmitting" class="spinner-sm"></span>
                  <Plus v-else :size="16" />
                  <span>Create Teacher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Edit Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="overlay" @click.self="closeEditModal">
          <div class="modal-card">
            <div class="modal-head">
              <div class="modal-icon icon-edit">
                <SquarePen :size="20" />
              </div>
              <div>
                <h3>Edit Teacher</h3>
                <p>Update teacher details below</p>
              </div>
              <button class="modal-x" @click="closeEditModal">&times;</button>
            </div>
            <form @submit.prevent="handleEdit" class="modal-body">
              <div class="row-2">
                <div class="field">
                  <label>Full Name</label>
                  <input v-model="editForm.name" placeholder="e.g. John Doe" />
                </div>
                <div class="field">
                  <label>Email</label>
                  <input v-model="editForm.email" type="email" placeholder="john@school.edu" />
                </div>
              </div>
              <div class="row-2">
                <div class="field">
                  <label>Gender</label>
                  <select v-model="editForm.gender">
                    <option value="">— Select —</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div class="field">
                  <label>Department</label>
                  <select v-model="editForm.department_id">
                    <option :value="null">— Select —</option>
                    <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                      {{ dept.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="row-2">
                <div class="field">
                  <label>Status</label>
                  <select v-model="editForm.status">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div class="field">
                  <label>New Password <span class="opt">(leave blank to keep)</span></label>
                  <input v-model="editForm.password" type="password" placeholder="New password" />
                </div>
              </div>
              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="closeEditModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="formSubmitting">
                  <span v-if="formSubmitting" class="spinner-sm"></span>
                  <CloudUpload v-else :size="16" />
                  <span>Update Teacher</span>
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
                <h3>Delete Teacher</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">Are you sure you want to delete <strong>{{ selectedTeacher?.user?.name }}</strong>?</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeDeleteModal">Cancel</button>
              <button class="btn btn-danger" @click="handleDelete" :disabled="formSubmitting">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>Delete</span>
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
                <h3>Delete Teachers</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeBulkDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">Are you sure you want to delete <strong>{{ bulkDeleteCount }} teacher{{ bulkDeleteCount !== 1 ? 's' : '' }}</strong>?</p>
              <p class="del-text" style="margin-top: 8px;">All associated data will be permanently removed.</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeBulkDeleteModal">Cancel</button>
              <button class="btn btn-danger" @click="handleBulkDelete" :disabled="formSubmitting">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>Delete {{ bulkDeleteCount }} teacher{{ bulkDeleteCount !== 1 ? 's' : '' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Details Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetailsModal && selectedTeacher" class="overlay" @click.self="closeDetailsModal">
          <div class="modal-card">
            <div class="modal-head">
              <div class="modal-icon icon-info">
                <Eye :size="20" />
              </div>
              <div>
                <h3>Teacher Details</h3>
                <p>Complete information about this teacher</p>
              </div>
              <button class="modal-x" @click="closeDetailsModal">&times;</button>
            </div>
            <div class="modal-body">
              <div class="detail-user-row">
                <div class="detail-avatar detail-avatar-fallback">
                  {{ getInitials(selectedTeacher.user?.name || '') }}
                </div>
                <div>
                  <h4>{{ selectedTeacher.user?.name || '—' }}</h4>
                  <div class="detail-email">{{ selectedTeacher.user?.email || '—' }}</div>
                </div>
              </div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Teacher ID</span>
                  <span class="detail-value">#{{ selectedTeacher.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Department</span>
                  <span class="detail-value">{{ selectedTeacher.department?.name || 'Not assigned' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Gender</span>
                  <span class="detail-value">{{ selectedTeacher.user?.gender || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status</span>
                  <span class="pill" :class="(selectedTeacher.user?.status || '') === 'active' ? 'pill-on' : 'pill-off'">
                    {{ formatStatus(selectedTeacher.user?.status) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Subjects</span>
                  <span class="detail-value">{{ selectedTeacher.subjects_count ?? 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Classes</span>
                  <span class="detail-value">{{ selectedTeacher.classes_count ?? 0 }}</span>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeDetailsModal">Close</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  getTeachers,
  getDepartments,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  bulkDeleteTeachers,
  type Teacher,
  type TeacherDepartment,
  type CreateTeacherPayload,
  type UpdateTeacherPayload,
} from '@/services/teacherService'
import TeacherList from './TeacherList.vue'
import {
  UserCheck,
  Plus,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Trash2,
  CirclePlus,
  SquarePen,
  CloudUpload,
  Eye,
} from '@lucide/vue'

// ─── Toast ─────────────────────────────────────────────────────────
const toast = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.message = msg
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

// ─── Data ──────────────────────────────────────────────────────────
const initialLoading = ref(true)
const formSubmitting = ref(false)
const teachers = ref<Teacher[]>([])
const departments = ref<TeacherDepartment[]>([])

const meta = reactive({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  from: 0,
  to: 0,
})

// ─── Search & Filters (shared with TeacherList via v-model) ────────
const searchQuery = ref('')
const departmentFilter = ref('')
const statusFilter = ref('')
const genderFilter = ref('')

// ─── API ───────────────────────────────────────────────────────────
async function fetchTeachers() {
  try {
    const params: Record<string, string | number | undefined> = {
      page: meta.current_page,
      per_page: meta.per_page,
    }
    if (searchQuery.value) params.search = searchQuery.value
    if (departmentFilter.value) params.department_id = Number(departmentFilter.value)
    if (statusFilter.value) params.status = statusFilter.value
    if (genderFilter.value) params.gender = genderFilter.value

    const res = await getTeachers(params)
    if (res.success) {
      teachers.value = res.data.data
      meta.current_page = res.data.current_page
      meta.last_page = res.data.last_page
      meta.per_page = res.data.per_page
      meta.total = res.data.total
      meta.from = res.data.from ?? 0
      meta.to = res.data.to ?? 0
    }
  } catch (err) {
    showToast('Failed to load teachers', 'error')
  } finally {
  }
}

async function fetchDepartments() {
  try {
    const res = await getDepartments()
    if (res.success) departments.value = res.data
  } catch {
    departments.value = []
  }
}

// ─── Helpers ───────────────────────────────────────────────────────
function getInitials(name: string): string {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatStatus(status?: string | null): string {
  if (!status) return 'Inactive'
  switch (status) {
    case 'active': return 'Active'
    case 'inactive': return 'Inactive'
    case 'suspended': return 'Suspended'
    default: return status
  }
}

// ─── Modal State ───────────────────────────────────────────────────
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const showDetailsModal = ref(false)
const selectedTeacher = ref<Teacher | null>(null)
const bulkDeleteIds = ref<number[]>([])
const bulkDeleteCount = ref(0)

// ─── Create Form ───────────────────────────────────────────────────
const createForm = reactive({
  name: '', email: '', password: '',
  department_id: null as number | null,
  gender: '', status: 'active',
})
const createErrors = reactive({ name: '', email: '' })

function openCreateModal() {
  Object.assign(createForm, { name: '', email: '', password: '', department_id: null, gender: '', status: 'active' })
  createErrors.name = ''; createErrors.email = ''
  showCreateModal.value = true
}

function closeCreateModal() { showCreateModal.value = false }

function validateCreateForm(): boolean {
  let valid = true
  if (!createForm.name.trim()) { createErrors.name = 'Name is required'; valid = false } else createErrors.name = ''
  if (!createForm.email.trim()) { createErrors.email = 'Email is required'; valid = false } else createErrors.email = ''
  return valid
}

async function handleCreate() {
  if (!validateCreateForm()) return
  formSubmitting.value = true
  try {
    const payload: CreateTeacherPayload = {
      name: createForm.name,
      email: createForm.email,
      department_id: createForm.department_id,
      gender: createForm.gender || undefined,
      status: createForm.status,
    }
    if (createForm.password) payload.password = createForm.password
    const res = await createTeacher(payload)
    if (res.success) {
      showToast('Teacher created successfully')
      closeCreateModal()
      await fetchTeachers()
    }
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to create teacher', 'error')
  } finally {
    formSubmitting.value = false
  }
}

// ─── Edit Form ─────────────────────────────────────────────────────
const editForm = reactive({
  name: '', email: '', password: '',
  department_id: null as number | null,
  gender: '', status: 'active',
})

function openEditModal(teacher: Teacher) {
  selectedTeacher.value = teacher
  editForm.name = teacher.user?.name || ''
  editForm.email = teacher.user?.email || ''
  editForm.password = ''
  editForm.department_id = teacher.department_id
  editForm.gender = teacher.user?.gender || ''
  editForm.status = teacher.user?.status || 'active'
  showEditModal.value = true
}

function closeEditModal() { showEditModal.value = false; selectedTeacher.value = null }

async function handleEdit() {
  if (!selectedTeacher.value) return
  formSubmitting.value = true
  try {
    const payload: UpdateTeacherPayload = {
      name: editForm.name || undefined,
      email: editForm.email || undefined,
      department_id: editForm.department_id,
      gender: editForm.gender || undefined,
      status: editForm.status,
    }
    if (editForm.password) payload.password = editForm.password
    const res = await updateTeacher(selectedTeacher.value.id, payload)
    if (res.success) {
      showToast('Teacher updated successfully')
      closeEditModal()
      await fetchTeachers()
    }
  } catch (err: any) {
    showToast(err?.response?.data?.message || 'Failed to update teacher', 'error')
  } finally {
    formSubmitting.value = false
  }
}

// ─── Delete ────────────────────────────────────────────────────────
function confirmDelete(teacher: Teacher) {
  selectedTeacher.value = teacher
  showDeleteModal.value = true
}

function closeDeleteModal() { showDeleteModal.value = false; selectedTeacher.value = null }

async function handleDelete() {
  if (!selectedTeacher.value) return
  formSubmitting.value = true
  try {
    const res = await deleteTeacher(selectedTeacher.value.id)
    if (res.success) {
      showToast('Teacher deleted successfully')
      closeDeleteModal()
      await fetchTeachers()
    }
  } catch {
    showToast('Failed to delete teacher', 'error')
  } finally {
    formSubmitting.value = false
  }
}

// ─── Bulk Delete ───────────────────────────────────────────────────
function openBulkDeleteModal(ids: number[]) {
  if (ids.length === 0) return
  bulkDeleteIds.value = ids
  bulkDeleteCount.value = ids.length
  showBulkDeleteModal.value = true
}

function closeBulkDeleteModal() {
  showBulkDeleteModal.value = false
  bulkDeleteIds.value = []
}

async function handleBulkDelete() {
  if (bulkDeleteIds.value.length === 0) return
  formSubmitting.value = true
  try {
    const res = await bulkDeleteTeachers([...bulkDeleteIds.value])
    if (res.success) {
      showToast(`${res.data.deleted_count} teacher(s) deleted successfully`)
      bulkDeleteIds.value = []
      closeBulkDeleteModal()
      await fetchTeachers()
    }
  } catch {
    showToast('Failed to delete teachers', 'error')
  } finally {
    formSubmitting.value = false
  }
}

// ─── Details Modal ─────────────────────────────────────────────────
function openDetailsModal(teacher: Teacher) {
  selectedTeacher.value = teacher
  showDetailsModal.value = true
}

function closeDetailsModal() { showDetailsModal.value = false; selectedTeacher.value = null }

// ─── Init ──────────────────────────────────────────────────────────
onMounted(async () => {
  initialLoading.value = true
  try {
    await Promise.all([fetchTeachers(), fetchDepartments()])
  } catch {
    showToast('Failed to load initial data', 'error')
  } finally {
    initialLoading.value = false
  }
})
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   GLOBAL
   ══════════════════════════════════════════════════════════════ */
.page-container {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1rem 1.5rem 2rem;
  font-family: 'Inter', 'Noto Sans Khmer', system-ui, sans-serif;
  color: #0f172a;
  max-width: 1440px;
}

.page-icon {
  width: 44px; height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eef2ff, #dbeafe);
  color: #2563eb;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* ══════════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════════ */
.page-head {
  display: flex;
  align-items: center; justify-content: space-between;
  margin-bottom: 1.25rem; gap: 16px; flex-wrap: wrap;
}
.page-head-left { display: flex; align-items: center; gap: 14px; }
.page-title { font-size: 1.4rem; font-weight: 800; margin: 0 0 2px; letter-spacing: -0.025em; }
.page-desc { font-size: 0.8rem; color: #64748b; margin: 0; }
.page-head-right { display: flex; align-items: center; gap: 10px; }

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
@keyframes spin { to { transform: rotate(360deg); } }

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
.icon-info { background: #dbeafe; color: #2563eb; }

.modal-x {
  position: absolute; top: 16px; right: 16px;
  background: none; border: none; font-size: 1.5rem;
  color: #94a3b8; cursor: pointer; line-height: 1; padding: 4px;
}
.modal-x:hover { color: #475569; }

.modal-body { padding: 16px 24px 20px; }
.modal-foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 24px 20px;
}

/* ── Form Fields ── */
.field { margin-bottom: 14px; }
.field label { display: block; font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 5px; }
.req { color: #ef4444; }
.opt { color: #94a3b8; font-weight: 400; }

.field input, .field select {
  width: 100%; padding: 8px 12px; border: 1.5px solid #d1d5db;
  border-radius: 8px; font-size: 0.88rem; outline: none;
  transition: border-color 0.15s; box-sizing: border-box; font-family: inherit;
  background: #fff; color: #0f172a;
}
.field input:focus, .field select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
.field input.err { border-color: #ef4444; }
.field-err { display: block; font-size: 0.75rem; color: #ef4444; margin-top: 3px; font-weight: 500; }

.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.del-text { font-size: 0.9rem; color: #475569; margin: 0; }

/* ── Pill Badges ── */
.pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 600; letter-spacing: 0.02em;
}
.pill-on { background: #dcfce7; color: #16a34a; }
.pill-off { background: #f1f5f9; color: #94a3b8; }

/* ══════════════════════════════════════════════════════════════
   DETAILS MODAL
   ══════════════════════════════════════════════════════════════ */
.detail-user-row {
  display: flex; align-items: center; gap: 14px;
  padding-bottom: 16px; margin-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}
.detail-user-row h4 { font-size: 1rem; font-weight: 700; margin: 0 0 2px; }
.detail-email { font-size: 0.82rem; color: #64748b; }

.detail-avatar {
  width: 54px; height: 54px; border-radius: 50%;
  overflow: hidden; flex-shrink: 0;
}
.detail-avatar-fallback {
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff; font-weight: 700; font-size: 1.125rem;
  box-shadow: 0 2px 8px rgba(37,99,235,0.25);
}

.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.detail-item {
  display: flex; flex-direction: column; gap: 2px;
  padding: 10px 12px;
  background: #f8fafc; border-radius: 10px;
}
.detail-label { font-size: 0.72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
.detail-value { font-size: 0.88rem; color: #0f172a; font-weight: 600; }

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
   TRANSITIONS
   ══════════════════════════════════════════════════════════════ */
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { transform: translateX(100%); opacity: 0; }

.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card, .modal-leave-to .modal-card { transform: scale(0.92) translateY(10px); }

/* ══════════════════════════════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .page-container { padding: 0.75rem 1rem; }
  .page-head { flex-direction: column; align-items: flex-start; }
  .page-head-right { width: 100%; }
  .page-head-right .btn { flex: 1; justify-content: center; }
  .row-2 { grid-template-columns: 1fr; }
}
</style>