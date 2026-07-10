import { http } from './apiHttp'

export interface ScoreDetail {
  id: number
  score_id: number
  type: 'quiz' | 'assignment' | 'midterm' | 'final'
  label: string
  mark: number | null
  created_at: string
  updated_at: string
}

export interface Score {
  id: number
  student_id: number
  subject_id: number
  term_id: number
  total: number | null
  grade: string | null
  remarks: string | null
  created_at: string
  updated_at: string
  student?: {
    id: number
    user?: {
      id: number
      name: string
    }
  } | null
  subject?: {
    id: number
    name: string
  } | null
  term?: {
    id: number
    name: string
  } | null
  details?: ScoreDetail[]
}

export interface Subject {
  id: number
  name: string
}

export interface Term {
  id: number
  name: string
}

export const scoreService = {
  async getAll(params?: {
    student_id?: number
    subject_id?: number
    term_id?: number
  }): Promise<Score[]> {
    const response = await http.get('/scores', { params })
    // Backend returns array directly or wrapped
    return Array.isArray(response.data) ? response.data : response.data.data
  },

  async getOne(id: number): Promise<Score> {
    const response = await http.get(`/scores/${id}`)
    return response.data.data || response.data
  },

  async getSubjects(): Promise<Subject[]> {
    const response = await http.get('/subjects')
    const data = response.data
    return data.data || data
  },

  async getTerms(): Promise<Term[]> {
    const response = await http.get('/terms')
    const data = response.data
    return data.data || data
  },
}
