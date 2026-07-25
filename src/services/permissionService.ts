import { http } from './apiHttp'
import type { Role, Permission, PermissionsByGroup, ApiResponse } from '@/types'

export type { Role, Permission, PermissionsByGroup }

export async function getPermissions(): Promise<PermissionsByGroup> {
  const res = await http.get<ApiResponse<PermissionsByGroup>>('/permissions')
  return res.data.data
}

export async function getRoles(): Promise<Role[]> {
  const res = await http.get<ApiResponse<Role[]>>('/roles')
  return res.data.data
}

export async function getRolePermissions(
  roleId: number,
): Promise<{ role: Role; permissions: PermissionsByGroup }> {
  const res = await http.get<{ role: Role; permissions: PermissionsByGroup }>(
    `/roles/${roleId}/permissions`,
  )
  return res.data
}

export async function syncRolePermissions(
  roleId: number,
  permissionIds: number[],
): Promise<void> {
  await http.put(`/roles/${roleId}/permissions`, { permission_ids: permissionIds })
}

export async function createRole(data: {
  name: string
  description?: string
  permission_ids?: number[]
}): Promise<Role> {
  const res = await http.post<ApiResponse<Role>>('/roles', data)
  return res.data.data
}

export async function updateRole(
  roleId: number,
  data: { name: string; description?: string },
): Promise<Role> {
  const res = await http.put<ApiResponse<Role>>(`/roles/${roleId}`, data)
  return res.data.data
}

export async function deleteRole(roleId: number): Promise<void> {
  await http.delete(`/roles/${roleId}`)
}
