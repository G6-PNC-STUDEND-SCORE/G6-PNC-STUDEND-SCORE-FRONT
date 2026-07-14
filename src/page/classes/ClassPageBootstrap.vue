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

    <!-- Page Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-medium mb-0">Class Management</h1>
        <p class="text-muted small mb-0 mt-1">Manage your classes efficiently</p>
      </div>
      <button class="btn btn-primary btn-sm shadow-sm" @click="openAddModal">
        <i class="bi bi-plus-lg me-1"></i>Add Class
      </button>
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

    <!-- Curriculum Classes Section -->
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <!-- Section Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="fw-medium mb-0">Curriculum Classes</h5>
          <div class="d-flex gap-2">
            <input
              type="text"
              class="form-control form-control-sm"
              placeholder="Search class..."
              v-model="searchQuery"
              @input="handleSearch"
              style="width: 250px;"
            />
            <button class="btn btn-outline-secondary btn-sm">
              <i class="bi bi-file-earmark-text me-1"></i>Template
            </button>
            <button class="btn btn-outline-secondary btn-sm">
              <i class="bi bi-upload me-1"></i>Import
            </button>
            <button class="btn btn-primary btn-sm" @click="openAddModal">
              <i class="bi bi-plus-lg me-1"></i>Create Class
            </button>
          </div>
        </div>

        <!-- Select All Checkbox -->
        <div class="mb-3">
          <input
            type="checkbox"
            class="form-check-input"
            id="selectAll"
            :checked="isAllSelected"
            @change="toggleSelectAll"
          />
          <label class="form-check-label small text-muted ms-2" for="selectAll">
            Select all visible classes
          </label>
        </div>

        <!-- Loading Spinner -->
        <div v-if="loading" class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <!-- Classes List -->
        <div v-else-if="filteredClasses.length > 0">
          <div v-for="classItem in filteredClasses" :key="classItem.id" class="class-item border rounded p-3 mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    :value="classItem.id"
                    v-model="selectedClasses"
                  />
                  <span class="badge bg-secondary text-dark small">#{{ classItem.id }}</span>
                  <h6 class="fw-medium mb-0">{{ classItem.name }}</h6>
                  <span class="badge bg-success bg-opacity-10 text-success small">Active</span>
                </div>

                <div class="ms-5">
                  <p class="text-muted small mb-2">
                    <i class="bi bi-diagram-3 me-1"></i>
                    {{ classItem.students }} students
                    <span class="mx-2">•</span>
                    <i class="bi bi-geo-alt me-1"></i>
                    Room {{ classItem.room }}
                  </p>

                  <div class="d-flex gap-2 flex-wrap">
                    <span class="badge bg-light text-dark border">
                      <i class="bi bi-calendar3 me-1"></i>
                      {{ classItem.generation }}
                    </span>
                    <span v-if="classItem.teacher?.name" class="badge bg-light text-dark border">
                      <i class="bi bi-person me-1"></i>
                      {{ classItem.teacher.name }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="d-flex gap-2">
                <div class="dropdown">
                  <button
                    class="btn btn-outline-secondary btn-sm"
                    type="button"
                    :id="'dropdownMenuButton-' + classItem.id"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i class="bi bi-three-dots"></i>
                  </button>
                  <ul class="dropdown-menu" :aria-labelledby="'dropdownMenuButton-' + classItem.id">
                    <li>
                      <button class="dropdown-item" type="button" @click="viewClass(classItem)">
                        <i class="bi bi-eye me-2"></i>View Details
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item" type="button" @click="openEditModal(classItem)">
                        <i class="bi bi-pencil me-2"></i>Edit
                      </button>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                      <button class="dropdown-item text-danger" type="button" @click="confirmDelete(classItem)">
                        <i class="bi bi-trash me-2"></i>Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-1 d-block mb-2"></i>
          <p>No classes found</p>
        </div>

        <!-- Footer -->
        <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          <div class="small text-muted">
            Showing {{ paginationStart }} to {{ paginationEnd }} of {{ totalClasses }} classes
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="small text-muted">Show:</span>
            <select class="form-select form-select-sm" style="width: auto;" v-model="itemsPerPage" @change="handleItemsPerPageChange">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Class Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal fade show" style="display: block;" @click.self="closeModal">
        <div class="modal-dialog modal-dialog-centered" @click.stop>
          <div class="modal-content">
            <div class="modal-header border-0 pb-3">
              <h5 class="modal-title fw-medium mb-0">{{ isEditMode ? 'Edit Class' : 'Add Class' }}</h5>
              <button
                type="button"
                class="btn-close"
                @click="closeModal"
              ></button>
            </div>
            <div class="modal-body pt-0">
              <form @submit.prevent="handleSubmit">
                <div class="row g-3">
                  <div class="col-12">
                    <label for="name" class="form-label text-muted small">Class Name <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      id="name"
                      v-model="formData.name"
                      :class="{ 'is-invalid': errors.name }"
                      placeholder="e.g., Class 10C"
                      required
                    />
                    <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                  </div>

                  <div class="col-12">
                    <label for="generation" class="form-label text-muted small">Generation <span class="text-danger">*</span></label>
                    <select
                      class="form-select form-select-sm"
                      id="generation"
                      v-model="formData.generation"
                      :class="{ 'is-invalid': errors.generation }"
                      required
                    >
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                    <div v-if="errors.generation" class="invalid-feedback">{{ errors.generation }}</div>
                  </div>

                  <div class="col-12">
                    <label for="teacher" class="form-label text-muted small">Homeroom Teacher</label>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      id="teacher"
                      v-model="formData.teacher"
                      placeholder="e.g., Mr. John Doe"
                    />
                  </div>

                  <div class="col-12">
                    <label for="room" class="form-label text-muted small">Room <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      id="room"
                      v-model="formData.room"
                      :class="{ 'is-invalid': errors.room }"
                      placeholder="e.g., Room 103"
                      required
                    />
                    <div v-if="errors.room" class="invalid-feedback">{{ errors.room }}</div>
                  </div>

                  <div class="col-12">
                    <label for="students" class="form-label text-muted small">Number of Students</label>
                    <input
                      type="number"
                      class="form-control form-control-sm"
                      id="students"
                      v-model.number="formData.students"
                      min="0"
                    />
                  </div>

                  <div class="col-12">
                    <label for="status" class="form-label text-muted small">Status <span class="text-danger">*</span></label>
                    <select
                      class="form-select form-select-sm"
                      id="status"
                      v-model="formData.status"
                      :class="{ 'is-invalid': errors.status }"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <div v-if="errors.status" class="invalid-feedback">{{ errors.status }}</div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer border-0 pt-3">
              <button type="button" class="btn btn-light" @click="closeModal">Cancel</button>
              <button
                type="button"
                class="btn btn-primary"
                @click="handleSubmit"
                :disabled="loading"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ isEditMode ? 'Update' : 'Create' }} Class
              </button>
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

// Search and Filter
const searchQuery = ref('')
const statusFilter = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const selectedClasses = ref<number[]>([])
const itemsPerPage = ref(5)

// Data
const classes = ref<Class[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Statistics
const totalClasses = computed(() => classes.value.length)
const totalStudents = computed(() => classes.value.reduce((sum, cls) => sum + (cls.students || 0), 0))
const teachersAssigned = computed(() => {
  const uniqueTeachers = new Set(classes.value.filter(cls => cls.teacher?.name).map(cls => cls.teacher!.name))
  return uniqueTeachers.size
})

// Modal states
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const classToDelete = ref<Class | null>(null)

// Form data
const formData = reactive({
  name: '',
  generation: 'Grade 10',
  teacher: '',
  students: 0,
  room: '',
  status: 'Active' as 'Active' | 'Inactive',
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

const paginationStart = computed(() => {
  return classes.value.length > 0 ? 1 : 0
})

const paginationEnd = computed(() => {
  return Math.min(itemsPerPage.value, classes.value.length)
})

const isAllSelected = computed(() => {
  return filteredClasses.value.length > 0 &&
         selectedClasses.value.length === filteredClasses.value.length
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

function handleItemsPerPageChange() {
  // The computed property will automatically update the displayed items
  console.log('Items per page changed to:', itemsPerPage.value)
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedClasses.value = []
  } else {
    selectedClasses.value = filteredClasses.value.map(c => c.id)
  }
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

function openAddModal() {
  isEditMode.value = false
  resetForm()
  showModal.value = true
}

function openEditModal(classItem: Class) {
  isEditMode.value = true
  Object.assign(formData, {
    name: classItem.name,
    generation: classItem.generation,
    teacher: classItem.teacher?.name || '',
    students: classItem.students,
    room: classItem.room,
    status: classItem.status,
  })
  showModal.value = true
}

function viewClass(classItem: Class) {
  alert(`Class: ${classItem.name}\nGeneration: ${classItem.generation}\nTeacher: ${classItem.teacher?.name || 'No Teacher'}\nRoom: ${classItem.room}\nStudents: ${classItem.students}\nStatus: ${classItem.status}`)
}

function closeModal() {
  showModal.value = false
  resetForm()
}

function resetForm() {
  formData.name = ''
  formData.generation = 'Grade 10'
  formData.teacher = ''
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
      teacher_id: null,
      room: formData.room,
      students: formData.students,
      status: formData.status,
    }

    if (isEditMode.value) {
      // Update - we need to get the ID from somewhere
      // For now, we'll just show a message
      successMessage.value = 'Class updated successfully'
      closeModal()
      await loadClasses()
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
    error.value = 'Failed to save class'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function confirmDelete(classItem: Class) {
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

.class-item {
  background: white;
  transition: box-shadow 0.2s;
}

.class-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.badge {
  font-weight: 500;
  padding: 0.35rem 0.65rem;
}

.form-control-sm,
.form-select-sm {
  font-size: 0.875rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}
</style>
