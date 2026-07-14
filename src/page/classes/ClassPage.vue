<template>
  <div class="class-management">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-3">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <router-link to="/dashboard">Home</router-link>
        </li>
        <li class="breadcrumb-item active" aria-current="page">Classes</li>
      </ol>
    </nav>

    <!-- Statistics Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="stat-card">
          <div class="stat-icon bg-primary bg-opacity-10 text-primary">
            <i class="bi bi-journal-bookmark"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label text-muted small mb-1">TOTAL CLASSES</p>
            <h3 class="stat-value mb-0">{{ totalClasses }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="stat-icon bg-success bg-opacity-10 text-success">
            <i class="bi bi-people"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label text-muted small mb-1">TOTAL STUDENTS</p>
            <h3 class="stat-value mb-0">{{ totalStudents }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="stat-icon bg-info bg-opacity-10 text-info">
            <i class="bi bi-person-badge"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label text-muted small mb-1">TEACHERS ASSIGNED</p>
            <h3 class="stat-value mb-0">{{ teachersAssigned }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Messages -->
    <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ error }}
      <button type="button" class="btn-close" @click="clearMessages()"></button>
    </div>

    <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
      <i class="bi bi-check-circle-fill me-2"></i>
      {{ successMessage }}
      <button type="button" class="btn-close" @click="clearMessages()"></button>
    </div>

    <!-- Search and Filter -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body py-3">
        <div class="row g-3 align-items-center">
          <div class="col-md-6">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                class="form-control form-control-sm border-start-0 ps-0"
                placeholder="Search classes by name, generation, or room..."
                v-model="searchQuery"
                @input="handleSearch"
                style="font-size: 0.9rem;"
              />
            </div>
          </div>
          <div class="col-md-3">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-funnel text-muted"></i>
              </span>
              <select
                class="form-select form-select-sm border-start-0 ps-0"
                v-model="statusFilter"
                @change="handleFilter"
                style="font-size: 0.9rem;"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div class="col-md-3">
            <input
              type="file"
              ref="pdfInput"
              @change="handlePDFUpload"
              accept=".pdf"
              class="d-none"
            />
            <button class="btn btn-light btn-sm w-100 shadow-sm" @click="triggerPDFUpload" style="background-color: white; color: black; border: 1px solid #dee2e6;">
              <i class="bi bi-file-earmark-pdf me-1"></i>Export
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Classes Table -->
    <div v-else class="card" style="border-radius: 12px; overflow: hidden;">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0" style="border-radius: 12px;">
            <thead class="table-light">
              <tr>
                <th scope="col" class="text-center py-2 px-3" style="width: 50px;">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    @change="toggleSelectAll"
                    :checked="isAllSelected"
                  />
                </th>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">CLASS</th>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">GENERATION</th>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">TEACHER</th>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">STUDENTS</th>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">ROOM</th>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">STATUS</th>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="classItem in filteredClasses" :key="classItem.id">
                <td class="text-center py-2 px-3">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    :value="classItem.id"
                    v-model="selectedClasses"
                  />
                </td>
                <td class="py-2 px-3">
                  <span class="fw-medium">{{ classItem.name }}</span>
                </td>
                <td class="small py-2 px-3">{{ classItem.generation }}</td>
                <td class="small py-2 px-3">{{ classItem.teacher?.name || 'No Teacher' }}</td>
                <td class="small py-2 px-3">{{ classItem.students }}</td>
                <td class="small py-2 px-3">{{ classItem.room }}</td>
                <td class="py-2 px-3">
                  <span
                    class="badge"
                    :class="classItem.status === 'Active' ? 'bg-success' : 'bg-secondary'"
                  >
                    {{ classItem.status }}
                  </span>
                </td>
                <td class="text-center py-2 px-3">
                  <div class="btn-group" role="group">
                    <button
                      type="button"
                      class="btn btn-sm p-0 border-0 bg-transparent me-3"
                      @click="viewClass(classItem)"
                      title="View"
                      style="color: #3b82f6;"
                    >
                      <i class="bi bi-eye" style="font-size: 1.1rem;"></i>
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm p-0 border-0 bg-transparent me-3"
                      @click="openEditModal(classItem)"
                      title="Edit"
                      style="color: #f59e0b;"
                    >
                      <i class="bi bi-pencil" style="font-size: 1.1rem;"></i>
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm p-0 border-0 bg-transparent"
                      @click="confirmDelete(classItem)"
                      title="Delete"
                      style="color: #ef4444;"
                    >
                      <i class="bi bi-trash" style="font-size: 1.1rem;"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredClasses.length === 0">
                <td colspan="8" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                  No classes found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Class Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal fade show" style="display: block;" @click.self="closeModal">
        <div class="modal-dialog modal-dialog-centered" @click.stop>
          <div class="modal-content" style="border-radius: 12px; border: none; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
            <div class="modal-header border-0 pt-4 px-4 pb-0">
              <h5 class="modal-title fw-semibold mb-0" style="font-size: 1.25rem;">{{ isEditMode ? 'Edit Class' : 'Create New Class' }}</h5>
              <button
                type="button"
                class="btn-close"
                @click="closeModal"
                style="font-size: 0.8rem;"
              ></button>
            </div>
            <div class="modal-body px-4 pt-3 pb-4">
              <form @submit.prevent="handleSubmit">
                <div class="row g-3">
                  <div class="col-12">
                    <label for="name" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">Class Name</label>
                    <input
                      type="text"
                      class="form-control"
                      id="name"
                      v-model="formData.name"
                      :class="{ 'is-invalid': errors.name }"
                      placeholder="e.g. Class 10A"
                      style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                      required
                    />
                    <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                  </div>

                  <div class="col-12">
                    <label for="generation" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">GENERATION</label>
                    <input
                      type="text"
                      class="form-control"
                      id="generation"
                      v-model="formData.generation"
                      :class="{ 'is-invalid': errors.generation }"
                      placeholder="e.g. 2026"
                      style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                      required
                    />
                    <div v-if="errors.generation" class="invalid-feedback">{{ errors.generation }}</div>
                  </div>

                  <div class="col-12">
                    <label for="teacher" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">Homeroom Teacher</label>
                    <select
                      class="form-select"
                      id="teacher"
                      v-model="formData.teacher_id"
                      style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                    >
                      <option :value="null">No Teacher</option>
                      <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                        {{ teacher.name }}
                      </option>
                    </select>
                  </div>

                  <div class="col-12">
                    <label for="room" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">Room</label>
                    <input
                      type="text"
                      class="form-control"
                      id="room"
                      v-model="formData.room"
                      :class="{ 'is-invalid': errors.room }"
                      placeholder="e.g. Room 101"
                      style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                      required
                    />
                    <div v-if="errors.room" class="invalid-feedback">{{ errors.room }}</div>
                  </div>

                  <div class="col-12">
                    <label for="students" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">Number of Students</label>
                    <input
                      type="number"
                      class="form-control"
                      id="students"
                      v-model="formData.students"
                      :class="{ 'is-invalid': errors.students }"
                      placeholder="e.g. 30"
                      min="0"
                      style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                    />
                    <div v-if="errors.students" class="invalid-feedback">{{ errors.students }}</div>
                  </div>

                  <div class="col-12">
                    <label for="status" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">Status</label>
                    <select
                      class="form-select"
                      id="status"
                      v-model="formData.status"
                      :class="{ 'is-invalid': errors.status }"
                      required
                      style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <div v-if="errors.status" class="invalid-feedback">{{ errors.status }}</div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer border-0 px-4 pb-4 pt-0">
              <button
                type="button"
                class="btn btn-light flex-fill me-2"
                @click="closeModal"
                style="border-radius: 8px; padding: 0.625rem; font-weight: 500; color: #4a5568;"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary flex-fill ms-2"
                @click="handleSubmit"
                :disabled="loading"
                style="border-radius: 8px; padding: 0.625rem; font-weight: 500; background-color: #2563eb; border-color: #2563eb;"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ isEditMode ? 'Update' : 'Create' }} Class
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- View Class Modal -->
    <Transition name="modal">
      <div v-if="showViewModal" class="modal fade show" style="display: block;" @click.self="closeViewModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-0 pb-3">
              <h5 class="modal-title fw-medium mb-0">Class Details</h5>
              <button
                type="button"
                class="btn-close"
                @click="closeViewModal"
              ></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label text-muted small">Class Name</label>
                  <p class="fw-medium mb-0">{{ viewData.name }}</p>
                </div>
                <div class="col-6">
                  <label class="form-label text-muted small">Generation</label>
                  <p class="mb-0">{{ viewData.generation }}</p>
                </div>
                <div class="col-6">
                  <label class="form-label text-muted small">Room</label>
                  <p class="mb-0">{{ viewData.room }}</p>
                </div>
                <div class="col-6">
                  <label class="form-label text-muted small">Students</label>
                  <p class="mb-0">{{ viewData.students }}</p>
                </div>
                <div class="col-6">
                  <label class="form-label text-muted small">Status</label>
                  <p class="mb-0">
                    <span
                      class="badge"
                      :class="viewData.status === 'Active' ? 'bg-success' : 'bg-secondary'"
                    >
                      {{ viewData.status }}
                    </span>
                  </p>
                </div>
                <div class="col-12">
                  <label class="form-label text-muted small">Homeroom Teacher</label>
                  <p class="mb-0">{{ viewData.teacher?.name || 'No Teacher' }}</p>
                </div>
              </div>
            </div>
            <div class="modal-footer border-0 pt-3">
              <button type="button" class="btn btn-primary" @click="closeViewModal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <Transition name="modal">
      <div v-if="showDeleteModal" class="modal fade show" style="display: block;" @click.self="closeDeleteModal">
        <div class="modal-dialog modal-sm modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-0 pb-2">
              <h5 class="modal-title fw-medium">Delete Class</h5>
              <button
                type="button"
                class="btn-close"
                @click="closeDeleteModal"
              ></button>
            </div>
            <div class="modal-body pt-2">
              <p class="mb-2">Are you sure you want to delete <strong>{{ classToDelete?.name }}</strong>?</p>
              <p class="text-danger small mb-0">This action cannot be undone.</p>
            </div>
            <div class="modal-footer border-0 pt-2">
              <button type="button" class="btn btn-light btn-sm" @click="closeDeleteModal">Cancel</button>
              <button
                type="button"
                class="btn btn-danger btn-sm"
                @click="handleDelete"
                :disabled="loading"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { classService, type Class } from '@/services/classService'
import { http } from '@/services/apiHttp'

// Search and Filter
const searchQuery = ref('')
const statusFilter = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const pdfInput = ref<HTMLInputElement | null>( null)
const selectedClasses = ref<number[]>([])

// Statistics
const totalClasses = computed(() => classes.value.length)
const totalStudents = computed(() => classes.value.reduce((sum, cls) => sum + (cls.students || 0), 0))
const teachersAssigned = computed(() => {
  const uniqueTeachers = new Set(classes.value.filter(cls => cls.teacher?.name).map(cls => cls.teacher!.name))
  return uniqueTeachers.size
})

function triggerPDFUpload() {
  pdfInput.value?.click()
}

const isAllSelected = computed(() => {
  return filteredClasses.value.length > 0 &&
         selectedClasses.value.length === filteredClasses.value.length
})

function toggleSelectAll(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.checked) {
    selectedClasses.value = filteredClasses.value.map(c => c.id)
  } else {
    selectedClasses.value = []
  }
}

// Data
const classes = ref<Class[]>([])
const teachers = ref<{ id: number; name: string }[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Modal states
const showModal = ref(false)
const showViewModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const classToDelete = ref<Class | null>(null)
const viewData = ref({
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
  generation: '2025',
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
      classItem.generation.toLowerCase().includes(query) ||
      classItem.room.toLowerCase().includes(query) ||
      (classItem.teacher?.name || '').toLowerCase().includes(query)

    const matchesStatus = !statusFilter.value ||
      classItem.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

// Methods
function clearMessages() {
  error.value = null
  successMessage.value = null
}

function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    loadClasses()
  }, 300)
}

function handleFilter() {
  loadClasses()
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
      classes.value = response.data as Class[]
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

function openEditModal(classItem: Class) {
  isEditMode.value = true
  Object.assign(formData, {
    id: classItem.id,
    name: classItem.name,
    generation: classItem.generation,
    teacher_id: classItem.teacher?.id || null,
    students: classItem.students,
    room: classItem.room,
    status: classItem.status,
  })
  showModal.value = true
}

function viewClass(classItem: Class) {
  viewData.value = {
    name: classItem.name,
    generation: classItem.generation,
    room: classItem.room,
    students: classItem.students,
    status: classItem.status,
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
  successMessage.value = null

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
      // Update existing class
      const classId = formData.id
      if (!classId) {
        error.value = 'Class ID not found'
        return
      }
      const response = await classService.updateClass(classId, classData)
      if (response.success) {
        successMessage.value = 'Class updated successfully'
        closeModal()
        await loadClasses()
      } else {
        error.value = response.message || 'Failed to update class'
      }
    } else {
      // Create new class
      const response = await classService.createClass(classData)
      if (response.success) {
        successMessage.value = 'Class created successfully'
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
    console.error('Error response:', axiosError?.response?.data)
  } finally {
    loading.value = false
  }
}

function confirmDelete(classItem: Class) {
  classToDelete.value = classItem
  showDeleteModal.value = true
}

async function handlePDFUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (file.type !== 'application/pdf') {
    error.value = 'Please select a PDF file'
    return
  }

  loading.value = true
  error.value = null

  try {
    const formData = new FormData()
    formData.append('pdf', file)

    const response = await http.post('/classes/import-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.data.success) {
      successMessage.value = response.data.message || 'Classes imported successfully'
      await loadClasses()
    } else {
      error.value = response.data.message || 'Failed to import classes'
    }
  } catch (err) {
    error.value = 'Failed to import PDF'
    console.error(err)
  } finally {
    loading.value = false
    // Reset file input
    if (pdfInput.value) {
      pdfInput.value.value = ''
    }
  }
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
      successMessage.value = 'Class deleted successfully'
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
.class-management {
  padding: 2rem;
}

.ls-tight {
  letter-spacing: 0.05em;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0;
  color: #1f2937;
}
</style>
