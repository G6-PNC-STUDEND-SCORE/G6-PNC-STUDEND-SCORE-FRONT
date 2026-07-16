import { http } from './apiHttp'

export interface SchoolClass {
  id: number
  name: string
  code: string
  teacher_id: number | null
  generation_id: number | null
  academic_year_id: number | null
  description: string | null
  is_active: boolean
  room: string | null
  created_at: string
  updated_at: string
  teacher?: {
    id: number
    name: string
  } | null
  academicYear?: {
    id: number
    name: string
  } | null
}

export interface ClassResponse {
  success: boolean
  message?: string
  data: SchoolClass | SchoolClass[]
  errors?: Record<string, string[]>
}

const CACHE_KEY = 'classes_cache'
const CACHE_TTL = 60_000

function readCache(): SchoolClass[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (Date.now() > entry.expiry) { localStorage.removeItem(CACHE_KEY); return null }
    return entry.data as SchoolClass[]
  } catch { return null }
}

function writeCache(data: SchoolClass[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, expiry: Date.now() + CACHE_TTL }))
  } catch { /* ignore */ }
}

export const classService = {
  async getClasses(): Promise<ClassResponse> {
    const cached = readCache()
    if (cached) {
      return { success: true, data: cached } as ClassResponse
    }
    const response = await http.get('/classes')
    const data = response.data
    if (data?.success && Array.isArray(data.data)) writeCache(data.data)
    return data
  },
  async createClass(payload: Partial<SchoolClass>): Promise<ClassResponse> {
    const response = await http.post('/classes', payload)
    const data = response.data
    if (data?.success && Array.isArray(data.data)) writeCache(data.data)
    return data
  },
  async updateClass(id: number, payload: Partial<SchoolClass>): Promise<ClassResponse> {
    const response = await http.put(`/classes/${id}`, payload)
    const data = response.data
    if (data?.success) {
      const list = readCache()
      if (Array.isArray(list)) {
        const idx = list.findIndex(c => c.id === id)
        const updated = Array.isArray(data.data) ? data.data[0] : (data.data as SchoolClass)
        if (idx >= 0 && updated) list[idx] = updated
        writeCache(list)
      }
    }
    return data
  },
  async deleteClass(id: number): Promise<ClassResponse> {
    const response = await http.delete(`/classes/${id}`)
    const data = response.data
    if (data?.success) {
      const list = readCache()
      if (Array.isArray(list)) { writeCache(list.filter(c => c.id !== id)) }
    }
    return data
  },
}
