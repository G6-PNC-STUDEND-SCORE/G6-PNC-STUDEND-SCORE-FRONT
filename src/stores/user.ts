import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  getRoles,
  type User,
  type UserRole,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/services/userService'
import { cacheService } from '@/services/cacheService'

const USERS_CACHE_KEY = 'users-data'
const ROLES_CACHE_KEY = 'users-roles'
const CACHE_TTL = 60_000 // 1 min in-memory TTL
const LS_TTL = 24 * 60 * 60_000 // 24h localStorage TTL

export const useUserStore = defineStore('user', () => {
  // ─── State ──────────────────────────────────────────────────────────
  const users = ref<User[]>([])
  const roles = ref<UserRole[]>([])
  const totalUsers = ref(0)
  const lastPage = ref(1)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  let usersCacheTime = 0
  let lastParams = ''

  // ─── Getters ────────────────────────────────────────────────────────
  const hasUsers = computed(() => users.value.length > 0)

  // ─── Helpers ────────────────────────────────────────────────────────
  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  function invalidateCache() {
    usersCacheTime = 0
    lastParams = ''
    cacheService.remove(USERS_CACHE_KEY)
  }

  function saveToLocalStorage() {
    cacheService.set(USERS_CACHE_KEY, {
      users: users.value,
      total: totalUsers.value,
      lastPage: lastPage.value,
    }, LS_TTL)
  }

  // ─── Load cached data on init ────────────────────────────────────────
  function loadFromCache() {
    const cached = cacheService.get<{ users: User[]; total: number; lastPage: number }>(USERS_CACHE_KEY)
    if (cached) {
      users.value = cached.users
      totalUsers.value = cached.total
      lastPage.value = cached.lastPage
    }
    const cachedRoles = cacheService.get<UserRole[]>(ROLES_CACHE_KEY)
    if (cachedRoles) {
      roles.value = cachedRoles
    }
  }

  // ─── API: Fetch Users ───────────────────────────────────────────────
  async function fetchUsers(params?: Record<string, string | number>) {
    const now = Date.now()
    const paramsKey = JSON.stringify(params || {})

    // In-memory TTL — skip if same params fetched recently
    if (paramsKey === lastParams && users.value.length > 0 && (now - usersCacheTime) < CACHE_TTL) {
      return
    }

    loading.value = users.value.length === 0
    error.value = null
    clearMessages()

    try {
      const res = await getUsers(params)
      users.value = res.data.data
      totalUsers.value = res.data.total
      lastPage.value = res.data.last_page
      usersCacheTime = Date.now()
      lastParams = paramsKey
      saveToLocalStorage()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to load users'
    } finally {
      loading.value = false
    }
  }

  // ─── API: Fetch Roles ───────────────────────────────────────────────
  async function fetchRoles() {
    // Check localStorage first
    const cached = cacheService.get<UserRole[]>(ROLES_CACHE_KEY)
    if (cached) {
      roles.value = cached
      return
    }

    try {
      const res = await getRoles()
      roles.value = res.data
      cacheService.set(ROLES_CACHE_KEY, res.data, LS_TTL)
    } catch {
      // Silently fail — roles are non-critical
    }
  }

  // ─── Create ─────────────────────────────────────────────────────────
  async function createUserAction(data: CreateUserPayload): Promise<{ success: boolean; message: string }> {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const res = await createUser(data)
      if (res.success) {
        // Prepend to local list instantly
        users.value.unshift(res.data)
        totalUsers.value++
        invalidateCache()
        return { success: true, message: res.message || 'User created successfully' }
      } else {
        error.value = res.message || 'Failed to create user'
        return { success: false, message: res.message || 'Failed to create user' }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; status?: number } }; message?: string }
      if (err.response?.data?.status === 401) {
        error.value = 'Please login to create users'
      } else {
        error.value = err.response?.data?.message || err.message || 'Failed to create user'
      }
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // ─── Update ─────────────────────────────────────────────────────────
  async function updateUserAction(id: number, data: UpdateUserPayload): Promise<{ success: boolean; message: string }> {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const res = await updateUser(id, data)
      if (res.success) {
        // Update in local list instantly
        const index = users.value.findIndex(u => u.id === id)
        if (index !== -1) {
          users.value[index] = res.data
        }
        invalidateCache()
        return { success: true, message: res.message || 'User updated successfully' }
      } else {
        error.value = res.message || 'Failed to update user'
        return { success: false, message: res.message || 'Failed to update user' }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Failed to update user'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // ─── Delete ─────────────────────────────────────────────────────────
  async function deleteUserAction(id: number): Promise<{ success: boolean; message: string }> {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const res = await deleteUser(id)
      if (res.success) {
        users.value = users.value.filter(u => u.id !== id)
        totalUsers.value = Math.max(0, totalUsers.value - 1)
        invalidateCache()
        return { success: true, message: res.message || 'User deleted successfully' }
      } else {
        error.value = res.message || 'Failed to delete user'
        return { success: false, message: res.message || 'Failed to delete user' }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string }
      const msg = err.response?.data?.message || err.message || ''
      // If already deleted, still clean up locally
      if (err.response?.status === 404 || msg.toLowerCase().includes('not found')) {
        users.value = users.value.filter(u => u.id !== id)
        totalUsers.value = Math.max(0, totalUsers.value - 1)
        invalidateCache()
        return { success: true, message: 'User deleted successfully' }
      }
      error.value = msg || 'Failed to delete user'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // ─── Bulk Delete ────────────────────────────────────────────────────
  async function bulkDeleteUsersAction(ids: number[]): Promise<{ success: boolean; message: string; deletedCount: number }> {
    loading.value = true
    error.value = null
    clearMessages()

    try {
      const res = await bulkDeleteUsers(ids)
      if (res.success) {
        users.value = users.value.filter(u => !ids.includes(u.id))
        totalUsers.value = Math.max(0, totalUsers.value - ids.length)
        invalidateCache()
        successMessage.value = res.message || `${ids.length} user(s) deleted successfully`
        return { success: true, message: res.message || 'User deleted successfully', deletedCount: ids.length }
      } else {
        error.value = res.message || 'Failed to delete users'
        return { success: false, message: res.message || 'Failed to delete users', deletedCount: 0 }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string }
      const msg = err.response?.data?.message || err.message || ''
      if (err.response?.status === 404 || msg.toLowerCase().includes('not found')) {
        users.value = users.value.filter(u => !ids.includes(u.id))
        totalUsers.value = Math.max(0, totalUsers.value - ids.length)
        invalidateCache()
        successMessage.value = 'User deleted successfully'
        return { success: true, message: 'User deleted successfully', deletedCount: ids.length }
      }
      error.value = msg || 'Failed to delete users'
      return { success: false, message: error.value, deletedCount: 0 }
    } finally {
      loading.value = false
    }
  }

  // ─── Init (call once on mount) ──────────────────────────────────────
  async function init() {
    // 1. Show cached data INSTANTLY from localStorage
    loadFromCache()

    // 2. Refresh from API in background
    await Promise.all([fetchUsers(), fetchRoles()])
  }

  // Export
  return {
    users,
    roles,
    totalUsers,
    lastPage,
    loading,
    error,
    successMessage,
    hasUsers,
    clearMessages,
    invalidateCache,
    loadFromCache,
    fetchUsers,
    fetchRoles,
    createUser: createUserAction,
    updateUser: updateUserAction,
    deleteUser: deleteUserAction,
    bulkDeleteUsers: bulkDeleteUsersAction,
    init,
  }
})
