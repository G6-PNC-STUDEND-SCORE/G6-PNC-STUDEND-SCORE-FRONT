import { http } from './apiHttp'

export interface DashboardStats {
  totalStudents: number
  totalClasses: number
  totalSubjects: number
  totalTeachers: number
  averageScore: number
  passCount: number
  failCount: number
  passRate: number
}

export interface GradeDistribution {
  grade: string
  label: string
  count: number
  color: string
  percent: number
}

export interface SubjectPerformance {
  subject: string
  average_score: number
  student_count: number
}

export interface TrendMonth {
  month: number
  month_name: string
  avg_score: number
  pass_rate: number
  count: number
}

export interface TrendData {
  year: number
  months: TrendMonth[]
}

export interface ActivityItem {
  id: number
  action: string
  module: string
  description: string
  user_name: string
  created_at: string
  created_at_raw: string
}

/** Full dashboard payload returned from a single /chart/summary call */
export interface DashboardData {
  stats: DashboardStats
  gradeDistribution: GradeDistribution[]
  subjectPerformance: SubjectPerformance[]
}

export const dashboardService = {
  /**
   * Fetch summary stats from a single endpoint.
   * Now includes pass/fail data, so we don't need extra round trips.
   */
  async getStats(): Promise<DashboardStats> {
    const response = await http.get('/chart/summary')
    const data = response.data.data
    return {
      totalStudents: data.total_students || 0,
      totalClasses: data.total_classes || 0,
      totalSubjects: data.total_subjects || 0,
      totalTeachers: data.total_teachers || 0,
      averageScore: data.average_score || 0,
      passCount: data.pass_count || 0,
      failCount: data.fail_count || 0,
      passRate: data.pass_rate || 0,
    }
  },

  async getGradeDistribution(): Promise<GradeDistribution[]> {
    const response = await http.get('/chart/grade-distribution')
    const data = response.data.data
    return data.grades.map((item: { grade: string; label: string; count: number; color: string }) => ({
      ...item,
      percent: data.total > 0 ? (item.count / data.total) * 100 : 0,
    }))
  },

  async getSubjectPerformance(): Promise<SubjectPerformance[]> {
    const response = await http.get('/chart/subject-performance')
    return response.data.data
  },

  /** Fetch monthly trend data for a given year */
  async getTrends(year: number): Promise<TrendData> {
    const response = await http.get('/chart/trends', { params: { year } })
    return response.data.data
  },

  /** Fetch recent activity logs */
  async getRecentActivity(): Promise<ActivityItem[]> {
    const response = await http.get('/chart/recent-activity')
    return response.data.data
  },

  /**
   * Fetch all dashboard data in parallel for maximum speed.
   */
  async getAll(): Promise<DashboardData> {
    const [stats, gradeDistribution, subjectPerformance] = await Promise.all([
      this.getStats(),
      this.getGradeDistribution(),
      this.getSubjectPerformance(),
    ])
    return { stats, gradeDistribution, subjectPerformance }
  },
}