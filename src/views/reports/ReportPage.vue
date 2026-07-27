<template>
  <div class="py-4 report-page" :class="{ 'dark-mode': isDark }">
    <PageHeader
      title="Students & Report Cards"
      subtitle="Student ranking and printable report cards"
      :icon="FileText"
    >
      <button class="rp-btn" :disabled="loading" @click="loadAll">
        <RefreshCw :size="14" :class="{ spinning: loading }" /> Refresh
      </button>
      <div v-if="canExport" class="rp-export">
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
    </PageHeader>

    <div v-if="error" class="rp-error">
      <AlertTriangle :size="16" />
      <span>{{ error }}</span>
      <button class="rp-error-retry" @click="loadAll"><RefreshCw :size="13" /> Retry</button>
    </div>

    <!-- Filters -->
    <div class="rp-filters">
      <div class="rp-filter">
        <label>Academic Year</label>
        <select v-model="filters.academic_year_id" class="rp-select">
          <option :value="null">All years</option>
          <option v-for="year in options.academic_years" :key="year.id" :value="year.id">{{ year.name }}</option>
        </select>
      </div>
      <div class="rp-filter">
        <label>Term</label>
        <select v-model="filters.term_id" class="rp-select">
          <option :value="null">All terms</option>
          <option v-for="term in options.terms" :key="term.id" :value="term.id">{{ term.name }}</option>
        </select>
      </div>
      <div class="rp-filter">
        <label>Class</label>
        <select v-model="filters.class_id" class="rp-select">
          <option :value="null">All classes</option>
          <option v-for="cls in options.classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
      </div>
      <div class="rp-filter">
        <label>Subject</label>
        <select v-model="filters.subject_id" class="rp-select">
          <option :value="null">All subjects</option>
          <option v-for="subject in options.subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
        </select>
      </div>
      <div class="rp-filter">
        <label>Teacher</label>
        <select v-model="filters.teacher_id" class="rp-select">
          <option :value="null">All teachers</option>
          <option v-for="teacher in options.teachers" :key="teacher.id" :value="teacher.id">{{ teacher.name }}</option>
        </select>
      </div>
      <div class="rp-filter">
        <label>Generation</label>
        <select v-model="filters.generation_id" class="rp-select">
          <option :value="null">All generations</option>
          <option v-for="gen in options.generations" :key="gen.id" :value="gen.id">{{ gen.name }}</option>
        </select>
      </div>
      <button v-if="activeFilterCount > 0" class="rp-clear" @click="clearFilters">
        <XCircle :size="14" /> Clear ({{ activeFilterCount }})
      </button>
    </div>

    <LoadingState v-if="loading" message="Compiling student rankings..." />

    <div v-else class="rp-card">
      <DataTable
        :columns="studentColumns"
        :data="filteredStudentRows"
        :row-key="(row) => row.student_id"
        @row-dblclick="(row) => openReportCard(row.student_id)"
      >
        <template #header>
          <div class="rp-table-head">
            <div>
              <h3 class="rp-table-title">Student Ranking &amp; Report Cards</h3>
              <p class="rp-table-sub">
                {{ filteredStudentRows.length }} students · double-click a row (or use the button) to open the report card
              </p>
            </div>
            <SearchInput v-model="studentSearch" placeholder="Search name or student ID..." />
          </div>
        </template>
        <template #cell-rank="{ row }">
          <span class="rp-rank" :class="rankClass(row.rank)">{{ row.rank }}</span>
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
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Sheet,
  XCircle,
} from '@lucide/vue'
import PageHeader from '@/components/common/PageHeader.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import DataTable from '@/components/DataTable.vue'
import LoadingState from '@/components/LoadingState.vue'
import StudentReportCardModal from './StudentReportCardModal.vue'
import { reportService } from '@/services/reportService'
import { exportTableToCsv, exportTableToExcel, exportTableToPdf } from '@/utils/reportExport'
import { extractErrorMessage } from '@/utils'
import { GRADE_COLORS } from '@/constants'
import { useThemeStore } from '@/stores/theme'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import type { ReportFilterOptions, ReportFilters, StudentRankingRow } from '@/types'

const theme = useThemeStore()
const { hasPermission } = usePermission()
const toast = useToast()

const isDark = computed(() => theme.isDark)
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
  if (!(event.target as HTMLElement).closest('.rp-export')) showExportMenu.value = false
}

watch(filters, loadAll, { deep: true })

onMounted(async () => {
  document.addEventListener('click', closeExportMenu)
  await loadOptions()
  await loadAll()
})

onUnmounted(() => document.removeEventListener('click', closeExportMenu))
</script>

<style scoped>
.report-page { font-family: 'Inter', 'Noto Sans Khmer', sans-serif; padding-bottom: 2rem !important; }

.rp-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  border-radius: 10px;
  padding: 0.45rem 0.8rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.rp-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
.rp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.rp-btn-primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.rp-btn-primary:hover:not(:disabled) { background: #1d4ed8; border-color: #1d4ed8; }

.spinning { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.rp-export { position: relative; }
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
.rp-error :deep(svg) { color: #ef4444; }
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
}

.rp-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.rp-filter { display: flex; flex-direction: column; gap: 0.2rem; min-width: 150px; flex: 1 1 150px; }
.rp-filter label {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}
.rp-select {
  font-size: 0.8rem;
  padding: 0.35rem 0.55rem;
  border-radius: 9px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #0f172a;
  cursor: pointer;
  width: 100%;
}
.rp-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15); }

.rp-clear {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 9px;
  padding: 0.4rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.rp-card {
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 18px;
  padding: 1.15rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 0 8px 24px rgba(15, 23, 42, 0.03);
}

.rp-table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.rp-table-title { font-size: 0.85rem; font-weight: 700; color: #0f172a; margin: 0; }
.rp-table-sub { font-size: 0.72rem; color: #94a3b8; margin: 0.1rem 0 0; }

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
}
.rp-row-btn:hover { background: #eff6ff; border-color: #bfdbfe; }

/* Dark mode */
.dark-mode .rp-btn { background: rgba(30, 41, 59, 0.9); border-color: #475569; color: #cbd5e1; }
.dark-mode .rp-btn-primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.dark-mode .rp-filters,
.dark-mode .rp-card,
.dark-mode .rp-export-menu { background: rgba(30, 41, 59, 0.95); border-color: rgba(71, 85, 105, 0.5); }
.dark-mode .rp-select { background: rgba(51, 65, 85, 0.5); border-color: #475569; color: #e2e8f0; }
.dark-mode .rp-table-title { color: #f1f5f9; }
.dark-mode .rp-export-menu button { color: #cbd5e1; }
.dark-mode .rp-export-menu button:hover { background: rgba(51, 65, 85, 0.6); color: #93c5fd; }
.dark-mode .rp-rank { background: rgba(51, 65, 85, 0.6); color: #cbd5e1; }
.dark-mode .rp-row-btn { background: rgba(51, 65, 85, 0.5); border-color: #475569; color: #93c5fd; }
</style>
