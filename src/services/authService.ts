import { http } from './api'


export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  user: unknown
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

export async function me(): Promise<{ user: unknown }> {
  const res = await http.get<{ user: unknown }>('/user')
  return res.data
}

