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
  class_name: string
  offering_id: number
  total: number | null
  grade: string | null
  details: Record<number, number | null>
  detail_ids: Record<number, number | null>
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
  academic_year_id: number
  academic_year: string | number | null
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

export interface GoogleConfigResponse {
  client_id: string
  scopes: string[]
}

export interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  has_refresh_token: boolean
}

export interface GoogleStatusResponse {
  connected: boolean
  has_valid_token: boolean
}
