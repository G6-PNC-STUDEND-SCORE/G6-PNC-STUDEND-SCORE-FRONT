<template>
  <div :class="['class-page', { 'dark-mode': theme.isDark }]">
    <!-- ── Store Messages ── -->
    <div v-if="store.error" class="msg msg-error">
      <AlertTriangle :size="16" />
      {{ store.error }}
      <button class="msg-close" @click="store.clearMessages()">&times;</button>
    </div>
    <div v-if="store.successMessage" class="msg msg-success">
      <CheckCircle :size="16" />
      {{ store.successMessage }}
      <button class="msg-close" @click="store.clearMessages()">&times;</button>
    </div>

    <!-- ── Loading ── -->
    <div v-if="store.loading && store.classes.length === 0" class="load-state">
      <div class="spinner"></div>
      <span>Loading classes…</span>
    </div>

    <!-- ── Content ── -->
    <template v-else>
      <div class="class-card">
        <!-- Toolbar -->
        <div class="toolbar">
          <div class="toolbar-left">
            <div class="search-box">
              <Search :size="16" class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                class="search-input"
                placeholder="Search classes..."
                @input="onSearchInput"
              />
              <button v-if="searchQuery" class="tb-clear" @click="clearSearch">
                <X :size="14" />
              </button>
            </div>
            <div class="filter-group">
              <label class="filter-label">
                <ToggleLeft :size="16" />
                <span>Status</span>
                <select v-model="statusFilter" class="filter-select" @change="onFilterChange">
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>
          <div class="toolbar-right">
            <button
              class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold"
              style="border-radius: 0.625rem; background: #2563eb; padding: 0.35rem 0.875rem; font-size: 0.8125rem; flex-shrink: 0;"
              @click="openAddModal"
            >
              <Plus :size="15" />
              Add Class
            </button>
            <span class="count-badge">
              {{ store.totalClasses }} class{{ store.totalClasses !== 1 ? 'es' : '' }}
            </span>
          </div>
        </div>

        <!-- Bulk Action Bar -->
        <div v-if="selectedIds.length > 0" class="bulk-bar">
          <span class="bulk-count">{{ selectedIds.length }} selected</span>
          <button class="bulk-delete-btn" @click="confirmBulkDelete">
            <Trash :size="16" />
            Delete Selected
          </button>
          <button class="bulk-clear-btn" @click="clearSelection">Clear Selection</button>
        </div>

        <!-- Table + Empty State (using v-show to prevent DOM rebuild) -->
        <div class="table-area">
          <div class="table-wrap" v-show="store.classes.length > 0">
            <table class="class-table">
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
                  <th>Class</th>
                  <th>Generation</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(cls, index) in store.classes"
                  :key="cls.id"
                  class="class-row"
                  :class="{ 'row-selected': selectedIds.includes(cls.id) }"
                >
                  <td class="col-check" @click.stop>
                    <input
                      type="checkbox"
                      class="table-checkbox"
                      :checked="selectedIds.includes(cls.id)"
                      @change="toggleSelectUser(cls.id)"
                    />
                  </td>
                  <td class="col-index">{{ pagination.from + index }}</td>
                  <td>
                    <div class="user-cell">
                      <div class="class-avatar">
                        <Users :size="16" />
                      </div>
                      <span class="user-name">{{ cls.name }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="meta-val">{{ cls.academicYear?.name || '—' }}</span>
                  </td>
                  <td>
                    <span class="meta-val">{{ cls.room || '—' }}</span>
                  </td>
                  <td>
                    <span class="status-badge" :class="cls.is_active ? 'badge-active' : 'badge-inactive'">
                      {{ cls.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="col-actions" @click.stop>
                    <div class="action-dropdown">
                      <button
                        class="action-trigger"
                        :title="`Actions for ${cls.name}`"
                        @click.stop="toggleDropdown(cls.id)"
                      >
                        <MoreVertical :size="18" />
                      </button>
                      <Transition name="dropdown">
                        <div v-if="openDropdownId === cls.id" class="action-menu">
                          <button class="action-item edit" @click.stop="openEditModal(cls); openDropdownId = null">
                            <Pencil :size="16" />
                            <span>Edit</span>
                          </button>
                          <button class="action-item view" @click.stop="viewClass(cls); openDropdownId = null">
                            <Eye :size="16" />
                            <span>View</span>
                          </button>
                          <div class="dropdown-divider"></div>
                          <button class="action-item delete" @click.stop="confirmDelete(cls); openDropdownId = null">
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
          <div class="empty-state-standalone" v-show="store.classes.length === 0">
            <div class="empty-state-inner">
              <div class="empty-state-icon-box">
                <div class="empty-state-icon-ring">
                  <SearchX :size="28" />
                </div>
              </div>
              <div class="empty-state-texts">
                <h5 class="empty-state-title">No classes found</h5>
                <p class="empty-state-desc">
                  <template v-if="searchQuery">We couldn't find any classes matching "<strong>{{ searchQuery }}</strong>". Try adjusting your search or filters.</template>
                  <template v-else>There are no classes to display yet. Create your first class to get started.</template>
                </p>
              </div>
              <button v-if="searchQuery" class="empty-state-btn" @click="clearSearch">
                <X :size="14" />
                <span>Clear search</span>
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
              :disabled="currentPage >= store.lastPage"
              @click="changePage(currentPage + 1)"
              aria-label="Next page"
            >
              <ChevronRight :size="16" />
            </button>
          </div>
          <div class="pagination-total">
            {{ store.totalClasses > 0 ? pagination.from : 0 }}-{{ pagination.to }} of {{ store.totalClasses }}
          </div>
        </div>
      </div>
    </template>

    <!-- ── Add / Edit Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" :class="['modal-overlay', { 'dark-mode': theme.isDark }]" @click.self="closeModal">
          <div class="modal-content-panel">
            <div class="modal-head">
              <div class="modal-icon" :class="isEditMode ? 'icon-edit' : 'icon-create'">
                <SquarePen v-if="isEditMode" :size="18" />
                <CirclePlus v-else :size="18" />
              </div>
              <div>
                <h3>{{ isEditMode ? 'Edit Class' : 'New Class' }}</h3>
                <p>{{ isEditMode ? 'Update the class details below.' : 'Fill in the details to create a new class.' }}</p>
              </div>
              <button class="modal-x" @click="closeModal">&times;</button>
            </div>
            <form @submit.prevent="handleSubmit">
              <div class="modal-body-custom">
                <div class="form-group">
                  <label class="form-label">Class Name <span class="text-danger">*</span></label>
                  <div class="input-wrapper">
                    <input v-model="formData.name" class="modern-input" :class="{ 'input-err': errors.name }" placeholder="e.g. Class A" required />
                  </div>
                  <span v-if="errors.name" class="field-err">{{ errors.name }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Generation <span class="text-danger">*</span></label>
                  <div class="input-wrapper">
                    <select v-model.number="formData.generation_id" class="modern-input" :class="{ 'input-err': errors.generation_id }">
                      <option :value="null">Select generation</option>
                      <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.name }}</option>
                    </select>
                  </div>
                  <span v-if="errors.generation_id" class="field-err">{{ errors.generation_id }}</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Room</label>
                  <div class="input-wrapper">
                    <input v-model="formData.room" class="modern-input" placeholder="e.g. B12" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <div class="input-wrapper">
                    <textarea v-model="formData.description" class="modern-input" placeholder="Optional notes..." rows="3" style="resize: vertical;"></textarea>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <div class="input-wrapper">
                    <select v-model="formData.is_active" class="modern-input">
                      <option :value="true">Active</option>
                      <option :value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="store.loading">
                  <span v-if="store.loading" class="spinner-sm"></span>
                  <Check v-else :size="16" />
                  <span>{{ isEditMode ? 'Update Class' : 'Create Class' }}</span>
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
        <div v-if="showDeleteModal" :class="['modal-overlay', { 'dark-mode': theme.isDark }]" @click.self="closeDeleteModal">
          <div class="modal-content-panel" style="max-width: 400px;">
            <div class="modal-head">
              <div class="modal-icon" style="background: #fef2f2; color: #ef4444;">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3 style="color: #dc2626;">Delete Class</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body" style="padding: 16px 24px 20px;">
              <p v-if="classToDelete" style="font-size: 0.9rem; color: #475569; margin: 0;">
                Are you sure you want to delete <strong>{{ classToDelete.name }}</strong>?
              </p>
              <p v-else style="font-size: 0.9rem; color: #475569; margin: 0;">
                Are you sure you want to delete <strong>{{ selectedIds.length }} class(es)</strong>?
              </p>
              <p style="font-size: 0.75rem; color: #ef4444; background: #fef2f2; padding: 8px 12px; border-radius: 8px; margin: 8px 0 0;">
                <AlertTriangle :size="14" style="vertical-align: middle; margin-right: 4px;" />
                <span style="vertical-align: middle;">This class and all associated data will be permanently removed.</span>
              </p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeDeleteModal">Cancel</button>
              <button class="btn btn-danger" @click="selectedIds.length > 0 ? handleBulkDelete() : handleDelete()" :disabled="store.loading">
                <span v-if="store.loading" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>{{ classToDelete ? 'Delete' : `Delete ${selectedIds.length} class(es)` }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── View Details Modal ── -->
    <ClassDetailsModal
      :show="showDetailsModal"
      :class-data="selectedClassDetails"
      @close="closeDetailsModal"
    />

    <!-- ── Toast Notification ── -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast-notification" :class="toast.type">
          <div class="toast-icon">
            <CheckCircleIcon v-if="toast.type === 'success'" :size="18" />
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
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useClassStore } from '@/stores/class'
import type { SchoolClass } from '@/services/classService'
import { getAcademicYears } from '@/services/academicYearService'
import ClassDetailsModal from './ClassDetailsModal.vue'
import {
  Users, Plus, AlertTriangle, CheckCircle, Pencil, Trash2, SquarePen, CirclePlus,
  ChevronLeft, ChevronRight, Search, SearchX, X, Check, ToggleLeft,
  MoreVertical, AlertCircle, CheckCircle as CheckCircleIcon, Trash, Eye,
} from '@lucide/vue'

const theme = useThemeStore()
const store = useClassStore()
const searchQuery = ref('')
const statusFilter = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const classToDelete = ref<SchoolClass | null>(null)
const academicYears = ref<{ id: number; name: string }[]>([])

let searchTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Toast Notification ────────────────────────────────────────────────
const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
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

// ─── View Details Modal ─────────────────────────────────────────────
const showDetailsModal = ref(false)
const selectedClassDetails = ref<{
  id: number
  name: string
  generation: string
  room: string
  students: number
  status: string
  teacher: { id: number; name: string } | null
} | null>(null)

function viewClass(cls: SchoolClass) {
  selectedClassDetails.value = {
    id: cls.id,
    name: cls.name,
    generation: cls.academicYear?.name || '—',
    room: cls.room || '—',
    students: 0,
    status: cls.is_active ? 'Active' : 'Inactive',
    teacher: null,
  }
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  selectedClassDetails.value = null
}

// ─── Server-side Pagination ─────────────────────────────────────────
const currentPage = ref(1)
const perPage = ref(10)
const pageSizeOptions = [5, 10, 25, 50]

const pagination = computed(() => {
  const total = store.totalClasses
  const page = currentPage.value
  const size = perPage.value
  const from = (page - 1) * size + 1
  const to = Math.min(page * size, total)
  return { from, to }
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = store.lastPage
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

async function loadClasses() {
  const params: Record<string, string | number> = {
    page: currentPage.value,
    per_page: perPage.value,
  }
  if (searchQuery.value) params.search = searchQuery.value
  if (statusFilter.value) params.status = statusFilter.value
  await store.fetchClasses(params)
}

function changePage(page: number) {
  currentPage.value = page
  loadClasses()
}

function changePerPage(size: number) {
  perPage.value = size
  currentPage.value = 1
  loadClasses()
}

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadClasses()
  }, 700)
}

function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
  loadClasses()
}

function onFilterChange() {
  currentPage.value = 1
  loadClasses()
}

// ─── Selection State ──────────────────────────────────────────────────
const selectedIds = ref<number[]>([])

const isAllPageSelected = computed(() => {
  return store.classes.length > 0 && store.classes.every(c => selectedIds.value.includes(c.id))
})

const isIndeterminate = computed(() => {
  const some = store.classes.some(c => selectedIds.value.includes(c.id))
  return some && !isAllPageSelected.value
})

function toggleSelectAll() {
  if (isAllPageSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !store.classes.some(c => c.id === id))
  } else {
    const currentIds = new Set(selectedIds.value)
    store.classes.forEach(c => currentIds.add(c.id))
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

// ─── Form State ──────────────────────────────────────────────────────
const formData = reactive({
  name: '',
  generation_id: null as number | null,
  room: '',
  description: '',
  is_active: true,
})

const errors = reactive({ name: '', generation_id: '' })

function validateForm() {
  let v = true
  if (!formData.name.trim()) { errors.name = 'Name is required'; v = false } else errors.name = ''
  if (!formData.generation_id) { errors.generation_id = 'Generation is required'; v = false } else errors.generation_id = ''
  return v
}

function resetForm() {
  Object.assign(formData, { name: '', generation_id: null, room: '', description: '', is_active: true })
  errors.name = ''; errors.generation_id = ''
}

function openAddModal() {
  isEditMode.value = false
  resetForm()
  showModal.value = true
}

function openEditModal(cls: SchoolClass) {
  isEditMode.value = true
  store.currentClass = cls
  formData.name = cls.name
  formData.generation_id = cls.generation_id
  formData.room = cls.room ?? ''
  formData.description = cls.description ?? ''
  formData.is_active = cls.is_active
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function loadAcademicYears() {
  try {
    const r = await getAcademicYears()
    if (r.success && Array.isArray(r.data)) academicYears.value = r.data
  } catch { academicYears.value = [] }
}

async function handleSubmit() {
  if (!validateForm()) return
  if (isEditMode.value && store.currentClass) {
    const ok = await store.updateClass(store.currentClass.id, formData)
    if (ok) { closeModal(); loadClasses(); showToast('Class updated successfully') }
  } else {
    const ok = await store.createClass(formData)
    if (ok) { closeModal(); loadClasses(); showToast('Class created successfully') }
  }
}

function confirmDelete(cls: SchoolClass) { classToDelete.value = cls; showDeleteModal.value = true }
function closeDeleteModal() { showDeleteModal.value = false; classToDelete.value = null }

// ─── Bulk Delete ────────────────────────────────────────────────────
function confirmBulkDelete() {
  if (selectedIds.value.length === 0) return
  showDeleteModal.value = true
}

async function handleBulkDelete() {
  if (selectedIds.value.length === 0) return
  const ids = [...selectedIds.value]
  try {
    for (const id of ids) {
      await store.deleteClass(id)
    }
    clearSelection()
    closeDeleteModal()
    loadClasses()
    showToast(`${ids.length} class(es) deleted successfully`)
  } catch {
    showToast('Failed to delete some classes', 'error')
  }
}

async function handleDelete() {
  if (!classToDelete.value) return
  const ok = await store.deleteClass(classToDelete.value.id)
  if (ok) {
    closeDeleteModal()
    loadClasses()
    showToast('Class deleted successfully')
  }
}

onMounted(async () => {
  await Promise.all([loadClasses(), loadAcademicYears()])
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* ==================== Page Layout ==================== */
.class-page {
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
.class-card {
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

.class-card:hover {
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

.class-table {
  width: 100%;
  height: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

.class-table thead th {
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

.class-table thead th.col-check,
.class-table tbody td.col-check {
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
  text-align: right;
  padding-right: 20px !important;
  width: 80px;
}

.class-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f3f5;
  color: #475569;
  vertical-align: middle;
  font-weight: 500;
}

.class-table tbody td.col-actions {
  overflow: visible;
}

.class-table tbody tr:last-child td { border-bottom: none; }

.row-selected {
  background: #f0f5ff !important;
  border-left-color: #2563eb !important;
}

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

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.class-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.3);
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.user-name {
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

.input-err { border-color: #ef4444; }
.field-err { display: block; font-size: 0.75rem; color: #ef4444; margin-top: 4px; }

select.modern-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 2.4rem;
}

.text-danger { color: #ef4444; }

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
.action-item.delete { color: #ef4444; }
.action-item.delete:hover { background: #fef2f2; color: #dc2626; }

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 8px;
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

/* ── Dark Mode ── */
.dark-mode .class-page { color: #e2e8f0; }

.dark-mode .class-card {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.4);
}

.dark-mode .class-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dark-mode .toolbar {
  background: transparent;
  border-bottom-color: rgba(71, 85, 105, 0.3);
}

.dark-mode .search-input {
  background: rgba(51, 65, 85, 0.4);
  border-color: #475569;
  color: #e2e8f0;
}

.dark-mode .search-input::placeholder { color: #64748b; }
.dark-mode .search-input:hover { border-color: #64748b; }
.dark-mode .search-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.1);
}

.dark-mode .filter-label {
  background: rgba(51, 65, 85, 0.4);
  border-color: #475569;
  color: #94a3b8;
}

.dark-mode .filter-label:hover { border-color: #64748b; }

.dark-mode .filter-select {
  color: #e2e8f0;
}

.dark-mode .count-badge {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.dark-mode .class-table thead th {
  background: rgba(30, 41, 59, 0.8);
  color: #94a3b8;
  border-bottom-color: rgba(71, 85, 105, 0.4);
}

.dark-mode .class-table tbody td {
  border-bottom-color: rgba(71, 85, 105, 0.2);
  color: #cbd5e1;
}

.dark-mode .class-table tbody tr:hover td {
  background: rgba(51, 65, 85, 0.3);
}

.dark-mode .row-selected {
  background: rgba(59, 130, 246, 0.08) !important;
}

.dark-mode .user-name {
  color: #f1f5f9;
}

.dark-mode .meta-val {
  color: #94a3b8;
}

.dark-mode .badge-inactive {
  background: rgba(71, 85, 105, 0.4);
  color: #94a3b8;
}

.dark-mode .bulk-bar {
  background: rgba(127, 29, 29, 0.3);
  border-bottom-color: rgba(239, 68, 68, 0.3);
}

.dark-mode .bulk-count {
  color: #fca5a5;
}

.dark-mode .bulk-clear-btn {
  background: rgba(51, 65, 85, 0.4);
  border-color: #475569;
  color: #94a3b8;
}

.dark-mode .bulk-clear-btn:hover {
  background: rgba(71, 85, 105, 0.4);
  border-color: #64748b;
}

.dark-mode .pagination-bar {
  background: rgba(30, 41, 59, 0.6);
  border-top-color: rgba(71, 85, 105, 0.3);
}

.dark-mode .pagination-info {
  color: #94a3b8;
}

.dark-mode .rows-selector {
  background: rgba(51, 65, 85, 0.4);
}

.dark-mode .rows-btn {
  color: #94a3b8;
}

.dark-mode .rows-btn:hover {
  color: #e2e8f0;
}

.dark-mode .rows-btn.active {
  background: rgba(51, 65, 85, 0.6);
  color: #60a5fa;
}

.dark-mode .page-nav {
  background: rgba(51, 65, 85, 0.4);
  border-color: #475569;
  color: #94a3b8;
}

.dark-mode .page-nav:hover:not(:disabled) {
  border-color: #60a5fa;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
}

.dark-mode .page-btn {
  color: #cbd5e1;
}

.dark-mode .page-btn:hover:not(.active) {
  background: rgba(51, 65, 85, 0.5);
  color: #60a5fa;
}

.dark-mode .page-btn.active {
  background: #3b82f6;
  color: #fff;
}

.dark-mode .page-dots {
  color: #64748b;
}

.dark-mode .pagination-total {
  color: #94a3b8;
}

.dark-mode .empty-state-icon-ring {
  background: rgba(59, 130, 246, 0.12);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
}

.dark-mode .empty-state-icon-ring::after {
  border-color: rgba(59, 130, 246, 0.1);
}

.dark-mode .empty-state-title {
  color: #f1f5f9;
}

.dark-mode .empty-state-desc {
  color: #94a3b8;
}

.dark-mode .empty-state-desc strong {
  color: #cbd5e1;
}

.dark-mode .empty-state-btn {
  background: rgba(51, 65, 85, 0.4);
  border-color: #475569;
  color: #cbd5e1;
}

.dark-mode .empty-state-btn:hover {
  background: rgba(71, 85, 105, 0.4);
  border-color: #64748b;
  color: #f1f5f9;
}

.dark-mode .action-trigger {
  background: rgba(51, 65, 85, 0.4);
  color: #94a3b8;
}

.dark-mode .action-trigger:hover {
  background: rgba(71, 85, 105, 0.5);
  color: #cbd5e1;
}

.dark-mode .action-menu {
  background: #1e293b;
  border-color: rgba(71, 85, 105, 0.5);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.dark-mode .action-item {
  color: #cbd5e1;
}

.dark-mode .action-item:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
}

.dark-mode .action-item.edit:hover {
  background: rgba(217, 119, 6, 0.15);
  color: #f59e0b;
}

.dark-mode .action-item.view:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
}

.dark-mode .action-item.delete {
  color: #ef4444;
}

.dark-mode .action-item.delete:hover {
  background: rgba(239, 68, 68, 0.1);
}

.dark-mode .dropdown-divider {
  background: rgba(71, 85, 105, 0.5);
}

.dark-mode .msg-error {
  background: rgba(127, 29, 29, 0.3);
  color: #fca5a5;
  border-left-color: #ef4444;
}

.dark-mode .msg-success {
  background: rgba(6, 95, 70, 0.3);
  color: #6ee7b7;
  border-left-color: #10b981;
}

.dark-mode .modal-content-panel {
  background: #1e293b;
}

.dark-mode .modal-head h3 {
  color: #f1f5f9;
}

.dark-mode .modal-head p {
  color: #94a3b8;
}

.dark-mode .modal-x {
  color: #64748b;
}

.dark-mode .modal-x:hover {
  color: #cbd5e1;
}

.dark-mode .form-label {
  color: #cbd5e1;
}

.dark-mode .modern-input {
  background: rgba(51, 65, 85, 0.4);
  border-color: #475569;
  color: #e2e8f0;
}

.dark-mode .modern-input:hover {
  border-color: #64748b;
}

.dark-mode .modern-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

.dark-mode .modern-input::placeholder {
  color: #64748b;
}

.dark-mode .btn-ghost {
  background: rgba(51, 65, 85, 0.4);
  color: #cbd5e1;
}

.dark-mode .btn-ghost:hover {
  background: rgba(71, 85, 105, 0.5);
}

.dark-mode .toast-notification.success {
  background: rgba(6, 95, 70, 0.5);
  color: #6ee7b7;
  border-top-color: rgba(16, 185, 129, 0.3);
  border-right-color: rgba(16, 185, 129, 0.3);
  border-bottom-color: rgba(16, 185, 129, 0.3);
}

.dark-mode .toast-notification.error {
  background: rgba(127, 29, 29, 0.5);
  color: #fca5a5;
  border-top-color: rgba(239, 68, 68, 0.3);
  border-right-color: rgba(239, 68, 68, 0.3);
  border-bottom-color: rgba(239, 68, 68, 0.3);
}
</style>