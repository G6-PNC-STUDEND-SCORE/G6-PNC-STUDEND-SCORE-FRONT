import { http } from './apiHttp'

export interface GradeBoundary {
  id: number
  grade: string
  min_percent: number
  max_percent: number
  label: string
  color: string | null
  is_active: boolean
}

export interface AssessmentType {
  id: number
  code: string
  name: string
  weight_percent: number
  is_active: boolean
}

export interface Term {
  id: number
  name: string
  term_number: number | null
  start_date: string | null
  end_date: string | null
}

export interface Generation {
  id: number
  year: number
  is_current: boolean
}

export const settingsService = {
  // Grade Boundaries
  async getGradeBoundaries(): Promise<GradeBoundary[]> {
    const res = await http.get('/grade-boundaries')
    return res.data.data
  },

  async updateGradeBoundary(id: number, data: Partial<GradeBoundary>): Promise<GradeBoundary> {
    const res = await http.put(`/grade-boundaries/${id}`, data)
    return res.data.data
  },

  // Assessment Types
  async getAssessmentTypes(): Promise<AssessmentType[]> {
    const res = await http.get('/assessment-types')
    return res.data.data
  },

  async createAssessmentType(data: Partial<AssessmentType>): Promise<AssessmentType> {
    const res = await http.post('/assessment-types', data)
    return res.data.data
  },

  async updateAssessmentType(id: number, data: Partial<AssessmentType>): Promise<AssessmentType> {
    const res = await http.put(`/assessment-types/${id}`, data)
    return res.data.data
  },

  async deleteAssessmentType(id: number): Promise<void> {
    await http.delete(`/assessment-types/${id}`)
  },

  // Terms
  async getTerms(): Promise<Term[]> {
    const res = await http.get('/terms')
    return res.data.data
  },

  async createTerm(data: Partial<Term>): Promise<Term> {
    const res = await http.post('/terms', data)
    return res.data.data
  },

  async updateTerm(id: number, data: Partial<Term>): Promise<Term> {
    const res = await http.put(`/terms/${id}`, data)
    return res.data.data
  },

  async deleteTerm(id: number): Promise<void> {
    await http.delete(`/terms/${id}`)
  },

  // Generations
  async getGenerations(): Promise<Generation[]> {
    const res = await http.get('/generations')
    return res.data.data
  },

  async createGeneration(data: Partial<Generation>): Promise<Generation> {
    const res = await http.post('/generations', data)
    return res.data.data
  },

  async updateGeneration(id: number, data: Partial<Generation>): Promise<Generation> {
    const res = await http.put(`/generations/${id}`, data)
    return res.data.data
  },

  async deleteGeneration(id: number): Promise<void> {
    await http.delete(`/generations/${id}`)
  },
}
