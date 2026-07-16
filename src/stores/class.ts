import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { classService } from '@/services/classService'
import type { SchoolClass } from '@/services/classService'

const CACHE_TTL = 60_000

export const useClassStore = defineStore('class', () => {
  const classes = ref<SchoolClass[]>([])
  const currentClass = ref<SchoolClass | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  let classesCacheTime = 0
  let lastSearch = ''

  const totalClasses = computed(() => classes.value.length)
  const activeClasses = computed(() => classes.value.filter(c => c.is_active === true).length)
  const inactiveClasses = computed(() => classes.value.filter(c => c.is_active === false).length)

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  async function fetchClasses(search?: string, bypassCache = false) {
    const now = Date.now()
    if (!bypassCache && search === lastSearch && classes.value.length > 0 && (now - classesCacheTime) < CACHE_TTL) {
      return
    }

    loading.value = classes.value.length === 0
    error.value = null
    clearMessages()

    try {
      const response = await classService.getClasses()
      if (response.success) {
        classes.value = (response.data as SchoolClass[]) || []
        classesCacheTime = Date.now()
        lastSearch = search ?? ''
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

  function invalidateCache() {
    localStorage.removeItem('classes_cache')
    classesCacheTime = 0
    lastSearch = ''
  }

  async function createClass(classData: Partial<SchoolClass>) {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const response = await classService.createClass(classData as any)
      if (response.success) {
        invalidateCache()
        await fetchClasses(undefined, true)
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
        invalidateCache()
        await fetchClasses(undefined, true)
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
        invalidateCache()
        await fetchClasses(undefined, true)
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
    activeClasses,
    inactiveClasses,
    clearMessages,
    invalidateCache,
    fetchClasses,
    fetchClass,
    createClass,
    updateClass,
    deleteClass,
  }
})