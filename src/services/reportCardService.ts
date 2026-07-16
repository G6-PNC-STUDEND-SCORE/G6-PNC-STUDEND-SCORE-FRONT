import { http } from './apiHttp'

export interface ReportCardItem {
  id: number
  student_id: number
  generation_id: number
  term_id: number
  total_average: number | null
  rank_in_class: number | null
  total_students: number | null
  grade: string | null
  remarks: string | null
  generated_by: number | null
  generated_at: string | null
  student: { id: number; user: { id: number; name: string } | null } | null
  generation: { id: number; year: number } | null
  term: { id: number; name: string } | null
}

export interface TranscriptItem {
  id: number
  student_id: number
  generation_id: number
  overall_average: number | null
  overall_grade: string | null
  status: string | null
  generated_by: number | null
  generated_at: string | null
  student: { id: number; user: { id: number; name: string } | null } | null
  generation: { id: number; year: number } | null
}

export const reportCardService = {
  async getReportCards(params?: { generation_id?: number; term_id?: number; student_id?: number }): Promise<ReportCardItem[]> {
    const res = await http.get('/report-cards', { params })
    return res.data.data
  },

  async getReportCard(id: number): Promise<ReportCardItem> {
    const res = await http.get(`/report-cards/${id}`)
    return res.data.data
  },

  async generateByOffering(offeringId: number, termId: number): Promise<{ message: string }> {
    const res = await http.post(`/subject-offerings/${offeringId}/generate-report-cards`, { term_id: termId })
    return res.data
  },

  async getTranscripts(params?: { generation_id?: number; student_id?: number }): Promise<TranscriptItem[]> {
    const res = await http.get('/transcripts', { params })
    return res.data.data
  },

  async generateTranscript(studentId: number, generationId: number): Promise<{ message: string }> {
    const res = await http.post(`/students/${studentId}/generate-transcript`, { generation_id: generationId })
    return res.data
  },
}
