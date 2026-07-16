<template>
  <Header />
  <div class="px-4 py-4">
      <!-- Header -->
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-header-icon">
            <i class="bi bi-journal-bookmark-fill"></i>
          </div>
          <div>
            <h2 class="page-title">Classes</h2>
            <p class="page-subtitle">
              Manage classes, teachers, and student assignments
            </p>
          </div>
        </div>
        <button
          class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold"
          style="border-radius: 0.625rem; background: #2563eb; padding: 0.5rem 1.125rem; font-size: 0.875rem;"
          @click="openCreateModal"
        >
          <i class="bi bi-plus-lg"></i>
          Add Class
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width: 2.5rem; height: 2.5rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2" style="color: #6b7280;">Loading classes...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="d-flex align-items-center gap-2 p-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.875rem;">
        <i class="bi bi-exclamation-triangle-fill"></i>
        {{ error }}
      </div>

      <!-- Class List Table -->
      <ClassList
        v-else
        :classes="filteredClasses"
        :search-query="searchQuery"
        :status-filter="statusFilter"
        @update:search-query="searchQuery = $event"
        @update:status-filter="statusFilter = $event"
        @view="viewClass"
        @edit="openEditModal"
        @delete="confirmDelete"
      />

    <!-- Create/Edit Modal -->
    <ClassFormModal
      :show="showModal"
      :is-edit="isEditMode"
      :name="formData.name"
      :generation="formData.generation"
      :teacher-id="formData.teacher_id"
      :room="formData.room"
      :students="formData.students"
      :status="formData.status"
      :teachers="teachers"
      :submitting="loading"
      :error="error"
      @close="closeModal"
      @submit="handleSubmit"
      @update:name="formData.name = $event"
      @update:generation="formData.generation = $event"
      @update:teacher-id="formData.teacher_id = $event"
      @update:room="formData.room = $event"
      @update:students="formData.students = $event"
      @update:status="formData.status = $event"
    />

    <!-- Delete Modal -->
    <ClassDeleteModal
      :show="showDeleteModal"
      :class-name="classToDelete?.name || ''"
      :submitting="loading"
      @close="closeDeleteModal"
      @confirm="handleDelete"
    />

    <!-- View Class Modal -->
    <ClassDetailsModal
      :show="showViewModal"
      :class-data="viewData"
      @close="closeViewModal"
    />

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast-notification" :class="toast.type">
          <i :class="toast.type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-circle-fill'" class="me-2"></i>
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import Header from '@/layouts/Header.vue'
import { onMounted, ref, computed, reactive } from 'vue'
import ClassList from './ClassList.vue'
import ClassFormModal from './ClassFormModal.vue'
import ClassDeleteModal from './ClassDeleteModal.vue'
import ClassDetailsModal from './ClassDetailsModal.vue'
import { classService, type SchoolClass } from '@/services/classService'

// Search and Filter
const searchQuery = ref('')
const statusFilter = ref('')

// Data
const classes = ref<SchoolClass[]>([])
const teachers = ref<{ id: number; name: string }[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

// Modal states
const showModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const classToDelete = ref<SchoolClass | null>(null)
const viewData = ref({
  id: 0,
  name: '',
  generation: '',
  room: '',
  students: 0,
  status: 'Active' as 'Active' | 'Inactive',
  teacher: null as { id: number; name: string } | null,
})

// Form data
interface FormDataType {
  id?: number
  name: string
  generation: string
  teacher_id: number | null
  students: number
  room: string
  status: 'Active' | 'Inactive'
}

const formData = reactive<FormDataType>({
  id: undefined,
  name: '',
  generation: '2026',
  teacher_id: null,
  students: 0,
  room: '',
  status: 'Active',
})

const errors = reactive({
  name: '',
  generation: '',
  teacher: '',
  room: '',
  students: '',
  status: '',
})

// Computed
const filteredClasses = computed(() => {
  const query = searchQuery.value.toLowerCase()

  return classes.value.filter(classItem => {
    const matchesSearch = !query ||
      classItem.name.toLowerCase().includes(query) ||
      (classItem.generation?.year || '').toString().toLowerCase().includes(query) ||
      (classItem.room || '').toLowerCase().includes(query) ||
      (classItem.teacher?.name || '').toLowerCase().includes(query)

    const matchesStatus = !statusFilter.value ||
      (statusFilter.value === 'Active' ? classItem.is_active : !classItem.is_active)

    return matchesSearch && matchesStatus
  })
})

// Methods
function showToast(message: string, type: 'success' | 'error' = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

async function loadClasses() {
  loading.value = true
  error.value = null
  try {
    const response = await classService.getClasses(
      searchQuery.value || undefined,
      statusFilter.value || undefined
    )
    if (response.success) {
      classes.value = response.data as SchoolClass[]
    }
  } catch (err) {
    error.value = 'Failed to load classes'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function loadTeachers() {
  try {
    const response = await classService.getTeachers()
    if (response.success) {
      teachers.value = response.data
    }
  } catch (err) {
    console.error('Failed to load teachers:', err)
  }
}

function openCreateModal() {
  isEditMode.value = false
  resetForm()
  showModal.value = true
}

function openEditModal(classItem: SchoolClass) {
  isEditMode.value = true
  Object.assign(formData, {
    id: classItem.id,
    name: classItem.name,
    generation: classItem.generation?.year.toString() || '',
    teacher_id: classItem.teacher?.id || null,
    students: classItem.students || 0,
    room: classItem.room || '',
    status: classItem.is_active ? 'Active' : 'Inactive',
  })
  showModal.value = true
}

function viewClass(classItem: SchoolClass) {
  viewData.value = {
    id: classItem.id,
    name: classItem.name,
    generation: classItem.generation?.year.toString() || '',
    room: classItem.room || '',
    students: classItem.students || 0,
    status: classItem.is_active ? 'Active' : 'Inactive',
    teacher: classItem.teacher || null,
  }
  showViewModal.value = true
}

function closeViewModal() {
  showViewModal.value = false
}

function closeModal() {
  showModal.value = false
  resetForm()
}

function resetForm() {
  formData.id = undefined
  formData.name = ''
  formData.generation = '2026'
  formData.teacher_id = null
  formData.students = 0
  formData.room = ''
  formData.status = 'Active'
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })
}

function validateForm(): boolean {
  let isValid = true

  if (!formData.name.trim()) {
    errors.name = 'Name is required'
    isValid = false
  } else {
    errors.name = ''
  }

  if (!formData.generation) {
    errors.generation = 'Generation is required'
    isValid = false
  } else {
    errors.generation = ''
  }

  if (!formData.room.trim()) {
    errors.room = 'Room is required'
    isValid = false
  } else {
    errors.room = ''
  }

  if (formData.students < 0) {
    errors.students = 'Students cannot be negative'
    isValid = false
  } else {
    errors.students = ''
  }

  if (!formData.status) {
    errors.status = 'Status is required'
    isValid = false
  } else {
    errors.status = ''
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  loading.value = true
  error.value = null

  try {
    const classData = {
      name: formData.name,
      generation: formData.generation,
      teacher_id: formData.teacher_id,
      room: formData.room,
      students: formData.students,
      status: formData.status,
    }

    if (isEditMode.value) {
      const classId = formData.id
      if (!classId) {
        error.value = 'Class ID not found'
        return
      }
      const response = await classService.updateClass(classId, classData)
      if (response.success) {
        showToast('Class updated successfully')
        closeModal()
        await loadClasses()
      } else {
        error.value = response.message || 'Failed to update class'
      }
    } else {
      const response = await classService.createClass(classData)
      if (response.success) {
        showToast('Class created successfully')
        closeModal()
        await loadClasses()
      } else {
        error.value = response.message || 'Failed to create class'
      }
    }
  } catch (err) {
    const axiosError = err as { response?: { data?: { message?: string } }; message?: string }
    const errorMessage = axiosError?.response?.data?.message || axiosError?.message || 'Failed to save class'
    error.value = errorMessage
    console.error('Error saving class:', err)
  } finally {
    loading.value = false
  }
}

function confirmDelete(classItem: SchoolClass) {
  classToDelete.value = classItem
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  classToDelete.value = null
}

async function handleDelete() {
  if (!classToDelete.value) return

  loading.value = true
  try {
    const response = await classService.deleteClass(classToDelete.value.id)
    if (response.success) {
      showToast('Class deleted successfully')
      closeDeleteModal()
      await loadClasses()
    } else {
      error.value = response.message || 'Failed to delete class'
    }
  } catch (err) {
    error.value = 'Failed to delete class'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadClasses()
  loadTeachers()
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
  font-size: 1.2rem;
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

.toast-notification.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.toast-notification.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from, .toast-leave-to { transform: translateX(100%); opacity: 0; }
</style>
