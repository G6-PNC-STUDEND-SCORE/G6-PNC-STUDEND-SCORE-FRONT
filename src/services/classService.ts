import { http } from './apiHttp'

<<<<<<< HEAD
export interface Class {
  id: number
  name: string
  generation: string
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
=======
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
>>>>>>> 743ea85536d3e8cc88fc89f63a75ddd773c4a1b2
}

export interface ClassResponse {
  success: boolean
  message?: string
<<<<<<< HEAD
  data: Class | Class[]
=======
  data: SchoolClass | SchoolClass[]
>>>>>>> 743ea85536d3e8cc88fc89f63a75ddd773c4a1b2
  errors?: Record<string, string[]>
}

export const classService = {
<<<<<<< HEAD
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
=======
  async getClasses(): Promise<ClassResponse> {
    const response = await http.get('/classes')
>>>>>>> 743ea85536d3e8cc88fc89f63a75ddd773c4a1b2
    return response.data
  },
}
