import type { RouteRecordRaw } from 'vue-router'

import LoginView from '../views/auth/LoginPage.vue'
import DashboardView from '../views/DashboardView.vue'
import UserProfile from '../views/UserProfile.vue'
import StudentPage from '@/views/students/StudentPage.vue'
import SubjectPage from '@/views/SubjectPage.vue'
import ClassPage from '@/views/classes/ClassPage.vue'
import ScorePage from '@/views/scores/ScorePage.vue'
import ReportPage from '@/views/reports/ReportPage.vue'
import UsersPage from '@/views/users/UsersPage.vue'
import RolesPage from '@/views/roles/RolesPage.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
  },
  {
    path: '/classes',
    name: 'classes',
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
    name: 'scores',
    component: ScorePage,
  },
  {
    path: '/reports',
    name: 'reports',
    component: ReportPage,
  },
  {
    path: '/users',
    name: 'users',
    component: UsersPage,
  },
  {
    path: '/roles',
    name: 'roles',
    component: RolesPage,
  },
  {
    path: '/profile',
    name: 'profile',
    component: UserProfile,
  },
]
