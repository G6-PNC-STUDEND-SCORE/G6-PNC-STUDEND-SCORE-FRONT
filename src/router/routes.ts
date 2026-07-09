import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/views/auth/LoginPage.vue')
const UserProfile = () => import('@/views/UserProfile.vue')
const StudentPage = () => import('@/views/students/StudentPage.vue')

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { guest: true },
  },

  {
    path: '/students',
    name: 'students',
    component: StudentPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: UserProfile,
    meta: { requiresAuth: true },
  },
  
]
