import type { RouteRecordRaw } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'

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

