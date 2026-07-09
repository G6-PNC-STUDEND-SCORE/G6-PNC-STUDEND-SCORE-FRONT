import { http } from './apiHttp'

export interface Class {
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
  async getClasses(): Promise<ClassResponse> {
    const response = await http.get('/classes')
    return response.data
  },
}
