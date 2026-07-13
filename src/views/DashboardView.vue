<template>
  <Header />
  <div class="px-4 py-4 dashboard-page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <i class="bi bi-speedometer2"></i>
        </div>
        <div>
          <h2 class="page-title">Admin Dashboard</h2>
          <p class="page-subtitle">Live academic performance and operations overview</p>
        </div>
      </div>
      <div class="last-updated">
        <i class="bi bi-clock me-1"></i>
        Last updated: {{ lastUpdated }}
      </div>
    </div>

    <!-- Error Banner -->
    <div
      v-if="dashboard.error"
      class="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 rounded-3 border-0"
      style="font-size: 0.82rem;"
    >
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span class="flex-grow-1">{{ dashboard.error }}</span>
      <button class="btn btn-sm btn-outline-danger rounded-pill px-3" @click="dashboard.fetchDashboardData">
        Retry
      </button>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-3" />

    <section :class="['command-center', { 'dark-mode': theme.isDark }]">
      <div class="command-main">
        <div class="command-eyebrow">Academic Command Center</div>
        <div class="command-title">
          {{ dashboard.kpi.average_score.toFixed(2) }}
          <span>average score</span>
        </div>
        <div class="command-meta">
          <span><i class="bi bi-calendar-event"></i>{{ String(dashboard.kpi.current_term ?? 'No term') }}</span>
          <span><i class="bi bi-people-fill"></i>{{ dashboard.kpi.active_students }} active students</span>
          <span><i class="bi bi-journal-check"></i>{{ dashboard.kpi.active_subject_offerings }} active offerings</span>
          <span><i class="bi bi-clock-history"></i>{{ lastUpdated }}</span>
        </div>
      </div>
      <div class="command-metrics">
        <div class="metric-tile">
          <span>Active Rate</span>
          <strong>{{ studentActivityRate }}%</strong>
          <small>{{ dashboard.kpi.active_students }} of {{ dashboard.kpi.total_students }} students</small>
        </div>
        <div class="metric-tile">
          <span>Score Completion</span>
          <strong>{{ dashboard.kpi.score_completion_rate.toFixed(1) }}%</strong>
          <small>{{ dashboard.kpi.total_enrollments }} enrollments</small>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="dashboard.loading" class="row g-2 g-xl-3 mb-3">
      <div v-for="i in 4" :key="i" class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 h-100" style="background: #ffffff; min-height: 100px;">
          <div class="card-body">
            <div class="skeleton-pulse skeleton-bar mb-2" style="height: 1.5rem; width: 60%;"></div>
            <div class="skeleton-pulse skeleton-bar" style="height: 2rem; width: 80%;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <section v-else class="kpi-grid mb-3">
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard
          label="Total Students"
          :value="dashboard.kpi.total_students"
          icon="bi bi-mortarboard"
          iconClass="icon-blue"
        />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard
          label="Active Students"
          :value="dashboard.kpi.active_students"
          icon="bi bi-person-check"
          iconClass="icon-green"
          :subtitle="`${studentActivityRate}% of total`"
        />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard
          label="Total Teachers"
          :value="dashboard.kpi.total_teachers"
          icon="bi bi-people"
          iconClass="icon-violet"
        />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard
          label="Total Classes"
          :value="dashboard.kpi.total_classes"
          icon="bi bi-building"
          iconClass="icon-orange"
        />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard
          label="Total Subjects"
          :value="dashboard.kpi.total_subjects"
          icon="bi bi-book"
          iconClass="icon-sky"
        />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard
          label="Active Offerings"
          :value="dashboard.kpi.active_subject_offerings"
          icon="bi bi-calendar-check"
          iconClass="icon-mint"
        />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard
          label="Total Enrollments"
          :value="dashboard.kpi.total_enrollments"
          icon="bi bi-diagram-3"
          iconClass="icon-rose"
        />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <KpiCard
          label="Average Score"
          :value="dashboard.kpi.average_score"
          icon="bi bi-bar-chart"
          iconClass="icon-orange"
          :decimals="2"
        />
      </div>
    </section>

    <section :class="['dashboard-tabs', { 'dark-mode': theme.isDark }]">
      <button :class="{ active: activeSection === 'overview' }" @click="activeSection = 'overview'">
        <i class="bi bi-grid-1x2"></i>
        Overview
      </button>
      <button :class="{ active: activeSection === 'performance' }" @click="activeSection = 'performance'">
        <i class="bi bi-graph-up-arrow"></i>
        Performance
      </button>
      <button :class="{ active: activeSection === 'activity' }" @click="activeSection = 'activity'">
        <i class="bi bi-activity"></i>
        Activity
      </button>
    </section>

    <!-- Overview Charts -->
    <section v-if="activeSection === 'overview'" class="row g-2 g-xl-3 mb-3">
      <div class="col-12 col-xl-6">
        <div :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
          <div class="card-body py-3 px-3">
            <h2 class="panel-title mb-0">Student Growth Over Time</h2>
            <p class="panel-subtitle mb-2">Cumulative student enrollment by month</p>
            <EChart
              :option="studentGrowthChartOption"
              :loading="dashboard.loading"
              height="280px"
            />
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-6">
        <div :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
          <div class="card-body py-3 px-3">
            <h2 class="panel-title mb-0">Students by Generation</h2>
            <p class="panel-subtitle mb-2">Student distribution across generations</p>
            <EChart
              :option="studentsByGenChartOption"
              :loading="dashboard.loading"
              height="280px"
            />
          </div>
        </div>
      </div>
    </section>

    <section v-if="activeSection === 'overview'" class="row g-2 g-xl-3 mb-3">
      <div class="col-12 col-xl-6">
        <div :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
          <div class="card-body py-3 px-3">
            <h2 class="panel-title mb-0">Students by Department</h2>
            <p class="panel-subtitle mb-2">Enrollment distribution by department</p>
            <EChart
              :option="studentsByDeptChartOption"
              :loading="dashboard.loading"
              height="280px"
            />
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-6">
        <div :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
          <div class="card-body py-3 px-3">
            <h2 class="panel-title mb-0">Grade Distribution</h2>
            <p class="panel-subtitle mb-2">Overall grade breakdown</p>
            <EChart
              :option="gradeDistChartOption"
              :loading="dashboard.loading"
              height="280px"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Performance Charts -->
    <section v-if="activeSection === 'performance'" class="row g-2 g-xl-3 mb-3">
      <div class="col-12 col-xl-6">
        <div :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
          <div class="card-body py-3 px-3">
            <h2 class="panel-title mb-0">Subject Average Scores</h2>
            <p class="panel-subtitle mb-2">Performance by subject</p>
            <EChart
              :option="subjectAvgScoresChartOption"
              :loading="dashboard.loading"
              height="300px"
            />
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-6">
        <div :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
          <div class="card-body py-3 px-3">
            <h2 class="panel-title mb-0">Teacher Workload</h2>
            <p class="panel-subtitle mb-2">Classes assigned per teacher</p>
            <EChart
              :option="teacherWorkloadChartOption"
              :loading="dashboard.loading"
              height="300px"
            />
          </div>
        </div>
      </div>
    </section>

    <section v-if="activeSection === 'performance'" class="row g-2 g-xl-3 mb-3">
      <div class="col-12 col-xl-6">
        <div :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
          <div class="card-body py-3 px-3">
            <h2 class="panel-title mb-0">Assessment Type Averages</h2>
            <p class="panel-subtitle mb-2">Average marks by assessment type</p>
            <EChart
              :option="assessmentTypeAvgChartOption"
              :loading="dashboard.loading"
              height="280px"
            />
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-6">
        <div :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
          <div class="card-body py-3 px-3">
            <h2 class="panel-title mb-0">Average Score by Term</h2>
            <p class="panel-subtitle mb-2">Performance trend across terms</p>
            <EChart
              :option="avgScoreByTermChartOption"
              :loading="dashboard.loading"
              height="280px"
            />
          </div>
        </div>
      </div>
    </section>

    <section v-if="activeSection === 'performance'" class="row g-2 g-xl-3 mb-3">
      <div class="col-12 col-xl-6">
        <div :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
          <div class="card-body py-3 px-3">
            <h2 class="panel-title mb-0">Top 10 Students</h2>
            <p class="panel-subtitle mb-2">Highest average scores</p>
            <EChart
              :option="topStudentsChartOption"
              :loading="dashboard.loading"
              height="320px"
            />
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-6">
        <div :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
          <div class="card-body py-3 px-3">
            <h2 class="panel-title mb-0">Lowest Performing Subjects</h2>
            <p class="panel-subtitle mb-2">Subjects needing attention</p>
            <EChart
              :option="lowestSubjectsChartOption"
              :loading="dashboard.loading"
              height="320px"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Data Tables -->
    <section v-if="activeSection === 'activity'" class="row g-2 g-xl-3 mb-3">
      <div class="col-12 col-xl-6">
        <DataTable
          title="Recent Academic Activities"
          :columns="academicActivityColumns"
          :data="dashboard.charts.recent_academic_activities"
        >
          <template #cell-total="{ row }">
            <span class="fw-semibold">{{ String((row as RecentAcademicActivity).total) }}</span>
          </template>
          <template #cell-grade="{ row }">
            <span :class="['badge', getGradeBadgeClass((row as RecentAcademicActivity).grade)]">
              {{ (row as RecentAcademicActivity).grade }}
            </span>
          </template>
        </DataTable>
      </div>

      <div class="col-12 col-xl-6">
        <DataTable
          title="Recent User Activities"
          :columns="userActivityColumns"
          :data="dashboard.charts.recent_user_activities"
        >
          <template #cell-action="{ row }">
            <span :class="['badge', getActionBadgeClass((row as any).action)]">
              {{ (row as any).action }}
            </span>
          </template>
        </DataTable>
      </div>
    </section>

    <section v-if="activeSection === 'activity'" class="row g-2 g-xl-3 mb-3">
      <div class="col-12 col-xl-6">
        <DataTable
          title="Recently Generated Report Cards"
          :columns="reportCardColumns"
          :data="dashboard.charts.recent_report_cards"
        >
          <template #cell-average="{ row }">
            <span class="fw-semibold">{{ (row as RecentReportCard).average?.toFixed(2) }}</span>
          </template>
          <template #cell-grade="{ row }">
            <span :class="['badge', getGradeBadgeClass((row as RecentReportCard).grade)]">
              {{ (row as RecentReportCard).grade }}
            </span>
          </template>
        </DataTable>
      </div>

      <div class="col-12 col-xl-6">
        <DataTable
          title="Recently Generated Transcripts"
          :columns="transcriptColumns"
          :data="dashboard.charts.recent_transcripts"
        >
          <template #cell-average="{ row }">
            <span class="fw-semibold">{{ (row as RecentTranscript).average?.toFixed(2) }}</span>
          </template>
          <template #cell-grade="{ row }">
            <span :class="['badge', getGradeBadgeClass((row as RecentTranscript).grade)]">
              {{ (row as RecentTranscript).grade }}
            </span>
          </template>
          <template #cell-status="{ row }">
            <span :class="['badge', getStatusBadgeClass((row as RecentTranscript).status)]">
              {{ (row as RecentTranscript).status }}
            </span>
          </template>
        </DataTable>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useDashboardStore } from '@/stores/dashboard'
import Header from '@/layouts/Header.vue'
import KpiCard from '@/components/KpiCard.vue'
import FilterBar from '@/components/FilterBar.vue'
import EChart from '@/components/EChart.vue'
import DataTable from '@/components/DataTable.vue'
import type { EChartsOption } from 'echarts'
import type {
  RecentAcademicActivity,
  RecentReportCard,
  RecentTranscript,
  TopStudent,
  LowestPerformingSubject
} from '@/types/dashboard'

const theme = useThemeStore()
const dashboard = useDashboardStore()

const lastUpdated = ref<string>('')
const activeSection = ref<'overview' | 'performance' | 'activity'>('overview')
let lastUpdatedTimer: ReturnType<typeof setInterval> | null = null

// ── Column Definitions ────────────────────────────────────────────────
const academicActivityColumns = [
  { key: 'student_name', label: 'Student' },
  { key: 'action', label: 'Action' },
  { key: 'total', label: 'Score' },
  { key: 'grade', label: 'Grade' },
  { key: 'created_at', label: 'Time' }
]

const userActivityColumns = [
  { key: 'user_name', label: 'User' },
  { key: 'action', label: 'Action' },
  { key: 'module', label: 'Module' },
  { key: 'created_at', label: 'Time' }
]

const reportCardColumns = [
  { key: 'student_name', label: 'Student' },
  { key: 'generation', label: 'Generation' },
  { key: 'term', label: 'Term' },
  { key: 'average', label: 'Average' },
  { key: 'grade', label: 'Grade' }
]

const transcriptColumns = [
  { key: 'student_name', label: 'Student' },
  { key: 'generation', label: 'Generation' },
  { key: 'average', label: 'Average' },
  { key: 'grade', label: 'Grade' },
  { key: 'status', label: 'Status' }
]

// ── Computed Helpers ──────────────────────────────────────────────────
const studentActivityRate = computed(() => {
  if (!dashboard.kpi.total_students) return '0'
  return String(((dashboard.kpi.active_students / dashboard.kpi.total_students) * 100).toFixed(1))
})

function getGradeBadgeClass(grade: string): string {
  const map: Record<string, string> = {
    'A': 'text-success', 'B': 'text-primary', 'C': 'text-warning',
    'D': 'text-orange', 'F': 'text-danger', 'N/A': 'text-secondary'
  }
  return map[grade] || 'text-secondary'
}

function getActionBadgeClass(action: string): string {
  const map: Record<string, string> = {
    'Create': 'text-success', 'Update': 'text-primary', 'Delete': 'text-danger',
    'Login': 'text-info', 'Logout': 'text-secondary', 'Export': 'text-primary'
  }
  return map[action] || 'text-secondary'
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'generated': 'text-success', 'pending': 'text-warning', 'failed': 'text-danger'
  }
  return map[status] || 'text-secondary'
}

// ── Chart Options ─────────────────────────────────────────────────────
const studentGrowthChartOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.student_growth
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 15, right: 15, top: 20, bottom: 20 },
    xAxis: { type: 'category', data: data.months, axisLine: { lineStyle: { color: '#cbd5e1' } } },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
    series: [{
      data: data.counts,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#2563eb', width: 2 },
      itemStyle: { color: '#2563eb' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(37,99,235,0.2)' }, { offset: 1, color: 'rgba(37,99,235,0)' }] } }
    }]
  }
})

const studentsByGenChartOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.students_by_generation
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 15, right: 15, top: 20, bottom: 20 },
    xAxis: { type: 'category', data: data.labels, axisLine: { lineStyle: { color: '#cbd5e1' } } },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
    series: [{
      data: data.counts,
      type: 'bar',
      itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
      barWidth: '50%'
    }]
  }
})

const studentsByDeptChartOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.students_by_department
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, fontSize: 11 },
      data: data.labels.map((label, i) => ({
        value: data.counts[i],
        name: label,
        itemStyle: { color: data.colors[i % data.colors.length] }
      }))
    }]
  }
})

const gradeDistChartOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.grade_distribution
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, fontSize: 11, formatter: '{b}\n{c} ({d}%)' },
      data: data.grades.map(g => ({
        value: g.count,
        name: g.label,
        itemStyle: { color: g.color }
      }))
    }]
  }
})

const subjectAvgScoresChartOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.subject_average_scores
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 15, right: 45, top: 20, bottom: 20 },
    xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
    yAxis: { type: 'category', data: data.subjects, axisLine: { lineStyle: { color: '#cbd5e1' } } },
    series: [{
      type: 'bar',
      data: data.scores,
      itemStyle: { color: '#14b8a6', borderRadius: [0, 4, 4, 0] },
      barWidth: '60%',
      label: { show: true, position: 'right', fontSize: 10, formatter: '{c}' }
    }]
  }
})

const teacherWorkloadChartOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.teacher_workload
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: data.teachers, axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: { rotate: 30, fontSize: 10 } },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
    legend: { data: ['Classes', 'Offerings'], bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 15, right: 15, top: 20, bottom: 45 },
    series: [
      {
        name: 'Classes',
        data: data.class_counts,
        type: 'bar',
        itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] },
        barWidth: '36%'
      },
      {
        name: 'Offerings',
        data: data.offering_counts,
        type: 'bar',
        itemStyle: { color: '#0ea5e9', borderRadius: [4, 4, 0, 0] },
        barWidth: '36%'
      }
    ]
  }
})

const assessmentTypeAvgChartOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.assessment_type_averages
  const typeColors: Record<string, string> = {
    quiz: '#3b82f6', assignment: '#10b981', midterm: '#f59e0b', final: '#ef4444'
  }
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Average Mark', 'Average Max'], bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 15, right: 15, top: 20, bottom: 55 },
    xAxis: { type: 'category', data: data.map(d => d.label), axisLine: { lineStyle: { color: '#cbd5e1' } } },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
    series: [
      {
        name: 'Average Mark', data: data.map(d => d.average_mark), type: 'bar',
        itemStyle: { 
          color: (params: { dataIndex: number }) => typeColors[data[params.dataIndex]?.type || ''] || '#64748b', 
          borderRadius: [4, 4, 0, 0] 
        }
      },
      {
        name: 'Average Max', data: data.map(d => d.average_max), type: 'bar',
        itemStyle: { 
          color: (params: { dataIndex: number }) => (typeColors[data[params.dataIndex]?.type || ''] || '#64748b') + '40', 
          borderRadius: [4, 4, 0, 0] 
        }
      }
    ]
  }
})

const avgScoreByTermChartOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.average_score_by_term
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 15, right: 15, top: 20, bottom: 20 },
    xAxis: { type: 'category', data: data.terms, axisLine: { lineStyle: { color: '#cbd5e1' } } },
    yAxis: { type: 'value', min: 60, max: 100, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
    series: [{
      data: data.scores,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#f97316', width: 2 },
      itemStyle: { color: '#f97316' }
    }]
  }
})

const topStudentsChartOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.top_students as TopStudent[]
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 15, right: 45, top: 20, bottom: 20 },
    xAxis: { type: 'value', min: 60, max: 100, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
    yAxis: { type: 'category', data: data.map(d => d.name), axisLine: { lineStyle: { color: '#cbd5e1' } } },
    series: [{
      type: 'bar',
      data: data.map(d => d.average_score),
      itemStyle: { color: '#22c55e', borderRadius: [0, 4, 4, 0] },
      barWidth: '60%',
      label: { show: true, position: 'right', fontSize: 10, formatter: '{c}' }
    }]
  }
})

const lowestSubjectsChartOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.lowest_performing_subjects as LowestPerformingSubject[]
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 15, right: 45, top: 20, bottom: 20 },
    xAxis: { type: 'value', min: 0, max: 100, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
    yAxis: { type: 'category', data: data.map(d => d.name), axisLine: { lineStyle: { color: '#cbd5e1' } } },
    series: [{
      type: 'bar',
      data: data.map(d => d.average_score),
      itemStyle: { color: '#ef4444', borderRadius: [0, 4, 4, 0] },
      barWidth: '60%',
      label: { show: true, position: 'right', fontSize: 10, formatter: '{c}' }
    }]
  }
})

// ── Lifecycle ─────────────────────────────────────────────────────────
onMounted(() => {
  dashboard.initialize()
  updateLastUpdated()
  lastUpdatedTimer = setInterval(updateLastUpdated, 30000)
})

onUnmounted(() => {
  if (lastUpdatedTimer) {
    clearInterval(lastUpdatedTimer)
    lastUpdatedTimer = null
  }
})

function updateLastUpdated() {
  const now = new Date()
  lastUpdated.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.dashboard-page {
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.page-header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff, #dbeafe);
  color: #2563eb;
  border-radius: 12px;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
  letter-spacing: -0.02em;
}

.page-subtitle {
  color: #64748b;
  font-size: 0.8125rem;
  margin-bottom: 0;
  font-weight: 400;
}

.last-updated {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.45rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
}

.dark-mode .page-title { color: #f1f5f9; }
.dark-mode .page-subtitle { color: #94a3b8; }
.dark-mode .last-updated {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.command-center {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: 1rem;
  align-items: stretch;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  padding: 1.1rem;
  margin-bottom: 1rem;
  overflow: hidden;
  position: relative;
}

.command-center.dark-mode {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
}

.command-main {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.command-eyebrow {
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.3rem;
}

.command-title {
  color: #0f172a;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  line-height: 1.1;
}

.command-title span {
  color: #64748b;
  font-size: 1rem;
  font-weight: 700;
  margin-left: 0.5rem;
}

.command-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.75rem;
}

.command-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 0.3rem 0.55rem;
  font-size: 0.76rem;
  font-weight: 600;
}

.command-metrics {
  display: grid;
  position: relative;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.metric-tile {
  min-width: 0;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 14px;
  background: #f8fafc;
  padding: 0.85rem;
}

.metric-tile span,
.metric-tile small {
  display: block;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 600;
}

.metric-tile strong {
  display: block;
  color: #0f172a;
  font-size: clamp(1.25rem, 2vw, 1.7rem);
  line-height: 1.1;
  margin: 0.35rem 0 0.2rem;
}

.dark-mode .command-title,
.dark-mode .metric-tile strong {
  color: #f8fafc;
}

.dark-mode .command-title span,
.dark-mode .metric-tile span,
.dark-mode .metric-tile small {
  color: #cbd5e1;
}

.dark-mode .command-meta span,
.dark-mode .metric-tile {
  background: rgba(15, 23, 42, 0.35);
  border-color: rgba(71, 85, 105, 0.7);
  color: #e2e8f0;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.kpi-grid > * {
  min-width: 0;
  width: 100%;
  max-width: none;
  flex: none;
}

.dashboard-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  padding: 0.35rem;
  margin-bottom: 1rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.dashboard-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.5rem 0.75rem;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.dashboard-tabs button:hover {
  background: #f1f5f9;
  color: #0f172a;
  transform: translateY(-1px);
}

.dashboard-tabs button.active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
}

.dashboard-tabs.dark-mode {
  background: rgba(30, 41, 59, 0.92);
  border-color: rgba(71, 85, 105, 0.5);
}

.dashboard-tabs.dark-mode button {
  color: #cbd5e1;
}

.dashboard-tabs.dark-mode button:hover {
  background: rgba(51, 65, 85, 0.9);
  color: #f8fafc;
}

.dashboard-tabs.dark-mode button.active {
  background: #e2e8f0;
  color: #0f172a;
}

.panel-title { color: #0f172a; font-size: 0.85rem; font-weight: 700; }
.panel-subtitle { color: #64748b; font-size: 0.72rem; }
.dark-mode .panel-title { color: #f1f5f9; }
.dark-mode .panel-subtitle { color: #94a3b8; }

.panel {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.panel {
  background: #ffffff;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.panel:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.panel.dark-mode {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

@media (max-width: 991.98px) {
  .dashboard-page { padding-inline: 0.75rem !important; }
  .page-header { align-items: flex-start; flex-direction: column; }
  .command-center { grid-template-columns: 1fr; }
  .command-metrics { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 575.98px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .dashboard-tabs {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }
}
</style>
