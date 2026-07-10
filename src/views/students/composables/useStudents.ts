import { ref, computed } from 'vue'
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  assignStudentToClass,
  type Student,
  type SchoolClass,
} from '@/services/studentService'
import { classService } from '@/services/classService'

export function useStudents() {
  // ==================== Data ====================
  const students = ref<Student[]>([])
  const classes = ref<SchoolClass[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const genderFilter = ref('')
  const statusFilter = ref('')
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

  // ==================== Selection & Bulk Delete State ====================
  const selectedIds = ref<number[]>([])
  const showBulkDeleteModal = ref(false)
  const bulkDeleteIds = ref<number[]>([])
  const bulkStudentNames = computed(() => {
    return bulkDeleteIds.value
      .map((id) => students.value.find((s) => s.id === id))
      .filter(Boolean)
      .map((s) => s!.name)
  })

  // ==================== Form State ====================
  const editForm = ref({ name: '', gender: 'Male' as 'Male' | 'Female', class_id: null as number | null, status: 'active' as 'active' | 'inactive' })
  const assignForm = ref({ class_id: null as number | null })
  const createForm = ref({ name: '', gender: 'Male' as 'Male' | 'Female', class_id: null as number | null, status: 'active' as 'active' | 'inactive' })
  const photoFile = ref<File | null>(null)
  const photoPreview = ref<string | null>(null)

  // ==================== Computed ====================
  const filteredStudents = computed(() => {
    const q = searchQuery.value.toLowerCase()
    return students.value.filter((s) => {
      const matchesSearch = !q
        || s.name.toLowerCase().includes(q)
        || String(s.id).includes(q)
        || (s.class?.name?.toLowerCase().includes(q) ?? false)
      const matchesGender = !genderFilter.value || s.gender.toLowerCase() === genderFilter.value.toLowerCase()
      const matchesStatus = !statusFilter.value || s.status === statusFilter.value
      return matchesSearch && matchesGender && matchesStatus
    })
  })

  // ==================== Stats ====================
  const maleCount = computed(() => students.value.filter((s) => s.gender === 'Male').length)
  const femaleCount = computed(() => students.value.filter((s) => s.gender === 'Female').length)

  // ==================== Helpers ====================
  function getInitials(name: string): string {
    const parts = name.split(' ').filter(Boolean)
    return parts.length >= 2
      ? (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
      : name.substring(0, 2).toUpperCase()
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

  // ==================== API Calls ====================
  async function loadStudents() {
    try {
      const res = await getStudents()
      students.value = res.students
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to load students'
    } finally {
      loading.value = false
    }
  }

  async function loadClasses() {
    try {
      const res = await classService.getClasses()
      classes.value = Array.isArray(res.data) ? res.data : []
    } catch {
      // Silently fail
    }
  }

  async function init() {
    await Promise.all([loadStudents(), loadClasses()])
  }

  // ==================== Create ====================
  function handlePhotoUpload(file: File | null) {
    photoFile.value = file
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          photoPreview.value = reader.result
        }
      }
      reader.readAsDataURL(file)
    } else {
      photoPreview.value = null
    }
  }

  function openCreateModal() {
    createForm.value = { name: '', gender: 'Male', class_id: null, status: 'active' }
    photoFile.value = null
    photoPreview.value = null
    formError.value = null
    showCreateModal.value = true
  }

  function closeCreateModal() {
    showCreateModal.value = false
  }

  async function handleCreate() {
    if (!createForm.value.name.trim()) {
      formError.value = 'Name is required'
      return
    }
    formSubmitting.value = true
    formError.value = null
    try {
      const payload = {
        ...createForm.value,
        photo: photoFile.value,
      }
      const res = await createStudent(payload)
      students.value.unshift(res.student)
      photoFile.value = null
      photoPreview.value = null
      closeCreateModal()
      showToast('Student created successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      formError.value = err.response?.data?.message || err.message || 'Failed to create student'
    } finally {
      formSubmitting.value = false
    }
  }

  // ==================== Edit ====================
  function openEditModal(student: Student) {
    selectedStudent.value = student
    editForm.value = {
      name: student.name,
      gender: student.gender,
      class_id: student.class_id,
      status: student.status || 'active',
    }
    photoFile.value = null
    photoPreview.value = student.photo
    formError.value = null
    showEditModal.value = true
  }

  function closeEditModal() {
    showEditModal.value = false
    selectedStudent.value = null
  }

  async function handleEdit() {
    if (!selectedStudent.value) return
    if (!editForm.value.name.trim()) {
      formError.value = 'Name is required'
      return
    }
    formSubmitting.value = true
    formError.value = null
    try {
      const payload: Record<string, unknown> = {
        name: editForm.value.name,
        gender: editForm.value.gender,
        class_id: editForm.value.class_id,
        status: editForm.value.status,
      }
      // Handle photo: file to upload, null to remove, undefined to keep
      if (photoFile.value instanceof File) {
        payload.photo = photoFile.value
      } else if (photoFile.value === null && photoPreview.value === null && selectedStudent.value?.photo) {
        payload.photo = null
      }
      const res = await updateStudent(selectedStudent.value.id, payload)
      const index = students.value.findIndex((s) => s.id === selectedStudent.value!.id)
      if (index !== -1) students.value[index] = res.student
      photoFile.value = null
      photoPreview.value = null
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
    assignForm.value = { class_id: student.class_id }
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
      closeAssignModal()
      showToast('Student assigned to class successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      showToast(err.response?.data?.message || err.message || 'Failed to assign class', 'error')
    } finally {
      formSubmitting.value = false
    }
  }

  // ==================== Bulk Delete ====================
  function openBulkDeleteModal(ids: number[]) {
    bulkDeleteIds.value = ids
    showBulkDeleteModal.value = true
  }

  function closeBulkDeleteModal() {
    showBulkDeleteModal.value = false
    bulkDeleteIds.value = []
  }

  async function handleBulkDelete() {
    if (bulkDeleteIds.value.length === 0) return
    formSubmitting.value = true
    try {
      await Promise.all(
        bulkDeleteIds.value.map((id) => deleteStudent(id))
      )
      students.value = students.value.filter((s) => !bulkDeleteIds.value.includes(s.id))
      selectedIds.value = []
      closeBulkDeleteModal()
      showToast('Students deleted successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      showToast(err.response?.data?.message || err.message || 'Failed to delete students', 'error')
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
    genderFilter,
    statusFilter,
    formSubmitting,
    formError,
    toast,
    // Stats
    maleCount,
    femaleCount,
    // Modal state
    showCreateModal,
    showEditModal,
    showDeleteModal,
    showAssignModal,
    showDetailsModal,
    selectedStudent,
    selectedIds,
    showBulkDeleteModal,
    bulkDeleteIds,
    bulkStudentNames,
    // Form state
    createForm,
    editForm,
    assignForm,
    photoFile,
    photoPreview,
    // Computed
    filteredStudents,
    // Helpers
    getInitials,
    formatDate,
    showToast,
    handlePhotoUpload,
    // Actions
    init,
    openCreateModal,
    closeCreateModal,
    handleCreate,
    openEditModal,
    closeEditModal,
    handleEdit,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
    openAssignModal,
    closeAssignModal,
    handleAssign,
    viewDetails,
    closeDetailsModal,
    openBulkDeleteModal,
    closeBulkDeleteModal,
    handleBulkDelete,
  }
}
