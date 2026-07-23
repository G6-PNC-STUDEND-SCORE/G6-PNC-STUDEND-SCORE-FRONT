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

  // Trust the token; the 401 interceptor handles truly invalid tokens
  const isAuthenticated = computed(() => !!token.value)

  // Where a login (or a redirect away from a route the user's role can't access) should land.
  const defaultLandingPath = computed(() => (user.value?.role === 'student' ? '/portal' : '/dashboard'))

  // Single source of truth for "can this user's role do X" on the frontend — mirrors the
  // backend's role-derived permissions list (see AuthController::userData()). Use this before
  // calling any endpoint gated by `permission:` middleware, so pages don't fire requests a
  // role isn't allowed to make (avoids console 403s and lets the UI degrade gracefully).
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
        // Token is invalid/expired — clear everything and redirect to login
        token.value = null
        user.value = null
        localStorage.removeItem('token')
        clearAuthToken()
        router.push('/login')
      }
    }
  }

  // Vue Router starts resolving its first navigation as soon as the router plugin is
  // installed (app.use(router)) — this happens before init()'s /user fetch has a chance to
  // resolve, so `user` can still be null when the very first beforeEach guard runs on a hard
  // page load. Memoize the init() promise so the router guard can await the SAME in-flight
  // call (idempotent — instant on every navigation after the first) instead of guessing at
  // a role check with incomplete data.
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
