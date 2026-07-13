import { http } from './apiHttp'

export interface ScoreDetail {
  id: number
  score_id: number
  type: 'quiz' | 'assignment' | 'midterm' | 'final'
  label: string
  mark: number | null
  max_score?: number | null
  order_number?: number | null
  created_at: string
  updated_at: string
}

export interface Score {
  id: number
  student_subject_enrollment_id: number
  total: number | null
  grade: string | null
  remarks: string | null
  created_at: string
  updated_at: string
  enrollment?: {
    id: number
    student_id: number
    subject_offering_id: number
    student?: {
      id: number
      user?: {
        id: number
        name: string
      }
    } | null
    subject_offering?: {
      id: number
      subject_id: number
      class_id: number
      generation_id: number
      term_id: number
      subject?: {
        id: number
        name: string
      } | null
      term?: {
        id: number
        name: string
      } | null
    } | null
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
    subject_offering_id?: number
  }): Promise<Score[]> {
    const response = await http.get('/scores', { params })
    return Array.isArray(response.data) ? response.data : response.data.data
  },

  async getOne(id: number): Promise<Score> {
    const response = await http.get(`/scores/${id}`)
    return response.data.data || response.data
  },

  async getByEnrollment(enrollmentId: number): Promise<Score | null> {
    const response = await http.get(`/scores/by-enrollment/${enrollmentId}`)
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
