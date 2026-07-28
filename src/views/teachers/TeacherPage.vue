<template>
  <div class="teachers-page">
    <LoadingState v-if="loading && teachers.length === 0" message="Loading teachers..." />

    <div v-else-if="error" class="d-flex align-items-center gap-2 p-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.875rem;">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <div v-else class="teacher-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input v-model="searchQuery" type="text" class="search-input" placeholder="Search by name, email, or gender..." @input="onSearchInput" />
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
          <button v-if="canCreate" class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold" style="border-radius: 0.625rem; background: #2563eb; padding: 0.35rem 0.875rem; font-size: 0.8125rem; flex-shrink: 0;" @click="openCreateModal">
            <Plus :size="15" />
            Add Teacher
          </button>
          <span class="count-badge">{{ totalTeachers }} teacher{{ totalTeachers !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <div v-if="canDelete && selectedIds.length > 0" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} selected</span>
        <button class="bulk-delete-btn" @click="openBulkDeleteModal"><Trash :size="16" /> Delete Selected</button>
        <button class="bulk-clear-btn" @click="clearSelection">Clear Selection</button>
      </div>

      <div v-if="teachers.length === 0" class="empty-container">
        <EmptyState title="No teachers found" :message="searchQuery ? 'Try a different search term.' : 'No teachers match the current filter.'">
          <template #icon><Inbox :size="24" /></template>
        </EmptyState>
      </div>          <div v-else class="table-wrap">
        <DataTable :columns="columns" :data="users" :row-key="(row) => (row as TeacherUser).id" :row-class="(row) => ({ 'row-selected': selectedIds.includes((row as TeacherUser).id) })" @row-dblclick="(row) => canUpdate && openEditModal(row as TeacherUser)">
          <template v-if="canDelete" #header-check>
            <div class="col-check" @click.stop @dblclick.stop>
              <input type="checkbox" class="table-checkbox" :checked="isAllPageSelected" :indeterminate="isIndeterminate" @change="toggleSelectAll" />
            </div>
          </template>
          <template v-if="canDelete" #cell-check="{ row }">
            <div class="col-check" @click.stop @dblclick.stop>
              <input type="checkbox" class="table-checkbox" :checked="selectedIds.includes((row as TeacherUser).id)" @change="toggleSelectTeacher((row as TeacherUser).id)" />
            </div>
          </template>
          <template #cell-index="{ index }">
            <span class="col-index">{{ pagination.from + index }}</span>
          </template>
          <template #cell-name="{ row }">
            <div class="teacher-cell">
              <div class="teacher-avatar"><UserCheck :size="16" /></div>
              <span class="teacher-name">{{ (row as TeacherUser).name }}</span>
            </div>
          </template>
          <template #cell-email="{ row }">
            <span class="email-cell">{{ (row as TeacherUser).email }}</span>
          </template>
          <template #cell-gender="{ row }">
            <span class="gender-badge" :class="getGenderClass((row as TeacherUser).gender || '')">{{ (row as TeacherUser).gender || '—' }}</span>
          </template>
          <template #cell-status="{ row }">
            <span class="status-badge" :class="getStatusClass((row as TeacherUser).status)">{{ (row as TeacherUser).status }}</span>
          </template>
          <template #cell-actions="{ row }">
            <div class="actions-cell" @click.stop @dblclick.stop>
              <button class="act-btn" @click="viewTeacher(row as TeacherUser)" title="View Details"><Eye :size="15" /></button>
              <button v-if="canUpdate" class="act-btn" @click="openEditModal(row as TeacherUser)" title="Edit"><Pencil :size="15" /></button>
              <button v-if="canDelete" class="act-btn act-danger" @click="confirmDelete(row as TeacherUser)" title="Delete"><Trash2 :size="15" /></button>
            </div>
          </template>
        </DataTable>
      </div>

      <div v-if="totalTeachers > 0" class="pagination-bar">
        <div class="pagination-info">
          <span class="rows-label">Rows per page:</span>
          <div class="rows-selector">
            <button v-for="size in pageSizeOptions" :key="size" class="rows-btn" :class="{ active: perPage === size }" @click="changePerPage(size)">{{ size }}</button>
          </div>
        </div>
        <div class="pagination-pages">
          <button class="page-nav" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)"><ChevronLeft :size="16" /></button>
          <template v-for="page in visiblePages" :key="page">
            <button v-if="page !== '...'" class="page-btn" :class="{ active: currentPage === page }" @click="changePage(page as number)">{{ page }}</button>
            <span v-else class="page-dots">…</span>
          </template>
          <button class="page-nav" :disabled="currentPage >= lastPage" @click="changePage(currentPage + 1)"><ChevronRight :size="16" /></button>
        </div>
        <div class="pagination-total">{{ pagination.from }}-{{ pagination.to }} of {{ totalTeachers }}</div>
      </div>
    </div>

    <!-- Form Modal -->
    <Modal v-model="showFormModal" maxWidth="520px">
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
          <div v-if="formError" class="error-alert"><AlertTriangle :size="16" class="me-2" /> {{ formError }}</div>

          <div class="form-group">
            <label class="form-label"><UserIcon :size="15" class="field-icon" /> Full Name <span class="req">*</span></label>
            <div class="input-wrap"><input v-model="form.name" type="text" class="styled-input" :class="{ err: formError && !form.name.trim() }" placeholder="e.g. John Smith" required /></div>
            <span v-if="formError && !form.name.trim()" class="field-err">Full name is required</span>
          </div>
          <div class="section-divider"></div>
          <div class="form-group">
            <label class="form-label"><Mail :size="15" class="field-icon" /> Email Address <span class="req">*</span></label>
            <div class="input-wrap"><input v-model="form.email" type="email" class="styled-input" :class="{ err: formError && !form.email.trim() }" placeholder="teacher@example.com" required /></div>
            <span v-if="formError && !form.email.trim()" class="field-err">Email is required</span>
          </div>
          <div class="section-divider"></div>
          <div class="form-group">
            <label class="form-label"><Lock :size="15" class="field-icon" /> Password <span v-if="!isEditing" class="req">*</span></label>
            <div class="input-wrap"><input v-model="form.password" type="password" class="styled-input" :class="{ err: formError && !isEditing && (!form.password || form.password.length < 8) }" :placeholder="isEditing ? 'Leave blank to keep current' : 'Min. 8 characters'" :required="!isEditing" minlength="8" /></div>
            <p v-if="isEditing" class="field-hint">Leave blank to keep the current password</p>
            <span v-if="formError && !isEditing && (!form.password || form.password.length < 8)" class="field-err">Password must be at least 8 characters</span>
          </div>
          <div class="section-divider"></div>
          <div class="row-2">
            <div class="form-group">
              <label class="form-label"><VenusAndMars :size="15" class="field-icon" /> Gender</label>
              <div class="input-wrap">
                <select v-model="form.gender" class="styled-input">
                  <option value="">— Select gender —</option>
                  <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label"><ToggleLeft :size="15" class="field-icon" /> Status <span class="req">*</span></label>
              <div class="input-wrap">
                <select v-model="form.status" class="styled-input" required>
                  <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
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
    </Modal>

    <!-- Detail Modal -->
    <Modal v-model="showDetailsModal" maxWidth="720px">
      <div class="modal-head">
        <button class="modal-x" @click="closeDetailsModal">&times;</button>
      </div>
      <div class="modal-body-custom" v-if="detailTeacher">
        <div class="info-header">
          <div class="info-avatar">{{ getInitials(detailTeacher.name) }}</div>
          <div class="info-heading"><h4>{{ detailTeacher.name }}</h4><span class="info-role">{{ detailTeacher.role?.name || 'Teacher' }}</span></div>
        </div>
        <div class="info-card">
          <div class="info-row"><span class="info-label"><Mail :size="14" /> Email</span><span class="info-value">{{ detailTeacher.email }}</span></div>
          <div class="info-row"><span class="info-label"><VenusAndMars :size="14" /> Gender</span><span class="info-value">{{ detailTeacher.gender || '—' }}</span></div>
          <div class="info-row"><span class="info-label"><BookOpen :size="14" /> Subjects</span><span v-if="teacherSubjects" class="info-value">{{ teacherSubjects.join(', ') }}</span><span v-else class="info-value">—</span></div>
          <div class="info-row"><span class="info-label"><Users :size="14" /> Classes</span><span v-if="teacherClasses" class="info-value">{{ teacherClasses.join(', ') }}</span><span v-else class="info-value">—</span></div>
          <div class="info-row"><span class="info-label"><ToggleLeft :size="14" /> Status</span><span class="info-value" :class="'status-' + detailTeacher.status">{{ detailTeacher.status }}</span></div>
          <div class="info-row info-row-last"><span class="info-label"><Calendar :size="14" /> Created</span><span class="info-value">{{ formatFullDate(detailTeacher.created_at) }}</span></div>
        </div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-ghost" @click="closeDetailsModal">Close</button>
        <button type="button" class="btn btn-primary" @click="openEditFromDetails"><Pencil :size="15" /> <span>Edit Teacher</span></button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import {
  UserCheck, Plus, AlertTriangle, Search, ToggleLeft, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, SquarePen, UserPlus,
  User as UserIcon, Mail, Lock, VenusAndMars, Check, Trash, Inbox, BookOpen, Users, Calendar,
} from '@lucide/vue'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import type { User, UserRole, CreateUserPayload, UpdateUserPayload } from '@/services/userService'
import { getUser } from '@/services/userService'
import { usePermission } from '@/composables/usePermission'
import DataTable from '@/components/DataTable.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'

interface TeacherUser extends User {}

const store = useUserStore()
const { users, loading, error, totalUsers, lastPage } = storeToRefs(store)
const toast = useToast()
const { confirm } = useConfirm()
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
  searchTimeout = setTimeout(() => { currentPage.value = 1; loadTeachers() }, 400)
}
function applyFilters() { currentPage.value = 1; loadTeachers() }

const currentPage = ref(1)
const perPage = ref(10)
const pageSizeOptions = [10, 25, 50]

const pagination = computed(() => {
  const total = totalTeachers.value
  const page = currentPage.value
  const size = perPage.value
  return { from: (page - 1) * size + 1, to: Math.min(page * size, total) }
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = lastPage.value
  const current = currentPage.value
  if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); return pages }
  pages.push(1)
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

function changePage(page: number) { currentPage.value = page; loadTeachers() }
function changePerPage(size: number) { perPage.value = size; currentPage.value = 1; loadTeachers() }

const teachers = computed(() => users.value)
const totalTeachers = computed(() => totalUsers.value)

const columns = computed(() => [
  ...(canDelete.value ? [{ key: 'check', label: '', width: '48px' }] : []),
  { key: 'index', label: '#', width: '64px' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'gender', label: 'Gender' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', width: '120px' },
])

const showFormModal = ref(false)
const isEditing = ref(false)
const showDetailsModal = ref(false)
const editingTeacher = ref<TeacherUser | null>(null)
const detailTeacher = ref<TeacherUser | null>(null)

const initialForm = () => ({ name: '', email: '', password: '', gender: '' as string, status: 'active' as string })
const form = ref(initialForm())

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
  if (teacherRole) { teacherRoleId.value = teacherRole.id; return teacherRole.id }
  return null
}

async function loadTeachers() {
  const roleId = await getTeacherRoleId()
  if (!roleId) return
  const params: Record<string, string | number> = { page: currentPage.value, per_page: perPage.value, role_id: roleId }
  if (searchQuery.value) params.search = searchQuery.value
  if (statusFilter.value) params.status = statusFilter.value
  if (genderFilter.value) params.gender = genderFilter.value
  await store.fetchUsers(params)
}

function openCreateModal() {
  isEditing.value = false; editingTeacher.value = null
  form.value = initialForm(); formError.value = null; showFormModal.value = true
}

function openEditModal(teacher: TeacherUser) {
  isEditing.value = true; editingTeacher.value = teacher
  form.value = { name: teacher.name, email: teacher.email, password: '', gender: teacher.gender || '', status: teacher.status }
  formError.value = null; showFormModal.value = true
}

function closeFormModal() { showFormModal.value = false; editingTeacher.value = null }

async function handleFormSubmit() {
  if (!form.value.name.trim()) { formError.value = 'Name is required'; return }
  if (!form.value.email.trim()) { formError.value = 'Email is required'; return }
  if (!isEditing.value && (!form.value.password || form.value.password.length < 8)) { formError.value = 'Password must be at least 8 characters'; return }
  const roleId = teacherRoleId.value
  if (!roleId) { formError.value = 'Teacher role not found.'; return }
  formSubmitting.value = true; formError.value = null
  try {
    if (isEditing.value && editingTeacher.value) {
      const payload: UpdateUserPayload = { name: form.value.name, email: form.value.email, role_id: roleId, gender: form.value.gender || undefined, status: form.value.status }
      if (form.value.password) payload.password = form.value.password
      const result = await store.updateUser(editingTeacher.value.id, payload)
      if (result.success) { toast.success(result.message || 'Teacher updated successfully'); closeFormModal(); await loadTeachers() }
      else { formError.value = result.message }
    } else {
      const payload: CreateUserPayload = { name: form.value.name, email: form.value.email, password: form.value.password, role_id: roleId, gender: form.value.gender || undefined, status: form.value.status }
      const result = await store.createUser(payload)
      if (result.success) { toast.success(result.message || 'Teacher created successfully'); closeFormModal(); await loadTeachers() }
      else { formError.value = result.message }
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    formError.value = err.response?.data?.message || err.message || 'Operation failed'
  } finally { formSubmitting.value = false }
}

const selectedIds = ref<number[]>([])

const isAllPageSelected = computed(() => teachers.value.length > 0 && teachers.value.every((t: any) => selectedIds.value.includes(t.id)))
const isIndeterminate = computed(() => { const some = teachers.value.some((t: any) => selectedIds.value.includes(t.id)); return some && !isAllPageSelected.value })

function toggleSelectAll() {
  if (isAllPageSelected.value) { selectedIds.value = selectedIds.value.filter((id: number) => !teachers.value.some((t: any) => t.id === id)) }
  else { const currentIds = new Set(selectedIds.value); teachers.value.forEach((t: any) => currentIds.add(t.id)); selectedIds.value = Array.from(currentIds) }
}
function toggleSelectTeacher(id: number) { const idx = selectedIds.value.indexOf(id); idx === -1 ? selectedIds.value.push(id) : selectedIds.value.splice(idx, 1) }
function clearSelection() { selectedIds.value = [] }

async function confirmDelete(teacher: TeacherUser) {
  const ok = await confirm({
    title: 'Delete Teacher',
    message: `Are you sure you want to delete "${teacher.name}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!ok) return
  formSubmitting.value = true
  try {
    const result = await store.deleteUser(teacher.id)
    if (result.success) {
      toast.success('Teacher deleted successfully')
      await loadTeachers()
    } else { toast.error(result.message || 'Failed to delete teacher') }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    toast.error(err.response?.data?.message || err.message || 'Failed to delete teacher')
  } finally { formSubmitting.value = false }
}

function openBulkDeleteModal() {
  confirm({
    title: 'Delete Teachers',
    message: `Are you sure you want to delete ${selectedIds.value.length} teacher(s)? These teachers and all associated data will be permanently removed.`,
    confirmLabel: `Delete ${selectedIds.value.length} teacher(s)`,
    danger: true,
  }).then(async (ok) => {
    if (!ok) return
    const idsToDelete = [...selectedIds.value]
    formSubmitting.value = true
    try {
      const result = await store.bulkDeleteUsers(idsToDelete)
      if (result.success) {
        toast.success(`${idsToDelete.length} teacher(s) deleted successfully`)
        clearSelection()
        await loadTeachers()
      } else { toast.error(result.message || 'Failed to delete teachers') }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      toast.error(err.response?.data?.message || err.message || 'Failed to delete teachers')
    } finally { formSubmitting.value = false }
  })
}

async function viewTeacher(teacher: TeacherUser) {
  try {
    const res = await getUser(teacher.id)
    detailTeacher.value = res.data as TeacherUser
  } catch { detailTeacher.value = teacher }
  showDetailsModal.value = true
}

function closeDetailsModal() { showDetailsModal.value = false; detailTeacher.value = null }

function openEditFromDetails() {
  if (detailTeacher.value) { const teacher = detailTeacher.value; closeDetailsModal(); openEditModal(teacher) }
}

function getGenderClass(gender: string): string {
  if (gender === 'Male') return 'badge-male'
  if (gender === 'Female') return 'badge-female'
  return ''
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function getStatusClass(status: string): string {
  if (status === 'active') return 'badge-active'
  if (status === 'inactive') return 'badge-inactive'
  if (status === 'suspended') return 'badge-suspended'
  return ''
}

function formatFullDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await store.fetchRoles()
  await getTeacherRoleId()
  if (teacherRoleId.value) { currentPage.value = 1; await loadTeachers() }
})
</script>

<style scoped>
.teachers-page {
  height: calc(100vh - 96px); width: calc(100% + 12px); margin-top: -6px; margin-left: -6px;
  display: flex; flex-direction: column; overflow: hidden; font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}
.teacher-card {
  background: #fff; border: 1px solid #e9ecef; border-radius: 16px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); flex: 1; height: 1px;
  display: flex; flex-direction: column; min-height: 0; transition: box-shadow 0.25s ease;
}
.teacher-card:hover { box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
.table-wrap { width: 100%; overflow: auto; flex: 1; min-height: 0; }
.table-wrap :deep(.data-table-wrapper) { border: none; border-radius: 0; box-shadow: none; }
.col-check { text-align: center; }
.table-checkbox { width: 16px; height: 16px; accent-color: #2563eb; cursor: pointer; display: block; margin: 0 auto; }
.col-index { color: #94a3b8; font-weight: 600; }
.actions-cell { text-align: center; white-space: nowrap; }
.teacher-cell { display: flex; align-items: center; gap: 8px; }
.teacher-avatar { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #2563eb; color: #fff; flex-shrink: 0; box-shadow: 0 2px 6px rgba(37,99,235,0.25); }
.teacher-name { font-weight: 600; color: #0f172a; font-size: 0.85rem; }
.email-cell { font-size: 0.8125rem; color: #64748b; }
.field-hint { font-size: 0.75rem; color: #94a3b8; margin: 4px 0 0; }
.modal-head { display: flex; align-items: center; gap: 14px; padding: 20px 24px 0; position: relative; }
.modal-head h3 { font-size: 1.05rem; font-weight: 700; margin: 0 0 2px; }
.modal-head p { font-size: 0.82rem; color: #64748b; margin: 0; }
.modal-x { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; line-height: 1; padding: 4px; }
.modal-x:hover { color: #475569; }
.modal-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.icon-create { background: #dbeafe; color: #2563eb; }
.icon-edit { background: #fef3c7; color: #d97706; }
.modal-body-custom { padding: 16px 24px 20px; }
.form-group { margin-bottom: 0; }
.form-label { display: flex; align-items: center; gap: 6px; font-size: 0.81rem; font-weight: 600; color: #374151; margin-bottom: 7px; }
.field-icon { color: #94a3b8; flex-shrink: 0; }
.req { color: #ef4444; font-weight: 700; }
.field-err { display: block; font-size: 0.75rem; color: #ef4444; margin-top: 4px; font-weight: 500; }
.input-wrap { position: relative; }
.styled-input { width: 100%; padding: 10px 12px; font-size: 0.88rem; font-family: inherit; color: #0f172a; background: #fff; border: 1.5px solid #d1d5db; border-radius: 10px; outline: none; transition: all 0.2s ease; box-sizing: border-box; }
.styled-input:hover { border-color: #9ca3af; }
.styled-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.styled-input.err { border-color: #ef4444; }
select.styled-input { cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }
.section-divider { height: 1px; background: linear-gradient(to right, transparent, #e2e8f0, transparent); margin: 14px 0 16px; }
.error-alert { display: flex; align-items: center; padding: 10px 14px; font-size: 0.8125rem; color: #991b1b; background: #fef2f2; border-radius: 10px; margin-bottom: 16px; border-left: 4px solid #ef4444; }
.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 24px 20px; }
.empty-container { display: flex; align-items: center; justify-content: center; flex: 1; padding: 3rem; }

.info-header { display: flex; align-items: center; gap: 20px; padding: 0 0 24px; }
.info-avatar { width: 60px; height: 60px; border-radius: 50%; background: #e2e8f0; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 600; flex-shrink: 0; }
.info-heading h4 { font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
.info-role { font-size: 0.82rem; color: #94a3b8; font-weight: 500; }
.info-card { background: #f8fafc; border: 1px solid #e9ecef; border-radius: 12px; overflow: hidden; }
.info-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #e9ecef; }
.info-row-last { border-bottom: none; }
.info-label { display: flex; align-items: center; gap: 7px; font-size: 0.83rem; font-weight: 500; color: #64748b; white-space: nowrap; }
.info-label svg { color: #94a3b8; flex-shrink: 0; }
.info-value { font-size: 0.88rem; font-weight: 500; color: #0f172a; text-align: right; max-width: 65%; overflow-wrap: break-word; }
.status-active { color: #16a34a; font-weight: 600; }
.status-inactive { color: #94a3b8; font-weight: 600; }
.status-suspended { color: #dc2626; font-weight: 600; }
.table-wrap::-webkit-scrollbar { width: 4px; height: 4px; }
.table-wrap::-webkit-scrollbar-track { background: transparent; }
.table-wrap::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
.table-wrap::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
