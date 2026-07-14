import { http } from './apiHttp'

export interface Class {
  id: number
  name: string
  generation: {
    id: number
    year: number
    is_current: boolean
    created_at?: string
    updated_at?: string
  }
  teacher_id?: number | null
  teacher?: {
    id: number
    name: string
  }
  room: string
  students: number
  status: 'Active' | 'Inactive'
  created_at?: string
  updated_at?: string
}

export interface Teacher {
  id: number
  name: string
}

export interface ClassResponse {
  success: boolean
  message?: string
  data: Class | Class[]
  errors?: Record<string, string[]>
}

export const classService = {
  async getClasses(search?: string, status?: string): Promise<ClassResponse> {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (status) params.append('status', status)

    const response = await http.get(`/classes?${params.toString()}`)
    return response.data
  },

  async getClass(id: number): Promise<ClassResponse> {
    const response = await http.get(`/classes/${id}`)
    return response.data
  },

  async createClass(classData: Partial<Omit<Class, 'id'>>): Promise<ClassResponse> {
    const response = await http.post('/classes', classData)
    return response.data
  },

  async updateClass(id: number, classData: Partial<Class>): Promise<ClassResponse> {
    const response = await http.put(`/classes/${id}`, classData)
    return response.data
  },

  async deleteClass(id: number): Promise<ClassResponse> {
    const response = await http.delete(`/classes/${id}`)
    return response.data
  },

  async getTeachers(): Promise<{ success: boolean; data: Teacher[] }> {
    const response = await http.get('/teachers')
    return response.data
  },
}
