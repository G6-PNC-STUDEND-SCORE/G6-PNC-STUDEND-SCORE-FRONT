import { ref, computed } from 'vue'
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkDeleteStudents,
  assignStudentToClass,
  uploadStudentPhoto,
  deleteStudentPhoto,
  type Student,
  type SchoolClass,
} from '@/services/studentService'

import { classService } from '@/services/classService'
import { cacheService } from '@/services/cacheService'

const STUDENTS_CACHE_KEY = 'students-data'
const CLASSES_CACHE_KEY = 'classes-data'

export function useStudents() {
  // ==================== Data ====================
  const cachedStudents = cacheService.get<Student[]>(STUDENTS_CACHE_KEY)
  const cachedClasses = cacheService.get<SchoolClass[]>(CLASSES_CACHE_KEY)

  const students = ref<Student[]>(cachedStudents ?? [])
  const classes = ref<SchoolClass[]>(cachedClasses ?? [])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const formSubmitting = ref(false)
  const formError = ref<string | null>(null)

const toast = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const showAssignModal = ref(false)
const showDetailsModal = ref(false)
const selectedStudent = ref<Student | null>(null)
const selectedBulkIds = ref<number[]>([])

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

  const filteredStudents = computed(() => {
    return students.value.filter((s) => {
      const studentName = s.user?.name || ''
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesStudentNumber = (s.studentNumberSequence?.student_number || '').toLowerCase().includes(searchQuery.value.toLowerCase())
      return matchesSearch || matchesStudentNumber
    })
  })

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

  async function loadStudents() {
    try {
      const res = await getStudents()
      students.value = res.students.sort((a, b) => b.id - a.id)
      cacheService.set(STUDENTS_CACHE_KEY, res.students.sort((a, b) => b.id - a.id), 24 * 60 * 60_000)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to load students'
    } finally {
      loading.value = false
    }
  }

  async function loadClasses() {
    try {
      const response = await classService.getClasses()
      if (response.success) {
        const data = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean) as SchoolClass[]
        classes.value = data
        cacheService.set(CLASSES_CACHE_KEY, data, 24 * 60 * 60_000)
      }
    } catch {
      // Non-critical; silently ignore
    }
  }

  async function init() {
    // 1. Show cached data INSTANTLY
    const cachedStudents = cacheService.get<Student[]>(STUDENTS_CACHE_KEY)
    const cachedClasses = cacheService.get<SchoolClass[]>(CLASSES_CACHE_KEY)
    if (cachedStudents) students.value = cachedStudents
    if (cachedClasses) classes.value = cachedClasses
    loading.value = !cachedStudents

    // 2. Refresh from API in background
    await Promise.all([loadStudents(), loadClasses()])
    loading.value = false
  }

  // Invalidate cache on mutations
  function invalidateStudentCache() {
    cacheService.remove(STUDENTS_CACHE_KEY)
    cacheService.remove(CLASSES_CACHE_KEY)
  }

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
    formError.value = null
    // Close modal immediately so user feels no delay
    closeCreateModal()
    // Save in background — show toast on success, or reopen modal on error
    try {
      const res = await createStudent(createForm.value)
      students.value.unshift(res.student)
      invalidateStudentCache()
      showToast('Student created successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      showToast(err.response?.data?.message || err.message || 'Failed to create student', 'error')
      // Reopen the form with the error so user can retry
      showCreateModal.value = true
      formError.value = err.response?.data?.message || err.message || 'Failed to create student'
    }
  }

  const photoFile = ref<File | null>(null)
  const removePhotoFlag = ref(false)

  function openEditModal(student: Student) {
    selectedStudent.value = student
    editForm.value = {
      ...initialEditForm(),
      name: student.user?.name ?? '',
      gender: (student.user?.gender as 'Male' | 'Female') ?? 'Male',
      status: (student.user?.status as 'active' | 'inactive') ?? 'active',
      class_id: student.class_id ?? student.classHistories?.find((h: any) => h.status === 'active')?.class_id ?? null,
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
      const res = await updateStudent(selectedStudent.value.id, editForm.value)
      let updatedStudent = res.student

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

  function openBulkDeleteModal(ids: number[]) {
    selectedBulkIds.value = ids
    showBulkDeleteModal.value = true
  }

  function closeBulkDeleteModal() {
    showBulkDeleteModal.value = false
    selectedBulkIds.value = []
  }

  async function handleBulkDelete() {
    const ids = selectedBulkIds.value
    if (!ids.length) return
    formSubmitting.value = true
    try {
      const res = await bulkDeleteStudents(ids)
      students.value = students.value.filter((s) => !ids.includes(s.id))
      invalidateStudentCache()
      closeBulkDeleteModal()
      showToast(res.message || 'Student deleted successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      showToast(err.response?.data?.message || err.message || 'Failed to delete students', 'error')
    } finally {
      formSubmitting.value = false
    }
  }

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
      const res = await deleteStudent(selectedStudent.value.id)
      students.value = students.value.filter((s) => s.id !== selectedStudent.value!.id)
      invalidateStudentCache()
      closeDeleteModal()
      showToast(res.message || 'Student deleted successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string }
      const msg = err.response?.data?.message || err.message || ''
      // If already deleted, still clean up and show success
      if (err.response?.status === 404 || msg.toLowerCase().includes('not found')) {
        students.value = students.value.filter((s) => s.id !== selectedStudent.value?.id)
        invalidateStudentCache()
        closeDeleteModal()
        showToast('Student deleted successfully')
      } else {
        showToast(msg || 'Failed to delete student', 'error')
      }
    } finally {
      formSubmitting.value = false
    }
  }

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

  function viewDetails(student: Student) {
    selectedStudent.value = student
    showDetailsModal.value = true
  }

  function closeDetailsModal() {
    showDetailsModal.value = false
    selectedStudent.value = null
  }

  return {
    students,
    classes,
    loading,
    error,
    searchQuery,
    formSubmitting,
    formError,
    toast,
    showCreateModal,
    showEditModal,
    showDeleteModal,
    showBulkDeleteModal,
    showAssignModal,
    showDetailsModal,
    selectedStudent,
    selectedBulkIds,
    genderFilter,
    createForm,
    editForm,
    assignForm,
    photoFile,
    existingPhotoUrl: computed(() => selectedStudent.value?.profile_photo_url ?? null),
    filteredStudents,
    getInitials,
    formatDate,
    showToast,
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
    openBulkDeleteModal,
    closeBulkDeleteModal,
    handleBulkDelete,
    openAssignModal,
    closeAssignModal,
    handleAssign,
    viewDetails,
    closeDetailsModal,
  }
}
