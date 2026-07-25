import { http } from './apiHttp'

export interface TermInfo {
  id: number
  name: string
}

export interface SubjectWithTerms {
  id: number
  name: string
  status: string
  term_ids: number[]
  terms: Array<{ id: number; name: string }>
  teacher?: { user?: { name?: string | null } } | null
  teachers?: Array<{ id: number; user?: { name?: string | null } }>
  teacher_ids?: number[]
  class?: { name?: string | null } | null
  offerings?: Array<{
    id: number
    teacher_id?: number | null
    class_id?: number | null
    teacher?: { user?: { name?: string | null } } | null
    class?: { name?: string | null } | null
  }>
}

export interface SubjectTermResponse {
  success: boolean
  data: {
    subjects: SubjectWithTerms[]
    terms: Array<{ id: number; name: string }>
  }
}

export interface SyncResult {
  success: boolean
  message: string
}

export const subjectTermService = {
  async getAll(): Promise<SubjectTermResponse> {
    const res = await http.get('/subject-terms')
    return res.data
  },

  async syncSubject(subjectId: number, termIds: number[]): Promise<SyncResult> {
    const res = await http.put(`/subject-terms/${subjectId}`, {
      term_ids: termIds,
    })
    return res.data
  },

  async syncBatch(
    assignments: { subject_id: number; term_ids: number[] }[],
  ): Promise<SyncResult> {
    const res = await http.post('/subject-terms/sync', {
      assignments,
    })
    return res.data
  },
}
