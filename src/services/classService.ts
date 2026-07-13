import { http } from './apiHttp'

export interface SchoolClass {
  id: number
  name: string
  code: string
  teacher_id: number | null
  academic_year_id: number | null
  description: string | null
  is_active: boolean
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
}

export interface ClassResponse {
  success: boolean
  message?: string
  data: SchoolClass | SchoolClass[]
  errors?: Record<string, string[]>
}

export const classService = {
  async getClasses(): Promise<ClassResponse> {
    const response = await http.get('/classes')
    return response.data
  },
}
