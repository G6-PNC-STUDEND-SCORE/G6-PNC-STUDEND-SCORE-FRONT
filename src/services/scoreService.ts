import { http } from './apiHttp'
import type {
  SpreadsheetColumn,
  SpreadsheetRow,
  AssessmentTypeWeight,
  SubjectTerm,
  SubjectItem,
  SpreadsheetResponse,
  SubjectsResponse,
  GoogleConfigResponse,
  GoogleTokenResponse,
  GoogleStatusResponse,
} from '@/types'

export type {
  SpreadsheetColumn,
  SpreadsheetRow,
  AssessmentTypeWeight,
  SubjectTerm,
  SubjectItem,
  SpreadsheetResponse,
  SubjectsResponse,
  GoogleConfigResponse,
  GoogleTokenResponse,
  GoogleStatusResponse,
}

export async function getSpreadsheetSubjects(): Promise<SubjectsResponse> {
  const res = await http.get('/spreadsheet/subjects')
  return res.data.data
}

let spreadsheetRefreshPromise: Promise<SpreadsheetResponse> | null = null

export function getSpreadsheetRefreshPromise(): Promise<SpreadsheetResponse> | null {
  return spreadsheetRefreshPromise
}

export async function getSpreadsheetBySubjectAndTerm(subjectId: number, termId: number, bypassCache = false): Promise<SpreadsheetResponse> {
  const cacheKey = `spreadsheet_${subjectId}_${termId}`

  const cached = bypassCache ? null : sessionStorage.getItem(cacheKey)
  if (cached) {
    spreadsheetRefreshPromise = http.get(`/spreadsheet/subject/${subjectId}/term/${termId}`)
      .then(res => {
        sessionStorage.setItem(cacheKey, JSON.stringify(res.data.data))
        return res.data.data
      })
      .catch(() => { /* silently fail - cached data is fine */ })
    return JSON.parse(cached) as SpreadsheetResponse
  }

  const res = await http.get(`/spreadsheet/subject/${subjectId}/term/${termId}`)
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(res.data.data))
  } catch { /* quota exceeded, ignore */ }
  return res.data.data
}

export async function updateCellMark(subjectId: number, termId: number, detailId: number, mark: number | null): Promise<void> {
  await http.put(`/spreadsheet/subject/${subjectId}/term/${termId}/details/${detailId}`, { mark })
}

export async function renameColumn(subjectId: number, termId: number, detailId: number, label: string): Promise<void> {
  await http.patch(`/spreadsheet/subject/${subjectId}/term/${termId}/details/${detailId}/rename`, { label })
}

export async function addColumn(subjectId: number, termId: number, data: {
  type: string
  label: string
  max_score?: number | null
  order_number?: number
}): Promise<void> {
  await http.post(`/spreadsheet/subject/${subjectId}/term/${termId}/details`, data)
}

export async function deleteColumn(subjectId: number, termId: number, detailId: number): Promise<void> {
  await http.delete(`/spreadsheet/subject/${subjectId}/term/${termId}/details/${detailId}`)
}

export async function changeColumnType(subjectId: number, termId: number, label: string, oldType: string, newType: string): Promise<{ updated_count: number }> {
  const res = await http.patch(`/spreadsheet/subject/${subjectId}/term/${termId}/details/change-type`, { label, old_type: oldType, new_type: newType })
  return res.data.data
}

export async function getStudentNumbers(): Promise<string[]> {
  const res = await http.get('/spreadsheet/student-numbers')
  return res.data.data
}

export async function reorderColumns(subjectId: number, termId: number, columns: { id: number; order_number: number }[]): Promise<void> {
  await http.post(`/spreadsheet/subject/${subjectId}/term/${termId}/reorder`, { columns })
}

export async function updateWeights(weights: { id: number; weight_percent: number }[]): Promise<void> {
  await http.put('/spreadsheet/weights', { weights })
}

export async function syncToGoogleSheets(subjectId: number, termId: number): Promise<{
  csv_content: string
  filename: string
}> {
  const res = await http.post(`/spreadsheet/subject/${subjectId}/term/${termId}/sync-google`)
  return res.data.data
}

export async function createGoogleSheet(subjectId: number, termId: number, accessToken: string): Promise<{
  spreadsheet_id: string
  url: string
  name: string
}> {
  const res = await http.post('/google-sheets/create', {
    subject_id: subjectId,
    term_id: termId,
    access_token: accessToken,
  })
  return res.data.data
}

export async function importFromGoogleSheets(subjectId: number, termId: number, spreadsheetId: string, accessToken: string, emailDomain?: string | null): Promise<{ synced: boolean }> {
  const res = await http.post('/google-sheets/import', {
    subject_id: subjectId,
    term_id: termId,
    spreadsheet_id: spreadsheetId,
    access_token: accessToken,
    email_domain: emailDomain || undefined,
  })
  return res.data.data ?? { synced: true }
}

export async function pushToGoogleSheet(subjectId: number, termId: number, spreadsheetId: string, accessToken: string): Promise<{ pushed_rows: number }> {
  const res = await http.post('/google-sheets/push', {
    subject_id: subjectId,
    term_id: termId,
    spreadsheet_id: spreadsheetId,
    access_token: accessToken,
  })
  return res.data.data ?? { pushed_rows: 0 }
}

export async function ensureGoogleSheetShared(spreadsheetId: string, accessToken: string): Promise<{ shared: boolean }> {
  const res = await http.post('/google-sheets/ensure-shared', {
    spreadsheet_id: spreadsheetId,
    access_token: accessToken,
  })
  return res.data.data ?? { shared: false }
}

export async function importFromGoogleSheetsCSV(subjectId: number, termId: number, csvContent: string, emailDomain?: string | null): Promise<void> {
  await http.post(`/spreadsheet/subject/${subjectId}/term/${termId}/import-google`, { csv_content: csvContent, email_domain: emailDomain || undefined })
}

export async function addEnrollment(subjectId: number, termId: number, studentId: number | null, classId?: number | null, studentName?: string | null, studentNumber?: string | null, emailDomain?: string | null): Promise<{ id: number; student_id: number; student_number: string }> {
  const payload: Record<string, unknown> = { student_id: studentId, class_id: classId || undefined }
  if (studentName) payload.student_name = studentName
  if (studentNumber) payload.student_number = studentNumber
  if (emailDomain) payload.email_domain = emailDomain
  const res = await http.post(`/spreadsheet/subject/${subjectId}/term/${termId}/enrollments`, payload)
  return res.data.data
}

export async function deleteEnrollment(subjectId: number, termId: number, enrollmentId: number): Promise<void> {
  await http.delete(`/spreadsheet/subject/${subjectId}/term/${termId}/enrollments/${enrollmentId}`)
}

export async function bulkDeleteEnrollments(subjectId: number, termId: number, enrollmentIds: number[]): Promise<{ deleted_count: number; errors: string[] }> {
  const res = await http.post(`/spreadsheet/subject/${subjectId}/term/${termId}/enrollments/bulk-delete`, { enrollment_ids: enrollmentIds })
  return res.data.data
}

export async function updateStudentInfo(subjectId: number, termId: number, enrollmentId: number, data: {
  student_name?: string
  student_number?: string
  email_domain?: string | null
}): Promise<{ student_name: string; student_number: string }> {
  const res = await http.put(`/spreadsheet/subject/${subjectId}/term/${termId}/enrollments/${enrollmentId}`, data)
  return res.data.data
}

export async function importFile(subjectId: number, termId: number, data: {
  rows: Array<{
    student_name: string
    student_number?: string
    marks?: Record<string, number>
  }>
  email_domain?: string | null
}, classId?: number | null): Promise<{ imported_count: number }> {
  const res = await http.post(`/spreadsheet/subject/${subjectId}/term/${termId}/import-file`, { ...data, class_id: classId || undefined })
  return res.data.data
}

export async function getStudents(): Promise<Array<{ id: number; name: string; student_number: string }>> {
  const res = await http.get('/students')
  return res.data.data
}


export async function getGoogleConfig(): Promise<GoogleConfigResponse> {
  const res = await http.get('/google-sheets/config')
  return res.data.data
}

export async function exchangeGoogleToken(code: string): Promise<GoogleTokenResponse> {
  const res = await http.post('/google-sheets/token', { code })
  return res.data.data
}

export async function refreshGoogleToken(): Promise<{ access_token: string; expires_in: number }> {
  const res = await http.post('/google-sheets/refresh')
  return res.data.data
}

export async function getGoogleStatus(): Promise<GoogleStatusResponse> {
  const res = await http.get('/google-sheets/status')
  return res.data.data
}

export async function disconnectGoogleAccount(): Promise<void> {
  await http.post('/google-sheets/disconnect')
}
