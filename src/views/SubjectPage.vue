<template>
  <Header />
  <div class="px-4 py-4">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <i class="bi bi-book-fill"></i>
        </div>
        <div>
          <h2 class="page-title">Subjects</h2>
          <p class="page-subtitle">Manage your subjects efficiently</p>
        </div>
      </div>
      <button
        class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold"
        style="border-radius: 0.625rem; background: #2563eb; padding: 0.5rem 1.125rem; font-size: 0.875rem;"
        @click="openAddModal"
      >
        <i class="bi bi-plus-lg"></i>
        Add Subject
      </button>
    </div>

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

    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-body py-3">
        <div class="row g-3 align-items-center">
          <div class="col-md-8">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input type="text" class="form-control form-control-sm border-start-0 ps-0"
                placeholder="Search subjects by name..."
                v-model="searchQuery" @input="handleSearch" style="font-size: 0.9rem;" />
            </div>
          </div>
          <div class="col-md-4">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-funnel text-muted"></i>
              </span>
              <select class="form-select form-select-sm border-start-0 ps-0" v-model="statusFilter" @change="handleFilter" style="font-size: 0.9rem;">
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else class="card" style="border-radius: 12px; overflow: hidden;">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th class="text-uppercase fw-semibold text-muted small py-2 px-3">SUBJECT</th>
                <th class="text-uppercase fw-semibold text-muted small py-2 px-3">TEACHER</th>
                <th class="text-uppercase fw-semibold text-muted small py-2 px-3">CLASS</th>
                <th class="text-uppercase fw-semibold text-muted small py-2 px-3">STATUS</th>
                <th class="text-uppercase fw-semibold text-muted small py-2 px-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="subject in store.subjects" :key="subject.id" @click="openEditModal(subject)" style="cursor: pointer;">
                <td class="py-2 px-3">
                  <span class="fw-medium">{{ subject.name }}</span>
                </td>
                <td class="small py-2 px-3">{{ subject.teacher?.user?.name || '—' }}</td>
                <td class="small py-2 px-3">{{ subject.class?.name || '—' }}</td>
                <td class="py-2 px-3">
                  <span class="badge" :class="subject.status === 'Active' ? 'bg-success' : 'bg-secondary'">
                    {{ subject.status }}
                  </span>
                </td>
                <td class="text-center py-2 px-3">
                  <button class="btn btn-sm text-warning" @click.stop="openEditModal(subject)" title="Edit" style="background: none; border: none;">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm text-danger" @click.stop="confirmDelete(subject)" title="Delete" style="background: none; border: none;">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="store.subjects.length === 0">
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

    <Transition name="modal">
      <div v-if="showModal" class="modal fade show" style="display: block;" @click.self="closeModal">
        <div class="modal-dialog modal-dialog-centered" @click.stop>
          <div class="modal-content">
            <div class="modal-header border-0 pb-3">
              <h5 class="modal-title fw-medium mb-0">{{ isEditMode ? 'Edit Subject' : 'Add Subject' }}</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body pt-0">
              <form @submit.prevent="handleSubmit">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label text-muted small">Subject Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm" v-model="formData.name"
                      :class="{ 'is-invalid': errors.name }" placeholder="Enter subject name" required />
                    <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                  </div>

                  <div class="col-12">
                    <label class="form-label text-muted small">Teacher <span class="text-muted">(Optional)</span></label>
                    <select class="form-select form-select-sm" v-model.number="formData.teacher_id">
                      <option :value="null">Select a teacher</option>
                      <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">{{ teacher.name }}</option>
                    </select>
                  </div>

                  <div class="col-12">
                    <label class="form-label text-muted small">Class <span class="text-danger">*</span></label>
                    <select class="form-select form-select-sm" v-model.number="formData.class_id" required>
                      <option :value="null">Select a class</option>
                      <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                    </select>
                    <div v-if="errors.class_id" class="invalid-feedback">{{ errors.class_id }}</div>
                  </div>

                  <div class="col-12">
                    <label class="form-label text-muted small">Status <span class="text-danger">*</span></label>
                    <select class="form-select form-select-sm" v-model="formData.status" required>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer border-0 pt-3">
              <button type="button" class="btn btn-light" @click="closeModal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="handleSubmit" :disabled="store.loading">
                <span v-if="store.loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ isEditMode ? 'Update' : 'Create' }} Subject
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showDeleteModal" class="modal fade show" style="display: block;" @click.self="closeDeleteModal">
        <div class="modal-dialog modal-sm modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-0 pb-2">
              <h5 class="modal-title fw-medium">Delete Subject</h5>
              <button type="button" class="btn-close" @click="closeDeleteModal"></button>
            </div>
            <div class="modal-body pt-2">
              <p class="mb-2">Are you sure you want to delete <strong>{{ subjectToDelete?.name }}</strong>?</p>
              <p class="text-danger small mb-0">This action cannot be undone.</p>
            </div>
            <div class="modal-footer border-0 pt-2">
              <button type="button" class="btn btn-light btn-sm" @click="closeDeleteModal">Cancel</button>
              <button type="button" class="btn btn-danger btn-sm" @click="handleDelete" :disabled="store.loading">
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
import Header from '@/layouts/Header.vue'
import { ref, onMounted, reactive } from 'vue'
import { useSubjectStore } from '@/stores/subject'
import type { Subject } from '@/services/subjectService'
import { subjectService } from '@/services/subjectService'
import { classService } from '@/services/classService'


const store = useSubjectStore()
const searchQuery = ref('')
const statusFilter = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const teachers = ref<{ id: number; name: string }[]>([])
const classes = ref<{ id: number; name: string }[]>([])

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const subjectToDelete = ref<Subject | null>(null)

const formData = reactive({
  name: '',
  teacher_id: null as number | null,
  class_id: null as number | null,
  status: 'Active' as 'Active' | 'Inactive',
})

const errors = reactive({
  name: '',
  class_id: '',
})

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.fetchSubjects(searchQuery.value, statusFilter.value)
  }, 300)
}

function handleFilter() {
  store.fetchSubjects(searchQuery.value, statusFilter.value)
}

function openAddModal() {
  isEditMode.value = false
  formData.name = ''
  formData.teacher_id = null
  formData.class_id = null
  formData.status = 'Active'
  errors.name = ''
  errors.class_id = ''
  showModal.value = true
}

function openEditModal(subject: Subject) {
  isEditMode.value = true
  store.currentSubject = subject
  formData.name = subject.name
  formData.teacher_id = subject.teacher_id ?? subject.offerings?.[0]?.teacher_id ?? null
  formData.class_id = subject.class_id ?? subject.offerings?.[0]?.class_id ?? null
  formData.status = subject.status
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function validateForm(): boolean {
  let valid = true
  if (!formData.name.trim()) {
    errors.name = 'Name is required'
    valid = false
  } else {
    errors.name = ''
  }
  if (!formData.class_id) {
    errors.class_id = 'Class is required'
    valid = false
  } else {
    errors.class_id = ''
  }
  return valid
}

async function handleSubmit() {
  if (!validateForm()) return

  if (isEditMode.value && store.currentSubject) {
    await store.updateSubject(store.currentSubject.id, { ...formData })
    if (!store.error) {
      closeModal()
      await store.fetchSubjects()
    }
  } else {
    await store.createSubject({ ...formData })
    if (!store.error) {
      closeModal()
      await store.fetchSubjects()
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
  await store.deleteSubject(subjectToDelete.value.id)
  if (!store.error) closeDeleteModal()
}

onMounted(() => {
  store.fetchSubjects()
  fetchTeachers()
  fetchClasses()
})

async function fetchTeachers() {
  try {
    const response = await subjectService.getTeachers()
    if (response.success) {
      teachers.value = (response.data as { id: number; name: string }[]) || []
    }
  } catch {
    teachers.value = []
  }
}

async function fetchClasses() {
  try {
    const response = await classService.getClasses()
    if (response.success) {
      classes.value = Array.isArray(response.data) ? response.data : []
    }
  } catch {
    classes.value = []
  }
}
</script>

<style scoped></style>
