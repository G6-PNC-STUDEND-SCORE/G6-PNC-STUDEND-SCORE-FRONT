import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/views/auth/LoginPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')
const UserProfile = () => import('@/views/UserProfile.vue')
const StudentPage = () => import('@/views/students/StudentPage.vue')
const PlaceholderPage = () => import('@/views/PlaceholderPage.vue')

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
    path: '/students',
    name: 'students',
    component: StudentPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/classes',
    name: 'classes',
    component: PlaceholderPage,
    meta: { requiresAuth: true, title: 'Classes' },
  },
  {
    path: '/subjects',
    name: 'subjects',
    component: PlaceholderPage,
    meta: { requiresAuth: true, title: 'Subjects' },
  },
  {
    path: '/scores',
    name: 'scores',
    component: PlaceholderPage,
    meta: { requiresAuth: true, title: 'Scores' },
  },
  {
    path: '/reports',
    name: 'reports',
    component: PlaceholderPage,
    meta: { requiresAuth: true, title: 'Reports' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: UserProfile,
    meta: { requiresAuth: true },
  },
  {
    path: '/users',
    name: 'users',
    component: PlaceholderPage,
    meta: { requiresAuth: true, title: 'Users' },
  },
  {
    path: '/roles',
    name: 'roles',
    component: PlaceholderPage,
    meta: { requiresAuth: true, title: 'Roles & Permissions' },
  },
]
