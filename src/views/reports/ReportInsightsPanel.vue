<template>
  <div class="rp-panel" :class="{ 'dark-mode': isDark }">
    <div class="rp-panel-head">
      <div>
        <h3 class="rp-panel-title">Performance Reports</h3>
        <p class="rp-panel-sub">Overview, class performance and subject ranking</p>
      </div>
      <div class="rp-panel-actions">
        <button class="rp-btn" :disabled="loading" @click="loadAll">
          <RefreshCw :size="14" :class="{ spinning: loading }" /> Refresh
        </button>
        <div v-if="canExport" class="rp-export">
          <button class="rp-btn rp-btn-primary" :disabled="!activeRows.length" @click="showExportMenu = !showExportMenu">
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

    <!-- Tabs -->
    <div class="rp-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['rp-tab', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" :size="15" />
        {{ tab.label }}
      </button>
    </div>

    <LoadingState v-if="loading" message="Compiling reports..." />

    <template v-else>
      <!-- ── Overview ─────────────────────────────────────────── -->
      <section v-if="activeTab === 'overview'">
        <div class="rp-kpis">
          <KpiCard label="Students Reported" :value="kpi.students_reported" icon="mortarboard" icon-class="icon-blue" :subtitle="`${kpi.classes_covered} classes`" />
          <KpiCard label="Average Score" :value="kpi.average_score" icon="bar-chart" icon-class="icon-violet" :decimals="2" :subtitle="`Grade ${kpi.average_grade}`" />
          <KpiCard label="Pass Rate" :value="kpi.pass_rate" icon="person-check" icon-class="icon-green" :decimals="1" :subtitle="`${kpi.pass_count} passed`" />
          <KpiCard label="Failed Results" :value="kpi.fail_count" icon="diagram-3" icon-class="icon-rose" :subtitle="`Pass mark ${kpi.pass_mark}`" />
          <KpiCard label="Highest Score" :value="kpi.highest_score" icon="calendar-check" icon-class="icon-mint" :decimals="2" />
          <KpiCard label="Lowest Score" :value="kpi.lowest_score" icon="bar-chart" icon-class="icon-amber" :decimals="2" />
          <KpiCard label="Subjects Assessed" :value="kpi.subjects_assessed" icon="book" icon-class="icon-sky" :subtitle="`${kpi.graded_enrollments} results`" />
          <KpiCard label="Grading Progress" :value="kpi.grading_progress" icon="building" icon-class="icon-orange" :decimals="1" :subtitle="`of ${kpi.total_enrollments} enrollments`" />
        </div>

        <EmptyState
          v-if="kpi.graded_enrollments === 0"
          title="No results in this scope"
          message="No scores have been recorded for the selected filters yet."
        />

        <template v-else>
          <div class="rp-charts">
            <div class="rp-card">
              <div class="rp-card-head">
                <h3>Grade Distribution</h3>
                <p>How many results landed on each grade</p>
              </div>
              <EChart :option="gradeChart" height="290px" />
            </div>
            <div class="rp-card">
              <div class="rp-card-head">
                <h3>Score Bands</h3>
                <p>Spread of totals across 10-point bands</p>
              </div>
              <EChart :option="bandChart" height="290px" />
            </div>
          </div>

          <div class="rp-charts">
            <div class="rp-card">
              <div class="rp-card-head">
                <h3>Average Score by Term</h3>
                <p>Trend across every term (ignores the term filter)</p>
              </div>
              <EChart :option="trendChart" height="280px" />
            </div>
            <div class="rp-card">
              <div class="rp-card-head">
                <h3>Assessment Breakdown</h3>
                <p>Average mark per assessment type and its weight</p>
              </div>
              <EChart :option="assessmentChart" height="280px" />
            </div>
          </div>

          <div class="rp-card">
            <DataTable
              title="Top 10 Students"
              :columns="topStudentColumns"
              :data="overview?.top_students ?? []"
              :row-key="(row) => row.student_id"
            >
              <template #cell-rank="{ row }">
                <span class="rp-rank" :class="rankClass(row.rank)">{{ row.rank }}</span>
              </template>
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
              </template>
            </DataTable>
          </div>
        </template>
      </section>

      <!-- ── Class performance ────────────────────────────────── -->
      <section v-else-if="activeTab === 'classes'">
        <EmptyState
          v-if="!classRows.length"
          title="No class data"
          message="No graded classes match the selected filters."
        />
        <template v-else>
          <div class="rp-card mb-3">
            <div class="rp-card-head">
              <h3>Class Averages</h3>
              <p>Every class in scope, best average first</p>
            </div>
            <EChart :option="classChart" height="320px" />
          </div>

          <div class="rp-card">
            <DataTable
              title="Class Performance Report"
              :columns="classColumns"
              :data="classRows"
              :row-key="(row) => row.class_id"
            >
              <template #cell-rank="{ row }">
                <span class="rp-rank" :class="rankClass(row.rank)">{{ row.rank }}</span>
              </template>
              <template #cell-average="{ row }">
                <strong>{{ row.average.toFixed(2) }}</strong>
              </template>
              <template #cell-grade="{ row }">
                <span class="rp-grade" :style="gradeStyle(row.grade)">{{ row.grade ?? '—' }}</span>
              </template>
              <template #cell-pass_rate="{ row }">
                <div class="rp-meter">
                  <div class="rp-meter-bar"><span :style="{ width: `${row.pass_rate}%`, background: passColor(row.pass_rate) }" /></div>
                  <span class="rp-meter-value">{{ row.pass_rate }}%</span>
                </div>
              </template>
              <template #cell-top_student="{ row }">
                <span v-if="row.top_student">{{ row.top_student.name }} ({{ row.top_student.average.toFixed(1) }})</span>
                <span v-else class="rp-muted">—</span>
              </template>
            </DataTable>
          </div>
        </template>
      </section>

      <!-- ── Subject ranking ──────────────────────────────────── -->
      <section v-else>
        <EmptyState
          v-if="!subjectRows.length"
          title="No subject data"
          message="No graded subjects match the selected filters."
        />
        <template v-else>
          <div class="rp-card mb-3">
            <div class="rp-card-head">
              <h3>Subject Ranking</h3>
              <p>Average score per subject — the bottom of this list is where to intervene</p>
            </div>
            <EChart :option="subjectChart" :height="`${Math.max(280, subjectRows.length * 32)}px`" />
          </div>

          <div class="rp-card">
            <DataTable
              title="Subject Ranking Report"
              :columns="subjectColumns"
              :data="subjectRows"
              :row-key="(row) => row.subject_id"
            >
              <template #cell-rank="{ row }">
                <span class="rp-rank" :class="rankClass(row.rank)">{{ row.rank }}</span>
              </template>
              <template #cell-teachers="{ row }">
                <span v-if="row.teachers.length">{{ row.teachers.join(', ') }}</span>
                <span v-else class="rp-muted">—</span>
              </template>
              <template #cell-average="{ row }">
                <strong>{{ row.average.toFixed(2) }}</strong>
              </template>
              <template #cell-grade="{ row }">
                <span class="rp-grade" :style="gradeStyle(row.grade)">{{ row.grade ?? '—' }}</span>
              </template>
              <template #cell-pass_rate="{ row }">
                <div class="rp-meter">
                  <div class="rp-meter-bar"><span :style="{ width: `${row.pass_rate}%`, background: passColor(row.pass_rate) }" /></div>
                  <span class="rp-meter-value">{{ row.pass_rate }}%</span>
                </div>
              </template>
            </DataTable>
          </div>
        </template>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Sheet,
  Users,
  XCircle,
} from '@lucide/vue'
import type { EChartsOption } from 'echarts'
import KpiCard from '@/components/KpiCard.vue'
import EChart from '@/components/EChart.vue'
import DataTable from '@/components/DataTable.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import { reportService } from '@/services/reportService'
import { exportTableToCsv, exportTableToExcel, exportTableToPdf } from '@/utils/reportExport'
import { extractErrorMessage } from '@/utils'
import { GRADE_COLORS } from '@/constants'
import { useThemeStore } from '@/stores/theme'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import type {
  ClassPerformanceRow,
  ReportFilterOptions,
  ReportFilters,
  ReportKpi,
  ReportOverview,
  SubjectRankingRow,
} from '@/types'

type TabId = 'overview' | 'classes' | 'subjects'

const theme = useThemeStore()
const { hasPermission } = usePermission()
const toast = useToast()

const isDark = computed(() => theme.isDark)
const canExport = computed(() => hasPermission('export-reports'))

const tabs = [
  { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
  { id: 'classes' as const, label: 'Class Performance', icon: Users },
  { id: 'subjects' as const, label: 'Subject Ranking', icon: BookOpen },
]

const activeTab = ref<TabId>('overview')
const loading = ref(true)
const error = ref('')
const showExportMenu = ref(false)

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

const overview = ref<ReportOverview | null>(null)
const classRows = ref<ClassPerformanceRow[]>([])
const subjectRows = ref<SubjectRankingRow[]>([])

const EMPTY_KPI: ReportKpi = {
  students_reported: 0, subjects_assessed: 0, classes_covered: 0, graded_enrollments: 0,
  total_enrollments: 0, grading_progress: 0, average_score: 0, average_grade: 'N/A',
  highest_score: 0, lowest_score: 0, pass_count: 0, fail_count: 0, pass_rate: 0, pass_mark: 50,
}

const kpi = computed<ReportKpi>(() => overview.value?.kpi ?? EMPTY_KPI)

const activeFilterCount = computed(
  () => Object.values(filters).filter((value) => value !== null && value !== undefined).length,
)

// ── Table columns ──────────────────────────────────────────────

const topStudentColumns = [
  { key: 'rank', label: '#', width: '56px' },
  { key: 'student_name', label: 'Student' },
  { key: 'student_number', label: 'Student ID' },
  { key: 'class_name', label: 'Class' },
  { key: 'subject_count', label: 'Subjects' },
  { key: 'average', label: 'Average' },
  { key: 'grade', label: 'Grade' },
  { key: 'result', label: 'Result' },
]

const classColumns = [
  { key: 'rank', label: '#', width: '56px' },
  { key: 'class_name', label: 'Class' },
  { key: 'student_count', label: 'Students' },
  { key: 'subject_count', label: 'Subjects' },
  { key: 'average', label: 'Average' },
  { key: 'grade', label: 'Grade' },
  { key: 'highest', label: 'Highest' },
  { key: 'lowest', label: 'Lowest' },
  { key: 'pass_rate', label: 'Pass Rate', width: '160px' },
  { key: 'top_student', label: 'Top Student' },
]

const subjectColumns = [
  { key: 'rank', label: '#', width: '56px' },
  { key: 'subject_name', label: 'Subject' },
  { key: 'teachers', label: 'Teacher(s)' },
  { key: 'student_count', label: 'Students' },
  { key: 'average', label: 'Average' },
  { key: 'grade', label: 'Grade' },
  { key: 'highest', label: 'Highest' },
  { key: 'lowest', label: 'Lowest' },
  { key: 'pass_rate', label: 'Pass Rate', width: '160px' },
]

// ── Charts ─────────────────────────────────────────────────────

const axisLine = { lineStyle: { color: '#cbd5e1' } }
const splitLine = { lineStyle: { type: 'dashed' as const, color: '#e2e8f0' } }

const gradeChart = computed<EChartsOption>(() => {
  const data = overview.value?.grade_distribution ?? []
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '44%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, fontSize: 11, formatter: '{b}\n{c}' },
      data: data.map((item) => ({
        name: item.grade,
        value: item.count,
        itemStyle: { color: item.color },
      })),
    }],
  }
})

const bandChart = computed<EChartsOption>(() => {
  const data = overview.value?.score_bands ?? []
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 15, right: 20, top: 20, bottom: 20, containLabel: true },
    xAxis: { type: 'category', data: data.map((b) => b.label), axisLine },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine },
    series: [{
      type: 'bar',
      data: data.map((b) => b.count),
      barWidth: '52%',
      itemStyle: { color: '#3b82f6', borderRadius: [6, 6, 0, 0] },
      label: { show: true, position: 'top', fontSize: 10 },
    }],
  }
})

const trendChart = computed<EChartsOption>(() => {
  const data = overview.value?.term_trend ?? []
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 15, right: 20, top: 20, bottom: 20, containLabel: true },
    xAxis: { type: 'category', data: data.map((t) => t.term), axisLine },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: data.map((t) => t.average),
      lineStyle: { color: '#f97316', width: 2.5 },
      itemStyle: { color: '#f97316' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(249,115,22,0.18)' },
            { offset: 1, color: 'rgba(249,115,22,0)' },
          ],
        },
      },
    }],
  }
})

const assessmentChart = computed<EChartsOption>(() => {
  const data = overview.value?.assessment_breakdown ?? []
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 15, right: 20, top: 20, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((a) => `${a.name} (${a.weight_percent}%)`),
      axisLine,
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: 'value', max: 100, axisLine: { show: false }, axisTick: { show: false }, splitLine },
    series: [{
      type: 'bar',
      data: data.map((a) => a.percentage),
      barWidth: '48%',
      itemStyle: { color: '#8b5cf6', borderRadius: [6, 6, 0, 0] },
      label: { show: true, position: 'top', fontSize: 10, formatter: '{c}%' },
    }],
  }
})

const classChart = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { bottom: 0, textStyle: { fontSize: 11 } },
  grid: { left: 15, right: 25, top: 20, bottom: 40, containLabel: true },
  xAxis: { type: 'category', data: classRows.value.map((c) => c.class_name), axisLine, axisLabel: { fontSize: 10, rotate: classRows.value.length > 6 ? 25 : 0 } },
  yAxis: { type: 'value', max: 100, axisLine: { show: false }, axisTick: { show: false }, splitLine },
  series: [
    {
      name: 'Average',
      type: 'bar',
      data: classRows.value.map((c) => c.average),
      barWidth: '38%',
      itemStyle: { color: '#2563eb', borderRadius: [6, 6, 0, 0] },
    },
    {
      name: 'Pass Rate %',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      data: classRows.value.map((c) => c.pass_rate),
      lineStyle: { color: '#10b981', width: 2 },
      itemStyle: { color: '#10b981' },
    },
  ],
}))

const subjectChart = computed<EChartsOption>(() => {
  // Reversed so rank 1 sits at the top of a horizontal bar axis.
  const rows = [...subjectRows.value].reverse()
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 15, right: 50, top: 15, bottom: 15, containLabel: true },
    xAxis: { type: 'value', max: 100, axisLine: { show: false }, axisTick: { show: false }, splitLine },
    yAxis: { type: 'category', data: rows.map((s) => s.subject_name), axisLine, axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      data: rows.map((s) => ({
        value: s.average,
        itemStyle: { color: s.average >= 80 ? '#22c55e' : s.average >= 65 ? '#3b82f6' : s.average >= 50 ? '#f59e0b' : '#ef4444', borderRadius: [0, 6, 6, 0] },
      })),
      barWidth: '58%',
      label: { show: true, position: 'right', fontSize: 10, formatter: '{c}' },
    }],
  }
})

// ── Presentation helpers ───────────────────────────────────────

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

function passColor(rate: number): string {
  if (rate >= 90) return '#22c55e'
  if (rate >= 70) return '#3b82f6'
  if (rate >= 50) return '#f59e0b'
  return '#ef4444'
}

// ── Data loading ───────────────────────────────────────────────

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
    const [overviewData, classes, subjects] = await Promise.all([
      reportService.getOverview(filters),
      reportService.getClassPerformance(filters),
      reportService.getSubjectRanking(filters),
    ])
    overview.value = overviewData
    classRows.value = classes
    subjectRows.value = subjects
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

// ── Export ─────────────────────────────────────────────────────

/** Rows backing the active tab — also what "Export" writes out. */
const activeRows = computed<unknown[]>(() => {
  switch (activeTab.value) {
    case 'classes': return classRows.value
    case 'subjects': return subjectRows.value
    default: return overview.value?.top_students ?? []
  }
})

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

function buildExport() {
  if (activeTab.value === 'classes') {
    return {
      title: 'Class Performance Report',
      head: ['#', 'Class', 'Students', 'Subjects', 'Results', 'Average', 'Grade', 'Highest', 'Lowest', 'Passed', 'Failed', 'Pass Rate %', 'Top Student'],
      body: classRows.value.map((row) => [
        row.rank, row.class_name, row.student_count, row.subject_count, row.graded_count,
        row.average.toFixed(2), row.grade ?? '—', row.highest.toFixed(2), row.lowest.toFixed(2),
        row.pass_count, row.fail_count, row.pass_rate,
        row.top_student ? `${row.top_student.name} (${row.top_student.average.toFixed(1)})` : '—',
      ]),
      filename: 'class-performance-report',
    }
  }

  if (activeTab.value === 'subjects') {
    return {
      title: 'Subject Ranking Report',
      head: ['#', 'Subject', 'Code', 'Teacher(s)', 'Students', 'Classes', 'Average', 'Grade', 'Highest', 'Lowest', 'Passed', 'Failed', 'Pass Rate %'],
      body: subjectRows.value.map((row) => [
        row.rank, row.subject_name, row.subject_code ?? '—', row.teachers.join(', ') || '—',
        row.student_count, row.class_count, row.average.toFixed(2), row.grade ?? '—',
        row.highest.toFixed(2), row.lowest.toFixed(2), row.pass_count, row.fail_count, row.pass_rate,
      ]),
      filename: 'subject-ranking-report',
    }
  }

  return {
    title: 'Performance Overview Report',
    head: ['Metric', 'Value'],
    body: [
      ['Students reported', kpi.value.students_reported],
      ['Classes covered', kpi.value.classes_covered],
      ['Subjects assessed', kpi.value.subjects_assessed],
      ['Results graded', `${kpi.value.graded_enrollments} of ${kpi.value.total_enrollments}`],
      ['Average score', kpi.value.average_score.toFixed(2)],
      ['Average grade', kpi.value.average_grade],
      ['Highest score', kpi.value.highest_score.toFixed(2)],
      ['Lowest score', kpi.value.lowest_score.toFixed(2)],
      ['Pass mark', kpi.value.pass_mark],
      ['Passed', kpi.value.pass_count],
      ['Failed', kpi.value.fail_count],
      ['Pass rate', `${kpi.value.pass_rate}%`],
      ...(overview.value?.grade_distribution ?? []).map((g) => [`Grade ${g.grade}`, `${g.count} (${g.percent}%)`]),
    ] as (string | number)[][],
    filename: 'performance-overview-report',
  }
}

async function runExport(format: 'pdf' | 'xlsx' | 'csv') {
  showExportMenu.value = false
  const payload = { ...buildExport(), subtitle: scopeLabel() }
  try {
    if (format === 'pdf') await exportTableToPdf(payload)
    else if (format === 'xlsx') await exportTableToExcel(payload)
    else exportTableToCsv(payload)
    toast.success(`Report exported as ${format.toUpperCase()}`)
  } catch (e) {
    toast.error(extractErrorMessage(e))
  }
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
.rp-panel { font-family: 'Inter', 'Noto Sans Khmer', sans-serif; }

@media (max-width: 768px) {
  .rp-panel {
    padding-left: 0;
    padding-right: 0;
  }
}

.rp-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.rp-panel-title { font-size: 1rem; font-weight: 800; color: #0f172a; margin: 0; }
.rp-panel-sub { font-size: 0.78rem; color: #94a3b8; margin: 0.15rem 0 0; }
.rp-panel-actions { display: flex; align-items: center; gap: 0.5rem; }

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

.rp-tabs {
  display: inline-flex;
  gap: 0.25rem;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 0.3rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
}
.rp-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  background: transparent;
  border-radius: 10px;
  padding: 0.5rem 0.95rem;
  font-size: 0.79rem;
  font-weight: 700;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}
.rp-tab:hover { color: #475569; }
.rp-tab.active { background: #0f172a; color: #fff; }

.rp-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }

.rp-charts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.25rem; }

.rp-card {
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 18px;
  padding: 1.15rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 0 8px 24px rgba(15, 23, 42, 0.03);
}
.rp-card-head { margin-bottom: 0.6rem; }
.rp-card-head h3 { font-size: 0.85rem; font-weight: 700; color: #0f172a; margin: 0; }
.rp-card-head p { font-size: 0.72rem; color: #94a3b8; margin: 0.1rem 0 0; }

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

.rp-meter { display: flex; align-items: center; gap: 0.5rem; }
.rp-meter-bar { flex: 1; height: 6px; border-radius: 99px; background: #f1f5f9; overflow: hidden; min-width: 60px; }
.rp-meter-bar span { display: block; height: 100%; border-radius: 99px; transition: width 0.4s ease; }
.rp-meter-value { font-size: 0.72rem; font-weight: 700; color: #475569; min-width: 38px; }

.mb-3 { margin-bottom: 1rem; }

/* Dark mode */
.dark-mode .rp-panel-title { color: #f1f5f9; }
.dark-mode .rp-btn { background: rgba(30, 41, 59, 0.9); border-color: #475569; color: #cbd5e1; }
.dark-mode .rp-btn-primary { background: #2563eb; border-color: #2563eb; color: #fff; }
.dark-mode .rp-filters,
.dark-mode .rp-tabs,
.dark-mode .rp-card,
.dark-mode .rp-export-menu { background: rgba(30, 41, 59, 0.95); border-color: rgba(71, 85, 105, 0.5); }
.dark-mode .rp-select { background: rgba(51, 65, 85, 0.5); border-color: #475569; color: #e2e8f0; }
.dark-mode .rp-card-head h3 { color: #f1f5f9; }
.dark-mode .rp-tab.active { background: #e5e7eb; color: #111827; }
.dark-mode .rp-export-menu button { color: #cbd5e1; }
.dark-mode .rp-export-menu button:hover { background: rgba(51, 65, 85, 0.6); color: #93c5fd; }
.dark-mode .rp-rank { background: rgba(51, 65, 85, 0.6); color: #cbd5e1; }
.dark-mode .rp-meter-bar { background: rgba(51, 65, 85, 0.6); }
.dark-mode .rp-meter-value { color: #cbd5e1; }

@media (max-width: 1199.98px) {
  .rp-kpis { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 991.98px) {
  .rp-charts { grid-template-columns: 1fr; }
  .rp-panel-head { flex-direction: column; align-items: flex-start; }
  .rp-panel-actions { width: 100%; }
  .rp-panel-actions .rp-btn { flex: 1; justify-content: center; }
}
@media (max-width: 768px) {
  .rp-filters {
    flex-direction: column;
    align-items: stretch;
    padding: 0.6rem 0.75rem;
    gap: 0.6rem;
  }
  .rp-filter {
    min-width: 100%;
    flex: none;
  }
  .rp-card {
    padding: 0.75rem;
    border-radius: 14px;
  }
  .rp-export-menu {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    border-radius: 16px 16px 0 0;
    min-width: unset;
    width: 100%;
    max-width: 100%;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
    padding: 0.5rem;
    z-index: 9999;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .rp-export-menu button {
    padding: 0.7rem 0.8rem;
    font-size: 0.85rem;
    justify-content: center;
  }
  .rp-rank {
    width: 22px;
    height: 22px;
    font-size: 0.65rem;
  }
}
@media (max-width: 575.98px) {
  .rp-kpis { grid-template-columns: 1fr; gap: 0.6rem; }
  .rp-tabs { display: grid; grid-template-columns: 1fr; width: 100%; }
  .rp-tab { justify-content: center; padding: 0.6rem; }
  .rp-panel-head { margin-bottom: 0.75rem; }
}
@media (max-width: 480px) {
  .rp-card {
    padding: 0.6rem;
    border-radius: 12px;
    margin-bottom: 0.75rem;
  }
  .rp-card-head h3 { font-size: 0.8rem; }
  .rp-card-head p { font-size: 0.68rem; }
  .rp-error { flex-wrap: wrap; }
  .rp-error-retry {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
  .rp-select {
    font-size: 0.9rem;
    padding: 0.45rem 0.6rem;
  }
  .rp-btn {
    padding: 0.5rem 0.65rem;
    font-size: 0.82rem;
  }
  .rp-panel-title { font-size: 0.9rem; }
  .rp-panel-sub { font-size: 0.72rem; }
}
</style>
