import type { RouteRecordRaw } from 'vue-router'

import LoginView from '../views/auth/LoginPage.vue'

import StudentPage from '@/views/students/StudentPage.vue'



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
    path: '/students',
    name: 'student',
    component: StudentPage,

  },





]
