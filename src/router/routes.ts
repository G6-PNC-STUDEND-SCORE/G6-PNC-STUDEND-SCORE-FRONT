import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/views/auth/LoginPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')
const UserProfile = () => import('@/views/UserProfile.vue')
const StudentPage = () => import('@/views/students/StudentPage.vue')
const PlaceholderPage = () => import('@/views/PlaceholderPage.vue')

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
  {
    path: '/classes',
    name: 'classes',
    component: PlaceholderPage,
    meta: { title: 'Classes' },
  },
  {
    path: '/subjects',
    name: 'subjects',
    component: PlaceholderPage,
    meta: { title: 'Subjects' },
  },
  {
    path: '/students',
    name: 'student',
    component: StudentPage,
  },
  {
    path: '/scores',
    name: 'scores',
    component: PlaceholderPage,
    meta: { title: 'Scores' },
  },
  {
    path: '/reports',
    name: 'reports',
    component: PlaceholderPage,
    meta: { title: 'Reports' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: UserProfile,
  },
  {
    path: '/users',
    name: 'users',
    component: PlaceholderPage,
    meta: { title: 'Users' },
  },
  {
    path: '/roles',
    name: 'roles',
    component: PlaceholderPage,
    meta: { title: 'Roles & Permissions' },
  },
]