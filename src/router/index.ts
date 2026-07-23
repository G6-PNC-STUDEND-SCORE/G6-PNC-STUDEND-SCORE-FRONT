import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, _from) => {
  const authStore = useAuthStore()

  const publicRoutes = ['/login']

  if (!authStore.isAuthenticated) {
    return publicRoutes.includes(to.path) ? true : '/login'
  }

  // The router resolves its first navigation as soon as it's installed — before init()'s
  // /user fetch has necessarily resolved. Wait for that same in-flight (or already-settled)
  // call so every role-dependent decision below always sees the real user, never a
  // transient null (which is what caused an earlier infinite redirect loop).
  if (!authStore.user) {
    await authStore.ensureReady()
  }

  if (publicRoutes.includes(to.path)) {
    // Authenticated and hitting /login directly — bounce to wherever this role actually lands.
    return authStore.isAuthenticated ? authStore.defaultLandingPath : true
  }

  const allowedRoles = to.meta.roles
  const userRole = authStore.user?.role as 'admin' | 'teacher' | 'student' | undefined
  if (allowedRoles && !(userRole && allowedRoles.includes(userRole))) {
    return authStore.defaultLandingPath
  }

  return true
})

export default router
