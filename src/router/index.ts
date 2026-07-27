import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  const isLoginRoute = to.name === 'login'

  if (!authStore.isAuthenticated) {
    return isLoginRoute ? true : '/login'
  }

  if (!authStore.user) {
    await authStore.ensureReady()
  }

  if (isLoginRoute) {
    return authStore.defaultLandingPath
  }

  const allowedRoles = to.meta.roles
  const userRole = authStore.user?.role as 'admin' | 'teacher' | 'student' | undefined
  if (allowedRoles && !(userRole && allowedRoles.includes(userRole))) {
    return authStore.defaultLandingPath
  }

  return true
})

export default router
