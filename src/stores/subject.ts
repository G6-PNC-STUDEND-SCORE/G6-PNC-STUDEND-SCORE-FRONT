import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { subjectService } from '@/services/subjectService'
import type { Subject } from '@/services/subjectService'

export const useSubjectStore = defineStore('subject', () => {
  const subjects = ref<Subject[]>([])
  const currentSubject = ref<Subject | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  const totalSubjects = computed(() => subjects.value.length)
  const activeSubjects = computed(() => subjects.value.filter(s => s.status === 'Active').length)
  const inactiveSubjects = computed(() => subjects.value.filter(s => s.status === 'Inactive').length)

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  async function fetchSubjects(search?: string, status?: string) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await subjectService.getSubjects(search, status)
      if (response.success) {
        subjects.value = response.data as Subject[]
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

  async function createSubject(subjectData: Omit<Subject, 'id'>) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await subjectService.createSubject(subjectData)
      if (response.success) {
        subjects.value.push(response.data as Subject)
        successMessage.value = response.message || 'Subject created successfully'
        return true
      } else {
        error.value = response.message || 'Failed to create subject'
        return false
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; status?: number } }; message?: string }
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

  async function updateSubject(id: number, subjectData: Partial<Subject>) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await subjectService.updateSubject(id, subjectData)
      if (response.success) {
        const index = subjects.value.findIndex(s => s.id === id)
        if (index !== -1) {
          subjects.value[index] = response.data as Subject
        }
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
        subjects.value = subjects.value.filter(s => s.id !== id)
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
    fetchSubjects,
    fetchSubject,
    createSubject,
    updateSubject,
    deleteSubject,
  }
})
