import { http } from './api'

export interface UserRole {
  id: number
  name: string
  slug: string
}

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  gender: string | null
  status: string
  role: UserRole | null
  avatar: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface UsersResponse {
  success: boolean
  data: {
    current_page: number
    data: User[]
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

export interface UserResponse {
  success: boolean
  message?: string
  data: User
}

export interface RolesResponse {
  success: boolean
  data: UserRole[]
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role_id: number
  phone?: string
  gender?: string
  status?: string
}

export interface UpdateUserPayload {
  name: string
  email: string
  password?: string
  role_id: number
  phone?: string
  gender?: string
  status?: string
}

export async function getUsers(params?: {
  search?: string
  role_id?: number
  status?: string
  page?: number
  per_page?: number
}): Promise<UsersResponse> {
  const res = await http.get<UsersResponse>('/users', { params })
  return res.data
}

export async function getUser(id: number): Promise<UserResponse> {
  const res = await http.get<UserResponse>(`/users/${id}`)
  return res.data
}

export async function createUser(data: CreateUserPayload): Promise<UserResponse> {
  const res = await http.post<UserResponse>('/users', data)
  return res.data
}

export async function updateUser(id: number, data: UpdateUserPayload): Promise<UserResponse> {
  const res = await http.put<UserResponse>(`/users/${id}`, data)
  return res.data
}

export async function deleteUser(id: number): Promise<{ success: boolean; message: string }> {
  const res = await http.delete<{ success: boolean; message: string }>(`/users/${id}`)
  return res.data
}

export interface BulkDeleteResponse {
  success: boolean
  message: string
  data: { deleted_count: number }
}

export async function bulkDeleteUsers(ids: number[]): Promise<BulkDeleteResponse> {
  const res = await http.post<BulkDeleteResponse>('/users/bulk-delete', { ids })
  return res.data
}

export async function getRoles(): Promise<RolesResponse> {
  const res = await http.get<RolesResponse>('/users/roles')
  return res.data
}
