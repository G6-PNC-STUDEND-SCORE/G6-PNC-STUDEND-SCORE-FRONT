import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    roles?: Array<'admin' | 'teacher' | 'student'>
  }
}

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
    meta: { roles: ['admin', 'teacher'] },
  },
  {
    path: '/classes',
    name: 'classes',
    component: () => import('@/views/classes/ClassPage.vue'),
    meta: { roles: ['admin', 'teacher'] },
  },
  {
    path: '/subjects',
    name: 'subject',
    component: () => import('@/views/SubjectPage.vue'),
    meta: { roles: ['admin', 'teacher'] },
  },
  {
    path: '/teachers',
    name: 'teachers',
    component: () => import('@/views/teachers/TeacherPage.vue'),
    meta: { roles: ['admin', 'teacher'] },
  },
  {
    path: '/students',
    name: 'student',
    component: () => import('@/views/students/StudentPage.vue'),
    meta: { roles: ['admin', 'teacher'] },
  },
  {
    path: '/scores',
    name: 'scores',
    component: () => import('@/views/scores/ScorePage.vue'),
    meta: { roles: ['admin', 'teacher'] },
  },
  {
    path: '/scores/term/:termId',
    name: 'scores-term-subjects',
    component: () => import('@/views/scores/TermSubjectsView.vue'),
    meta: { roles: ['admin', 'teacher'] },
  },
  {
    path: '/scores/subject/:subjectId/term/:termId',
    name: 'score-sheet',
    component: () => import('@/views/scores/ScoreSheetView.vue'),
    meta: { roles: ['admin', 'teacher'] },
  },
  {
    path: '/reports',
    name: 'reports',
    component: () => import('@/views/reports/ReportPage.vue'),
    meta: { roles: ['admin', 'teacher'] },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/users/UsersPage.vue'),
    meta: { roles: ['admin'] },
  },
  {
    path: '/roles',
    name: 'roles',
    component: () => import('@/views/roles/RolesPage.vue'),
    meta: { roles: ['admin'] },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/UserProfile.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsPage.vue'),
  },
  {
    path: '/portal',
    name: 'student-portal',
    component: () => import('@/views/portal/StudentPortalPage.vue'),
    meta: { roles: ['student'] },
  },
  {
    path: '/portal/scores',
    name: 'student-portal-scores',
    component: () => import('@/views/portal/StudentScoresPage.vue'),
    meta: { roles: ['student'] },
  },
  {
    path: '/portal/transcript',
    name: 'student-portal-transcript',
    component: () => import('@/views/portal/StudentTranscriptPage.vue'),
    meta: { roles: ['student'] },
  },
]
