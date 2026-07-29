<template>
  <div class="dashboard-page">
    <!-- Welcome card (separate, above the master card) -->
    <Transition name="welcome-fade">
      <div v-if="showWelcome" class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-icon-box">
            <Stars :size="20" />
          </div>
          <div class="welcome-text">
            <span class="welcome-badge">{{ t('dashboard') }}</span>
            <h3>{{ t('dash.welcomeBack') }}</h3>
            <p>{{ t('dash.snapshotReady') }}</p>
          </div>
          <button class="welcome-close" @click="dismissWelcome(true)" title="Dismiss">
            <X :size="16" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Error banner -->
    <div v-if="dashboard.error" class="error-banner">
      <AlertTriangle :size="16" />
      <span>{{ dashboard.error }}</span>
      <button class="error-retry" @click="dashboard.fetchDashboardData">
        <RefreshCw :size="14" /> {{ t('retry') }}
      </button>
    </div>

    <!-- ── ONE MASTER CARD ── -->
    <div :class="['master-card', { 'dark-mode': theme.isDark }]">

      <!-- Card Header -->
      <div class="master-header">
        <div class="master-header-left">
          <div class="master-header-icon">
            <LayoutDashboard :size="18" />
          </div>
          <div>
            <h2 class="master-title">{{ t('dash.overview') }}</h2>
            <p class="master-subtitle">{{ t('dash.performanceAtGlance') }}</p>
          </div>
        </div>
        <div class="master-header-right">
          <span class="master-badge">{{ t('dash.updated') }} {{ lastUpdated }}</span>
        </div>
      </div>

      <!-- ── Section: Tab Navigation ── -->
      <div class="master-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['master-tab-btn', { active: activeSection === tab.id }]"
          @click="activeSection = tab.id"
        >
          <component :is="tab.component" :size="15" />
          {{ tab.label }}
        </button>
      </div>

      <!-- ── Tab Content ── -->
      <div class="master-tab-content">
        <!-- Overview Tab -->
        <template v-if="activeSection === 'overview'">
          <!-- ── Section: KPI Statistics ── -->
          <div class="master-section">

            <div v-if="dashboard.loading" class="stats-grid">
              <div v-for="i in 6" :key="i" class="skeleton-card">
                <div class="skeleton-pulse" style="height: 26px; width: 26px; border-radius: 8px; margin-bottom: 0.55rem;"></div>
                <div class="skeleton-pulse" style="height: 1.2rem; width: 45%; border-radius: 6px; margin-bottom: 0.2rem;"></div>
                <div class="skeleton-pulse" style="height: 0.65rem; width: 55%; border-radius: 4px;"></div>
              </div>
            </div>
            <div v-else class="stats-grid">
              <KpiCard
                :label="t('dash.totalStudents')"
                :value="dashboard.kpi.total_students"
                icon="users"
                iconClass="icon-blue"
                :subtitle="t('dash.activeEnrollments')"
                compact
              />
              <KpiCard
                :label="t('dash.totalTeachers')"
                :value="dashboard.kpi.total_teachers"
                icon="mortarboard"
                iconClass="icon-blue"
                :subtitle="t('dash.teachingStaff')"
                compact
              />
              <KpiCard
                :label="t('dash.totalSubjects')"
                :value="dashboard.kpi.total_subjects"
                icon="book"
                iconClass="icon-blue"
                :subtitle="t('dash.activeCurriculum')"
                compact
              />

              <KpiCard
                :label="t('dash.averageScore')"
                :value="dashboard.kpi.average_score"
                icon="award"
                iconClass="icon-blue"
                :subtitle="t('dash.allClassesCombined')"
                :decimals="1"
                compact
              />
              <KpiCard
                :label="t('dash.scoreCompletion')"
                :value="dashboard.kpi.score_completion_rate"
                icon="bar-chart"
                iconClass="icon-blue"
                :subtitle="t('dash.gradingProgress')"
                valueSuffix="%"
                :decimals="1"
                compact
              />
              <KpiCard
                :label="t('dash.passRate')"
                :value="passRate"
                icon="graduation-cap"
                iconClass="icon-blue"
                :subtitle="t('dash.passOfStudents', { count: passingCount, total: dashboard.kpi.total_students })"
                valueSuffix="%"
                :decimals="1"
                compact
              />
            </div>
          </div>

          <!-- ── Section: Charts (70/30 layout) ── -->
          <div class="master-section">

            <div class="charts-row">
              <div class="inner-card">
                <div class="inner-card-head">
                  <div>
                    <h3 class="inner-card-title">{{ t('dash.averageScoreTrend') }}</h3>
                    <p class="inner-card-desc">{{ t('dash.monthlyAverage') }}</p>
                  </div>
                  <button
                    v-if="!dashboard.loading"
                    class="chart-export-btn"
                    title="Export as PNG"
                    @click="avgScoreChartRef?.exportPng()"
                  >
                    <Download :size="14" />
                  </button>
                </div>
                <EChart
                  ref="avgScoreChartRef"
                  :option="avgScoreTrendOption"
                  :loading="dashboard.loading"
                  height="260px"
                  :showExport="false"
                />
              </div>
              <div class="inner-card">
                <div class="inner-card-head">
                  <div>
                    <h3 class="inner-card-title">{{ t('dash.gradeDistribution') }}</h3>
                    <p class="inner-card-desc">{{ t('dash.allStudentsCurrent') }}</p>
                  </div>
                  <button
                    v-if="!dashboard.loading"
                    class="chart-export-btn"
                    title="Export as PNG"
                    @click="chartRefs.gradeDist?.exportPng()"
                  >
                    <Download :size="14" />
                  </button>
                </div>
                <EChart
                  :ref="(el: any) => { if (el) chartRefs.gradeDist = el }"
                  :option="gradeDistDonutOption"
                  :loading="dashboard.loading"
                  height="210px"
                  :showExport="false"
                />
                <div class="grade-legend">
                  <div
                    v-for="g in gradeDistItems"
                    :key="g.grade"
                    class="grade-legend-item"
                  >
                    <span class="grade-dot" :style="{ backgroundColor: g.color }"></span>
                    <span class="grade-label-text">{{ g.label }}</span>
                    <span class="grade-percent">{{ g.percent }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Section: Student Insights ── -->
          <div class="master-section">

            <div class="insights-grid">
              <!-- Top Students -->
              <div class="insight-card">
                <div class="insight-card-head">                    <h3 class="insight-card-title">{{ t('dash.topStudents') }}</h3>
                  <p class="insight-card-desc">{{ t('dash.highestPerforming') }}</p>
                </div>
                <div class="top-students-list">
                  <div v-for="(student, i) in topStudentsData" :key="student.student_id" class="top-student-row">
                    <span class="top-student-rank">
                      <Crown v-if="i === 0" :size="14" class="rank-crown" />
                      <Medal v-else-if="i === 1" :size="13" class="rank-medal" />
                      <Medal v-else-if="i === 2" :size="13" class="rank-medal-bronze" />
                      <span v-else>{{ i + 1 }}</span>
                    </span>
                    <div class="top-student-avatar" :style="{ background: avatarColors[i] }">
                      {{ student.name.charAt(0).toUpperCase() }}
                    </div>
                    <div class="top-student-info">
                      <span class="top-student-name">{{ student.name }}</span>
                      <span class="top-student-class">Class A</span>
                    </div>
                    <span class="top-student-score">{{ student.average_score.toFixed(1) }}</span>
                    <span :class="['top-student-grade', getGradeBadgeClass(student.best_grade)]">
                      {{ student.best_grade }}
                    </span>
                    <TrendingUp :size="14" class="trend-up" />
                  </div>
                  <div v-if="!topStudentsData.length" class="insight-empty">
                    <span>{{ t('dash.noStudentData') }}</span>
                  </div>
                </div>
              </div>

              <!-- Recent Activity -->
              <div class="insight-card">
                <div class="insight-card-head">                    <h3 class="insight-card-title">{{ t('dash.recentActivity') }}</h3>
                  <p class="insight-card-desc">{{ t('dash.latestActions') }}</p>
                </div>
                <div class="activity-list">
                  <div v-for="act in recentActivityItems" :key="act.id" class="activity-item">
                    <div class="activity-icon-wrap" :class="getActivityColor(act.action)">
                      <component :is="getActivityIcon(act.action)" :size="13" />
                    </div>
                    <div class="activity-content">
                      <span class="activity-text">
                        <strong>{{ act.action }}</strong> — {{ act.student_name }}
                      </span>
                      <span class="activity-time">{{ act.created_at }}</span>
                    </div>
                  </div>
                  <div v-if="!recentActivityItems.length" class="insight-empty">
                    <span>{{ t('dash.noRecentActivity') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Performance Tab -->
        <template v-if="activeSection === 'performance'">
          <section class="charts-grid mb-3">
            <div class="inner-card">
              <div class="inner-card-head">
                <div>                    <h3 class="inner-card-title">{{ t('dash.subjectAvgScores') }}</h3>
                    <p class="inner-card-desc">{{ t('dash.performanceBySubject') }}</p>
                </div>
                <button
                  v-if="!dashboard.loading"
                  class="chart-export-btn"
                  title="Export as PNG"
                  @click="chartRefs.subjectAvg?.exportPng()"
                >
                  <Download :size="14" />
                </button>
              </div>
              <EChart
                :ref="(el: any) => { if (el) chartRefs.subjectAvg = el }"
                :option="subjectAvgScoresChartOption"
                :loading="dashboard.loading"
                height="250px"
                :showExport="false"
              />
            </div>
            <div class="inner-card">
              <div class="inner-card-head">
                <div>                    <h3 class="inner-card-title">{{ t('dash.teacherWorkload') }}</h3>
                    <p class="inner-card-desc">{{ t('dash.classesPerTeacher') }}</p>
                </div>
                <button
                  v-if="!dashboard.loading"
                  class="chart-export-btn"
                  title="Export as PNG"
                  @click="chartRefs.teacherWorkload?.exportPng()"
                >
                  <Download :size="14" />
                </button>
              </div>
              <EChart
                :ref="(el: any) => { if (el) chartRefs.teacherWorkload = el }"
                :option="teacherWorkloadChartOption"
                :loading="dashboard.loading"
                height="250px"
                :showExport="false"
              />
            </div>
          </section>
          <section class="charts-grid mb-3">
            <div class="inner-card">
              <div class="inner-card-head">
                <div>                    <h3 class="inner-card-title">{{ t('dash.assessmentAverages') }}</h3>
                    <p class="inner-card-desc">{{ t('dash.marksByType') }}</p>
                </div>
                <button
                  v-if="!dashboard.loading"
                  class="chart-export-btn"
                  title="Export as PNG"
                  @click="chartRefs.assessmentType?.exportPng()"
                >
                  <Download :size="14" />
                </button>
              </div>
              <EChart
                :ref="(el: any) => { if (el) chartRefs.assessmentType = el }"
                :option="assessmentTypeAvgChartOption"
                :loading="dashboard.loading"
                height="230px"
                :showExport="false"
              />
            </div>
            <div class="inner-card">
              <div class="inner-card-head">
                <div>                    <h3 class="inner-card-title">{{ t('dash.avgScoreByTerm') }}</h3>
                    <p class="inner-card-desc">{{ t('dash.trendAcrossTerms') }}</p>
                </div>
                <button
                  v-if="!dashboard.loading"
                  class="chart-export-btn"
                  title="Export as PNG"
                  @click="chartRefs.avgByTerm?.exportPng()"
                >
                  <Download :size="14" />
                </button>
              </div>
              <EChart
                :ref="(el: any) => { if (el) chartRefs.avgByTerm = el }"
                :option="avgScoreByTermChartOption"
                :loading="dashboard.loading"
                height="230px"
                :showExport="false"
              />
            </div>
          </section>
          <section class="charts-grid">
            <div class="inner-card">
              <div class="inner-card-head">
                <div>                    <h3 class="inner-card-title">{{ t('dash.top10Students') }}</h3>
                    <p class="inner-card-desc">{{ t('dash.highestAvgScores') }}</p>
                </div>
                <button
                  v-if="!dashboard.loading"
                  class="chart-export-btn"
                  title="Export as PNG"
                  @click="chartRefs.topStudents?.exportPng()"
                >
                  <Download :size="14" />
                </button>
              </div>
              <EChart
                :ref="(el: any) => { if (el) chartRefs.topStudents = el }"
                :option="topStudentsChartOption"
                :loading="dashboard.loading"
                height="260px"
                :showExport="false"
              />
            </div>
            <div class="inner-card">
              <div class="inner-card-head">
                <div>                    <h3 class="inner-card-title">{{ t('dash.lowestSubjects') }}</h3>
                    <p class="inner-card-desc">{{ t('dash.subjectsNeedingAttention') }}</p>
                </div>
                <button
                  v-if="!dashboard.loading"
                  class="chart-export-btn"
                  title="Export as PNG"
                  @click="chartRefs.lowestSubjects?.exportPng()"
                >
                  <Download :size="14" />
                </button>
              </div>
              <EChart
                :ref="(el: any) => { if (el) chartRefs.lowestSubjects = el }"
                :option="lowestSubjectsChartOption"
                :loading="dashboard.loading"
                height="260px"
                :showExport="false"
              />
            </div>
          </section>
        </template>

      </div>

    </div>
    <!-- ── END MASTER CARD ── -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import { useDashboardStore } from '@/stores/dashboard'
import KpiCard from '@/components/KpiCard.vue'
import EChart from '@/components/EChart.vue'
import type { EChartsOption } from 'echarts'
import type {
  TopStudent,
  LowestPerformingSubject,
  GradeDistributionItem,
} from '@/types/dashboard'
import {
  Stars,
  X,
  AlertTriangle,
  RefreshCw,
  LayoutDashboard,
  TrendingUp,  BarChart3,
  Award,
  Crown,
  Medal,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Download,
  Circle,
} from '@lucide/vue'

const { t } = useI18n()
const theme = useThemeStore()
const dashboard = useDashboardStore()

const lastUpdated = ref<string>('')
const activeSection = ref<'overview' | 'performance'>('overview')
const showWelcome = ref(localStorage.getItem('dashboard_welcome_dismissed') !== 'true')
const avgScoreChartRef = ref<InstanceType<typeof EChart> | null>(null)
const chartRefs: Record<string, InstanceType<typeof EChart>> = {}
let lastUpdatedTimer: ReturnType<typeof setInterval> | null = null
let welcomeTimer: ReturnType<typeof setTimeout> | null = null

const tabs = computed(() => [
  { id: 'overview' as const, label: t('dash.overview'), component: LayoutDashboard },
  { id: 'performance' as const, label: t('dash.performance'), component: TrendingUp },
])

function dismissWelcome(saveDismiss = false) {
  showWelcome.value = false
  if (welcomeTimer) clearTimeout(welcomeTimer)
  if (saveDismiss) {
    localStorage.setItem('dashboard_welcome_dismissed', 'true')
  }
}

/* ── Derived KPI data ── */

const passRate = computed(() => {
  const grades = dashboard.charts.grade_distribution.grades
  if (!grades.length) return 0
  const passing = grades.filter(g => ['A', 'B', 'C'].includes(g.grade))
  const total = grades.reduce((sum, g) => sum + g.count, 0)
  return total ? Number(((passing.reduce((sum, g) => sum + g.count, 0) / total) * 100).toFixed(1)) : 0
})

const passingCount = computed(() => {
  const grades = dashboard.charts.grade_distribution.grades
  if (!grades.length) return 0
  return grades.filter(g => ['A', 'B', 'C'].includes(g.grade)).reduce((sum, g) => sum + g.count, 0)
})

const gradeDistItems = computed<(GradeDistributionItem & { percent: number })[]>(() => {
  return dashboard.charts.grade_distribution.grades.map(g => ({
    ...g,
    percent: g.percent ?? Number(((g.count / (dashboard.charts.grade_distribution.total || 1)) * 100).toFixed(1)),
  }))
})

/* ── Badge helpers ── */

function getGradeBadgeClass(grade: string): string {
  const map: Record<string, string> = {
    'A': 'grade-a', 'B': 'grade-b', 'C': 'grade-c',
    'D': 'grade-d', 'F': 'grade-f', 'N/A': 'grade-na',
  }
  return map[grade] || 'grade-na'
}

/* ── Chart: Average Score Trend ── */

const avgScoreTrendOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.average_score_by_term
  const terms = data?.terms || []
  const scores = data?.scores || []
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#0f172a', fontSize: 12 },
      formatter: (params: unknown) => {
        const p = (params as { axisValue: string; value: number }[])[0]
        return `<strong>${p.axisValue}</strong><br/>Avg score: <strong>${p.value.toFixed(1)}</strong>`
      },
    },
    grid: { left: 20, right: 20, top: 20, bottom: 25 },
    xAxis: {
      type: 'category',
      data: terms,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11, fontWeight: 500 },
    },
    yAxis: {
      type: 'value',
      min: 60,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6', width: 1 } },
      axisLabel: { color: '#9ca3af', fontSize: 11 },
    },
    series: [{
      data: scores,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#3b82f6', width: 2.5 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59,130,246,0.15)' },
            { offset: 1, color: 'rgba(59,130,246,0)' },
          ],
        },
      },
    }],
  }
})

/* ── Chart: Grade Distribution ── */

const gradeDistDonutOption = computed<EChartsOption>(() => {
  const items = gradeDistItems.value
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#0f172a', fontSize: 12 },
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number }
        return `<strong>${p.name}</strong><br/>${p.value} students (${p.percent}%)`
      },
    },
    series: [{
      type: 'pie',
      radius: ['55%', '75%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#ffffff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 13, fontWeight: 700 },
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.15)' },
      },
      data: items.map(g => ({
        value: g.count,
        name: g.label,
        itemStyle: { color: g.color },
      })),
    }],
  }
})

/* ── Student Insights data ── */

const avatarColors = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#f43f5e', '#0ea5e9', '#f59e0b', '#14b8a6']

const topStudentsData = computed<TopStudent[]>(() => {
  return (dashboard.charts.top_students as TopStudent[]).slice(0, 5)
})

const recentActivityItems = computed(() => {
  return (dashboard.charts.recent_academic_activities || []).slice(0, 5)
})

const activityIconMap: Record<string, Component> = {
  'Create': Plus,
  'Update': Pencil,
  'Delete': Trash2,
  'Login': LogIn,
  'Logout': LogOut,
  'Export': Download,
}

function getActivityIcon(action: string): Component {
  return activityIconMap[action] || Circle
}

function getActivityColor(action: string): string {
  const map: Record<string, string> = {
    'Create': 'act-icon-create',
    'Update': 'act-icon-update',
    'Delete': 'act-icon-delete',
    'Login': 'act-icon-login',
    'Logout': 'act-icon-logout',
    'Export': 'act-icon-export',
  }
  return map[action] || 'act-icon-default'
}

/* ── Charts: Performance tab ── */

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
      barWidth: '35%',
      label: { show: true, position: 'right', fontSize: 10, formatter: '{c}' },
    }],
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
      { name: 'Classes', data: data.class_counts, type: 'bar', itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }, barWidth: '22%' },
      { name: 'Offerings', data: data.offering_counts, type: 'bar', itemStyle: { color: '#0ea5e9', borderRadius: [4, 4, 0, 0] }, barWidth: '22%' },
    ],
  }
})

const assessmentTypeAvgChartOption = computed<EChartsOption>(() => {
  const data = dashboard.charts.assessment_type_averages
  const typeColors: Record<string, string> = {
    quiz: '#3b82f6', assignment: '#10b981', midterm: '#f59e0b', final: '#ef4444',
  }
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Average Mark', 'Average Max'], bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 15, right: 15, top: 20, bottom: 55 },
    xAxis: { type: 'category', data: data.map(d => d.label), axisLine: { lineStyle: { color: '#cbd5e1' } } },
    yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } } },
    series: [
      {
        name: 'Average Mark', data: data.map(d => d.average_mark), type: 'bar', barWidth: '35%',
        itemStyle: { color: (params: { dataIndex: number }) => typeColors[data[params.dataIndex]?.type || ''] || '#64748b', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Average Max', data: data.map(d => d.average_max), type: 'bar', barWidth: '35%',
        itemStyle: { color: (params: { dataIndex: number }) => (typeColors[data[params.dataIndex]?.type || ''] || '#64748b') + '40', borderRadius: [4, 4, 0, 0] },
      },
    ],
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
      itemStyle: { color: '#f97316' },
    }],
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
      barWidth: '35%',
      label: { show: true, position: 'right', fontSize: 10, formatter: '{c}' },
    }],
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
      barWidth: '35%',
      label: { show: true, position: 'right', fontSize: 10, formatter: '{c}' },
    }],
  }
})

/* ── Lifecycle ── */

onMounted(() => {
  dashboard.initialize()
  updateLastUpdated()
  lastUpdatedTimer = setInterval(updateLastUpdated, 30000)
  // Auto-dismiss welcome card after 3 seconds
  if (showWelcome.value) {
    welcomeTimer = setTimeout(() => {
      dismissWelcome()
    }, 3000)
  }
})

onUnmounted(() => {
  if (lastUpdatedTimer) {
    clearInterval(lastUpdatedTimer)
    lastUpdatedTimer = null
  }
  if (welcomeTimer) {
    clearTimeout(welcomeTimer)
    welcomeTimer = null
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

/* ── Welcome card ── */
.welcome-card {
  background: #ffffff;
  border: 1px solid #eef2f6;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.04);
}

.welcome-content { display: flex; align-items: center; gap: 1rem; }
.welcome-icon-box {
  width: 40px; height: 40px; border-radius: 10px;
  background: #eff6ff;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.welcome-icon-box :deep(svg) { color: #3b82f6; }
.welcome-text { flex: 1; min-width: 0; }
.welcome-badge {
  display: inline-flex; font-size: 0.62rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.04em; color: #3b82f6;
  background: #eff6ff; padding: 0.1rem 0.45rem;
  border-radius: 5px; margin-bottom: 0.25rem;
}
.welcome-text h3 { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 1px; line-height: 1.3; }
.welcome-text p { font-size: 0.78rem; color: #64748b; margin: 0; line-height: 1.4; }
.welcome-close {
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid #e5e7eb;
  background: transparent; color: #9ca3af;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.welcome-close:hover { background: #f8fafc; color: #475569; }

/* ── Welcome card fade-out transition ── */
.welcome-fade-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease, margin-bottom 0.6s ease;
}
.welcome-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.96);
  margin-bottom: 0;
}

/* ── Error banner ── */
.error-banner {
  display: flex; align-items: center; gap: 0.6rem;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1px solid #fecaca; border-radius: 14px;
  padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.82rem; color: #991b1b;
}
.error-banner :deep(svg) { color: #ef4444; }
.error-retry {
  margin-left: auto; display: inline-flex; align-items: center; gap: 0.3rem;
  background: #ef4444; color: #fff; border: none; border-radius: 8px;
  padding: 0.35rem 0.65rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: background 0.2s;
}
.error-retry:hover { background: #dc2626; }

/* ════════════════════════════════════════
   MASTER CARD — contains everything
   ════════════════════════════════════════ */
.master-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.04);
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 80px);
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
  transition: all 0.25s ease;
}

.master-card::-webkit-scrollbar {
  width: 6px;
}

.master-card::-webkit-scrollbar-track {
  background: transparent;
}

.master-card::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.master-card::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark-mode .master-card {
  scrollbar-color: #4b5563 transparent;
}

.dark-mode .master-card::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark-mode .master-card::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.dashboard-page {
  max-height: 100vh;
  overflow: hidden;
}

.master-card.dark-mode {
  background: rgba(15, 23, 42, 0.98);
  border-color: rgba(71, 85, 105, 0.4);
}

/* ── Card Header ── */
.master-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 0.75rem;
  gap: 1rem;
}

.master-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.master-header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
}

.master-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

.master-subtitle {
  font-size: 0.7rem;
  color: #9ca3af;
  margin: 2px 0 0;
  line-height: 1.2;
}

.master-header-right {
  flex-shrink: 0;
}

.master-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
  white-space: nowrap;
}

.master-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: live-pulse 2s ease-in-out infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.dark-mode .master-header-icon {
  background: rgba(59, 130, 246, 0.12);
  color: #60a5fa;
}

.dark-mode .master-title { color: #f1f5f9; }
.dark-mode .master-subtitle { color: #6b7280; }
.dark-mode .master-badge {
  background: rgba(51, 65, 85, 0.5);
  border-color: #475569;
  color: #94a3b8;
}

.dark-mode .master-badge::before {
  background: #4ade80;
}

/* ── Internal Sections ── */
.master-section {
  padding: 0.75rem 1.5rem 1.25rem;
  animation: section-fade-in 0.4s ease both;
}

.master-section:nth-child(2) { animation-delay: 0.05s; }
.master-section:nth-child(3) { animation-delay: 0.1s; }
.master-section:nth-child(4) { animation-delay: 0.15s; }

@keyframes section-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.master-section + .master-section {
  border-top: 1px solid #f0f1f3;
  margin-top: 0.5rem;
  padding-top: 1rem;
}

.dark-mode .master-section + .master-section {
  border-top-color: #334155;
}

.master-section-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
  padding-left: 0.75rem;
}

.master-section-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 2px;
  background: currentColor;
  opacity: 0.3;
}

.master-section-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.master-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.dark-mode .master-section-title { color: #94a3b8; }

/* ── KPI Grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.skeleton-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  min-height: 68px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.dark-mode .skeleton-card {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.4);
}

/* ── Charts row (70/30) ── */
.charts-row {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 1rem;
}

/* ── Inner Cards (inside master card) ── */
.inner-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #f0f1f3;
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  animation: card-pop-in 0.35s ease both;
}

.inner-card:nth-child(1) { animation-delay: 0.05s; }
.inner-card:nth-child(2) { animation-delay: 0.1s; }

@keyframes card-pop-in {
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.inner-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  border-color: #dbeafe;
  transform: translateY(-1px);
}

.dark-mode .inner-card {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(71, 85, 105, 0.25);
}

.inner-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.chart-export-btn {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #eef1f4;
  background: #ffffff;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-export-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.dark-mode .chart-export-btn {
  border-color: rgba(71, 85, 105, 0.35);
  background: rgba(30, 41, 59, 0.5);
  color: #6b7280;
}

.dark-mode .chart-export-btn:hover {
  border-color: #60a5fa;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
}

.inner-card-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.inner-card-desc {
  font-size: 0.7rem;
  color: #9ca3af;
  margin: 0.1rem 0 0;
  line-height: 1.3;
}

.dark-mode .inner-card-title { color: #f1f5f9; }
.dark-mode .inner-card-desc { color: #6b7280; }

/* ── Insights Grid ── */
.insights-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.insight-card {
  background: #ffffff;
  border: 1px solid #eef2f6;
  border-radius: 14px;
  padding: 1rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  animation: card-pop-in 0.35s ease both;
}

.insight-card:nth-child(1) { animation-delay: 0.05s; }
.insight-card:nth-child(2) { animation-delay: 0.1s; }
.insight-card:nth-child(3) { animation-delay: 0.15s; }

.insight-card:hover {
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.dark-mode .insight-card {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(71, 85, 105, 0.3);
}

.insight-card-head {
  margin-bottom: 0.65rem;
}

.insight-card-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.insight-card-desc {
  font-size: 0.68rem;
  color: #9ca3af;
  margin: 0.1rem 0 0;
  line-height: 1.3;
}

.dark-mode .insight-card-title { color: #f1f5f9; }
.dark-mode .insight-card-desc { color: #6b7280; }

/* ── Top Students List ── */
.top-students-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.top-student-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.5rem;
  border-radius: 10px;
  transition: background 0.15s;
}

.top-student-row:hover {
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.dark-mode .top-student-row:hover {
  background: rgba(51, 65, 85, 0.3);
}

.top-student-rank {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #9ca3af;
  flex-shrink: 0;
}

.rank-crown { color: #f59e0b; }
.rank-medal { color: #94a3b8; }
.rank-medal-bronze { color: #d97706; }

.top-student-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
}

.top-student-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.top-student-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-student-class {
  font-size: 0.62rem;
  color: #9ca3af;
  line-height: 1.2;
}

.dark-mode .top-student-name { color: #f1f5f9; }
.dark-mode .top-student-class { color: #6b7280; }

.top-student-score {
  font-size: 0.8rem;
  font-weight: 800;
  color: #0f172a;
  flex-shrink: 0;
}

.dark-mode .top-student-score { color: #f1f5f9; }

.top-student-grade {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 5px;
  flex-shrink: 0;
}

.trend-up {
  color: #22c55e;
  flex-shrink: 0;
  animation: trend-bounce 2s ease-in-out infinite;
}

@keyframes trend-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.dark-mode .trend-up { color: #4ade80; }

/* ── Activity List ── */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.4rem 0.65rem;
  border-radius: 10px;
  transition: all 0.2s;
  position: relative;
}

.activity-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  border-radius: 2px;
  background: #e5e7eb;
  transition: height 0.2s;
}

.activity-item:hover {
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  padding-left: 0.85rem;
}

.activity-item:hover::before {
  height: 24px;
}

.dark-mode .activity-item:hover {
  background: rgba(51, 65, 85, 0.3);
}

.dark-mode .activity-item::before { background: #4b5563; }

.activity-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.act-icon-create { background: #f0fdf4; color: #16a34a; }
.act-icon-update { background: #eff6ff; color: #2563eb; }
.act-icon-delete { background: #fef2f2; color: #dc2626; }
.act-icon-login { background: #f0f9ff; color: #0891b2; }
.act-icon-logout { background: #f8fafc; color: #64748b; }
.act-icon-export { background: #f5f3ff; color: #7c3aed; }
.act-icon-default { background: #f8fafc; color: #9ca3af; }

.dark-mode .act-icon-create { background: rgba(34,197,94,0.1); color: #4ade80; }
.dark-mode .act-icon-update { background: rgba(59,130,246,0.1); color: #60a5fa; }
.dark-mode .act-icon-delete { background: rgba(239,68,68,0.1); color: #f87171; }
.dark-mode .act-icon-login { background: rgba(6,182,212,0.1); color: #22d3ee; }
.dark-mode .act-icon-logout { background: rgba(100,116,139,0.1); color: #94a3b8; }
.dark-mode .act-icon-export { background: rgba(124,58,237,0.1); color: #a78bfa; }
.dark-mode .act-icon-default { background: rgba(148,163,184,0.1); color: #6b7280; }

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  display: block;
  font-size: 0.72rem;
  color: #374151;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time {
  display: block;
  font-size: 0.62rem;
  color: #9ca3af;
  margin-top: 2px;
  line-height: 1.2;
}

.dark-mode .activity-text { color: #d1d5db; }
.dark-mode .activity-time { color: #6b7280; }

.insight-empty {
  padding: 1.5rem 0;
  text-align: center;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* ── Grade Legend ── */
.grade-legend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.3rem 0.65rem;
  margin-top: 0.65rem;
  padding-top: 0.65rem;
  border-top: 1px solid #eef2f6;
}

.grade-legend-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; }
.grade-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.8);
}

.dark-mode .grade-dot {
  box-shadow: 0 0 0 2px rgba(30, 41, 59, 0.8);
}
.grade-label-text { color: #4b5563; font-weight: 500; flex: 1; }
.grade-percent { color: #0f172a; font-weight: 700; font-size: 0.78rem; }

.dark-mode .grade-label-text { color: #d1d5db; }
.dark-mode .grade-percent { color: #f1f5f9; }
.dark-mode .grade-legend { border-top-color: #334155; }

/* ── Tab Navigation ── */
.master-tabs {
  display: flex;
  gap: 0;
  border-top: 1px solid #f3f4f6;
  background: #fafbfc;
  padding: 0 1.5rem;
}

.dark-mode .master-tabs {
  border-top-color: #334155;
  background: rgba(30, 41, 59, 0.3);
}

.master-tab-btn {
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.7rem 1.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: -1px;
}

.master-tab-btn:hover {
  color: #4b5563;
}

.master-tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.dark-mode .master-tab-btn { color: #6b7280; }
.dark-mode .master-tab-btn:hover { color: #d1d5db; }
.dark-mode .master-tab-btn.active { color: #60a5fa; border-bottom-color: #60a5fa; }

/* ── Tab Content ── */
.master-tab-content {
  padding: 1.25rem 1.5rem 1.5rem;
}

/* ── Charts grid ── */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

/* ── Badges ── */
.grade-badge, .action-badge, .status-badge {
  font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px; white-space: nowrap;
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

/* ── Skeleton ── */
.skeleton-pulse {
  background: linear-gradient(90deg, #eef0f3 25%, #f5f7fa 50%, #eef0f3 75%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  border-radius: 6px;
}
.dark-mode .skeleton-pulse {
  background: linear-gradient(90deg, #2d3a4d 25%, #3b4b5f 50%, #2d3a4d 75%);
  background-size: 200% 100%;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Icon variants ── */
.icon-blue { background: #eff6ff; color: #3b82f6; }
.dark-mode .icon-blue { background: rgba(59,130,246,0.12); color: #60a5fa; }

/* ── Responsive ── */
@media (max-width: 1199.98px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .insights-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 991.98px) {
  .charts-grid { grid-template-columns: 1fr; }
  .insights-grid { grid-template-columns: 1fr; }
  .master-header { flex-direction: column; align-items: flex-start; }
}

@media (max-width: 767.98px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .master-tabs { overflow-x: auto; gap: 0; }
  .master-tab-btn { white-space: nowrap; padding: 0.6rem 1rem; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
  .grade-legend { grid-template-columns: 1fr; }
  .welcome-content { flex-wrap: wrap; }
}
</style>


