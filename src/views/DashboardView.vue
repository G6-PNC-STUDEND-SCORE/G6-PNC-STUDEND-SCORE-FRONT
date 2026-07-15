<template>
  <Header />
  <div class="px-4 py-4 dashboard-page">
    <!-- Dismissible Welcome Banner -->
    <div v-if="showWelcome" class="welcome-card">
      <div class="welcome-bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
      <div class="welcome-content">
        <div class="welcome-icon-box">
          <i class="bi bi-stars"></i>
        </div>
        <div class="welcome-text">
          <span class="welcome-badge">Dashboard</span>
          <h3>Welcome back, Admin</h3>
          <p>Your academic snapshot is ready — everything you need at a glance.</p>
        </div>
        <button class="welcome-close" @click="dismissWelcome" title="Dismiss">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </div>

    <!-- Error Banner -->
    <div
      v-if="dashboard.error"
      class="error-banner"
    >
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>{{ dashboard.error }}</span>
      <button class="error-retry" @click="dashboard.fetchDashboardData">
        <i class="bi bi-arrow-clockwise"></i> Retry
      </button>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-3" />

    <!-- Stats Grid -->
    <div v-if="dashboard.loading" class="stats-grid mb-3">
      <div v-for="i in 8" :key="i" class="skeleton-card">
        <div class="skeleton-pulse" style="height: 44px; width: 44px; border-radius: 14px; margin-bottom: 0.85rem;"></div>
        <div class="skeleton-pulse" style="height: 1.75rem; width: 70%; border-radius: 8px; margin-bottom: 0.3rem;"></div>
        <div class="skeleton-pulse" style="height: 0.8rem; width: 40%; border-radius: 6px;"></div>
      </div>
    </div>

    <section v-else class="stats-grid mb-3">
      <KpiCard
        label="Total Students"
        :value="dashboard.kpi.total_students"
        icon="bi bi-mortarboard"
        iconClass="icon-blue"
        :subtitle="`${studentActivityRate}% active`"
      />
      <KpiCard
        label="Active Students"
        :value="dashboard.kpi.active_students"
        icon="bi bi-person-check"
        iconClass="icon-green"
      />
      <KpiCard
        label="Total Teachers"
        :value="dashboard.kpi.total_teachers"
        icon="bi bi-people"
        iconClass="icon-violet"
      />
      <KpiCard
        label="Average Score"
        :value="dashboard.kpi.average_score"
        icon="bi bi-bar-chart"
        iconClass="icon-orange"
        :decimals="2"
      />
      <KpiCard
        label="Total Subjects"
        :value="dashboard.kpi.total_subjects"
        icon="bi bi-book"
        iconClass="icon-sky"
      />
      <KpiCard
        label="Active Offerings"
        :value="dashboard.kpi.active_subject_offerings"
        icon="bi bi-calendar-check"
        iconClass="icon-mint"
      />
      <KpiCard
        label="Total Enrollments"
        :value="dashboard.kpi.total_enrollments"
        icon="bi bi-diagram-3"
        iconClass="icon-rose"
      />
      <KpiCard
        label="Total Classes"
        :value="dashboard.kpi.total_classes"
        icon="bi bi-building"
        iconClass="icon-amber"
      />
    </section>

    <!-- Tab Bar -->
    <div :class="['tab-bar', { 'dark-mode': theme.isDark }]">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-btn', { active: activeSection === tab.id }]"
        @click="activeSection = tab.id"
      >
        <i :class="tab.icon"></i>
        {{ tab.label }}
      </button>
      <div class="tab-indicator" :style="tabIndicatorStyle"></div>
    </div>

    <!-- Overview Charts -->
    <section v-if="activeSection === 'overview'" class="charts-grid mb-3">
      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3 class="chart-title">Student Growth Over Time</h3>
            <p class="chart-desc">Cumulative enrollment by month</p>
          </div>
          <span class="chart-tag blue">+12.5%</span>
        </div>
        <EChart
          :option="studentGrowthChartOption"
          :loading="dashboard.loading"
          height="280px"
        />
      </div>

      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3 class="chart-title">Students by Generation</h3>
            <p class="chart-desc">Distribution across generations</p>
          </div>
          <span class="chart-tag violet">+8.3%</span>
        </div>
        <EChart
          :option="studentsByGenChartOption"
          :loading="dashboard.loading"
          height="280px"
        />
      </div>
    </section>

    <section v-if="activeSection === 'overview'" class="charts-grid mb-3">
      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3 class="chart-title">Students by Department</h3>
            <p class="chart-desc">Enrollment by department</p>
          </div>
        </div>
        <EChart
          :option="studentsByDeptChartOption"
          :loading="dashboard.loading"
          height="280px"
        />
      </div>

      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3 class="chart-title">Grade Distribution</h3>
            <p class="chart-desc">Overall grade breakdown</p>
          </div>
        </div>
        <EChart
          :option="gradeDistChartOption"
          :loading="dashboard.loading"
          height="280px"
        />
      </div>
    </section>

    <!-- Performance Charts -->
    <section v-if="activeSection === 'performance'" class="charts-grid mb-3">
      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3 class="chart-title">Subject Average Scores</h3>
            <p class="chart-desc">Performance by subject</p>
          </div>
        </div>
        <EChart
          :option="subjectAvgScoresChartOption"
          :loading="dashboard.loading"
          height="300px"
        />
      </div>

      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3 class="chart-title">Teacher Workload</h3>
            <p class="chart-desc">Classes per teacher</p>
          </div>
        </div>
        <EChart
          :option="teacherWorkloadChartOption"
          :loading="dashboard.loading"
          height="300px"
        />
      </div>
    </section>

    <section v-if="activeSection === 'performance'" class="charts-grid mb-3">
      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3 class="chart-title">Assessment Type Averages</h3>
            <p class="chart-desc">Marks by assessment type</p>
          </div>
        </div>
        <EChart
          :option="assessmentTypeAvgChartOption"
          :loading="dashboard.loading"
          height="280px"
        />
      </div>

      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3 class="chart-title">Average Score by Term</h3>
            <p class="chart-desc">Trend across terms</p>
          </div>
        </div>
        <EChart
          :option="avgScoreByTermChartOption"
          :loading="dashboard.loading"
          height="280px"
        />
      </div>
    </section>

    <section v-if="activeSection === 'performance'" class="charts-grid mb-3">
      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3 class="chart-title">Top 10 Students</h3>
            <p class="chart-desc">Highest average scores</p>
          </div>
        </div>
        <EChart
          :option="topStudentsChartOption"
          :loading="dashboard.loading"
          height="320px"
        />
      </div>

      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3 class="chart-title">Lowest Performing Subjects</h3>
            <p class="chart-desc">Subjects needing attention</p>
          </div>
        </div>
        <EChart
          :option="lowestSubjectsChartOption"
          :loading="dashboard.loading"
          height="320px"
        />
      </div>
    </section>

    <!-- Activity Tables -->
    <section v-if="activeSection === 'activity'" class="charts-grid mb-3">
      <div class="chart-card">
        <DataTable
          title="Recent Academic Activities"
          :columns="academicActivityColumns"
          :data="dashboard.charts.recent_academic_activities"
        >
          <template #cell-total="{ row }">
            <span class="fw-semibold">{{ String((row as RecentAcademicActivity).total) }}</span>
          </template>
          <template #cell-grade="{ row }">
            <span :class="['grade-badge', getGradeBadgeClass((row as RecentAcademicActivity).grade)]">
              {{ (row as RecentAcademicActivity).grade }}
            </span>
          </template>
        </DataTable>
      </div>

      <div class="chart-card">
        <DataTable
          title="Recent User Activities"
          :columns="userActivityColumns"
          :data="dashboard.charts.recent_user_activities"
        >
          <template #cell-action="{ row }">
            <span :class="['action-badge', getActionBadgeClass((row as any).action)]">
              {{ (row as any).action }}
            </span>
          </template>
        </DataTable>
      </div>
    </section>

    <section v-if="activeSection === 'activity'" class="charts-grid mb-3">
      <div class="chart-card">
        <DataTable
          title="Recently Generated Report Cards"
          :columns="reportCardColumns"
          :data="dashboard.charts.recent_report_cards"
        >
          <template #cell-average="{ row }">
            <span class="fw-semibold">{{ (row as RecentReportCard).average?.toFixed(2) }}</span>
          </template>
          <template #cell-grade="{ row }">
            <span :class="['grade-badge', getGradeBadgeClass((row as RecentReportCard).grade)]">
              {{ (row as RecentReportCard).grade }}
            </span>
          </template>
        </DataTable>
      </div>

      <div class="chart-card">
        <DataTable
          title="Recently Generated Transcripts"
          :columns="transcriptColumns"
          :data="dashboard.charts.recent_transcripts"
        >
          <template #cell-average="{ row }">
            <span class="fw-semibold">{{ (row as RecentTranscript).average?.toFixed(2) }}</span>
          </template>
          <template #cell-grade="{ row }">
            <span :class="['grade-badge', getGradeBadgeClass((row as RecentTranscript).grade)]">
              {{ (row as RecentTranscript).grade }}
            </span>
          </template>
          <template #cell-status="{ row }">
            <span :class="['status-badge', getStatusBadgeClass((row as RecentTranscript).status)]">
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
const showWelcome = ref(localStorage.getItem('dashboard_welcome_dismissed') !== 'true')
let lastUpdatedTimer: ReturnType<typeof setInterval> | null = null

const tabs = [
  { id: 'overview' as const, label: 'Overview', icon: 'bi bi-grid-1x2' },
  { id: 'performance' as const, label: 'Performance', icon: 'bi bi-graph-up-arrow' },
  { id: 'activity' as const, label: 'Activity', icon: 'bi bi-activity' },
]

const tabIndicatorStyle = computed(() => {
  const idx = tabs.findIndex(t => t.id === activeSection.value)
  return {
    transform: `translateX(${idx * 100}%)`,
    width: `${100 / tabs.length}%`,
  }
})

function dismissWelcome() {
  showWelcome.value = false
  localStorage.setItem('dashboard_welcome_dismissed', 'true')
}

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
    'A': 'grade-a', 'B': 'grade-b', 'C': 'grade-c',
    'D': 'grade-d', 'F': 'grade-f', 'N/A': 'grade-na'
  }
  return map[grade] || 'grade-na'
}

function getActionBadgeClass(action: string): string {
  const map: Record<string, string> = {
    'Create': 'act-create', 'Update': 'act-update', 'Delete': 'act-delete',
    'Login': 'act-login', 'Logout': 'act-logout', 'Export': 'act-export'
  }
  return map[action] || 'act-default'
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'generated': 'stat-gen', 'pending': 'stat-pending', 'failed': 'stat-fail'
  }
  return map[status] || 'stat-default'
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
      lineStyle: { color: '#3b82f6', width: 2.5 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.2)' }, { offset: 1, color: 'rgba(59,130,246,0)' }] } }
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
      itemStyle: { color: '#8b5cf6', borderRadius: [6, 6, 0, 0] },
      barWidth: '45%'
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
      itemStyle: { color: '#14b8a6', borderRadius: [0, 6, 6, 0] },
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
      { name: 'Classes', data: data.class_counts, type: 'bar', itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }, barWidth: '36%' },
      { name: 'Offerings', data: data.offering_counts, type: 'bar', itemStyle: { color: '#0ea5e9', borderRadius: [4, 4, 0, 0] }, barWidth: '36%' }
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
        itemStyle: { color: (params: { dataIndex: number }) => typeColors[data[params.dataIndex]?.type || ''] || '#64748b', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: 'Average Max', data: data.map(d => d.average_max), type: 'bar',
        itemStyle: { color: (params: { dataIndex: number }) => (typeColors[data[params.dataIndex]?.type || ''] || '#64748b') + '40', borderRadius: [4, 4, 0, 0] }
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
      lineStyle: { color: '#f97316', width: 2.5 },
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
      itemStyle: { color: '#22c55e', borderRadius: [0, 6, 6, 0] },
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
      itemStyle: { color: '#ef4444', borderRadius: [0, 6, 6, 0] },
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
  padding-bottom: 2rem !important;
}

/* ── Welcome Card ────────────────────────── */
.welcome-card {
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  border-radius: 24px;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.2);
}

.welcome-bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.shape-1 {
  top: -80px; left: -40px;
  width: 240px; height: 240px;
  background: radial-gradient(circle, #3b82f6, transparent);
  animation: float 6s ease-in-out infinite;
}

.shape-2 {
  bottom: -60px; right: 10%;
  width: 180px; height: 180px;
  background: radial-gradient(circle, #8b5cf6, transparent);
  animation: float 8s ease-in-out infinite reverse;
}

.shape-3 {
  top: 20%; right: -30px;
  width: 120px; height: 120px;
  background: radial-gradient(circle, #14b8a6, transparent);
  animation: float 7s ease-in-out infinite 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  position: relative;
  z-index: 1;
}

.welcome-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #60a5fa;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(59,130,246,0.15);
}

.welcome-text {
  flex: 1;
  min-width: 0;
}

.welcome-badge {
  display: inline-flex;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #60a5fa;
  background: rgba(59,130,246,0.15);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  margin-bottom: 0.35rem;
}

.welcome-text h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #f1f5f9;
  margin: 0 0 2px;
  line-height: 1.3;
}

.welcome-text p {
  font-size: 0.82rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
}

.welcome-close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.welcome-close:hover {
  background: rgba(255,255,255,0.1);
  color: #e2e8f0;
}

/* ── Error Banner ────────────────────────── */
.error-banner {
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

.error-banner i { color: #ef4444; font-size: 0.9rem; }

.error-retry {
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
  transition: background 0.2s;
}

.error-retry:hover { background: #dc2626; }

/* ── Stats Grid ──────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.skeleton-card {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #e9ecef;
  padding: 1.25rem;
  min-height: 140px;
}

/* ── Tab Bar ─────────────────────────────── */
.tab-bar {
  display: inline-flex;
  position: relative;
  gap: 0;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(12px);
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 0.3rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.tab-btn {
  position: relative;
  z-index: 2;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 100px;
  justify-content: center;
}

.tab-btn:hover { color: #475569; }
.tab-btn.active { color: #ffffff; }

.tab-indicator {
  position: absolute;
  top: 0.3rem;
  bottom: 0.3rem;
  left: 0.3rem;
  background: #0f172a;
  border-radius: 10px;
  z-index: 1;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(15,23,42,0.15);
}

.tab-bar.dark-mode {
  background: rgba(31, 41, 55, 0.7);
  border-color: rgba(75, 85, 99, 0.4);
}

.tab-bar.dark-mode .tab-btn { color: #9ca3af; }
.tab-bar.dark-mode .tab-btn:hover { color: #e5e7eb; }
.tab-bar.dark-mode .tab-btn.active { color: #111827; }
.tab-bar.dark-mode .tab-indicator { background: #e5e7eb; }

/* ── Charts Grid ─────────────────────────── */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 20px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(15,23,42,0.03);
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 4px 16px rgba(59,130,246,0.08), 0 12px 40px rgba(15,23,42,0.06);
  transform: translateY(-2px);
  border-color: rgba(59,130,246,0.15);
}

.chart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  gap: 0.75rem;
}

.chart-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.chart-desc {
  font-size: 0.72rem;
  color: #94a3b8;
  margin: 0.1rem 0 0;
  line-height: 1.3;
}

.chart-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  white-space: nowrap;
  flex-shrink: 0;
}

.chart-tag.blue {
  background: rgba(59,130,246,0.08);
  color: #3b82f6;
  border: 1px solid rgba(59,130,246,0.12);
}

.chart-tag.violet {
  background: rgba(139,92,246,0.08);
  color: #8b5cf6;
  border: 1px solid rgba(139,92,246,0.12);
}

.dark-mode .chart-card {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.4);
}

.dark-mode .chart-card:hover {
  border-color: rgba(96, 165, 250, 0.25);
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
}

.dark-mode .chart-title { color: #f1f5f9; }
.dark-mode .chart-desc { color: #94a3b8; }

/* ── Badges ──────────────────────────────── */
.grade-badge, .action-badge, .status-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  white-space: nowrap;
}

.grade-a { background: rgba(16,185,129,0.1); color: #10b981; }
.grade-b { background: rgba(59,130,246,0.1); color: #3b82f6; }
.grade-c { background: rgba(245,158,11,0.1); color: #f59e0b; }
.grade-d { background: rgba(249,115,22,0.1); color: #f97316; }
.grade-f { background: rgba(239,68,68,0.1); color: #ef4444; }
.grade-na { background: rgba(148,163,184,0.1); color: #94a3b8; }

.act-create { background: rgba(16,185,129,0.1); color: #10b981; }
.act-update { background: rgba(59,130,246,0.1); color: #3b82f6; }
.act-delete { background: rgba(239,68,68,0.1); color: #ef4444; }
.act-login { background: rgba(14,165,233,0.1); color: #0ea5e9; }
.act-logout { background: rgba(148,163,184,0.1); color: #94a3b8; }
.act-export { background: rgba(59,130,246,0.1); color: #3b82f6; }
.act-default { background: rgba(148,163,184,0.1); color: #94a3b8; }

.stat-gen { background: rgba(16,185,129,0.1); color: #10b981; }
.stat-pending { background: rgba(245,158,11,0.1); color: #f59e0b; }
.stat-fail { background: rgba(239,68,68,0.1); color: #ef4444; }
.stat-default { background: rgba(148,163,184,0.1); color: #94a3b8; }

/* ── Skeleton ────────────────────────────── */
.skeleton-pulse {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
}

.dark-mode .skeleton-pulse {
  background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
  background-size: 200% 100%;
}

@keyframes pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Responsive ──────────────────────────── */
@media (max-width: 1199.98px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 991.98px) {
  .dashboard-page { padding-inline: 0.75rem !important; }
  .charts-grid { grid-template-columns: 1fr; }
}

@media (max-width: 767.98px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .tab-bar { display: grid; grid-template-columns: 1fr; width: 100%; }
  .tab-indicator { display: none; }
  .tab-btn.active { background: #0f172a; color: #fff; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
  .welcome-content { flex-wrap: wrap; }
}
</style>

