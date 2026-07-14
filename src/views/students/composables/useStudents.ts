import { ref, computed } from 'vue'
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  assignStudentToClass,
  uploadStudentPhoto,
  deleteStudentPhoto,
  type Student,
  type SchoolClass,
} from '@/services/studentService'

import { classService } from '@/services/classService'

// ── Module-level cache (shared across component instances) ──
let cachedStudents: Student[] | null = null
let cachedClasses: SchoolClass[] | null = null
let studentCacheTime = 0
let classCacheTime = 0
const CACHE_TTL = 30_000 // 30 seconds

function isCacheStale(cacheTime: number): boolean {
  return Date.now() - cacheTime > CACHE_TTL
}

export function useStudents() {
  // ==================== Data ====================
  const students = ref<Student[]>(cachedStudents ?? [])
  const classes = ref<SchoolClass[]>(cachedClasses ?? [])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const formSubmitting = ref(false)
  const formError = ref<string | null>(null)

  const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

  // ==================== Modal State ====================
  const showCreateModal = ref(false)
  const showEditModal = ref(false)
  const showDeleteModal = ref(false)
  const showAssignModal = ref(false)
  const showDetailsModal = ref(false)
  const selectedStudent = ref<Student | null>(null)

  // ==================== Form State ====================
  const genderFilter = ref('')

  const initialCreateForm = () => ({
    name: '',
    email: '',
    password: '',
    gender: 'Male' as 'Male' | 'Female',
    status: 'active' as 'active' | 'inactive',
    class_id: null as number | null,
    generation_id: null as number | null,
  })

  const createForm = ref(initialCreateForm())
  
  const initialEditForm = () => ({
    name: '',
    gender: 'Male' as 'Male' | 'Female',
    status: 'active' as 'active' | 'inactive',
    class_id: null as number | null,
    academic_year_id: null as number | null,
    enrollment_date: null as string | null,
  })

  const editForm = ref(initialEditForm())
  
  const assignForm = ref({ class_id: null as number | null })

  // ==================== Computed ====================
  const filteredStudents = computed(() => {
    return students.value.filter((s) => {
      const studentName = s.user?.name || ''
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesStudentNumber = (s.studentNumberSequence?.student_number || '').toLowerCase().includes(searchQuery.value.toLowerCase())
      return matchesSearch || matchesStudentNumber
    })
  })

  // ==================== Helpers ====================
  function getInitials(name: string): string {
    const safeName = name || ''
    const parts = safeName.split(' ').filter(Boolean)
    return parts.length >= 2
      ? (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
      : safeName.substring(0, 2).toUpperCase()
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    toast.value = { show: true, message, type }
    setTimeout(() => { toast.value.show = false }, 3000)
  }

  // ==================== API Calls with Cache ====================
  async function loadStudents() {
    if (cachedStudents && !isCacheStale(studentCacheTime)) {
      students.value = cachedStudents
      loading.value = false
      return
    }
    try {
      const res = await getStudents()
      cachedStudents = res.students
      studentCacheTime = Date.now()
      students.value = cachedStudents
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to load students'
    } finally {
      loading.value = false
    }
  }

  async function loadClasses() {
    if (cachedClasses && !isCacheStale(classCacheTime)) {
      classes.value = cachedClasses
      return
    }
    try {
      const response = await classService.getClasses()
      if (response.success) {
        cachedClasses = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean) as SchoolClass[]
        classCacheTime = Date.now()
        classes.value = cachedClasses
      }
    } catch {
      // Silently fail
    }
  }

  async function init() {
    loading.value = !cachedStudents || isCacheStale(studentCacheTime)
    await Promise.all([loadStudents(), loadClasses()])
  }

  // Invalidate cache on mutations so next visit re-fetches
  function invalidateStudentCache() {
    cachedStudents = null
    studentCacheTime = 0
  }

  // ==================== Create ====================
  function openCreateModal() {
    createForm.value = initialCreateForm()
    formError.value = null
    showCreateModal.value = true
  }

  function closeCreateModal() {
    showCreateModal.value = false
  }

  async function handleCreate() {
    if (!createForm.value.name.trim()) {
      formError.value = 'Student name is required'
      return
    }
    if (!createForm.value.email.trim()) {
      formError.value = 'Email address is required'
      return
    }
    if (!createForm.value.password || createForm.value.password.length < 8) {
      formError.value = 'Password must be at least 8 characters'
      return
    }
    formSubmitting.value = true
    formError.value = null
    try {
      const res = await createStudent(createForm.value)
      students.value.unshift(res.student)
      invalidateStudentCache()
      closeCreateModal()
      showToast('Student created successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      formError.value = err.response?.data?.message || err.message || 'Failed to create student'
    } finally {
      formSubmitting.value = false
    }
  }

  // ==================== Photo ====================
  const photoFile = ref<File | null>(null)
  const removePhotoFlag = ref(false)

  // ==================== Edit ====================
  function openEditModal(student: Student) {
    selectedStudent.value = student
    editForm.value = {
      ...initialEditForm(),
      class_id: student.class_id ?? null,
      academic_year_id: student.academic_year_id ?? null,
      enrollment_date: student.enrollment_date ?? null,
    }
    formError.value = null
    photoFile.value = null
    removePhotoFlag.value = false
    showEditModal.value = true
  }

  function closeEditModal() {
    showEditModal.value = false
    selectedStudent.value = null
    photoFile.value = null
    removePhotoFlag.value = false
  }

  function onEditPhotoSelected(file: File | null) {
    photoFile.value = file
    if (file) {
      removePhotoFlag.value = false
    }
  }

  function onEditRemovePhoto() {
    photoFile.value = null
    removePhotoFlag.value = true
  }

  async function handleEdit() {
    if (!selectedStudent.value) return
    formSubmitting.value = true
    formError.value = null
    try {
      // Update student info first
      const res = await updateStudent(selectedStudent.value.id, editForm.value)
      let updatedStudent = res.student

      // Upload photo if selected
      if (photoFile.value) {
        const photoRes = await uploadStudentPhoto(selectedStudent.value.id, photoFile.value)
        updatedStudent = photoRes.student
      } else if (removePhotoFlag.value) {
        const photoRes = await deleteStudentPhoto(selectedStudent.value.id)
        updatedStudent = photoRes.student
      }

      const index = students.value.findIndex((s) => s.id === selectedStudent.value!.id)
      if (index !== -1) students.value[index] = updatedStudent
      invalidateStudentCache()
      closeEditModal()
      showToast('Student updated successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      formError.value = err.response?.data?.message || err.message || 'Failed to update student'
    } finally {
      formSubmitting.value = false
    }
  }

  // ==================== Delete ====================
  function openDeleteModal(student: Student) {
    selectedStudent.value = student
    showDeleteModal.value = true
  }

  function closeDeleteModal() {
    showDeleteModal.value = false
    selectedStudent.value = null
  }

  async function handleDelete() {
    if (!selectedStudent.value) return
    formSubmitting.value = true
    try {
      await deleteStudent(selectedStudent.value.id)
      students.value = students.value.filter((s) => s.id !== selectedStudent.value!.id)
      invalidateStudentCache()
      closeDeleteModal()
      showToast('Student deleted successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      showToast(err.response?.data?.message || err.message || 'Failed to delete student', 'error')
    } finally {
      formSubmitting.value = false
    }
  }

  // ==================== Assign ====================
  function openAssignModal(student: Student) {
    selectedStudent.value = student
    assignForm.value = { class_id: student.class_id ?? null }
    showAssignModal.value = true
  }

  function closeAssignModal() {
    showAssignModal.value = false
    selectedStudent.value = null
  }

  async function handleAssign() {
    if (!selectedStudent.value || !assignForm.value.class_id) return
    formSubmitting.value = true
    try {
      const res = await assignStudentToClass(selectedStudent.value.id, assignForm.value.class_id)
      const index = students.value.findIndex((s) => s.id === selectedStudent.value!.id)
      if (index !== -1) students.value[index] = res.student
      invalidateStudentCache()
      closeAssignModal()
      showToast('Student assigned to class successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      showToast(err.response?.data?.message || err.message || 'Failed to assign class', 'error')
    } finally {
      formSubmitting.value = false
    }
  }

  // ==================== View Details ====================
  function viewDetails(student: Student) {
    selectedStudent.value = student
    showDetailsModal.value = true
  }

  function closeDetailsModal() {
    showDetailsModal.value = false
    selectedStudent.value = null
  }

  // ==================== Return ====================
  return {
    // Data
    students,
    classes,
    loading,
    error,
    searchQuery,
    formSubmitting,
    formError,
    toast,
    // Modal state
    showCreateModal,
    showEditModal,
    showDeleteModal,
    showAssignModal,
    showDetailsModal,
    selectedStudent,
    // Form state
    genderFilter,
    createForm,
    editForm,
    assignForm,
    photoFile,
    existingPhotoUrl: computed(() => selectedStudent.value?.profile_photo_url ?? null),
    // Computed
    filteredStudents,
    // Helpers
    getInitials,
    formatDate,
    showToast,
    // Actions
    init,
    invalidateStudentCache,
    openCreateModal,
    closeCreateModal,
    handleCreate,
    openEditModal,
    closeEditModal,
    handleEdit,
    onEditPhotoSelected,
    onEditRemovePhoto,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
    openAssignModal,
    closeAssignModal,
    handleAssign,
    viewDetails,
    closeDetailsModal,
  }
}
