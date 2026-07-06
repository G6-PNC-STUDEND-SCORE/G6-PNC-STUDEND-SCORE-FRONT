import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, me } from '@/services/authService'
import { setAuthToken, clearAuthToken } from '@/services/apiHttp'

export interface User {
  id: number
  name: string
  email: string
  [key: string]: unknown
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token') || null)
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function init() {
    if (token.value) {
      setAuthToken(token.value)
      try {
        const response = await me()
        user.value = response.user as User
      } catch (e) {
        console.error('Failed to fetch user', e)
        logout()
      }
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await loginApi({ email, password })
      token.value = response.token
      user.value = response.user as User

      localStorage.setItem('token', response.token)
      setAuthToken(response.token)

      return true
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await logoutApi()
    } catch (e) {
      console.error('Logout error', e)
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      clearAuthToken()
    }
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    init,
    login,
    logout,
  }
})