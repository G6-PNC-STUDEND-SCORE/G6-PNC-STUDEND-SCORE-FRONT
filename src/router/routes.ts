import type { RouteRecordRaw } from 'vue-router'

import LoginView from '../views/auth/LoginPage.vue'
import DashboardView from '../views/DashboardView.vue'
import UserProfile from '../views/UserProfile.vue'
import StudentPage from '@/views/students/StudentPage.vue'
import SubjectPage from '@/views/SubjectPage.vue'
// import StudentPage from '@/views/students/StudentPage.vue'


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
    path: '/students',
    name: 'student',
    component: StudentPage,

  },
  {
    path: '/subjects',
    name: 'subject',
    component: SubjectPage,

  },



  {
    path: '/profile',
    name: 'profile',
    component: UserProfile,

  },



]
