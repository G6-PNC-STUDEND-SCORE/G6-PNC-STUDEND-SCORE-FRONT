import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/views/auth/LoginPage.vue')
// const DashboardPage = () => import('@/views/DashboardPage.vue')
const UserProfile = () => import('@/views/UserProfile.vue')
const StudentPage = () => import('@/views/students/StudentPage.vue')


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
    path: '/students',
    name: 'student',
    component: StudentPage,
  },
  
  {
    path: '/profile',
    name: 'profile',
    component: UserProfile,
  },
  
]