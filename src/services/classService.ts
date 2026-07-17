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
  generation?: {
    id: number
    year: string
    name: string
  } | null
  room?: string | null
  students?: number | null
}

export interface ClassResponse {
  success: boolean
  message?: string
  data: SchoolClass | SchoolClass[]
  errors?: Record<string, string[]>
}

export interface Teacher {
  id: number
  name: string
}

export const classService = {
  async getClasses(): Promise<ClassResponse> {
    const response = await http.get('/classes')
    return response.data
  },

  async getTeachers(): Promise<ClassResponse> {
    const response = await http.get('/teachers')
    return response.data
  },

  async createClass(classData: {
    name: string
    generation: string
    teacher_id: number | null
    room: string
    students: number
    status: 'Active' | 'Inactive'
  }): Promise<ClassResponse> {
    const response = await http.post('/classes', {
      name: classData.name,
      generation_id: classData.generation ? parseInt(classData.generation) : null,
      teacher_id: classData.teacher_id,
      description: classData.room || null,
      is_active: classData.status === 'Active',
    })
    return response.data
  },

  async updateClass(
    classId: number,
    classData: {
      name: string
      generation: string
      teacher_id: number | null
      room: string
      students: number
      status: 'Active' | 'Inactive'
    },
  ): Promise<ClassResponse> {
    const response = await http.put(`/classes/${classId}`, {
      name: classData.name,
      generation_id: classData.generation ? parseInt(classData.generation) : null,
      teacher_id: classData.teacher_id,
      description: classData.room || null,
      is_active: classData.status === 'Active',
    })
    return response.data
  },

  async deleteClass(classId: number): Promise<ClassResponse> {
    const response = await http.delete(`/classes/${classId}`)
    return response.data
  },

  async deleteClasses(ids: number[]): Promise<ClassResponse> {
    const response = await http.post('/classes/bulk-delete', { ids })
    return response.data
  },
}
