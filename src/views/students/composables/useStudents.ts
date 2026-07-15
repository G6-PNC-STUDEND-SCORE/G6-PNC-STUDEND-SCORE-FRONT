import { ref, computed } from 'vue'
import {
  getStudents,
  getStudent,
  getGenerations,
  createStudent,
  updateStudent,
  deleteStudent,
  assignStudentToClass,
  type Student,
  type SchoolClass,
  type Generation,
} from '@/services/studentService'

import { classService } from '@/services/classService'

// ── Module-level cache (shared across component instances) ──
let cachedStudents: Student[] | null = null
let cachedClasses: SchoolClass[] | null = null
let cachedGenerations: Generation[] | null = null
let studentCacheTime = 0
let classCacheTime = 0
let generationCacheTime = 0
const CACHE_TTL = 30_000 // 30 seconds

function isCacheStale(cacheTime: number): boolean {
  return Date.now() - cacheTime > CACHE_TTL
}

export function useStudents() {
  // ==================== Data ====================
  const students = ref<Student[]>(cachedStudents ?? [])
  const classes = ref<SchoolClass[]>(cachedClasses ?? [])
  const generations = ref<Generation[]>(cachedGenerations ?? [])
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
  const combinedFilter = ref('')

  const initialCreateForm = () => ({
    name: '',
    email: '',
    password: '',
    gender: 'Male' as 'Male' | 'Female',
    status: 'active' as 'active' | 'inactive',
    generation_id: null as number | null,
    class_id: null as number | null,
    student_number: '',
  })

  const createForm = ref(initialCreateForm())
  
  const initialEditForm = () => ({
    name: '',
    email: '',
    password: '',
    gender: 'Male' as 'Male' | 'Female',
    status: 'active' as 'active' | 'inactive',
    generation_id: null as number | null,
    class_id: null as number | null,
    student_number: '',
  })

  const editForm = ref(initialEditForm())
  
  const assignForm = ref({ class_id: null as number | null })

  // ==================== Bulk Delete State ====================
  const showBulkDeleteModal = ref(false)
  const bulkDeleteIds = ref<number[]>([])
  const bulkDeleting = ref(false)
  const bulkProgress = ref(0)
  const bulkTotal = ref(0)
  const bulkSucceeded = ref(0)
  const bulkFailed = ref<number[]>([])
  const bulkLastError = ref('')

  // ==================== Computed ====================
  const filteredStudents = computed(() => {
    return students.value.filter((s) => {
      const q = searchQuery.value.toLowerCase().trim()

      // Search by name, student number, ID, or class name
      const studentName = (s.user?.name || '').toLowerCase()
      const studentNumber = (s.studentNumberSequence?.student_number || '').toLowerCase()
      const studentId = String(s.id)
      const className = (s.class?.name || '').toLowerCase()

      const matchesSearch =
        !q ||
        studentName.includes(q) ||
        studentNumber.includes(q) ||
        studentId.includes(q) ||
        className.includes(q)

      // Combined gender + status filter
      const filter = combinedFilter.value
      const studentGender = s.user?.gender || ''
      const studentStatus = s.user?.status || ''

      let matchesFilter = true
      if (filter === 'male') {
        matchesFilter = studentGender === 'Male'
      } else if (filter === 'female') {
        matchesFilter = studentGender === 'Female'
      } else if (filter === 'male_active') {
        matchesFilter = studentGender === 'Male' && studentStatus === 'active'
      } else if (filter === 'male_inactive') {
        matchesFilter = studentGender === 'Male' && studentStatus === 'inactive'
      } else if (filter === 'female_active') {
        matchesFilter = studentGender === 'Female' && studentStatus === 'active'
      } else if (filter === 'female_inactive') {
        matchesFilter = studentGender === 'Female' && studentStatus === 'inactive'
      }

      return matchesSearch && matchesFilter
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

  async function loadGenerations() {
    if (cachedGenerations && !isCacheStale(generationCacheTime)) {
      generations.value = cachedGenerations
      return
    }
    try {
      const response = await getGenerations()
      if (response.success) {
        cachedGenerations = response.data
        generationCacheTime = Date.now()
        generations.value = cachedGenerations
      }
    } catch {
      // Silently fail
    }
  }

  async function init() {
    loading.value = !cachedStudents || isCacheStale(studentCacheTime)
    await Promise.all([loadStudents(), loadClasses(), loadGenerations()])
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
    if (!createForm.value.password.trim()) {
      formError.value = 'Password is required'
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

  // ==================== Edit ====================
  function openEditModal(student: Student) {
    selectedStudent.value = student
    editForm.value = {
      name: student.user?.name ?? '',
      email: student.user?.email ?? '',
      password: '',
      gender: (student.user?.gender as 'Male' | 'Female') ?? 'Male',
      status: (student.user?.status as 'active' | 'inactive') ?? 'active',
      generation_id: student.generation_id ?? null,
      class_id: student.class_id ?? null,
      student_number: student.studentNumberSequence?.student_number ?? '',
    }
    formError.value = null
    showEditModal.value = true
  }

  function closeEditModal() {
    showEditModal.value = false
    selectedStudent.value = null
  }

  async function handleEdit() {
    if (!selectedStudent.value) return
    formSubmitting.value = true
    formError.value = null
    try {
      // Only send password if it was changed
      const editData = { ...editForm.value }
      if (!editData.password) {
        delete editData.password
      }
      const res = await updateStudent(selectedStudent.value.id, editData)
      const index = students.value.findIndex((s) => s.id === selectedStudent.value!.id)
      if (index !== -1) students.value[index] = res.student
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
  const deleteInProgress = ref(false)

  function openDeleteModal(student: Student) {
    // 🛡️ Never open the delete modal while another delete is in progress
    if (deleteInProgress.value) return
    selectedStudent.value = student
    showDeleteModal.value = true
  }

  function closeDeleteModal() {
    showDeleteModal.value = false
    selectedStudent.value = null
  }

  async function handleDelete() {
    if (!selectedStudent.value || deleteInProgress.value) return
    const studentId = selectedStudent.value.id

    // 🔒 Lock and close modal IMMEDIATELY — before any async work
    deleteInProgress.value = true
    showDeleteModal.value = false
    selectedStudent.value = null
    formSubmitting.value = true

    try {
      await deleteStudent(studentId)
      students.value = students.value.filter((s) => s.id !== studentId)
      invalidateStudentCache()
      showToast('Student deleted successfully')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      showToast(err.response?.data?.message || err.message || 'Failed to delete student', 'error')
    } finally {
      // 🛡️ Defender: close modal again in case anything reopened it
      showDeleteModal.value = false
      selectedStudent.value = null
      formSubmitting.value = false
      deleteInProgress.value = false
    }
  }

  // ==================== Bulk Delete ====================
  let bulkDeleteTimer: ReturnType<typeof setTimeout> | null = null

  function handleBulkDelete(ids: number[]) {
    if (ids.length === 0) return
    bulkDeleteIds.value = ids
    bulkDeleting.value = false
    bulkProgress.value = 0
    bulkTotal.value = ids.length
    bulkSucceeded.value = 0
    bulkFailed.value = []
    bulkLastError.value = ''
    showBulkDeleteModal.value = true
  }

  function closeBulkDeleteModal() {
    // 🛡️ Cancel the auto-close timer so it doesn't steal another operation's lock
    if (bulkDeleteTimer) {
      clearTimeout(bulkDeleteTimer)
      bulkDeleteTimer = null
    }
    showBulkDeleteModal.value = false
    bulkDeleteIds.value = []
    deleteInProgress.value = false
  }

  async function confirmBulkDelete() {
    const ids = bulkDeleteIds.value
    if (ids.length === 0 || deleteInProgress.value) return

    // 🔒 Use the same lock as single delete so neither can run at the same time
    deleteInProgress.value = true
    bulkDeleting.value = true
    bulkProgress.value = 0
    bulkSucceeded.value = 0
    bulkFailed.value = []
    bulkLastError.value = ''

    for (const id of ids) {
      try {
        await deleteStudent(id)
        bulkSucceeded.value++
      } catch {
        bulkFailed.value.push(id)
        bulkLastError.value = `Failed to delete student #${id}`
      }
      bulkProgress.value++
    }

    // Remove only successfully deleted students from the list
    const failedIds = new Set(bulkFailed.value)
    students.value = students.value.filter((s) => !bulkDeleteIds.value.includes(s.id) || failedIds.has(s.id))
    invalidateStudentCache()
    bulkDeleting.value = false

    // Show toast
    if (bulkFailed.value.length === 0) {
      showToast(`${ids.length} student${ids.length !== 1 ? 's' : ''} deleted successfully`)
    } else if (bulkSucceeded.value > 0) {
      showToast(`${bulkSucceeded.value} deleted, ${bulkFailed.value.length} failed`, 'error')
    } else {
      showToast('Failed to delete students', 'error')
    }

    // 🛡️ Defender: close modal, clear state, release lock
    showDeleteModal.value = false
    selectedStudent.value = null

    // Auto-close bulk modal after brief delay so user sees 100% progress
    bulkDeleteTimer = setTimeout(() => {
      bulkDeleteTimer = null
      showBulkDeleteModal.value = false
      bulkDeleteIds.value = []
      // Only release lock if no other operation has claimed it
      if (deleteInProgress.value) {
        deleteInProgress.value = false
      }
    }, 800)
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
    generations,
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
    showBulkDeleteModal,
    selectedStudent,
    // Form state
    combinedFilter,
    createForm,
    editForm,
    assignForm,
    // Bulk delete state
    bulkDeleteIds,
    bulkDeleting,
    bulkProgress,
    bulkTotal,
    bulkSucceeded,
    bulkFailed,
    bulkLastError,
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
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
    handleBulkDelete,
    confirmBulkDelete,
    closeBulkDeleteModal,
    openAssignModal,
    closeAssignModal,
    handleAssign,
    viewDetails,
    closeDetailsModal,
  }
}
