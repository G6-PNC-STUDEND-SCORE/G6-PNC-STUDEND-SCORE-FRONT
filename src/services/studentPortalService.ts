import { http } from './api'

export interface PortalSummaryItem {
  label: string
  value: number
  decimals: number
  icon: string
  iconClass: string
  subtitle: string
}

export interface PortalProfile {
  name: string | null
  studentId: string | null
  email: string | null
  class: string | null
  generation: string | null
  department: string | null
  currentTerm: string | null
  academicStatus: string | null
  avatar: string | null
}

export interface PortalCurrentSubject {
  id: number
  name: string | null
  teacher: string | null
  credits: number
  currentScore: number
  grade: string | null
  progress: number
}

export interface PortalData {
  profile: PortalProfile
  summary: PortalSummaryItem[]
  currentSubjects: PortalCurrentSubject[]
}

export interface TermScoreSubject {
  subject: string | null
  total: number | null
  grade: string | null
  quiz: number | null
  assignment: number | null
  midterm: number | null
  final: number | null
}

export interface TermScores {
  term: string
  subjects: TermScoreSubject[]
}

export interface TranscriptTerm {
  term: string
  average: number
  subjects: TermScoreSubject[]
}

export interface TranscriptData {
  student: { name: string | null; studentId: string | null; generation: string | null }
  terms: TranscriptTerm[]
}

export async function getPortal(): Promise<PortalData> {
  const res = await http.get<{ success: boolean; data: PortalData }>('/student/portal')
  return res.data.data
}

export async function getScores(): Promise<TermScores[]> {
  const res = await http.get<{ success: boolean; data: TermScores[] }>('/student/scores')
  return res.data.data
}

export async function getTranscript(): Promise<TranscriptData> {
  const res = await http.get<{ success: boolean; data: TranscriptData }>('/student/transcript')
  return res.data.data
}

export async function downloadTranscript(): Promise<void> {
  const res = await http.get('/student/transcript/download', { responseType: 'blob' })
  const disposition = res.headers['content-disposition'] as string | undefined
  const match = disposition?.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] || 'transcript.html'

  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
