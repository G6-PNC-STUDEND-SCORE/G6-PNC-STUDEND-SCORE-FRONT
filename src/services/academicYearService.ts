import { http } from './apiHttp'

export interface AcademicYear {
  id: number
  name: string
}

export interface AcademicYearsResponse {
  success: boolean
  message?: string
  data: AcademicYear[]
}

export async function getAcademicYears(): Promise<AcademicYearsResponse> {
  const response = await http.get('/academic-years')
  return response.data
}