<template>
  <div class="subject-management">
    <!-- Statistics Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="stat-card">
          <div class="stat-icon bg-primary bg-opacity-10 text-primary">
            <i class="bi bi-journal-bookmark"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label text-muted small mb-1">TOTAL SUBJECTS</p>
            <h3 class="stat-value mb-0">{{ store.totalSubjects }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="stat-icon bg-warning bg-opacity-10 text-warning">
            <i class="bi bi-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label text-muted small mb-1">UNASSIGNED SUBJECTS</p>
            <h3 class="stat-value mb-0">{{ unassignedSubjects }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card">
          <div class="stat-icon bg-success bg-opacity-10 text-success">
            <i class="bi bi-person-video3"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label text-muted small mb-1">TEACHING TUTORS</p>
            <h3 class="stat-value mb-0">{{ teachingTutors }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Curriculum Subjects Section -->
    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <!-- Section Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="fw-medium mb-0">Curriculum Subjects</h5>
          <div class="d-flex gap-2">
            <input
              type="text"
              class="form-control form-control-sm"
              placeholder="Search subject..."
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
              <i class="bi bi-plus-lg me-1"></i>Create Subject
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
            Select all visible subjects
          </label>
        </div>

        <!-- Loading Spinner -->
        <div v-if="store.loading" class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <!-- Subjects List -->
        <div v-else-if="filteredSubjects.length > 0">
          <div v-for="subject in filteredSubjects" :key="subject.id" class="subject-item border rounded p-3 mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    :value="subject.id"
                    v-model="selectedSubjects"
                  />
                  <span class="badge bg-secondary text-dark small">#{{ subject.id }}</span>
                  <h6 class="fw-medium mb-0">{{ subject.name }}</h6>
                  <span class="badge bg-success bg-opacity-10 text-success small">Active</span>
                </div>

                <div class="ms-5">
                  <p class="text-muted small mb-2">
                    <i class="bi bi-diagram-3 me-1"></i>
                    {{ getClassCount(subject) }} classes
                    <span class="mx-2">•</span>
                    <i class="bi bi-gear me-1"></i>
                    Weights: Quiz (20%) · Assignment (10%) · Midterm (30%) · Final (40%)
                  </p>

                  <div class="d-flex gap-2 flex-wrap">
                    <span
                      v-for="classInfo in getSubjectClasses(subject)"
                      :key="classInfo.class"
                      class="badge bg-light text-dark border"
                    >
                      {{ classInfo.class }} {{ classInfo.teacher }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="d-flex gap-2">
                <button class="btn btn-outline-primary btn-sm" @click="openAssignModal">
                  <i class="bi bi-link me-1"></i>Assign to Class
                </button>
                <button class="btn btn-outline-secondary btn-sm" @click="openEditModal(subject)">
                  <i class="bi bi-three-dots"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-5 text-muted">
          <i class="bi bi-inbox fs-1 d-block mb-2"></i>
          <p>No subjects found</p>
        </div>

        <!-- Footer -->
        <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          <div class="small text-muted">
            Showing 1 to {{ filteredSubjects.length }} of {{ store.totalSubjects }} subjects
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="small text-muted">Show:</span>
            <select class="form-select form-select-sm" style="width: auto;">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Messages -->
    <div v-if="store.error" class="alert alert-danger alert-dismissible fade show mt-3" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ store.error }}
      <button type="button" class="btn-close" @click="store.clearMessages()"></button>
    </div>

    <div v-if="store.successMessage" class="alert alert-success alert-dismissible fade show mt-3" role="alert">
      <i class="bi bi-check-circle-fill me-2"></i>
      {{ store.successMessage }}
      <button type="button" class="btn-close" @click="store.clearMessages()"></button>
    </div>

    <!-- Add/Edit Subject Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal fade show" style="display: block;" @click.self="closeModal">
        <div class="modal-dialog modal-dialog-centered" @click.stop>
          <div class="modal-content">
            <div class="modal-header border-0 pt-3 px-3">
              <h5 class="modal-title fw-medium fs-5">Create Subject</h5>
              <button
                type="button"
                class="btn-close"
                @click="closeModal"
              ></button>
            </div>
            <div class="modal-body px-3">
              <form @submit.prevent="handleSubmit">
                <div class="mb-3">
                  <label for="name" class="form-label text-muted small fw-medium text-uppercase">Subject Name</label>
                  <input
                    type="text"
                    class="form-control"
                    id="name"
                    v-model="formData.name"
                    :class="{ 'is-invalid': errors.name }"
                    placeholder="e.g. Science"
                    required
                  />
                  <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                </div>
              </form>
            </div>
            <div class="modal-footer border-0 pt-3 px-3 pb-3">
              <button type="button" class="btn btn-light px-4" @click="closeModal">Cancel</button>
              <button
                type="button"
                class="btn btn-primary px-4"
                @click="handleSubmit"
                :disabled="store.loading"
              >
                <span v-if="store.loading" class="spinner-border spinner-border-sm me-2"></span>
                Save Subject
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Assign to Class Modal -->
    <Transition name="modal">
      <div v-if="showAssignModal" class="modal fade show" style="display: block;" @click.self="closeAssignModal">
        <div class="modal-dialog modal-lg" @click.stop>
          <div class="modal-content">
            <div class="modal-header border-0 pt-3 px-3">
              <h5 class="modal-title fw-medium fs-5">Subjects & Teachers for Class {{ selectedClassForAssign }}</h5>
              <button
                type="button"
                class="btn-close"
                @click="closeAssignModal"
              ></button>
            </div>
            <div class="modal-body px-3">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th scope="col" class="small fw-semibold text-muted py-2" style="width: 80px;">SELECT</th>
                      <th scope="col" class="small fw-semibold text-muted py-2">SUBJECT</th>
                      <th scope="col" class="small fw-semibold text-muted py-2">ASSIGNED TEACHER</th>
                      <th scope="col" class="small fw-semibold text-muted py-2" style="width: 100px;">STATUS</th>
                      <th scope="col" class="small fw-semibold text-muted py-2" style="width: 100px;">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="subject in assignableSubjects" :key="subject.id">
                      <td class="py-2">
                        <input
                          type="checkbox"
                          class="form-check-input"
                          :value="subject.id"
                          v-model="selectedSubjectsForAssign"
                        />
                      </td>
                      <td class="py-2">
                        <span class="fw-medium">{{ subject.name }}</span>
                      </td>
                      <td class="py-2">
                        <select
                          class="form-select form-select-sm"
                          v-model="subjectAssignments[subject.id]"
                          style="width: 200px;"
                        >
                          <option value="">Select teacher</option>
                          <option v-for="teacher in teachers" :key="teacher" :value="teacher">
                            Professor {{ teacher }}
                          </option>
                        </select>
                      </td>
                      <td class="py-2">
                        <span class="badge bg-success bg-opacity-10 text-success small">Active</span>
                      </td>
                      <td class="py-2">
                        <button class="btn btn-outline-primary btn-sm">
                          <i class="bi bi-journal-text me-1"></i>Subjects
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer border-0 pt-3 px-3 pb-3">
              <button type="button" class="btn btn-light px-4" @click="closeAssignModal">Cancel</button>
              <button
                type="button"
                class="btn btn-primary px-4"
                @click="applyAssignments"
                :disabled="store.loading"
              >
                <span v-if="store.loading" class="spinner-border spinner-border-sm me-2"></span>
                Apply Changes
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
import { subjectService } from '@/services/subjectService'
import { classService } from '@/services/classService'

const store = useSubjectStore()

// Search and Filter
const searchQuery = ref('')
const statusFilter = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Teachers list
const teachers = ref<string[]>([])
const loadingTeachers = ref(false)

// Classes list
const classes = ref<{ id: number; name: string }[]>([])
const loadingClasses = ref(false)

// Modal states
const showModal = ref(false)
const showDeleteModal = ref(false)
const showAssignModal = ref(false)
const isEditMode = ref(false)
const subjectToDelete = ref<Subject | null>(null)
const selectedClassForAssign = ref('')

// Selected subjects for checkbox
const selectedSubjects = ref<number[]>([])
const selectedSubjectsForAssign = ref<number[]>([])
const subjectAssignments = ref<Record<number, string>>({})

// Form data
const formData = reactive({
  name: '',
  teacher: '',
  class: '',
  is_active: 'Active' as 'Active' | 'Inactive',
})

const errors = reactive({
  name: '',
  teacher: '',
  class: '',
  is_active: '',
})

// Computed
const filteredSubjects = computed(() => {
  return store.subjects
})

const isAllSelected = computed(() => {
  return filteredSubjects.value.length > 0 &&
         selectedSubjects.value.length === filteredSubjects.value.length
})

const unassignedSubjects = computed(() => {
  return store.subjects.filter(s => !s.teacher || s.teacher === '').length
})

const teachingTutors = computed(() => {
  const uniqueTeachers = new Set(store.subjects.filter(s => s.teacher && s.teacher !== '').map(s => s.teacher))
  return uniqueTeachers.size
})

const assignableSubjects = computed(() => {
  return store.subjects.filter(s => s.is_active === 'Active')
})

// Methods

function getClassCount(subject: Subject): number {
  // Count how many classes this subject is assigned to
  const subjectClasses = store.subjects.filter(s => s.name === subject.name)
  return new Set(subjectClasses.map(s => s.class)).size
}

function getSubjectClasses(subject: Subject) {
  // Get unique class-teacher combinations for this subject
  const classMap = new Map()
  store.subjects.forEach(s => {
    if (s.name === subject.name) {
      const key = s.class
      if (!classMap.has(key)) {
        classMap.set(key, {
          class: s.class,
          teacher: s.teacher ? `Professor ${s.teacher}` : ''
        })
      }
    }
  })
  return Array.from(classMap.values())
}

function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    store.fetchSubjects(searchQuery.value, statusFilter.value)
  }, 300)
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
    is_active: subject.is_active,
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
  formData.is_active = 'Active'
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

  if (!formData.is_active) {
    errors.is_active = 'Status is required'
    isValid = false
  } else {
    errors.is_active = ''
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
    is_active: formData.is_active,
  }

  if (isEditMode.value && store.currentSubject) {
    const success = await store.updateSubject(store.currentSubject.id, subjectData)
    if (success) {
      closeModal()
      await store.fetchSubjects(searchQuery.value, statusFilter.value)
    } else if (store.error) {
      console.error('Failed to update subject:', store.error)
    }
  } else {
    const success = await store.createSubject(subjectData)
    if (success) {
      closeModal()
      await store.fetchSubjects(searchQuery.value, statusFilter.value)
    } else if (store.error) {
      console.error('Failed to create subject:', store.error)
    }
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedSubjects.value = []
  } else {
    selectedSubjects.value = filteredSubjects.value.map(s => s.id)
  }
}

function openAssignModal() {
  selectedClassForAssign.value = '2027A'
  selectedSubjectsForAssign.value = []
  subjectAssignments.value = {}
  showAssignModal.value = true
}

function closeAssignModal() {
  showAssignModal.value = false
  selectedClassForAssign.value = ''
  selectedSubjectsForAssign.value = []
  subjectAssignments.value = {}
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

async function applyAssignments() {
  // Here you would typically send the assignments to the backend
  console.log('Applying assignments:', {
    class: selectedClassForAssign.value,
    assignments: subjectAssignments.value
  })
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))
  
  closeAssignModal()
  // Optionally refresh the subjects list
  await store.fetchSubjects(searchQuery.value, statusFilter.value)
}

// Lifecycle
onMounted(() => {
  store.fetchSubjects()
  fetchTeachers()
  fetchClasses()
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

async function fetchClasses() {
  loadingClasses.value = true
  try {
    const response = await classService.getClasses()
    console.log('Classes response:', response)
    if (response.success) {
      classes.value = Array.isArray(response.data) ? response.data : []
      console.log('Classes loaded:', classes.value)
    } else {
      console.error('Failed to fetch classes')
    }
  } catch (error) {
    console.error('Error fetching classes:', error)
    classes.value = []
  } finally {
    loadingClasses.value = false
  }
}
</script>

<style scoped>
.subject-management {
  padding: 2rem;
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

.subject-item {
  background: white;
  transition: box-shadow 0.2s;
}

.subject-item:hover {
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
