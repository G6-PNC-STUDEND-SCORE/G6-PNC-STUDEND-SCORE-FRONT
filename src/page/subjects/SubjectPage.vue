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
                <div class="dropdown">
                  <button
                    class="btn btn-outline-secondary btn-sm"
                    type="button"
                    :id="'dropdownMenuButton-' + subject.id"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i class="bi bi-three-dots"></i>
                  </button>
                  <ul class="dropdown-menu" :aria-labelledby="'dropdownMenuButton-' + subject.id">
                    <li>
                      <button class="dropdown-item" type="button" @click="viewSubjectDetails(subject)">
                        <i class="bi bi-eye me-2"></i>View Details
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item" type="button" @click="openEditModal(subject)">
                        <i class="bi bi-pencil me-2"></i>Edit
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item" type="button" @click="openAssignModal">
                        <i class="bi bi-link me-2"></i>Assign Class
                      </button>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                      <button class="dropdown-item text-danger" type="button" @click="confirmDelete(subject)">
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
          <p>No subjects found</p>
        </div>

        <!-- Footer -->
        <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          <div class="small text-muted">
            Showing {{ paginationStart }} to {{ paginationEnd }} of {{ store.totalSubjects }} subjects
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
              <h5 class="modal-title fw-medium fs-5">{{ isEditMode ? 'Edit Subject' : 'Create Subject' }}</h5>
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

                <div class="mb-3">
                  <label for="status" class="form-label text-muted small fw-medium text-uppercase">Status</label>
                  <select
                    class="form-select"
                    id="status"
                    v-model="formData.status"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <!-- Grading Weights Section -->
                <div>
                  <p class="text-muted small fw-medium mb-3">GRADING WEIGHTS</p>
                  <div class="row g-3">
                    <div class="col-6 col-md-3">
                      <label for="quiz_weight" class="form-label text-muted small">Quiz (%)</label>
                      <input
                        type="number"
                        class="form-control form-control-sm"
                        id="quiz_weight"
                        v-model="formData.quiz_weight"
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                    <div class="col-6 col-md-3">
                      <label for="assignment_weight" class="form-label text-muted small">Assignment (%)</label>
                      <input
                        type="number"
                        class="form-control form-control-sm"
                        id="assignment_weight"
                        v-model="formData.assignment_weight"
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                    <div class="col-6 col-md-3">
                      <label for="midterm_weight" class="form-label text-muted small">Midterm (%)</label>
                      <input
                        type="number"
                        class="form-control form-control-sm"
                        id="midterm_weight"
                        v-model="formData.midterm_weight"
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                    <div class="col-6 col-md-3">
                      <label for="final_weight" class="form-label text-muted small">Final (%)</label>
                      <input
                        type="number"
                        class="form-control form-control-sm"
                        id="final_weight"
                        v-model="formData.final_weight"
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                  </div>
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
                {{ isEditMode ? 'Update' : 'Save' }} Subject
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
                          <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.name">
                            Professor {{ teacher.name }}
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

    <!-- View Subject Details Modal -->
    <Transition name="modal">
      <div v-if="showViewDetailsModal" class="modal fade show" style="display: block;" @click.self="closeViewDetailsModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-0 pt-3 px-3">
              <h5 class="modal-title fw-medium fs-5">Subject Details</h5>
              <button
                type="button"
                class="btn-close"
                @click="closeViewDetailsModal"
              ></button>
            </div>
            <div class="modal-body px-3">
              <div class="row g-3">
                <div class="col-12">
                  <div class="p-3 bg-light rounded">
                    <div class="row g-2">
                      <div class="col-sm-4">
                        <p class="text-muted small mb-1 fw-medium">NAME</p>
                        <p class="mb-0 fw-medium">{{ selectedSubject?.name }}</p>
                      </div>
                      <div class="col-sm-4">
                        <p class="text-muted small mb-1 fw-medium">CODE</p>
                        <p class="mb-0 fw-medium">{{ selectedSubject?.subject_code || 'N/A' }}</p>
                      </div>
                      <div class="col-sm-4">
                        <p class="text-muted small mb-1 fw-medium">STATUS</p>
                        <p class="mb-0">
                          <span class="badge" :class="selectedSubject?.is_active === 'Active' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'">
                            {{ selectedSubject?.is_active || 'Inactive' }}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-12" v-if="selectedSubject && getSubjectClasses(selectedSubject).length > 0">
                  <p class="text-muted small fw-medium mb-2">ASSIGNED CLASSES</p>
                  <div class="d-flex gap-2 flex-wrap">
                    <span
                      v-for="classInfo in getSubjectClasses(selectedSubject)"
                      :key="classInfo.class"
                      class="badge bg-primary bg-opacity-10 text-primary"
                    >
                      <i class="bi bi-diagram-3 me-1"></i>
                      {{ classInfo.class }}
                      <span v-if="classInfo.teacher" class="ms-1">• Professor {{ classInfo.teacher }}</span>
                    </span>
                  </div>
                </div>
                <div class="col-12">
                  <p class="text-muted small fw-medium mb-2">GRADING WEIGHTS</p>
                  <div class="row g-2">
                    <div class="col-6 col-md-3">
                      <div class="p-2 bg-light rounded text-center">
                        <p class="text-muted small mb-0">Quiz</p>
                        <p class="fw-medium mb-0">20%</p>
                      </div>
                    </div>
                    <div class="col-6 col-md-3">
                      <div class="p-2 bg-light rounded text-center">
                        <p class="text-muted small mb-0">Assignment</p>
                        <p class="fw-medium mb-0">10%</p>
                      </div>
                    </div>
                    <div class="col-6 col-md-3">
                      <div class="p-2 bg-light rounded text-center">
                        <p class="text-muted small mb-0">Midterm</p>
                        <p class="fw-medium mb-0">30%</p>
                      </div>
                    </div>
                    <div class="col-6 col-md-3">
                      <div class="p-2 bg-light rounded text-center">
                        <p class="text-muted small mb-0">Final</p>
                        <p class="fw-medium mb-0">40%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer border-0 pt-3 px-3 pb-3">
              <button type="button" class="btn btn-primary px-4" @click="closeViewDetailsModal">OK</button>
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
import type { Subject, SubjectPayload } from '@/services/subjectService'
import { subjectService } from '@/services/subjectService'
import { classService } from '@/services/classService'

const store = useSubjectStore()

// Search and Filter
const searchQuery = ref('')
const statusFilter = ref('')
const itemsPerPage = ref(5)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Teachers list
const teachers = ref<{ id: number; name: string }[]>([])
const loadingTeachers = ref(false)

// Classes list
const classes = ref<{ id: number; name: string }[]>([])
const loadingClasses = ref(false)

// Modal states
const showModal = ref(false)
const showDeleteModal = ref(false)
const showAssignModal = ref(false)
const showViewDetailsModal = ref(false)
const isEditMode = ref(false)
const subjectToDelete = ref<Subject | null>(null)
const selectedSubject = ref<Subject | null>(null)
const selectedClassForAssign = ref('')

// Selected subjects for checkbox
const selectedSubjects = ref<number[]>([])
const selectedSubjectsForAssign = ref<number[]>([])
const subjectAssignments = ref<Record<number, string>>({})

// Form data
const formData = reactive({
  name: '',
  teacher_id: null as number | null,
  class_id: null as number | null,
  status: 'Active' as 'Active' | 'Inactive',
  quiz_weight: 20,
  assignment_weight: 10,
  midterm_weight: 30,
  final_weight: 40,
})

const errors = reactive({
  name: '',
  teacher_id: '',
  class_id: '',
  status: '',
})

// Computed
const filteredSubjects = computed(() => {
  return store.subjects.slice(0, itemsPerPage.value)
})

const paginationStart = computed(() => {
  return store.subjects.length > 0 ? 1 : 0
})

const paginationEnd = computed(() => {
  return Math.min(itemsPerPage.value, store.subjects.length)
})

const isAllSelected = computed(() => {
  return filteredSubjects.value.length > 0 &&
         selectedSubjects.value.length === filteredSubjects.value.length
})

const unassignedSubjects = computed(() => {
  return store.subjects.filter(s => !s.teacher?.user?.name || s.teacher.user.name === '').length
})

const teachingTutors = computed(() => {
  const uniqueTeachers = new Set(store.subjects.filter(s => s.teacher?.user?.name).map(s => s.teacher!.user!.name))
  return uniqueTeachers.size
})

const assignableSubjects = computed(() => {
  return store.subjects.filter(s => s.is_active === 'Active')
})

// Methods

function getClassCount(subject: Subject): number {
  // Count how many classes this subject is assigned to
  const subjectClasses = store.subjects.filter(s => s.name === subject.name)
  return new Set(subjectClasses.map(s => s.class?.name || '')).size
}

function getSubjectClasses(subject: Subject | null) {
  // Get unique class-teacher combinations for this subject
  if (!subject) return []

  const classMap = new Map()
  store.subjects.forEach(s => {
    if (s.name === subject.name && s.class) {
      const key = s.class.name
      if (!classMap.has(key)) {
        classMap.set(key, {
          class: s.class.name,
          teacher: s.teacher?.user?.name ? `Professor ${s.teacher.user.name}` : ''
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

function handleItemsPerPageChange() {
  // The computed property will automatically update the displayed items
  console.log('Items per page changed to:', itemsPerPage.value)
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
    teacher_id: subject.teacher?.id || null,
    class_id: subject.class?.id || null,
    status: subject.is_active,
    quiz_weight: subject.quiz_weight || 20,
    assignment_weight: subject.assignment_weight || 10,
    midterm_weight: subject.midterm_weight || 30,
    final_weight: subject.final_weight || 40,
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

function resetForm() {
  formData.name = ''
  formData.teacher_id = null
  formData.class_id = null
  formData.status = 'Active'
  formData.quiz_weight = 20
  formData.assignment_weight = 10
  formData.midterm_weight = 30
  formData.final_weight = 40
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

  // Only validate teacher_id, class_id, and status in edit mode
  if (isEditMode.value) {
    if (!formData.class_id) {
      errors.class_id = 'Class is required'
      isValid = false
    } else {
      errors.class_id = ''
    }

    if (!formData.status) {
      errors.status = 'Status is required'
      isValid = false
    } else {
      errors.status = ''
    }
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  try {
    if (isEditMode.value && store.currentSubject) {
      // For edit mode, submit only the fields that are allowed
      const subjectData: Partial<SubjectPayload> = {
        name: formData.name,
        status: formData.status,
      }

      // Only include grading weights if they exist
      if (formData.quiz_weight !== undefined) {
        subjectData.quiz_weight = formData.quiz_weight
      }
      if (formData.assignment_weight !== undefined) {
        subjectData.assignment_weight = formData.assignment_weight
      }
      if (formData.midterm_weight !== undefined) {
        subjectData.midterm_weight = formData.midterm_weight
      }
      if (formData.final_weight !== undefined) {
        subjectData.final_weight = formData.final_weight
      }

      console.log('Updating subject with data:', subjectData)
      const success = await store.updateSubject(store.currentSubject.id, subjectData)
      if (success) {
        closeModal()
        await store.fetchSubjects(searchQuery.value, statusFilter.value)
      } else {
        console.error('Update failed:', store.error)
        alert('Failed to update subject: ' + (store.error || 'Unknown error'))
      }
    } else {
      // For create mode, submit only the name, status, and grading weights
      const subjectData: Partial<SubjectPayload> = {
        name: formData.name,
        status: formData.status,
        quiz_weight: formData.quiz_weight,
        assignment_weight: formData.assignment_weight,
        midterm_weight: formData.midterm_weight,
        final_weight: formData.final_weight,
      }
      console.log('Creating subject with data:', subjectData)
      const success = await store.createSubject(subjectData)
      if (success) {
        closeModal()
        await store.fetchSubjects(searchQuery.value, statusFilter.value)
      } else {
        console.error('Create failed:', store.error)
        alert('Failed to create subject: ' + (store.error || 'Unknown error'))
      }
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    alert('An error occurred: ' + error)
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

function confirmDelete(subject: Subject) {
  subjectToDelete.value = subject
  showDeleteModal.value = true
}

function viewSubjectDetails(subject: Subject) {
  selectedSubject.value = subject
  showViewDetailsModal.value = true
}

function closeViewDetailsModal() {
  showViewDetailsModal.value = false
  selectedSubject.value = null
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
