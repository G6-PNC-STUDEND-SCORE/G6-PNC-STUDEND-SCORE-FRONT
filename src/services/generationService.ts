import { http } from './apiHttp'
import type { Generation } from '@/types'

export type { Generation }

export interface GenerationsResponse {
  data: Generation[]
}

export async function getGenerations(): Promise<GenerationsResponse> {
  const res = await http.get<GenerationsResponse>('/generations')
  return res.data
}
