import { http } from './api'

export interface Permission {
  id: number
  name: string
  slug: string
  group: string
  description: string | null
}

export interface Role {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
  permissions?: Permission[]
  created_at: string
  updated_at: string
}

export type PermissionsByGroup = Record<string, Permission[]>

export async function getPermissions(): Promise<PermissionsByGroup> {
  const res = await http.get<{ success: boolean; data: PermissionsByGroup }>('/permissions')
  return res.data.data
}

export async function getRoles(): Promise<Role[]> {
  const res = await http.get<{ success: boolean; data: Role[] }>('/roles')
  return res.data.data
}

export async function getRolePermissions(roleId: number): Promise<{ role: Role; permissions: PermissionsByGroup }> {
  const res = await http.get<{ role: Role; permissions: PermissionsByGroup }>(`/roles/${roleId}/permissions`)
  return res.data
}

export async function syncRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
  await http.put(`/roles/${roleId}/permissions`, { permission_ids: permissionIds })
}

export async function createRole(data: { name: string; description?: string; permission_ids?: number[] }): Promise<Role> {
  const res = await http.post<{ success: boolean; data: Role }>('/roles', data)
  return res.data.data
}

export async function updateRole(roleId: number, data: { name: string; description?: string }): Promise<Role> {
  const res = await http.put<{ success: boolean; data: Role }>(`/roles/${roleId}`, data)
  return res.data.data
}

export async function deleteRole(roleId: number): Promise<void> {
  await http.delete(`/roles/${roleId}`)
}
