import { http } from './apiHttp'
import type {
  ApiResponse,
  ClassPerformanceRow,
  ReportFilterOptions,
  ReportFilters,
  ReportOverview,
  StudentRankingRow,
  StudentReportCard,
  SubjectRankingRow,
} from '@/types'

function toParams(filters: ReportFilters): Record<string, number> {
  const params: Record<string, number> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined && value !== '') {
      params[key] = Number(value)
    }
  }
  return params
}

export const reportService = {
  async getFilterOptions(): Promise<ReportFilterOptions> {
    const res = await http.get<ApiResponse<ReportFilterOptions>>('/reports/filters')
    return res.data.data
  },

  async getOverview(filters: ReportFilters = {}): Promise<ReportOverview> {
    const res = await http.get<ApiResponse<ReportOverview>>('/reports/overview', { params: toParams(filters) })
    return res.data.data
  },

  async getClassPerformance(filters: ReportFilters = {}): Promise<ClassPerformanceRow[]> {
    const res = await http.get<ApiResponse<ClassPerformanceRow[]>>('/reports/class-performance', { params: toParams(filters) })
    return res.data.data
  },

  async getSubjectRanking(filters: ReportFilters = {}): Promise<SubjectRankingRow[]> {
    const res = await http.get<ApiResponse<SubjectRankingRow[]>>('/reports/subject-ranking', { params: toParams(filters) })
    return res.data.data
  },

  async getStudentRanking(filters: ReportFilters = {}): Promise<StudentRankingRow[]> {
    const res = await http.get<ApiResponse<StudentRankingRow[]>>('/reports/student-ranking', { params: toParams(filters) })
    return res.data.data
  },

  async getStudentReportCard(studentId: number, filters: ReportFilters = {}): Promise<StudentReportCard> {
    const res = await http.get<ApiResponse<StudentReportCard>>(
      `/reports/students/${studentId}/report-card`,
      { params: toParams(filters) },
    )
    return res.data.data
  },
}
