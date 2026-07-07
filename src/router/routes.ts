import type { RouteRecordRaw } from 'vue-router'

const LoginPage = () => import('@/page/login/LoginPage.vue')
const DashboardPage = () => import('@/page/dashboard/DashboardPage.vue')
const ClassPage = () => import('@/page/classes/ClassPage.vue')
const SubjectPage = () => import('@/page/subjects/SubjectPage.vue')
const StudentPage = () => import('@/page/students/StudentPage.vue')
const ScorePage = () => import('@/page/scores/ScorePage.vue')
const ReportPage = () => import('@/page/reports/ReportPage.vue')
const ProfilePage = () => import('@/page/profile/ProfilePage.vue')
const UserPage = () => import('@/page/users/UserPage.vue')
const RolePage = () => import('@/page/roles/RolePage.vue')

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

