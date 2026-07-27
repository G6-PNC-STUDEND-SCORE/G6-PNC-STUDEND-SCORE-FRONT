import { http } from './apiHttp'
import type { ActivityLogFilters, ActivityLogListData, ApiResponse } from '@/types'

export const activityLogService = {
  async getLogs(filters: ActivityLogFilters = {}): Promise<ActivityLogListData> {
    const params: Record<string, string | number> = {}
    if (filters.search) params.search = filters.search
    if (filters.action) params.action = filters.action
    if (filters.module) params.module = filters.module
    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to
    if (filters.page) params.page = filters.page
    if (filters.per_page) params.per_page = filters.per_page

    const response = await http.get<ApiResponse<ActivityLogListData>>('/activity-logs', { params })
    return response.data.data
  },

  async deleteLogs(ids: number[]): Promise<void> {
    await http.post('/activity-logs/bulk-delete', { ids })
  },
}
