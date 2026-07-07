import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const publicPages = ['/login']
  const authRequired = !publicPages.includes(to.path)

  if (authRequired && !token) {
    next({ path: '/login' })
  } else {
    next()
  }
})

export default router
