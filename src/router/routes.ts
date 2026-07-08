import type { RouteRecordRaw } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import ClassesView from '../views/ClassesView.vue'
import SubjectsView from '../views/SubjectsView.vue'
import StudentsView from '../views/StudentsView.vue'
import ScoresView from '../views/ScoresView.vue'
import ReportsView from '../views/ReportsView.vue'
import ProfileView from '../views/ProfileView.vue'
import UsersView from '../views/UsersView.vue'
import RolesView from '../views/RolesView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: 'Login',
      showInSidebar: false,
    },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      title: 'Dashboard',
      icon: 'bi bi-grid-fill',
      showInSidebar: true,
    },
  },
  {
    path: '/classes',
    name: 'classes',
    component: ClassesView,
    meta: {
      title: 'Classes',
      icon: 'bi bi-people-fill',
      showInSidebar: true,
    },
  },
  {
    path: '/subjects',
    name: 'subjects',
    component: SubjectsView,
    meta: {
      title: 'Subjects',
      icon: 'bi bi-book-fill',
      showInSidebar: true,
    },
  },
  {
    path: '/students',
    name: 'students',
    component: StudentsView,
    meta: {
      title: 'Students',
      icon: 'bi bi-person-badge-fill',
      showInSidebar: true,
    },
  },
  {
    path: '/scores',
    name: 'scores',
    component: ScoresView,
    meta: {
      title: 'Scores',
      icon: 'bi bi-clipboard-data-fill',
      showInSidebar: true,
    },
  },
  {
    path: '/reports',
    name: 'reports',
    component: ReportsView,
    meta: {
      title: 'Reports',
      icon: 'bi bi-file-earmark-bar-graph-fill',
      showInSidebar: true,
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      title: 'Profile',
      icon: 'bi bi-person-circle',
      showInSidebar: true,
    },
  },
  {
    path: '/users',
    name: 'users',
    component: UsersView,
    meta: {
      title: 'Users',
      icon: 'bi bi-person-fill',
      showInSidebar: true,
      parent: 'settings',
    },
  },
  {
    path: '/roles',
    name: 'roles',
    component: RolesView,
    meta: {
      title: 'Roles & Permissions',
      icon: 'bi bi-shield-lock-fill',
      showInSidebar: true,
      parent: 'settings',
    },
  },
]
