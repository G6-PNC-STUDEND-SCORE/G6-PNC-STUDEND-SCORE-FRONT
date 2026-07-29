import { http } from './apiHttp'
import type { User } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  message?: string
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>('/login', payload)
  return res.data
}

export async function logout(): Promise<{ message: string }> {
  const res = await http.post<{ message: string }>('/logout')
  return res.data
}

export async function me(): Promise<{ user: User }> {
  const res = await http.get<{ user: User }>('/user')
  return res.data
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await http.post<{ message: string }>('/forgot-password', { email })
  return res.data
}

export async function resetPassword(payload: {
  email: string
  token: string
  password: string
  password_confirmation: string
}): Promise<{ message: string }> {
  const res = await http.post<{ message: string }>('/reset-password', payload)
  return res.data
}

export async function directResetPassword(payload: {
  email: string
  password: string
  password_confirmation: string
}): Promise<{ message: string }> {
  const res = await http.post<{ message: string }>('/direct-reset-password', payload)
  return res.data
}
