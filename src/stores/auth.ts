import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, me } from '@/services/authService'
import { googleLogin as googleLoginApi } from '@/services/googleAuthService'
import { setAuthToken, clearAuthToken } from '@/services/apiHttp'
import type { User } from '@/types'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token') || null)
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  const defaultLandingPath = computed(() => (user.value?.role === 'student' ? '/portal' : '/dashboard'))

  function hasPermission(permission: string): boolean {
    return (user.value?.permissions as string[] | undefined)?.includes(permission) ?? false
  }

  async function init() {
    if (token.value) {
      setAuthToken(token.value)
      try {
        const response = await me()
        user.value = response.user as User
      } catch {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
        clearAuthToken()
        router.push('/login')
      }
    }
  }

  let readyPromise: Promise<void> | null = null
  function ensureReady(): Promise<void> {
    if (!readyPromise) readyPromise = init()
    return readyPromise
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

  async function loginWithGoogle(credential: string) {
    loading.value = true
    error.value = null

    try {
      const response = await googleLoginApi(credential)
      token.value = response.token
      user.value = response.user as User

      localStorage.setItem('token', response.token)
      setAuthToken(response.token)

      return true
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      error.value = err.response?.data?.message || err.message || 'Google login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    defaultLandingPath,
    hasPermission,
    init,
    ensureReady,
    login,
    loginWithGoogle,
    logout,
  }
})
