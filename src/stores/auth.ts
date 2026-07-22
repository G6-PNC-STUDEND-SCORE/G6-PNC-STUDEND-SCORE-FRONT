import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, me } from '@/services/authService'
import { googleLogin as googleLoginApi } from '@/services/googleAuthService'
import { setAuthToken, clearAuthToken } from '@/services/apiHttp'
import router from '@/router'

export interface User {
  id: number
  name: string
  email: string
  role: string
  [key: string]: unknown
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token') || null)
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loginMessage = ref<string | null>(null)

  // Trust the token; the 401 interceptor handles truly invalid tokens
  const isAuthenticated = computed(() => !!token.value)

  async function init() {
    if (token.value) {
      setAuthToken(token.value)
      try {
        const response = await me()
        user.value = response.user as User
      } catch {
        // Token is invalid/expired — clear everything and redirect to login
        token.value = null
        user.value = null
        localStorage.removeItem('token')
        clearAuthToken()
        router.push('/login')
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

  function setLoginMessage(msg: string | null) {
    loginMessage.value = msg
  }

  function clearLoginMessage() {
    loginMessage.value = null
  }

  return {
    token,
    user,
    loading,
    error,
    loginMessage,
    isAuthenticated,
    init,
    login,
    loginWithGoogle,
    logout,
    setLoginMessage,
    clearLoginMessage,
  }
})
