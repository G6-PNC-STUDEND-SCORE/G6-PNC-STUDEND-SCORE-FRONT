// import { log } from 'console'
import { http } from './api'

export interface Student {
  id: number
  class_id: number | null
  name: string
  photo: string | null
  gender: 'Male' | 'Female'
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  class?: {
    id: number
    name: string
  } | null
}

export interface SchoolClass {
  id: number
  name: string
}

export interface StudentsResponse {
  students: Student[]
}

export interface StudentResponse {
  student: Student
}

export interface ClassesResponse {
  classes: SchoolClass[]
}

/** Backend origin extracted from the API base URL */
const BACKEND_ORIGIN = (() => {
  const base = import.meta.env.VITE_API_BASE_URL as string || ''
  // Remove trailing /api or /api/
  return base.replace(/\/api\/?$/, '')
})()

/**
 * Convert a relative photo path to a full URL.
 * E.g. "/uploads/photos/file.jpg" → "http://127.0.0.1:8001/uploads/photos/file.jpg"
 */
export function getPhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path
  return `${BACKEND_ORIGIN}${path}`
}

export async function getStudents(): Promise<StudentsResponse> {
  const res = await http.get<StudentsResponse>('/students')
  return res.data
}


export async function getStudent(id: number): Promise<StudentResponse> {
  const res = await http.get<StudentResponse>(`/students/${id}`)
  return res.data
}

function buildFormData(data: Record<string, unknown>): FormData | Record<string, unknown> {
  // If there's a File in the data, use FormData
  const hasFile = Object.values(data).some((v) => v instanceof File)
  if (!hasFile) return data

  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof File) {
      fd.append(key, value)
    } else if (value !== undefined && value !== null) {
      fd.append(key, String(value))
    }
  }
  return fd
}

export async function createStudent(data: {
  name: string
  gender: 'Male' | 'Female'
  class_id?: number | null
  photo?: File | string | null
  status?: 'active' | 'inactive'
}): Promise<StudentResponse> {
  const payload = buildFormData(data)
  const config = payload instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : {}
  const res = await http.post<StudentResponse>('/students', payload, config)
  return res.data
}

export async function updateStudent(
  id: number,
  data: {
    name?: string
    gender?: 'Male' | 'Female'
    class_id?: number | null
    photo?: File | string | null
    status?: 'active' | 'inactive'
  }
): Promise<StudentResponse> {
  const payload = buildFormData(data)
  const isFormData = payload instanceof FormData
  const config = isFormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : {}

  if (isFormData) {
    // Use POST with _method=PUT for file uploads (Laravel convention)
    payload.append('_method', 'PUT')
    const res = await http.post<StudentResponse>(`/students/${id}`, payload, config)
    return res.data
  }

  const res = await http.put<StudentResponse>(`/students/${id}`, payload, config)
  return res.data
}

export async function deleteStudent(id: number): Promise<{ message: string }> {
  const res = await http.delete<{ message: string }>(`/students/${id}`)
  return res.data
}

export async function assignStudentToClass(
  id: number,
  classId: number
): Promise<StudentResponse> {
  const res = await http.put<StudentResponse>(`/students/${id}/assign-class`, {
    class_id: classId,
  })
  return res.data
}

// export async function getClasses(): Promise<ClassesResponse> {
//   log('getClasses')
//   // const res = await http.get<ClassesResponse>('/classes/list')
//   // return res.data
// }
