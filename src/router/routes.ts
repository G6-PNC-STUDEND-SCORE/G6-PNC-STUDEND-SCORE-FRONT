import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/views/auth/LoginPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')
const UserProfile = () => import('@/views/UserProfile.vue')

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
    path: '/classes',
    name: 'classes',
    component: () => import('@/views/PlaceholderPage.vue'),
    meta: { requiresAuth: true, title: 'Classes' },
  },
  {
    path: '/subjects',
    name: 'subjects',
    component: () => import('@/views/PlaceholderPage.vue'),
    meta: { requiresAuth: true, title: 'Subjects' },
  },
  {
    path: '/students',
    name: 'students',
    component: () => import('@/views/PlaceholderPage.vue'),
    meta: { requiresAuth: true, title: 'Students' },
  },
  {
    path: '/scores',
    name: 'scores',
    component: () => import('@/views/PlaceholderPage.vue'),
    meta: { requiresAuth: true, title: 'Scores' },
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/views/PlaceholderPage.vue'),
    meta: { requiresAuth: true, title: 'Reports' },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/PlaceholderPage.vue'),
    meta: { requiresAuth: true, title: 'Users' },
  },
  {
    path: '/roles',
    name: 'roles',
    component: () => import('@/views/PlaceholderPage.vue'),
    meta: { requiresAuth: true, title: 'Roles & Permissions' },
  },
]
