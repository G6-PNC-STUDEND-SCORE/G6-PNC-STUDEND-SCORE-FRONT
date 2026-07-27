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
