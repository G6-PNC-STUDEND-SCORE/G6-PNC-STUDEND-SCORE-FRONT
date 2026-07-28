export interface ReportFilters {
  term_id?: number | null
  class_id?: number | null
  subject_id?: number | null
  teacher_id?: number | null
  academic_year_id?: number | null
  generation_id?: number | null
}

export interface ReportGradeBoundary {
  grade: string
  min_percent: number
  max_percent: number
  label: string
  color: string | null
}

export interface ReportFilterOptions {
  academic_years: Array<{ id: number; name: string; year: number; is_current: boolean }>
  generations: Array<{ id: number; name: string; year: number; is_current: boolean }>
  terms: Array<{ id: number; name: string; term_number: number; academic_year_id: number; is_current: boolean }>
  classes: Array<{ id: number; name: string; generation_id: number | null }>
  subjects: Array<{ id: number; name: string; subject_code: string | null }>
  teachers: Array<{ id: number; name: string }>
  grade_boundaries: ReportGradeBoundary[]
  pass_mark: number
}

export interface ReportKpi {
  students_reported: number
  subjects_assessed: number
  classes_covered: number
  graded_enrollments: number
  total_enrollments: number
  grading_progress: number
  average_score: number
  average_grade: string
  highest_score: number
  lowest_score: number
  pass_count: number
  fail_count: number
  pass_rate: number
  pass_mark: number
}

export interface GradeDistributionItem {
  grade: string
  label: string
  color: string
  min_percent: number
  max_percent: number
  count: number
  percent: number
}

export interface AssessmentBreakdownItem {
  code: string
  name: string
  weight_percent: number
  average_mark: number
  average_max: number
  percentage: number
  count: number
}

export interface TermTrendItem {
  term_id: number
  term: string
  average: number
  count: number
}

export interface StudentRankingRow {
  rank: number
  student_id: number
  student_number: string | null
  student_name: string
  email: string | null
  class_id: number
  class_name: string
  subject_count: number
  subjects: string
  total: number
  average: number
  grade: string | null
  highest: number
  lowest: number
  failed_subjects: number
  result: 'pass' | 'fail'
}

export interface ReportOverview {
  kpi: ReportKpi
  grade_distribution: GradeDistributionItem[]
  score_bands: Array<{ label: string; count: number }>
  term_trend: TermTrendItem[]
  assessment_breakdown: AssessmentBreakdownItem[]
  top_students: StudentRankingRow[]
}

export interface ClassPerformanceRow {
  rank: number
  class_id: number
  class_name: string
  room: string | null
  student_count: number
  subject_count: number
  graded_count: number
  average: number
  grade: string | null
  highest: number
  lowest: number
  pass_count: number
  fail_count: number
  pass_rate: number
  top_student: { name: string; average: number } | null
}

export interface SubjectRankingRow {
  rank: number
  subject_id: number
  subject_name: string
  subject_code: string | null
  credits: number | null
  teachers: string[]
  student_count: number
  class_count: number
  graded_count: number
  average: number
  grade: string | null
  highest: number
  lowest: number
  pass_count: number
  fail_count: number
  pass_rate: number
}

export interface ReportCardAssessment {
  code: string
  name: string
  weight_percent: number
  average: number | null
  max_score: number | null
  items: Array<{ label: string; score: number | null; max_score: number | null }>
}

export interface ReportCardSubject {
  subject_id: number
  subject_name: string
  subject_code: string | null
  credits: number | null
  teacher: string | null
  class_name: string | null
  term_id: number
  term_name: string
  assessments: ReportCardAssessment[]
  total: number | null
  grade: string | null
  result: 'pass' | 'fail' | null
  remarks: string | null
}

export interface StudentReportCard {
  student: {
    id: number
    name: string | null
    student_number: string | null
    email: string | null
    avatar: string | null
    gender: string | null
    status: string | null
    generation: string | null
    class_name: string | null
  }
  scope: { terms: string[]; pass_mark: number }
  subjects: ReportCardSubject[]
  summary: {
    subject_count: number
    graded_count: number
    total_score: number
    max_possible: number
    average: number
    grade: string
    highest_subject: string | null
    lowest_subject: string | null
    failed_subjects: number
    result: 'pass' | 'fail'
    rank: number | null
    class_size: number
    class_average: number | null
  }
  generated_at: string
}
