// ── KPI Cards ──────────────────────────────────────────────────────
export interface KpiData {
  total_students: number
  active_students: number
  total_teachers: number
  total_classes: number
  total_subjects: number
  active_subject_offerings: number
  total_enrollments: number
  total_report_cards: number
  total_transcripts: number
  average_score: number
  average_grade: string
  current_generation: number | null
  current_term: string | null
  score_completion_rate: number
  report_card_coverage: number
}

// ── Charts ──────────────────────────────────────────────────────────
export interface StudentGrowth {
  months: string[]
  counts: number[]
}

export interface StudentsByGeneration {
  labels: string[]
  counts: number[]
}

export interface StudentsByDepartment {
  labels: string[]
  counts: number[]
  colors: string[]
}

export interface GradeDistributionItem {
  grade: string
  label: string
  count: number
  color: string
  percent: number
}

export interface GradeDistribution {
  grades: GradeDistributionItem[]
  total: number
}

export interface SubjectAverageScores {
  subjects: string[]
  scores: number[]
  student_counts: number[]
}

export interface TeacherWorkload {
  teachers: string[]
  class_counts: number[]
  offering_counts: number[]
}

export interface AssessmentTypeAverage {
  type: string
  label: string
  average_mark: number
  average_max: number
  count: number
  percentage: number
}

export interface AverageScoreByTerm {
  terms: string[]
  scores: number[]
  counts: number[]
}

export interface TopStudent {
  student_id: number
  name: string
  average_score: number
  best_grade: string
  score_count: number
}

export interface LowestPerformingSubject {
  name: string
  average_score: number
  enrollment_count: number
  pass_rate: number
}

export interface RecentActivity {
  id: number
  action: string
  module: string
  description: string
  user_name: string
  created_at: string
  created_at_raw: string
}

export interface RecentAcademicActivity {
  id: number
  action: string
  student_name: string
  total: number
  grade: string
  created_at: string
  created_at_raw: string
}

export interface RecentReportCard {
  id: number
  student_name: string
  generation: number | null
  term: string | null
  average: number
  grade: string
  generated_by: string
  generated_at: string
}

export interface RecentTranscript {
  id: number
  student_name: string
  generation: number | null
  average: number
  grade: string
  status: string
  generated_by: string
  generated_at: string
}

// ── Chart Data Container ────────────────────────────────────────────
export interface ChartsData {
  student_growth: StudentGrowth
  students_by_generation: StudentsByGeneration
  students_by_department: StudentsByDepartment
  grade_distribution: GradeDistribution
  subject_average_scores: SubjectAverageScores
  teacher_workload: TeacherWorkload
  assessment_type_averages: AssessmentTypeAverage[]
  average_score_by_term: AverageScoreByTerm
  top_students: TopStudent[]
  lowest_performing_subjects: LowestPerformingSubject[]
  recent_academic_activities: RecentAcademicActivity[]
  recent_user_activities: RecentActivity[]
  recent_report_cards: RecentReportCard[]
  recent_transcripts: RecentTranscript[]
}

// ── Full Dashboard Response ─────────────────────────────────────────
export interface DashboardData {
  kpi: KpiData
  charts: ChartsData
}

// ── Filter Options ──────────────────────────────────────────────────
export interface GenerationOption {
  id: number
  year: number
  name: string | null
  is_current?: boolean
}

export interface TermOption {
  id: number
  name: string
  term_number: number
}

export interface ClassOption {
  id: number
  name: string
  generation_id: number
  generation: { id: number; year: number } | null
}

export interface DepartmentOption {
  id: number
  name: string
}

export interface TeacherOption {
  id: number
  user_id: number
  user: { id: number; name: string } | null
}

export interface FilterOptions {
  generations: GenerationOption[]
  terms: TermOption[]
  classes: ClassOption[]
  departments: DepartmentOption[]
  teachers: TeacherOption[]
}

// ── Dashboard Filters (for API params) ──────────────────────────────
export interface DashboardFilters {
  generation_id?: number | null
  term_id?: number | null
  class_id?: number | null
  department_id?: number | null
  teacher_id?: number | null
}
