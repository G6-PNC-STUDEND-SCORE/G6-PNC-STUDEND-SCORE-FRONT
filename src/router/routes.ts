import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/page/login/LoginPage.vue')

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
]

