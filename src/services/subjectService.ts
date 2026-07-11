import { http } from './apiHttp'

export interface Subject {
  id: number
  name: string
  teacher_id: number | null
  class_id: number | null
  status: 'Active' | 'Inactive'
  created_at?: string
  updated_at?: string
  teacher?: {
    id: number
    user_id: number
    teacher_code: string
    user?: {
      name: string
      email: string
    }
  } | null
  class?: {
    id: number
    name: string
    code: string
  } | null
}

export interface SubjectResponse {
  success: boolean
  message?: string
  data: Subject | Subject[]
  errors?: Record<string, string[]>
}

export const subjectService = {
  async getSubjects(search?: string, status?: string): Promise<SubjectResponse> {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (status) params.append('status', status)

    const response = await http.get(`/subjects?${params.toString()}`)
    return response.data
  },

  async getSubject(id: number): Promise<SubjectResponse> {
    const response = await http.get(`/subjects/${id}`)
    return response.data
  },

  async createSubject(subject: Partial<Omit<Subject, 'id'>>): Promise<SubjectResponse> {
    const response = await http.post('/subjects', subject)
    return response.data
  },

  async updateSubject(id: number, subject: Partial<Subject>): Promise<SubjectResponse> {
    const response = await http.put(`/subjects/${id}`, subject)
    return response.data
  },

  async deleteSubject(id: number): Promise<SubjectResponse> {
    const response = await http.delete(`/subjects/${id}`)
    return response.data
  },

  async getTeachers(): Promise<{ success: boolean; data: { id: number; name: string }[] }> {
    const response = await http.get('/teachers')
    return response.data
  },
}
