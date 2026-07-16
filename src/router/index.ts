import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard - redirect to login if not authenticated
// Note: authStore.init() completes before app.mount() in main.ts,
// so authReady is always true by the time this guard runs.
router.beforeEach((to, _from) => {
  const authStore = useAuthStore()
  
  // Routes that don't require authentication
  const publicRoutes = ['/login']
  
  if (publicRoutes.includes(to.path)) {
    // Redirect to dashboard if already logged in
    if (authStore.isAuthenticated) {
      return '/dashboard'
    }
    return true
  }
  
  // Require authentication for all other routes
  if (!authStore.isAuthenticated) {
    return '/login'
  }
  return true
})

export default router
