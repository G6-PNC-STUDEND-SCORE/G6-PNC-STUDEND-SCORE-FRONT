import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginPage.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
  },
  {
    path: '/classes',
    name: 'classes',
    component: () => import('@/views/classes/ClassPage.vue'),
  },
  {
    path: '/subjects',
    name: 'subject',
    component: () => import('@/views/SubjectPage.vue'),
  },
  {
    path: '/teachers',
    name: 'teachers',
    component: () => import('@/views/teachers/TeacherPage.vue'),
  },
  {
    path: '/students',
    name: 'student',
    component: () => import('@/views/students/StudentPage.vue'),
  },
  {
    path: '/scores',
    name: 'scores',
    component: () => import('@/views/scores/ScorePage.vue'),
  },
  {
    path: '/scores/subject/:subjectId/term/:termId',
    name: 'score-sheet',
    component: () => import('@/views/scores/ScoreSheetView.vue'),
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/views/reports/ReportPage.vue'),
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/users/UsersPage.vue'),
  },
  {
    path: '/roles',
    name: 'roles',
    component: () => import('@/views/roles/RolesPage.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/UserProfile.vue'),
  },
]
