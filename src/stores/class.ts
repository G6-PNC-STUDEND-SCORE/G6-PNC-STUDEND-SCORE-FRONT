import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { classService } from '@/services/classService'
import type { SchoolClass } from '@/services/classService'

interface PaginatedData {
  data: SchoolClass[]
  total: number
  last_page: number
  current_page: number
  per_page: number
  from: number | null
  to: number | null
}

export const useClassStore = defineStore('class', () => {
  const classes = ref<SchoolClass[]>([])
  const currentClass = ref<SchoolClass | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Server-side pagination state
  const totalClasses = ref(0)
  const lastPage = ref(1)

  const activeClasses = computed(() => classes.value.filter(c => c.is_active === true).length)
  const inactiveClasses = computed(() => classes.value.filter(c => c.is_active === false).length)

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  async function fetchClasses(params?: Record<string, string | number>) {
    loading.value = classes.value.length === 0
    error.value = null
    clearMessages()

    try {
      const response = await classService.getClasses(params)
      if (response.success) {
        const data = response.data as PaginatedData | SchoolClass[]
        // Handle both paginated and non-paginated responses
        if (!Array.isArray(data) && Array.isArray(data.data)) {
          classes.value = data.data as SchoolClass[]
          totalClasses.value = data.total ?? 0
          lastPage.value = data.last_page ?? 1
        } else if (Array.isArray(data)) {
          classes.value = data as SchoolClass[]
          totalClasses.value = data.length
          lastPage.value = 1
        } else {
          classes.value = []
          totalClasses.value = 0
          lastPage.value = 1
        }
      } else {
        error.value = response.message || 'Failed to fetch classes'
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to fetch classes'
    } finally {
      loading.value = false
    }
  }

  async function fetchClass(id: number) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await classService.getClasses()
      const list = Array.isArray(response.data) ? response.data : [response.data]
      const found = (list as SchoolClass[]).find(c => c.id === id) || null
      currentClass.value = found
      return currentClass.value
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to fetch class'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createClass(classData: Partial<SchoolClass>) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await classService.createClass(classData as Partial<SchoolClass>)
      if (response.success) {
        successMessage.value = response.message || 'Class created successfully'
        return true
      } else {
        error.value = response.message || 'Failed to create class'
        return false
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; status?: number } }; message?: string }
      if (err.response?.data?.status === 401) {
        error.value = 'Please login to create classes'
      } else {
        error.value = err.response?.data?.message || err.message || 'Failed to create class'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateClass(id: number, classData: Partial<SchoolClass>) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await classService.updateClass(id, classData as any)
      if (response.success) {
        successMessage.value = response.message || 'Class updated successfully'
        return true
      } else {
        error.value = response.message || 'Failed to update class'
        return false
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to update class'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteClass(id: number) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await classService.deleteClass(id)
      if (response.success) {
        // Remove from local list instantly
        classes.value = classes.value.filter(c => c.id !== id)
        totalClasses.value = Math.max(0, totalClasses.value - 1)
        successMessage.value = response.message || 'Class deleted successfully'
        return true
      } else {
        error.value = response.message || 'Failed to delete class'
        return false
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to delete class'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    classes,
    currentClass,
    loading,
    error,
    successMessage,
    totalClasses,
    lastPage,
    activeClasses,
    inactiveClasses,
    clearMessages,
    fetchClasses,
    fetchClass,
    createClass,
    updateClass,
    deleteClass,
  }
})