import { http } from './api'

export interface SpreadsheetColumn {
  id: number
  score_id: number
  label: string
  type: string
  order_number: number
  max_score: number | null
  assessment_type_id: number
}

export interface SpreadsheetRow {
  enrollment_id: number
  score_id: number | null
  student_id: number
  student_name: string
  student_number: string
  offering_id: number
  total: number | null
  grade: string | null
  details: Record<number, number | null>
  detail_ids: Record<number, number | null>  // Canonical col ID -> actual detail ID for this student
}

export interface AssessmentTypeWeight {
  id: number
  code: string
  name: string
  weight_percent: number
}

export interface SubjectTerm {
  term_id: number
  term_name: string
  teachers: string[]
  classes: string[]
  offering_ids: number[]
  enrollment_count: number
}

export interface SubjectItem {
  id: number
  name: string
  code: string
  terms: SubjectTerm[]
}

export interface SpreadsheetResponse {
  subject: { id: number; name: string; subject_code: string }
  term: { id: number; name: string }
  offerings: Array<{ teacher_name: string; class_name: string }>
  columns: SpreadsheetColumn[]
  rows: SpreadsheetRow[]
  assessment_types: AssessmentTypeWeight[]
}

export interface SubjectsResponse {
  subjects: SubjectItem[]
  terms: Array<{ id: number; name: string }>
}

export async function getSpreadsheetSubjects(): Promise<SubjectsResponse> {
  const res = await http.get('/spreadsheet/subjects')
  return res.data.data
}

export async function getSpreadsheetBySubjectAndTerm(subjectId: number, termId: number): Promise<SpreadsheetResponse> {
  const res = await http.get(`/spreadsheet/subject/${subjectId}/term/${termId}`)
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
  google_sheets_url: string
  download_url: string
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

export async function importFromGoogleSheets(subjectId: number, termId: number, spreadsheetId: string, accessToken: string): Promise<void> {
  await http.post('/google-sheets/import', {
    subject_id: subjectId,
    term_id: termId,
    spreadsheet_id: spreadsheetId,
    access_token: accessToken,
  })
}

export async function importFromGoogleSheetsCSV(subjectId: number, termId: number, csvContent: string): Promise<void> {
  await http.post(`/spreadsheet/subject/${subjectId}/term/${termId}/import-google`, { csv_content: csvContent })
}

export async function addEnrollment(subjectId: number, termId: number, studentId: number | null): Promise<{ id: number; student_id: number; student_number: string }> {
  const res = await http.post(`/spreadsheet/subject/${subjectId}/term/${termId}/enrollments`, { student_id: studentId })
  return res.data.data
}

export async function deleteEnrollment(subjectId: number, termId: number, enrollmentId: number): Promise<void> {
  await http.delete(`/spreadsheet/subject/${subjectId}/term/${termId}/enrollments/${enrollmentId}`)
}

export async function updateStudentInfo(subjectId: number, termId: number, enrollmentId: number, data: {
  student_name?: string
  student_number?: string
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
}): Promise<{ imported_count: number }> {
  const res = await http.post(`/spreadsheet/subject/${subjectId}/term/${termId}/import-file`, data)
  return res.data.data
}

export async function getStudents(): Promise<Array<{ id: number; name: string; student_number: string }>> {
  const res = await http.get('/students')
  return res.data.data
}
