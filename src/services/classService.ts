import { http } from './apiHttp'
import type { SchoolClass, ApiResponse } from '@/types'

export type { SchoolClass }

export interface ClassResponse extends ApiResponse<SchoolClass | SchoolClass[]> {}

export const classService = {
  async getClasses(): Promise<ClassResponse> {
    const response = await http.get<ClassResponse>('/classes')
    return response.data
  },

  async createClass(payload: Partial<SchoolClass>): Promise<ClassResponse> {
    const response = await http.post<ClassResponse>('/classes', payload)
    return response.data
  },

  async updateClass(id: number, payload: Partial<SchoolClass>): Promise<ClassResponse> {
    const response = await http.put<ClassResponse>(`/classes/${id}`, payload)
    return response.data
  },

  async deleteClass(id: number): Promise<ClassResponse> {
    const response = await http.delete<ClassResponse>(`/classes/${id}`)
    return response.data
  },

  async getTeachers(): Promise<ClassResponse> {
    const response = await http.get<ClassResponse>('/teachers')
    return response.data
  },
}
