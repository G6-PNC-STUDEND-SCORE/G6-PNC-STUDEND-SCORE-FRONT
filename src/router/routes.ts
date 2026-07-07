import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/page/login/LoginPage.vue')
const DashboardPage = () => import('@/page/dashboard/DashboardPage.vue')

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
  },
]

