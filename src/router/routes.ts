import SubjectPage from '@/page/subjects/SubjectPage.vue'
import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/views/auth/LoginPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')
const UserProfile = () => import('@/views/UserProfile.vue')
const ClassPage = () => import('@/page/classes/ClassPage.vue')

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
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: UserProfile,
    meta: { requiresAuth: true },
  },
  {
    path: '/subjects',
    name: 'subjects',
    component: SubjectPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/classes',
    name: 'classes',
    component: ClassPage,
    meta: { requiresAuth: true },
  },

]
