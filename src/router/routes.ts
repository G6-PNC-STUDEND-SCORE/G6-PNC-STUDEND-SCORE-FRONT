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
  {
    path: '/classes',
    name: 'class',
    component: ClassView,
  },
  {
    path: '/subjects',
    name: 'subject',
    component: SubjectView,
  },
  {
    path: '/students',
    name: 'student',
    component: StudentView,
  },
  {
    path: '/scores',
    name: 'score',
    component: ScoreView,
  },
  {
    path: '/reports',
    name: 'report',
    component: ReportView,
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
  },
  {
    path: '/users',
    name: 'users',
    component: UserView,
  },
  {
    path: '/roles',
    name: 'roles',
    component: RoleView,
  },
]

