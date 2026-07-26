export interface ActivityLogEntry {
  id: number
  action: string
  module: string
  description: string
  user_name: string
  ip_address: string | null
  created_at: string
  created_at_raw: string
}

export interface ActivityLogFilters {
  search?: string
  action?: string
  module?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface ActivityLogFilterOptions {
  modules: string[]
  actions: string[]
}

export interface ActivityLogListData {
  logs: {
    current_page: number
    data: ActivityLogEntry[]
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
  filters: ActivityLogFilterOptions
}
