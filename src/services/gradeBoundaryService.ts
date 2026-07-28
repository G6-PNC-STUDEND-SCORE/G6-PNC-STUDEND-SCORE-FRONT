import { http } from './apiHttp'

export interface GradeBoundary {
  id: number
  grade: string
  min_percent: number
  max_percent: number
  label: string | null
  color: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export async function getGradeBoundaries(): Promise<GradeBoundary[]> {
  const res = await http.get('/grade-boundaries')
  return res.data.data
}

export async function updateGradeBoundary(
  id: number,
  data: Partial<{
    grade: string
    min_percent: number
    max_percent: number
    label: string
    color: string
    is_active: boolean
  }>
): Promise<GradeBoundary> {
  const res = await http.put(`/grade-boundaries/${id}`, data)
  return res.data.data
}
