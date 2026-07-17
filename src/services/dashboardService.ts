import { http } from './apiHttp'
import type { DashboardData, FilterOptions, DashboardFilters } from '@/types/dashboard'

export const dashboardService = {
  async getDashboardData(filters: DashboardFilters = {}): Promise<DashboardData> {
    const params: Record<string, string | number> = {}
    if (filters.generation_id) params.generation_id = filters.generation_id
    if (filters.term_id) params.term_id = filters.term_id
    if (filters.class_id) params.class_id = filters.class_id
    if (filters.department_id) params.department_id = filters.department_id
    if (filters.teacher_id) params.teacher_id = filters.teacher_id

    const response = await http.get('/dashboard', { params })
    return response.data.data
  },

  async getFilterOptions(): Promise<FilterOptions> {
    const response = await http.get('/dashboard/filters')
    return response.data.data
  },
}
