import { http } from './apiHttp'

export interface SchoolClass {
  id: number
  name: string
  code: string
  teacher_id: number | null
  generation_id: number | null
  academic_year_id: number | null
  description: string | null
  is_active: boolean
  room: string | null
  created_at: string
  updated_at: string
  teacher?: {
    id: number
    name: string
  } | null
  academicYear?: {
    id: number
    name: string
  } | null
  generation?: {
    id: number
    year: string
    name: string
  } | null
  students?: number | null
}

export interface ClassResponse {
  success: boolean
  message?: string
  data: SchoolClass | SchoolClass[]
  errors?: Record<string, string[]>
}

export interface PaginatedClasses {
  current_page: number
  data: SchoolClass[]
  from: number
  last_page: number
  per_page: number
  to: number
  total: number
}

export interface Teacher {
  id: number
  name: string
}

export const classService = {
  async getClasses(params?: Record<string, string | number>): Promise<ClassResponse> {
    const response = await http.get('/classes', { params })
    return response.data
  },
  async createClass(payload: Partial<SchoolClass>): Promise<ClassResponse> {
    const response = await http.post('/classes', payload)
    return response.data
  },
  async updateClass(id: number, payload: Partial<SchoolClass>): Promise<ClassResponse> {
    const response = await http.put(`/classes/${id}`, payload)
    return response.data
  },
  async deleteClass(id: number): Promise<ClassResponse> {
    const response = await http.delete(`/classes/${id}`)
    return response.data
  },

  async getTeachers(): Promise<ClassResponse> {
    const response = await http.get('/teachers')
    return response.data
  },
}