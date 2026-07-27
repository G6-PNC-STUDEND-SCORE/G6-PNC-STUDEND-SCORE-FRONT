import { http } from './apiHttp'
import type {
  PortalData,
  TermScores,
  TranscriptData,
  ApiResponse,
} from '@/types'

export type {
  PortalData,
  PortalProfile,
  PortalSummaryItem,
  PortalCurrentSubject,
  TermScoreSubject,
  TermScores,
  TranscriptTerm,
  TranscriptData,
} from '@/types'

export async function getPortal(): Promise<PortalData> {
  const res = await http.get<ApiResponse<PortalData>>('/student/portal')
  return res.data.data
}

export async function getScores(): Promise<TermScores[]> {
  const res = await http.get<ApiResponse<TermScores[]>>('/student/scores')
  return res.data.data
}

export async function getTranscript(): Promise<TranscriptData> {
  const res = await http.get<ApiResponse<TranscriptData>>('/student/transcript')
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
