import { http } from './api'

export interface TeacherUser {
  id: number
  name: string
  email: string
  gender: string | null
  phone: string | null
  avatar: string | null
  status: string
}

export interface TeacherDepartment {
  id: number
  name: string
}

export interface TeacherSubject {
  id: number
  name: string
}

export interface Teacher {
  id: number
  user_id: number
  department_id: number | null
  user: TeacherUser | null
  department: TeacherDepartment | null
  subjects_count: number
  classes_count: number
  subjects?: TeacherSubject[]
  created_at: string
  updated_at: string
}

export interface TeachersResponse {
  success: boolean
  data: {
    current_page: number
    data: Teacher[]
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

export interface TeacherResponse {
  success: boolean
  message?: string
  data: Teacher
}

export interface CreateTeacherPayload {
  name: string
  email: string
  password?: string
  department_id?: number | null
  gender?: string
  status?: string
}

export interface UpdateTeacherPayload {
  name?: string
  email?: string
  password?: string
  department_id?: number | null
  gender?: string
  status?: string
}

export interface BulkDeleteResponse {
  success: boolean
  message: string
  data: { deleted_count: number }
}

export interface DepartmentsResponse {
  success: boolean
  data: { id: number; name: string }[]
}

export async function getTeachers(params?: {
  search?: string
  department_id?: number
  status?: string
  gender?: string
  page?: number
  per_page?: number
}): Promise<TeachersResponse> {
  const res = await http.get<TeachersResponse>('/teachers', { params })
  return res.data
}

export async function getTeacher(id: number): Promise<TeacherResponse> {
  const res = await http.get<TeacherResponse>(`/teachers/${id}`)
  return res.data
}

export async function createTeacher(data: CreateTeacherPayload): Promise<TeacherResponse> {
  const res = await http.post<TeacherResponse>('/teachers', data)
  return res.data
}

export async function updateTeacher(id: number, data: UpdateTeacherPayload): Promise<TeacherResponse> {
  const res = await http.put<TeacherResponse>(`/teachers/${id}`, data)
  return res.data
}

export async function deleteTeacher(id: number): Promise<{ success: boolean; message: string }> {
  const res = await http.delete<{ success: boolean; message: string }>(`/teachers/${id}`)
  return res.data
}

export async function bulkDeleteTeachers(ids: number[]): Promise<BulkDeleteResponse> {
  const res = await http.post<BulkDeleteResponse>('/teachers/bulk-delete', { ids })
  return res.data
}

export async function getDepartments(): Promise<DepartmentsResponse> {
  const res = await http.get<DepartmentsResponse>('/teachers/departments')
  return res.data
}
