import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dashboardService } from '@/services/dashboardService'
import { cacheService } from '@/services/cacheService'
import type {
  DashboardData,
  DashboardFilters,
  FilterOptions,
  KpiData,
  ChartsData,
} from '@/types/dashboard'

const DEBOUNCE_MS = 400
const CACHE_TTL = 60_000
const DASHBOARD_CACHE_KEY = 'dashboard-data'

export const useDashboardStore = defineStore('dashboard', () => {
  const kpi = ref<KpiData>({
    total_students: 0,
    active_students: 0,
    total_teachers: 0,
    total_classes: 0,
    total_subjects: 0,
    active_subject_offerings: 0,
    total_enrollments: 0,
    total_report_cards: 0,
    total_transcripts: 0,
    average_score: 0,
    average_grade: 'N/A',
    current_generation: null,
    current_term: null,
    score_completion_rate: 0,
    report_card_coverage: 0,
  })

  const charts = ref<ChartsData>({
    student_growth: { months: [], counts: [] },
    students_by_generation: { labels: [], counts: [] },
    students_by_department: { labels: [], counts: [], colors: [] },
    grade_distribution: { grades: [], total: 0 },
    subject_average_scores: { subjects: [], scores: [], student_counts: [] },
    teacher_workload: { teachers: [], class_counts: [], offering_counts: [] },
    assessment_type_averages: [],
    average_score_by_term: { terms: [], scores: [], counts: [] },
    top_students: [],
    lowest_performing_subjects: [],
    recent_academic_activities: [],
    recent_user_activities: [],
    recent_report_cards: [],
    recent_transcripts: [],
  })

  const filters = ref<DashboardFilters>({
    generation_id: null,
    term_id: null,
    class_id: null,
    department_id: null,
    teacher_id: null,
  })

  const filterOptions = ref<FilterOptions>({
    generations: [],
    terms: [],
    classes: [],
    departments: [],
    teachers: [],
  })

  const loading = ref(false)
  const filtersLoading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref(0)
  const lastCacheKey = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let pendingDashboardRequest: Promise<void> | null = null

  const hasData = computed(() => kpi.value.total_students > 0)
  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.value.generation_id) count++
    if (filters.value.term_id) count++
    if (filters.value.class_id) count++
    if (filters.value.department_id) count++
    if (filters.value.teacher_id) count++
    return count
  })

  async function fetchFilterOptions() {
    const hasOptions = filterOptions.value.generations.length > 0 ||
      filterOptions.value.terms.length > 0 ||
      filterOptions.value.classes.length > 0 ||
      filterOptions.value.departments.length > 0 ||
      filterOptions.value.teachers.length > 0
    if (hasOptions) return

    filtersLoading.value = true
    try {
      filterOptions.value = await dashboardService.getFilterOptions()
    } catch {
      // Filters are non-critical; silently ignore
    } finally {
      filtersLoading.value = false
    }
  }

  async function fetchDashboardData(silent = false) {
    const cacheKey = JSON.stringify(filters.value)
    const hasFreshData = cacheKey === lastCacheKey.value && Date.now() - lastFetchedAt.value < CACHE_TTL
    if (hasFreshData && hasData.value) return
    if (pendingDashboardRequest) return pendingDashboardRequest

    if (!silent) loading.value = true
    error.value = null

    pendingDashboardRequest = dashboardService.getDashboardData(filters.value)
      .then((data: DashboardData) => {
        kpi.value = data.kpi
        charts.value = data.charts
        cacheService.set(DASHBOARD_CACHE_KEY, data, 24 * 60 * 60_000)
        lastCacheKey.value = cacheKey
        lastFetchedAt.value = Date.now()
      })
      .catch((e: unknown) => {
        const err = e as { message?: string; response?: { data?: { message?: string } } }
        error.value = err.response?.data?.message || err.message || 'Failed to load dashboard data'
      })
      .finally(() => {
        loading.value = false
        pendingDashboardRequest = null
      })

    return pendingDashboardRequest
  }

  function onFilterChange() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      fetchDashboardData()
    }, DEBOUNCE_MS)
  }

  function setFilter(key: keyof DashboardFilters, value: number | null) {
    filters.value[key] = value
    onFilterChange()
  }

  function clearFilters() {
    filters.value = {
      generation_id: null,
      term_id: null,
      class_id: null,
      department_id: null,
      teacher_id: null,
    }
    onFilterChange()
  }

  async function initialize() {
    // 1. Show cached data INSTANTLY (skeleton stays hidden if cache exists)
    const cached = cacheService.get<DashboardData>(DASHBOARD_CACHE_KEY)
    if (cached) {
      kpi.value = cached.kpi
      charts.value = cached.charts
      // loading stays false — cached data visible instantly
    } else {
      loading.value = true // show skeleton on first visit only
    }
    // 2. Refresh from API in background (silent — no skeleton flash)
    await Promise.all([
      fetchFilterOptions(),
      fetchDashboardData(true),
    ])
  }

  return {
    kpi,
    charts,
    filters,
    filterOptions,
    loading,
    filtersLoading,
    error,
    hasData,
    activeFilterCount,
    initialize,
    fetchDashboardData,
    fetchFilterOptions,
    onFilterChange,
    setFilter,
    clearFilters,
  }
})
