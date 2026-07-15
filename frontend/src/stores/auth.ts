import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, me } from '@/services/authService'
import { googleLogin as googleLoginApi } from '@/services/googleAuthService'
import { setAuthToken, clearAuthToken } from '@/services/apiHttp'

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

  // Trust the token — on page refresh, if a token exists in localStorage,
  // the user is considered authenticated. The /user API call is only for
  // loading the user profile in the background; if it fails, we still
  // let the user through (real API calls will 401 if the token is invalid).
  const isAuthenticated = computed(() => !!token.value)

  async function init() {
    if (token.value) {
      setAuthToken(token.value)
      // Try to load the user profile in the background.
      // Return a promise so main.ts can await it before mounting the app.
      // Failure here won't log the user out — the 401 interceptor on axios
      // will handle truly invalid tokens when real API calls are made.
      try {
        const response = await me()
        user.value = response.user as User
      } catch {
        console.warn('Auth init: could not verify token with /user endpoint, proceeding anyway')
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

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    init,
    login,
    loginWithGoogle,
    logout,
  }
})
