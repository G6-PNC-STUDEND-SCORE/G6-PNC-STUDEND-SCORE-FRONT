import { http } from './apiHttp'
import type { AcademicYear, ApiResponse } from '@/types'

export async function getAcademicYears(): Promise<ApiResponse<AcademicYear[]>> {
  const response = await http.get<ApiResponse<AcademicYear[]>>('/academic-years')
  return response.data
}
