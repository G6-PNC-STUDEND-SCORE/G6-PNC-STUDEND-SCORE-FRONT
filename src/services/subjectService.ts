import { http } from './apiHttp'
import type { Subject, SubjectPayload, ApiResponse } from '@/types'

export type { Subject, SubjectPayload }

export interface SubjectResponse extends ApiResponse<Subject | Subject[]> {}

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

  async createSubject(subject: Partial<SubjectPayload>): Promise<SubjectResponse> {
    const response = await http.post('/subjects', subject)
    return response.data
  },

  async updateSubject(id: number, subject: Partial<SubjectPayload>): Promise<SubjectResponse> {
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
