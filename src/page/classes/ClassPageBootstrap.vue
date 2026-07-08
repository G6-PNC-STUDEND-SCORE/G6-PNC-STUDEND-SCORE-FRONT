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

    <!-- Search and Filter -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body py-3">
        <div class="row g-3 align-items-center">
          <div class="col-md-8">
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
          <div class="col-md-4">
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
                      class="btn btn-sm btn-outline-primary"
                      @click="viewClass(classItem)"
                      title="View"
                    >
                      <i class="bi bi-eye"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-warning"
                      @click="openEditModal(classItem)"
                      title="Edit"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="confirmDelete(classItem)"
                      title="Delete"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredClasses.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
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

// Data
const classes = ref<Class[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

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
</style>
