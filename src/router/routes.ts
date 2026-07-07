import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/views/auth/LoginPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')

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
    name: 'class',
    component: ClassPage,
  },
  {
    path: '/subjects',
    name: 'subject',
    component: SubjectPage,
  },
  {
    path: '/students',
    name: 'student',
    component: StudentPage,
  },
  {
    path: '/scores',
    name: 'score',
    component: ScorePage,
  },
  {
    path: '/reports',
    name: 'report',
    component: ReportPage,
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
  },
  {
    path: '/users',
    name: 'users',
    component: UserPage,
  },
  {
    path: '/roles',
    name: 'roles',
    component: RolePage,
  },
]
