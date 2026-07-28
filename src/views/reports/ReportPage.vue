<template>
  <div class="page-container">
    <div v-if="error" class="rp-error">
      <AlertTriangle :size="16" />
      <span>{{ error }}</span>
      <button class="rp-error-retry" @click="loadAll"><RefreshCw :size="13" /> Retry</button>
    </div>

    <div class="scores-card">
      <!-- Card Header: Title row + Search/Export + Student count -->
      <div class="rp-card-header">
        <div class="rp-header-top">
          <span class="rp-header-label">Student Ranking · Report Cards</span>
          <div class="rp-header-actions">
            <div class="rp-search-box">
              <Search :size="15" class="search-icon" />
              <input
                v-model="studentSearch"
                type="text"
                class="rp-search-input"
                placeholder="Search students..."
              />
              <button v-if="studentSearch" class="rp-search-clear" @click="studentSearch = ''">
                <X :size="13" />
              </button>
            </div>
            <div v-if="canExport" class="rp-export-wrap">
              <button class="rp-btn rp-btn-primary" :disabled="!filteredStudentRows.length" @click="showExportMenu = !showExportMenu">
                <Download :size="14" /> Export
                <ChevronDown :size="13" />
              </button>
              <div v-if="showExportMenu" class="rp-export-menu">
                <button @click="runExport('pdf')"><FileText :size="14" /> PDF (.pdf)</button>
                <button @click="runExport('xlsx')"><Sheet :size="14" /> Excel (.xlsx)</button>
                <button @click="runExport('csv')"><FileSpreadsheet :size="14" /> CSV (.csv)</button>
              </div>
            </div>
          </div>
        </div>
        <div class="rp-header-bottom" v-if="!loading">
          <span class="rp-count-badge">
            <Users :size="14" />
            {{ filteredStudentRows.length }} Student{{ filteredStudentRows.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <!-- Filter items: each label paired with its select -->
      <div class="rp-filter-section">
        <div class="rp-filter-items">
          <div class="rp-filter-group">
            <span class="rp-flabel">Academic Year</span>
            <select v-model="filters.academic_year_id" class="rp-fselect">
              <option :value="null">All Academic Years</option>
              <option v-for="year in options.academic_years" :key="year.id" :value="year.id">{{ year.name }}</option>
            </select>
          </div>
          <div class="rp-filter-group">
            <span class="rp-flabel">Term</span>
            <select v-model="filters.term_id" class="rp-fselect">
              <option :value="null">All Terms</option>
              <option v-for="term in options.terms" :key="term.id" :value="term.id">{{ term.name }}</option>
            </select>
          </div>
          <div class="rp-filter-group">
            <span class="rp-flabel">Class</span>
            <select v-model="filters.class_id" class="rp-fselect">
              <option :value="null">All Classes</option>
              <option v-for="cls in options.classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div class="rp-filter-group">
            <span class="rp-flabel">Subject</span>
            <select v-model="filters.subject_id" class="rp-fselect">
              <option :value="null">All Subjects</option>
              <option v-for="subject in options.subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
            </select>
          </div>
          <div class="rp-filter-group">
            <span class="rp-flabel">Teacher</span>
            <select v-model="filters.teacher_id" class="rp-fselect">
              <option :value="null">All Teachers</option>
              <option v-for="teacher in options.teachers" :key="teacher.id" :value="teacher.id">{{ teacher.name }}</option>
            </select>
          </div>
          <div class="rp-filter-group">
            <span class="rp-flabel">Generation</span>
            <select v-model="filters.generation_id" class="rp-fselect">
              <option :value="null">All Generations</option>
              <option v-for="gen in options.generations" :key="gen.id" :value="gen.id">{{ gen.name }}</option>
            </select>
          </div>
          <button v-if="activeFilterCount > 0" class="rp-fclear" @click="clearFilters">
            <XCircle :size="13" /> Clear
          </button>
        </div>
      </div>

      <LoadingState v-if="loading" message="Compiling student rankings..." />

      <div v-else class="table-wrapper">
        <DataTable
          :columns="studentColumns"
          :data="paginatedStudentRows"
          :row-key="(row) => row.student_id"
          @row-dblclick="(row) => openReportCard(row.student_id)"
        >
          <template #cell-rank="{ row }">
            <span class="rp-rank" :class="rankClass(row.rank)">{{ row.rank }}</span>
          </template>
          <template #cell-subject_count="{ row }">
            <span :title="row.subjects" class="rp-subjects">{{ row.subjects || row.subject_count }}</span>
          </template>
          <template #cell-total="{ row }">{{ row.total.toFixed(2) }}</template>
          <template #cell-average="{ row }">
            <strong>{{ row.average.toFixed(2) }}</strong>
          </template>
          <template #cell-grade="{ row }">
            <span class="rp-grade" :style="gradeStyle(row.grade)">{{ row.grade ?? '—' }}</span>
          </template>
          <template #cell-result="{ row }">
            <span class="rp-result" :class="row.result === 'pass' ? 'is-pass' : 'is-fail'">
              {{ row.result.toUpperCase() }}
            </span>
            <span v-if="row.failed_subjects > 0" class="rp-muted"> ({{ row.failed_subjects }} failed)</span>
          </template>
          <template #cell-actions="{ row }">
            <button class="rp-row-btn" @click="openReportCard(row.student_id)">
              <FileText :size="13" /> Report Card
            </button>
          </template>
        </DataTable>
      </div>

      <!-- Pagination - stays fixed below the scrollable table -->
      <div v-if="!loading && filteredStudentRows.length > 0" class="pagination-bar">
        <div class="pagination-info">
          <span class="rows-label">Rows per page:</span>
          <div class="rows-selector">
            <button
              v-for="size in pageSizeOptions"
              :key="size"
              class="rows-btn"
              :class="{ active: pageSize === size }"
              @click="pageSize = size; currentPage = 1"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <div class="pagination-pages">
          <button
            class="page-nav"
            :disabled="currentPage <= 1"
            @click="currentPage--"
            aria-label="Previous page"
          >
            <ChevronLeft :size="16" />
          </button>

          <template v-for="(page, idx) in visiblePages" :key="'vp-' + idx">
            <button
              v-if="page !== '...'"
              class="page-btn"
              :class="{ active: currentPage === page }"
              @click="currentPage = page as number"
            >
              {{ page }}
            </button>
            <span v-else class="page-dots">…</span>
          </template>

          <button
            class="page-nav"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
            aria-label="Next page"
          >
            <ChevronRight :size="16" />
          </button>
        </div>

        <div class="pagination-total">
          {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredStudentRows.length) }} of {{ filteredStudentRows.length }}
        </div>
      </div>
    </div>

    <StudentReportCardModal
      v-model="showReportCard"
      :student-id="selectedStudentId"
      :filters="filters"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
  Sheet,
  Users,
  X,
  XCircle,
} from '@lucide/vue'
import DataTable from '@/components/DataTable.vue'
import LoadingState from '@/components/LoadingState.vue'
import StudentReportCardModal from './StudentReportCardModal.vue'
import { reportService } from '@/services/reportService'
import { exportTableToCsv, exportTableToExcel, exportTableToPdf } from '@/utils/reportExport'
import { extractErrorMessage } from '@/utils'
import { GRADE_COLORS } from '@/constants'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import type { ReportFilterOptions, ReportFilters, StudentRankingRow } from '@/types'

const { hasPermission } = usePermission()
const toast = useToast()

const canExport = computed(() => hasPermission('export-reports'))

const loading = ref(true)
const error = ref('')
const showExportMenu = ref(false)
const studentSearch = ref('')
const showReportCard = ref(false)
const selectedStudentId = ref<number | null>(null)

const filters = reactive<ReportFilters>({
  academic_year_id: null,
  term_id: null,
  class_id: null,
  subject_id: null,
  teacher_id: null,
  generation_id: null,
})

const options = ref<ReportFilterOptions>({
  academic_years: [],
  generations: [],
  terms: [],
  classes: [],
  subjects: [],
  teachers: [],
  grade_boundaries: [],
  pass_mark: 50,
})

const studentRows = ref<StudentRankingRow[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [5, 10, 20, 30, 50]

const totalPages = computed(() => Math.max(1, Math.ceil(filteredStudentRows.value.length / pageSize.value)))

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }
  pages.push(1)
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

const paginatedStudentRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredStudentRows.value.slice(start, end)
})

// Reset to page 1 when search/filter changes
watch([studentSearch, filters], () => {
  currentPage.value = 1
}, { deep: true })

const activeFilterCount = computed(
  () => Object.values(filters).filter((value) => value !== null && value !== undefined).length,
)

const filteredStudentRows = computed(() => {
  const term = studentSearch.value.trim().toLowerCase()
  if (!term) return studentRows.value
  return studentRows.value.filter(
    (row) =>
      row.student_name.toLowerCase().includes(term) ||
      (row.student_number ?? '').toLowerCase().includes(term) ||
      row.class_name.toLowerCase().includes(term),
  )
})

const studentColumns = [
  { key: 'rank', label: '#', width: '56px' },
  { key: 'student_name', label: 'Student' },
  { key: 'student_number', label: 'Student ID' },
  { key: 'class_name', label: 'Class' },
  { key: 'subject_count', label: 'Subjects' },
  { key: 'total', label: 'Total' },
  { key: 'average', label: 'Average' },
  { key: 'grade', label: 'Grade' },
  { key: 'result', label: 'Result' },
  { key: 'actions', label: '', width: '140px' },
]

function gradeStyle(grade: string | null) {
  const color = grade ? GRADE_COLORS[grade] : undefined
  return color ? { color, background: `${color}1a` } : {}
}

function rankClass(rank: number): string {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return ''
}

async function loadOptions() {
  try {
    options.value = await reportService.getFilterOptions()
  } catch (e) {
    error.value = extractErrorMessage(e)
  }
}

async function loadAll() {
  loading.value = true
  error.value = ''
  currentPage.value = 1
  try {
    studentRows.value = await reportService.getStudentRanking(filters)
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  filters.academic_year_id = null
  filters.term_id = null
  filters.class_id = null
  filters.subject_id = null
  filters.teacher_id = null
  filters.generation_id = null
}

function scopeLabel(): string {
  const parts: string[] = []
  const named = (list: Array<{ id: number; name: string }>, id: number | null | undefined) =>
    list.find((item) => item.id === id)?.name

  const year = named(options.value.academic_years, filters.academic_year_id)
  const term = named(options.value.terms, filters.term_id)
  const cls = named(options.value.classes, filters.class_id)
  const subject = named(options.value.subjects, filters.subject_id)
  const teacher = named(options.value.teachers, filters.teacher_id)
  const generation = named(options.value.generations, filters.generation_id)

  if (year) parts.push(year)
  if (term) parts.push(term)
  if (cls) parts.push(`Class ${cls}`)
  if (subject) parts.push(subject)
  if (teacher) parts.push(`Teacher ${teacher}`)
  if (generation) parts.push(generation)

  return parts.length ? parts.join(' · ') : 'All academic years, terms and classes'
}

async function runExport(format: 'pdf' | 'xlsx' | 'csv') {
  showExportMenu.value = false
  const payload = {
    title: 'Student Ranking Report',
    subtitle: scopeLabel(),
    head: ['#', 'Student', 'Student ID', 'Class', 'Subjects', 'Total', 'Average', 'Grade', 'Failed Subjects', 'Result'],
    body: filteredStudentRows.value.map((row) => [
      row.rank, row.student_name, row.student_number ?? '—', row.class_name, row.subject_count,
      row.total.toFixed(2), row.average.toFixed(2), row.grade ?? '—', row.failed_subjects,
      row.result.toUpperCase(),
    ]),
    filename: 'student-ranking-report',
  }
  try {
    if (format === 'pdf') await exportTableToPdf(payload)
    else if (format === 'xlsx') await exportTableToExcel(payload)
    else exportTableToCsv(payload)
    toast.success(`Report exported as ${format.toUpperCase()}`)
  } catch (e) {
    toast.error(extractErrorMessage(e))
  }
}

function openReportCard(studentId: number) {
  selectedStudentId.value = studentId
  showReportCard.value = true
}

function closeExportMenu(event: MouseEvent) {
  if (!(event.target as HTMLElement).closest('.rp-export-wrap')) showExportMenu.value = false
}

watch(filters, loadAll, { deep: true })

onMounted(async () => {
  document.addEventListener('click', closeExportMenu)
  await loadOptions()
  await loadAll()
})

onUnmounted(() => {
  document.removeEventListener('click', closeExportMenu)
})
</script>

<style scoped>
.page-container {
  height: calc(100vh - 96px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans Khmer', system-ui, sans-serif;
  color: #0f172a;
  max-width: 1440px;
  padding: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 4rem;
  color: #64748b;
  flex: 1;
}

.spinner {
  width: 30px; height: 30px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.scores-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.25s ease;
  flex: 1;
  height: 1px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.scores-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

/* ── Card Header ──────────────────────────────── */
.rp-card-header {
  display: flex;
  flex-direction: column;
  padding: 14px 24px 10px;
  border-bottom: 1px solid #e9ecef;
  background: #fff;
  gap: 10px;
}

.rp-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.rp-header-label {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
  flex-shrink: 0;
}

.rp-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.rp-header-bottom {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.rp-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 100px;
}

.rp-search-box {
  position: relative;
  width: 220px;
}

.rp-search-box .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

/* Filter section (labels + selects) */
.rp-filter-section {
  background: #f8fafc;
  border: 1px solid #eef2f6;
  border-radius: 10px;
  padding: 10px 14px;
  margin: 8px 16px 12px;
}

.rp-filter-items {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.rp-filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 160px;
}

.rp-flabel {
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  flex-shrink: 0;
}

.rp-fselect {
  border: 1.5px solid #e2e8f0;
  background: #fff;
  color: #1e293b;
  border-radius: 8px;
  padding: 0.3rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  min-width: 0;
  flex: 1;
  height: 32px;
  transition: all 0.18s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 26px;
}

.rp-fselect:hover {
  border-color: #93c5fd;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.06);
}

.rp-fselect:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.rp-fclear {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #fecaca;
  background: #fff;
  color: #dc2626;
  border-radius: 8px;
  padding: 0.2rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: all 0.15s;
  height: 32px;
}

.rp-fclear:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  box-shadow: 0 1px 3px rgba(220, 38, 38, 0.08);
}

.rp-search-input {
  width: 100%;
  padding: 0.4rem 0.8rem 0.4rem 2.1rem;
  font-size: 0.8rem;
  font-family: inherit;
  color: #1e293b;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 100px;
  outline: none;
  transition: all 0.2s ease;
  height: 34px;
}

.rp-search-input::placeholder {
  color: #94a3b8;
  font-size: 0.78rem;
}

.rp-search-input:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.rp-search-input:focus {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.rp-search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 50%;
  transition: all 0.15s;
}

.rp-search-clear:hover {
  color: #475569;
  background: #f1f5f9;
}

.rp-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  color: #475569;
  border-radius: 100px;
  padding: 0 16px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  height: 34px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.rp-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
.rp-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.rp-btn-primary { background: linear-gradient(135deg, #2563eb, #1d4ed8); border-color: #1d4ed8; color: #fff; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25); }
.rp-btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #1d4ed8, #1e40af); border-color: #1e40af; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35); transform: translateY(-1px); }

.rp-export-wrap { position: relative; }

.rp-export-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 190px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  padding: 0.3rem;
  z-index: 40;
}

.rp-export-menu button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  border: none;
  background: transparent;
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  font-family: inherit;
}

.rp-export-menu button:hover { background: #f1f5f9; color: #2563eb; }

.rp-error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 0.7rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.82rem;
  color: #991b1b;
}

.rp-error svg { color: #ef4444; flex-shrink: 0; }

.rp-error-retry {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* Pagination bar */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid #e9ecef;
  background: #ffffff;
  flex-shrink: 0;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rows-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.rows-selector {
  display: flex;
  gap: 3px;
}

.rows-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.rows-btn:hover {
  border-color: #93c5fd;
  color: #2563eb;
  background: #f8faff;
}

.rows-btn.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 3px;
}

.page-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.page-nav:hover:not(:disabled) {
  border-color: #93c5fd;
  color: #2563eb;
  background: #f8faff;
}

.page-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.page-btn:hover {
  border-color: #e2e8f0;
  background: #f8fafc;
}

.page-btn.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.page-dots {
  color: #94a3b8;
  font-size: 0.8rem;
  padding: 0 4px;
}

.pagination-total {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.rp-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 800;
  background: #f1f5f9;
  color: #64748b;
}

.rank-gold { background: rgba(245, 158, 11, 0.15); color: #d97706; }
.rank-silver { background: rgba(148, 163, 184, 0.2); color: #475569; }
.rank-bronze { background: rgba(249, 115, 22, 0.15); color: #ea580c; }

.rp-grade {
  display: inline-block;
  min-width: 34px;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
}

.rp-result { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.03em; }
.rp-result.is-pass { color: #10b981; }
.rp-result.is-fail { color: #ef4444; }
.rp-subjects {
  display: inline-block;
  max-width: 240px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
  color: #475569;
}

.rp-muted { color: #94a3b8; font-size: 0.75rem; }

.rp-row-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #2563eb;
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
}

.rp-row-btn:hover { background: #eff6ff; border-color: #bfdbfe; }

.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: #9ca3af;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-state-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.empty-state h5 { font-weight: 600; color: #64748b; margin: 0 0 4px 0; font-size: 1rem; }
.empty-state p { font-size: 0.8125rem; margin: 0; }
</style>

<!-- Unscoped styles to freeze header row and first column on Report page only -->
<style>
.table-wrapper .data-table-wrapper {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
}

.table-wrapper .table-responsive {
  overflow: visible !important;
}

.table-wrapper .data-table {
  border-collapse: separate;
}

/* === FREEZE HEADER ROW (sticky top) === */
.table-wrapper .data-table thead th {
  background: #f8fafc !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 3 !important;
}

/* === FREEZE FIRST COLUMN (#) (sticky left) === */
.table-wrapper .data-table thead th:first-child,
.table-wrapper .data-table tbody td:first-child {
  position: sticky !important;
  left: 0 !important;
  z-index: 4 !important;
}

/* === CORNER CELL (# header) - highest z-index === */
.table-wrapper .data-table thead th:first-child {
  z-index: 6 !important;
}

/* === BACKGROUNDS to hide scrolled content behind frozen cells === */
.table-wrapper .data-table tbody td:first-child {
  background: #ffffff !important;
  border-right: 1px solid #e2e8f0 !important;
}

.table-wrapper .data-table thead th {
  background: #f8fafc !important;
}

/* === HOVER on frozen first column === */
.table-wrapper .data-row:hover td:first-child {
  background: #f8fafc !important;
}
</style>
