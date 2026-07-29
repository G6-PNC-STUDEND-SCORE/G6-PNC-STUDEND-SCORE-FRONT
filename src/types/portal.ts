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

export interface PortalSummaryItem {
  label: string
  value: number | string
  decimals: number
  icon: string
  iconClass: string
  subtitle: string
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

export interface PortalProgressItem {
  label: string
  value: number
  display: string
  color: string
  icon: string
}

export interface PortalTermTrend {
  term: string
  gpa: number
  average: number
}

export interface PortalData {
  profile: PortalProfile
  summary: PortalSummaryItem[]
  termTrends: PortalTermTrend[]
  currentSubjects: PortalCurrentSubject[]
  progress: PortalProgressItem[]
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
