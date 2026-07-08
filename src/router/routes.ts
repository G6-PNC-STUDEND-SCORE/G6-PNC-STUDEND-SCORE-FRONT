import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/views/auth/LoginPage.vue')
const DashboardPage = () => import('@/views/DashboardPage.vue')
const ClassPage = () => import('@/views/classes/ClassPage.vue')
const SubjectPage = () => import('@/views/subjects/SubjectPage.vue')
const StudentPage = () => import('@/views/students/StudentPage.vue')
const ScorePage = () => import('@/views/scores/ScorePage.vue')
const ReportPage = () => import('@/views/reports/ReportPage.vue')
const ProfilePage = () => import('@/views/profile/ProfilePage.vue')
const UserPage = () => import('@/views/users/UserPage.vue')
const RolePage = () => import('@/views/roles/RolePage.vue')

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
