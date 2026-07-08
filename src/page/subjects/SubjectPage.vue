<template>
  <div class="subject-management">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-3">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <router-link to="/dashboard">Home</router-link>
        </li>
        <li class="breadcrumb-item active" aria-current="page">Subjects</li>
      </ol>
    </nav>

    <!-- Page Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-medium mb-0">Subject Management</h1>
        <p class="text-muted small mb-0 mt-1">Manage your subjects efficiently</p>
      </div>
      <button class="btn btn-primary btn-sm shadow-sm" @click="openAddModal">
        <i class="bi bi-plus-lg me-1"></i>Add Subject
      </button>
    </div>

    <!-- Alert Messages -->
    <div v-if="store.error" class="alert alert-danger alert-dismissible fade show" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ store.error }}
      <button type="button" class="btn-close" @click="store.clearMessages()"></button>
    </div>

    <div v-if="store.successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
      <i class="bi bi-check-circle-fill me-2"></i>
      {{ store.successMessage }}
      <button type="button" class="btn-close" @click="store.clearMessages()"></button>
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
                placeholder="Search subjects by name, teacher, or class..."
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
    <div v-if="store.loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

     <!-- Subjects Table -->
     <div v-else class="card" style="border-radius: 12px; overflow: hidden;">
       <div class="card-body p-0">
         <div class="table-responsive">
           <table class="table table-hover mb-0" style="border-radius: 12px;">
            <thead class="table-light">
              <tr>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">SUBJECT</th>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">TEACHER</th>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">CLASS</th>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">STATUS</th>
                <th scope="col" class="text-uppercase fw-semibold text-muted small ls-tight py-2 px-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="subject in filteredSubjects" :key="subject.id">
                <td class="py-2 px-3">
                  <div class="d-flex align-items-center">
                    <div class="subject-icon me-2 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" :style="{ backgroundColor: getSubjectColor(subject.name), width: '24px', height: '24px', fontSize: '0.75rem' }">
                      <i class="bi bi-book text-white"></i>
                    </div>
                    <span class="fw-medium">{{ subject.name }}</span>
                  </div>
                </td>
                <td class="small py-2 px-3">{{ subject.teacher }}</td>
                <td class="small py-2 px-3">{{ subject.class }}</td>
                <td class="py-2 px-3">
<span
  class="badge"
  :class="subject.status === 'Active' ? 'bg-success' : 'bg-secondary'"
>
                    {{ subject.status }}
                  </span>
                </td>
                <td class="text-center py-2 px-3">
                  <div class="btn-group" role="group">
<button
  class="btn btn-sm btn-outline-warning"
  @click="openEditModal(subject)"
  title="Edit"
>
  <i class="bi bi-pencil"></i>
</button>
<button
  class="btn btn-sm btn-outline-danger"
  @click="confirmDelete(subject)"
  title="Delete"
>
  <i class="bi bi-trash"></i>
</button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredSubjects.length === 0">
                <td colspan="5" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                  No subjects found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Subject Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal fade show" style="display: block;" @click.self="closeModal">
        <div class="modal-dialog modal-dialog-centered" @click.stop>
          <div class="modal-content">
            <div class="modal-header border-0 pb-3">
              <div class="d-flex align-items-center">
                <div class="subject-icon me-3 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" :style="{ backgroundColor: getSubjectColor(formData.name), width: '24px', height: '24px', fontSize: '0.75rem' }">
                  <i class="bi bi-book text-white"></i>
                </div>
                <h5 class="modal-title fw-medium mb-0">{{ isEditMode ? 'Edit Subject' : 'Add Subject' }}</h5>
              </div>
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
                    <label for="name" class="form-label text-muted small">Subject Name <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      id="name"
                      v-model="formData.name"
                      :class="{ 'is-invalid': errors.name }"
                      placeholder="Enter subject name"
                      required
                    />
                    <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                  </div>

                  <div class="col-12">
                    <label for="teacher" class="form-label text-muted small">Teacher <span class="text-muted">(Optional)</span></label>
                    <select
                      class="form-select form-select-sm"
                      id="teacher"
                      v-model="formData.teacher"
                      :class="{ 'is-invalid': errors.teacher }"
                    >
                      <option value="">Select a teacher</option>
                      <option v-for="teacher in teachers" :key="teacher" :value="teacher">
                        {{ teacher }}
                      </option>
                    </select>
                    <div v-if="errors.teacher" class="invalid-feedback">{{ errors.teacher }}</div>
                  </div>

                  <div class="col-12">
                    <label for="class" class="form-label text-muted small">Class <span class="text-danger">*</span></label>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      id="class"
                      v-model="formData.class"
                      :class="{ 'is-invalid': errors.class }"
                      placeholder="Enter class name"
                      required
                    />
                    <div v-if="errors.class" class="invalid-feedback">{{ errors.class }}</div>
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
                :disabled="store.loading"
              >
                <span v-if="store.loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ isEditMode ? 'Update' : 'Create' }} Subject
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
              <h5 class="modal-title fw-medium">Delete Subject</h5>
              <button
                type="button"
                class="btn-close"
                @click="closeDeleteModal"
              ></button>
            </div>
            <div class="modal-body pt-2">
              <p class="mb-2">Are you sure you want to delete <strong>{{ subjectToDelete?.name }}</strong>?</p>
              <p class="text-danger small mb-0">This action cannot be undone.</p>
            </div>
            <div class="modal-footer border-0 pt-2">
              <button type="button" class="btn btn-light btn-sm" @click="closeDeleteModal">Cancel</button>
              <button
                type="button"
                class="btn btn-danger btn-sm"
                @click="handleDelete"
                :disabled="store.loading"
              >
                <span v-if="store.loading" class="spinner-border spinner-border-sm me-2"></span>
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
import { useSubjectStore } from '@/stores/subject'
import type { Subject } from '@/services/subjectService'
import { getSubjectColor } from '@/assets/subject-images'
import { subjectService } from '@/services/subjectService'

const store = useSubjectStore()

// Search and Filter
const searchQuery = ref('')
const statusFilter = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Teachers list
const teachers = ref<string[]>([])
const loadingTeachers = ref(false)

// Modal states
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const subjectToDelete = ref<Subject | null>(null)

// Form data
const formData = reactive({
  name: '',
  teacher: '',
  class: '',
  status: 'Active' as 'Active' | 'Inactive',
})

const errors = reactive({
  name: '',
  teacher: '',
  class: '',
  status: '',
})

// Computed
const filteredSubjects = computed(() => {
  // When using server-side search/filter, just return store.subjects
  // The API already handles the filtering
  return store.subjects
})

// Methods

function handleSearch() {
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  // Debounce search to avoid too many API calls
  searchTimeout = setTimeout(() => {
    store.fetchSubjects(searchQuery.value, statusFilter.value)
  }, 300)
}

function handleFilter() {
  store.fetchSubjects(searchQuery.value, statusFilter.value)
}

function openAddModal() {
  isEditMode.value = false
  resetForm()
  showModal.value = true
}

function openEditModal(subject: Subject) {
  isEditMode.value = true
  store.currentSubject = subject
  Object.assign(formData, {
    name: subject.name,
    teacher: subject.teacher,
    class: subject.class,
    status: subject.status,
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

function resetForm() {
  formData.name = ''
  formData.teacher = ''
  formData.class = ''
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

  if (!formData.teacher.trim()) {
    errors.teacher = ''
  } else {
    errors.teacher = ''
  }

  if (!formData.class.trim()) {
    errors.class = 'Class is required'
    isValid = false
  } else {
    errors.class = ''
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

  const subjectData = {
    name: formData.name,
    teacher: formData.teacher,
    class: formData.class,
    status: formData.status,
  }

  if (isEditMode.value && store.currentSubject) {
    const success = await store.updateSubject(store.currentSubject.id, subjectData)
    if (success) {
      closeModal()
      // Refresh the subjects list to show updated data
      await store.fetchSubjects(searchQuery.value, statusFilter.value)
    } else if (store.error) {
      // Error is already set in the store, it will be displayed
      console.error('Failed to update subject:', store.error)
    }
  } else {
    const success = await store.createSubject(subjectData)
    if (success) {
      closeModal()
      // Refresh the subjects list to show new data
      await store.fetchSubjects(searchQuery.value, statusFilter.value)
    } else if (store.error) {
      // Error is already set in the store, it will be displayed
      console.error('Failed to create subject:', store.error)
    }
  }
}

function confirmDelete(subject: Subject) {
  subjectToDelete.value = subject
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  subjectToDelete.value = null
}

async function handleDelete() {
  if (!subjectToDelete.value) return

  const success = await store.deleteSubject(subjectToDelete.value.id)
  if (success) {
    closeDeleteModal()
  }
}

// Lifecycle
onMounted(() => {
  store.fetchSubjects()
  fetchTeachers()
})

async function fetchTeachers() {
  loadingTeachers.value = true
  try {
    const response = await subjectService.getTeachers()
    console.log('Teachers response:', response)
    if (response.success) {
      teachers.value = response.data || []
      console.log('Teachers loaded:', teachers.value)
    } else {
      console.error('Failed to fetch teachers')
    }
  } catch (error) {
    console.error('Error fetching teachers:', error)
    teachers.value = []
  } finally {
    loadingTeachers.value = false
  }
}
</script>

<style scoped>
.subject-management {
  padding: 2rem;
}
</style>
