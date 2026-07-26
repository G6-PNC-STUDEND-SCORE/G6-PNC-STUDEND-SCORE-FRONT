import { http } from './apiHttp'
import type {
  UserListItem,
  UserRole,
  CreateUserPayload,
  UpdateUserPayload,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

export type { UserListItem as User, UserRole, CreateUserPayload, UpdateUserPayload }

export interface UsersResponse extends ApiResponse<PaginatedResponse<UserListItem>> {}
export interface UserResponse extends ApiResponse<UserListItem> {}
export interface RolesResponse extends ApiResponse<UserRole[]> {}
export interface BulkDeleteResponse extends ApiResponse<{ deleted_count: number }> {}

export async function getUsers(params?: {
  search?: string
  role_id?: number
  status?: string
  gender?: string
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

export async function createUser(data: {
  name: string
  email: string
  password: string
  role_id: number
  phone?: string
  gender?: string
  status?: string
}): Promise<UserResponse> {
  const res = await http.post<UserResponse>('/users', data)
  return res.data
}

export async function updateUser(
  id: number,
  data: {
    name: string
    email: string
    password?: string
    role_id: number
    phone?: string
    gender?: string
    status?: string
  },
): Promise<UserResponse> {
  const res = await http.put<UserResponse>(`/users/${id}`, data)
  return res.data
}

export async function deleteUser(id: number): Promise<{ success: boolean; message: string }> {
  const res = await http.delete<{ success: boolean; message: string }>(`/users/${id}`)
  return res.data
}

export async function bulkDeleteUsers(ids: number[]): Promise<BulkDeleteResponse> {
  const res = await http.post<BulkDeleteResponse>('/users/bulk-delete', { ids })
  return res.data
}

export async function getRoles(): Promise<RolesResponse> {
  const res = await http.get<RolesResponse>('/users/roles')
  return res.data
}
