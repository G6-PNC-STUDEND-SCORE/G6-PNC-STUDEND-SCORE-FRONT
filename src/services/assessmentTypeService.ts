import { http } from './apiHttp'
import type { ApiResponse } from '@/types'

export interface AssessmentType {
  id: number
  code: string
  name: string
  weight_percent: number
  is_active: boolean
}

export async function createAssessmentType(data: {
  code: string
  name: string
  weight_percent: number
  is_active?: boolean
}): Promise<AssessmentType> {
  const res = await http.post<ApiResponse<AssessmentType>>('/assessment-types', data)
  return res.data.data
}
