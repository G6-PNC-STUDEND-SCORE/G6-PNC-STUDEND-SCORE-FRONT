import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { subjectService } from '@/services/subjectService'
import type { Subject, SubjectPayload } from '@/services/subjectService'

const CACHE_TTL = 30_000

export const useSubjectStore = defineStore('subject', () => {
  const subjects = ref<Subject[]>([])
  const currentSubject = ref<Subject | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  let subjectsCacheTime = 0
  let lastSearch = ''
  let lastStatus = ''

  const totalSubjects = computed(() => subjects.value.length)
  const activeSubjects = computed(() => subjects.value.filter((s) => s.status === 'Active').length)
  const inactiveSubjects = computed(
    () => subjects.value.filter((s) => s.status === 'Inactive').length,
  )

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  async function fetchSubjects(search?: string, status?: string) {
    const now = Date.now()
    if (
      search === lastSearch &&
      status === lastStatus &&
      subjects.value.length > 0 &&
      now - subjectsCacheTime < CACHE_TTL
    ) {
      return
    }

    loading.value = subjects.value.length === 0
    error.value = null
    clearMessages()

    try {
      const response = await subjectService.getSubjects(search, status)
      if (response.success) {
        subjects.value = response.data as Subject[]
        subjectsCacheTime = Date.now()
        lastSearch = search ?? ''
        lastStatus = status ?? ''
      } else {
        error.value = response.message || 'Failed to fetch subjects'
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to fetch subjects'
    } finally {
      loading.value = false
    }
  }

  async function fetchSubject(id: number) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await subjectService.getSubject(id)
      if (response.success) {
        currentSubject.value = response.data as Subject
        return currentSubject.value
      } else {
        error.value = response.message || 'Failed to fetch subject'
        return null
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to fetch subject'
      return null
    } finally {
      loading.value = false
    }
  }

  function invalidateCache() {
    subjectsCacheTime = 0
    lastSearch = ''
    lastStatus = ''
  }

  async function createSubject(subjectData: SubjectPayload) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await subjectService.createSubject(subjectData)
      if (response.success) {
        subjects.value.push(response.data as Subject)
        subjectsCacheTime = Date.now()
        successMessage.value = response.message || 'Subject created successfully'
        return true
      } else {
        error.value = response.message || 'Failed to create subject'
        return false
      }
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string; status?: number } }
        message?: string
      }
      if (err.response?.data?.status === 401) {
        error.value = 'Please login to create subjects'
      } else {
        error.value = err.response?.data?.message || err.message || 'Failed to create subject'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateSubject(id: number, subjectData: Partial<SubjectPayload>) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await subjectService.updateSubject(id, subjectData)
      if (response.success) {
        const index = subjects.value.findIndex((s) => s.id === id)
        if (index !== -1) {
          subjects.value[index] = response.data as Subject
        }
        invalidateCache()
        successMessage.value = response.message || 'Subject updated successfully'
        return true
      } else {
        error.value = response.message || 'Failed to update subject'
        return false
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to update subject'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteSubject(id: number) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await subjectService.deleteSubject(id)
      if (response.success) {
        subjects.value = subjects.value.filter((s) => s.id !== id)
        invalidateCache()
        successMessage.value = response.message || 'Subject deleted successfully'
        return true
      } else {
        error.value = response.message || 'Failed to delete subject'
        return false
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to delete subject'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    subjects,
    currentSubject,
    loading,
    error,
    successMessage,
    totalSubjects,
    activeSubjects,
    inactiveSubjects,
    clearMessages,
    invalidateCache,
    fetchSubjects,
    fetchSubject,
    createSubject,
    updateSubject,
    deleteSubject,
  }
})
