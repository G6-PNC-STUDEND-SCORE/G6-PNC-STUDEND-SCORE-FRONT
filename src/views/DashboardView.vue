<template>
  <div class="page-content">
      <h1 class="page-title">{{ t('dashboard') }}</h1>
      <p class="page-subtitle">{{ t('overview') }}</p>

      <section class="row g-2 g-xl-3 mb-3">
        <div v-for="card in primaryStatsCards" :key="card.label" class="col-12 col-sm-6 col-lg-3">
          <article :class="['stat-card', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="stat-icon" :class="card.iconClass">
                  <i :class="card.icon"></i>
                </div>
                <div class="stat-trend" :class="card.trendClass">
                  <i :class="card.trendIcon"></i>
                  <span>{{ card.trend }}</span>
                </div>
              </div>
              <div class="mt-auto">
                <div class="stat-value">{{ card.value }}</div>
                <div class="stat-label">{{ card.label }}</div>
                <div class="stat-subtitle">{{ card.subtitle }}</div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="row g-2 g-xl-3 mb-3">
        <div class="col-12 col-xl-6">
          <article :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
            <div class="card-body py-3 px-3">
              <div class="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                <div>
                  <h2 class="panel-title mb-0">{{ t('studentPerformance') }}</h2>
                  <p class="panel-subtitle mb-0">{{ t('averagePassing') }}</p>
                </div>
                <div class="dropdown">
                  <button
                    class="btn btn-outline-primary btn-sm dropdown-toggle rounded-pill px-3"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {{ selectedYear }}
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                    <li v-for="year in trendYears" :key="year">
                      <button
                        class="dropdown-item"
                        :class="{ active: selectedYear === year }"
                        type="button"
                        @click="selectYear(year)"
                      >
                        {{ year }}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="line-chart">
                <svg viewBox="0 0 820 150" preserveAspectRatio="none" role="img" aria-label="Student performance trend chart">
                  <g class="grid-lines">
                    <line v-for="line in chartGridLines" :key="line" x1="50" :y1="line" x2="800" :y2="line" />
                  </g>

                  <g class="y-axis-labels">
                    <text v-for="label in yAxisLabels" :key="label.value" x="32" :y="label.y">{{ label.value }}</text>
                  </g>

                  <path :d="avgAreaPath" class="series-area avg-area"></path>
                  <path :d="passAreaPath" class="series-area pass-area"></path>

                  <path :d="avgLinePath" class="series-line avg-line"></path>
                  <path :d="passLinePath" class="series-line pass-line"></path>

                  <g>
                    <circle
                      v-for="point in avgPoints"
                      :key="`avg-${point.x}`"
                      :cx="point.x"
                      :cy="point.y"
                      r="3"
                      class="series-point avg-point"
                    />
                    <circle
                      v-for="point in passPoints"
                      :key="`pass-${point.x}`"
                      :cx="point.x"
                      :cy="point.y"
                      r="3"
                      class="series-point pass-point"
                    />
                  </g>

                  <g class="x-axis-labels">
                    <text v-for="(label, index) in months" :key="label" :x="xLabelPositions[index]" y="142">
                      {{ label }}
                    </text>
                  </g>
                </svg>
              </div>

              <div class="chart-legend d-flex justify-content-center gap-3 mt-1">
                <div class="legend-item">
                  <span class="legend-dot avg-dot"></span>
                  <span>{{ t('averageScoreClass') }}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot pass-dot"></span>
                  <span>{{ t('passRate') }}</span>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div class="col-12 col-xl-6">
            <article :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
              <div class="card-body d-flex flex-column py-3 px-3">
                <div class="mb-2">
                  <h2 class="panel-title mb-0">{{ t('passVsFail') }}</h2>
                  <p class="panel-subtitle mb-0">{{ t('currentSemester') }}</p>
                </div>

                <div class="donut-wrap flex-grow-1 d-flex align-items-center justify-content-center">
                  <div class="donut" :style="donutStyle">
                    <div class="donut-inner">
                      <div class="donut-value">{{ passRateLabel }}</div>
                      <small class="text-secondary" style="font-size: 0.65rem;">{{ t('passRate') }}</small>
                    </div>
                  </div>
                </div>

                <div class="d-flex justify-content-between align-items-center mt-1">
                  <div class="d-grid gap-1">
                    <div class="legend-item">
                      <span class="legend-dot pass-dot"></span>
                      <span>{{ t('pass') }}</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-dot fail-dot"></span>
                      <span>{{ t('fail') }}</span>
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="fw-semibold" style="font-size: 0.85rem;">624</div>
                    <div class="fw-semibold" style="font-size: 0.85rem;">36</div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="row g-2 g-xl-3 mb-3">
          <div class="col-12 col-xl-6">
            <article :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
              <div class="card-body py-3 px-3">
                <h2 class="panel-title mb-0">{{ t('gradeDistribution') }}</h2>
                <p class="panel-subtitle mb-3">{{ t('allStudents') }}</p>

                <div class="grade-bars">
                  <div v-for="grade in gradeDistribution" :key="grade.label" class="grade-row">
                    <div class="grade-label">{{ grade.label }}</div>
                    <div class="grade-track">
                      <div
                        class="grade-fill"
                        :style="{ width: `${grade.percent}%`, backgroundColor: grade.color }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div class="col-12 col-xl-6">
            <article :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
              <div class="card-body py-3 px-3">
                <h2 class="panel-title mb-0">{{ t('averageScoreClass') }}</h2>
                <p class="panel-subtitle mb-3">{{ t('schoolWide') }}</p>

                <div class="class-bars">
                  <div v-for="item in classAverages" :key="item.label" class="class-bar-item">
                    <div class="class-bar-track">
                      <div class="class-bar-fill" :style="{ height: `${item.height}%` }"></div>
                    </div>
                    <div class="class-bar-label">{{ item.label }}</div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="row g-2 g-xl-3">
          <div class="col-12 col-xl-6">
            <article :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
              <div class="card-body py-3 px-3">
                <h2 class="panel-title mb-3">{{ t('recentActivity') }}</h2>

                <div class="activity-list">
                  <div v-for="item in recentActivity" :key="item.title" class="activity-item">
                    <div class="activity-icon" :class="item.iconClass">
                      <i :class="item.icon"></i>
                    </div>
                    <div class="flex-grow-1">
                      <div class="fw-semibold" style="font-size: 0.85rem;">{{ item.title }}</div>
                      <div class="text-secondary small">{{ item.subtitle }}</div>
                    </div>
                    <div class="activity-time text-secondary small">{{ item.time }}</div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div class="col-12 col-xl-6">
            <article :class="['panel', 'card', 'h-100', 'border-0', { 'dark-mode': theme.isDark }]">
              <div class="card-body py-3 px-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h2 class="panel-title mb-0">{{ t('upcomingExams') }}</h2>
                  <span class="badge rounded-pill text-primary border border-primary-subtle bg-primary-subtle fw-normal" style="font-size: 0.7rem;">
                    {{ t('thisMonth') }}
                  </span>
                </div>

                <div class="exam-list">
                  <div v-for="exam in upcomingExams" :key="exam.title" class="exam-item">
                    <div>
                      <div class="fw-semibold" style="font-size: 0.85rem;">{{ exam.title }}</div>
                      <div class="text-secondary small">{{ exam.classLabel }}</div>
                    </div>
                    <div class="text-end">
                      <div class="small text-secondary mb-1">{{ exam.date }}</div>
                      <span class="exam-badge" :class="exam.badgeClass">{{ exam.badge }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'

const { t } = useI18n()
const theme = useThemeStore()

type StatCard = {
  label: string
  subtitle: string
  value: string
  icon: string
  iconClass: string
  trend: string
  trendIcon: string
  trendClass: string
}

type GradeItem = {
  label: string
  percent: number
  color: string
}

type ActivityItem = {
  title: string
  subtitle: string
  time: string
  icon: string
  iconClass: string
}

type ExamItem = {
  title: string
  classLabel: string
  date: string
  badge: string
  badgeClass: string
}

type Point = {
  x: number
  y: number
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
const trendYears = [2024, 2025, 2026]
const selectedYear = ref(2026)

const primaryStatsCards = computed<StatCard[]>(() => [
  {
    label: t('totalStudents'),
    subtitle: t('acrossClasses'),
    value: '660',
    icon: 'bi bi-mortarboard',
    iconClass: 'icon-blue',
    trend: '4.2%',
    trendIcon: 'bi bi-arrow-up-short',
    trendClass: 'trend-up',
  },
  {
    label: t('totalClasses'),
    subtitle: t('activeSemester'),
    value: '6',
    icon: 'bi bi-building',
    iconClass: 'icon-violet',
    trend: '0%',
    trendIcon: 'bi bi-arrow-up-short',
    trendClass: 'trend-up',
  },
  {
    label: t('totalSubjects'),
    subtitle: t('teachersAssigned'),
    value: '18',
    icon: 'bi bi-book',
    iconClass: 'icon-orange',
    trend: '2.1%',
    trendIcon: 'bi bi-arrow-up-short',
    trendClass: 'trend-up',
  },
  {
    label: t('totalTeachers'),
    subtitle: t('fullPartTime'),
    value: '12',
    icon: 'bi bi-people',
    iconClass: 'icon-green',
    trend: '8.3%',
    trendIcon: 'bi bi-arrow-up-short',
    trendClass: 'trend-up',
  },
])

const gradeDistribution: GradeItem[] = [
  { label: 'A (90-100)', percent: 63, color: '#18c08b' },
  { label: 'B (80-89)', percent: 98, color: '#2563eb' },
  { label: 'C (70-79)', percent: 78, color: '#f59e0b' },
  { label: 'D (60-69)', percent: 40, color: '#f97316' },
  { label: 'F (<60)', percent: 18, color: '#ef4444' },
]

const classAverages = [
  { label: '10A', height: 83 },
  { label: '10B', height: 78 },
  { label: '11A', height: 85 },
  { label: '11B', height: 76 },
  { label: '12A', height: 88 },
  { label: '12B', height: 72 },
]

const recentActivity = computed<ActivityItem[]>(() => [
  {
    title: t('scoresSubmitted'),
    subtitle: 'Mathematics — Class 10A',
    time: '2 min ago',
    icon: 'bi bi-clipboard2-data',
    iconClass: 'activity-blue',
  },
  {
    title: t('newStudentEnrolled'),
    subtitle: 'Emma Johnson → Class 10A',
    time: '15 min ago',
    icon: 'bi bi-mortarboard',
    iconClass: 'activity-green',
  },
  {
    title: t('reportGenerated'),
    subtitle: 'Q2 Performance Report',
    time: '1 hr ago',
    icon: 'bi bi-bar-chart',
    iconClass: 'activity-violet',
  },
  {
    title: t('classCreated'),
    subtitle: 'Class 12C — Grade 12',
    time: '3 hrs ago',
    icon: 'bi bi-building',
    iconClass: 'activity-orange',
  },
  {
    title: t('userAccountUpdated'),
    subtitle: 'Dr. Linda Foster profile',
    time: '5 hrs ago',
    icon: 'bi bi-person-gear',
    iconClass: 'activity-sky',
  },
])

const upcomingExams: ExamItem[] = [
  {
    title: 'Mathematics',
    classLabel: 'Class 10A',
    date: 'Jul 15, 2026',
    badge: 'Midterm',
    badgeClass: 'badge-warm',
  },
  {
    title: 'English Literature',
    classLabel: 'Class 11B',
    date: 'Jul 18, 2026',
    badge: 'Final',
    badgeClass: 'badge-red',
  },
  {
    title: 'Biology',
    classLabel: 'Class 12A',
    date: 'Jul 22, 2026',
    badge: 'Quiz',
    badgeClass: 'badge-blue',
  },
  {
    title: 'Physics',
    classLabel: 'Class 11A',
    date: 'Jul 25, 2026',
    badge: 'Midterm',
    badgeClass: 'badge-warm',
  },
]

const trendData: Record<number, { avgScores: number[]; passRates: number[] }> = {
  2024: {
    avgScores: [68, 70, 69, 72, 75, 77, 76, 78],
    passRates: [81, 83, 82, 85, 87, 89, 88, 90],
  },
  2025: {
    avgScores: [70, 72, 69, 75, 77, 79, 76, 80],
    passRates: [83, 85, 82, 88, 90, 92, 89, 93],
  },
  2026: {
    avgScores: [72, 74, 71, 78, 80, 82, 79, 83],
    passRates: [85, 87, 83, 90, 92, 94, 91, 95],
  },
}

function buildLinePoints(values: number[]): Point[] {
  const left = 50
  const right = 800
  const top = 16
  const bottom = 120
  const min = 60
  const max = 100
  const width = right - left
  const height = bottom - top
  const step = values.length > 1 ? width / (values.length - 1) : 0

  return values.map((value, index) => {
    const x = left + index * step
    const normalized = (value - min) / (max - min)
    const y = bottom - normalized * height
    return { x, y }
  })
}

function buildPath(points: Point[]) {
  if (points.length === 0) return ''
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
}

function buildAreaPath(points: Point[]) {
  if (points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return ''
  return `${buildPath(points)} L ${last.x.toFixed(1)} 120 L ${first.x.toFixed(1)} 120 Z`
}

const currentTrendSeries = computed(() => trendData[selectedYear.value] ?? trendData[2026])

const avgPoints = computed(() => buildLinePoints(currentTrendSeries.value?.avgScores ?? []))
const passPoints = computed(() => buildLinePoints(currentTrendSeries.value?.passRates ?? []))

const avgLinePath = computed(() => buildPath(avgPoints.value))
const passLinePath = computed(() => buildPath(passPoints.value))
const avgAreaPath = computed(() => buildAreaPath(avgPoints.value))
const passAreaPath = computed(() => buildAreaPath(passPoints.value))

const chartGridLines = [16, 36, 56, 76, 96, 116]
const yAxisLabels = [
  { value: '100', y: 20 },
  { value: '90', y: 40 },
  { value: '80', y: 60 },
  { value: '70', y: 80 },
  { value: '60', y: 100 },
]
const xLabelPositions = [50, 157, 264, 371, 479, 586, 693, 800]

const passRate = 94.6
const donutStyle = computed(() => ({
  background: `conic-gradient(#18c08b 0 ${passRate}%, #ef4444 ${passRate}% 100%)`,
}))

const passRateLabel = `${passRate.toFixed(1)}%`

function selectYear(year: number) {
  selectedYear.value = year
}
</script>

<style scoped>
.page-content { flex: 1; padding: 20px; }
.page-title { font-size: 1.3rem; font-weight: 700; color: #0f172a; margin-top: 0.75rem; margin-bottom: 0.15rem; }
.page-subtitle { color: #64748b; font-size: 0.82rem; margin-bottom: 1rem; }

.dark-mode .page-title {
  color: #f1f5f9;
}

.dark-mode .page-subtitle {
  color: #94a3b8;
}

.stat-card {
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e9ecef;
  min-height: 90px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.stat-card.dark-mode {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.stat-icon {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.icon-blue {
  background: rgba(37, 99, 235, 0.09);
  color: #2563eb;
}

.icon-violet {
  background: rgba(124, 58, 237, 0.09);
  color: #7c3aed;
}

.icon-orange {
  background: rgba(249, 115, 22, 0.11);
  color: #f97316;
}

.icon-green {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.icon-sky {
  background: rgba(14, 165, 233, 0.1);
  color: #0ea5e9;
}

.icon-mint {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.icon-rose {
  background: rgba(244, 63, 94, 0.1);
  color: #f43f5e;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.trend-up {
  color: #10b981;
}

.trend-down {
  color: #ef4444;
}

.stat-value {
  font-size: clamp(1.1rem, 1.3vw, 1.25rem);
  font-weight: 700;
  color: #0f172a;
  line-height: 1.05;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  margin-top: 0.1rem;
}

.stat-subtitle,
.panel-subtitle {
  color: #64748b;
  font-size: 0.7rem;
}

.dark-mode .stat-value {
  color: #f1f5f9;
}

.dark-mode .stat-label {
  color: #e2e8f0;
}

.dark-mode .stat-subtitle,
.dark-mode .panel-subtitle {
  color: #cbd5e1;
}

.panel-title {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 700;
}

.dark-mode .panel-title {
  color: #f1f5f9;
}

.panel {
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.panel {
  background: #ffffff;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.panel.dark-mode {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.line-chart {
  width: 100%;
  overflow: hidden;
}

.line-chart svg {
  width: 100%;
  height: 155px;
  display: block;
}

.grid-lines line {
  stroke: #e5edf7;
  stroke-width: 1;
  stroke-dasharray: 2 4;
  transition: stroke 0.3s ease;
}

:deep(.layout-page.dark-mode) .grid-lines line {
  stroke: #334155;
}

.y-axis-labels text,
.x-axis-labels text {
  fill: #94a3b8;
  font-size: 9px;
  transition: fill 0.3s ease;
}

:deep(.layout-page.dark-mode) .y-axis-labels text,
:deep(.layout-page.dark-mode) .x-axis-labels text {
  fill: #64748b;
}

.series-area {
  fill-opacity: 0.18;
}

.avg-area {
  fill: rgba(37, 99, 235, 0.13);
}

.pass-area {
  fill: rgba(16, 185, 129, 0.1);
}

.series-line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.avg-line {
  stroke: #2563eb;
}

.pass-line {
  stroke: #10b981;
}

.series-point {
  stroke-width: 1.5;
}

.avg-point {
  fill: #dbeafe;
  stroke: #2563eb;
}

.pass-point {
  fill: #d1fae5;
  stroke: #10b981;
}

.chart-legend {
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #334155;
  font-weight: 500;
  font-size: 0.75rem;
}

.dark-mode .legend-item {
  color: #e2e8f0;
}

.legend-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.avg-dot {
  background: #2563eb;
}

.pass-dot {
  background: #10b981;
}

.fail-dot {
  background: #ef4444;
}

.donut-wrap {
  min-height: 130px;
}

.donut {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  padding: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}

.donut-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

:deep(.layout-page.dark-mode) .donut-inner {
  background: #1e293b;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.donut-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  transition: color 0.3s ease;
}

:deep(.layout-page.dark-mode) .donut-value {
  color: #f1f5f9;
}

.grade-bars {
  display: grid;
  gap: 0.5rem;
}

.grade-row {
  display: grid;
  grid-template-columns: 68px 1fr;
  align-items: center;
  gap: 0.5rem;
}

.grade-label {
  color: #475569;
  font-size: 0.75rem;
  font-weight: 500;
}

.dark-mode .grade-label {
  color: #e2e8f0;
}

.grade-track {
  width: 100%;
  height: 1rem;
  background: #eef3f9;
  border-radius: 999px;
  overflow: hidden;
  transition: background 0.3s ease;
}

:deep(.layout-page.dark-mode) .grade-track {
  background: #334155;
}

.grade-fill {
  height: 100%;
  border-radius: inherit;
}

.class-bars {
  height: 100%;
  min-height: 130px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-items: end;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

.class-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  height: 100%;
}

.class-bar-track {
  width: 100%;
  max-width: 2.5rem;
  min-height: 80px;
  background: #eef3f9;
  border-radius: 10px 10px 4px 4px;
  position: relative;
  display: flex;
  align-items: end;
  justify-content: center;
  overflow: hidden;
  transition: background 0.3s ease;
}

:deep(.layout-page.dark-mode) .class-bar-track {
  background: #334155;
}

.class-bar-fill {
  width: 100%;
  border-radius: 10px 10px 4px 4px;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
}

.class-bar-label {
  color: #64748b;
  font-weight: 600;
  font-size: 0.72rem;
}

.dark-mode .class-bar-label {
  color: #e2e8f0;
}

.activity-list,
.exam-list {
  display: grid;
  gap: 0.5rem;
}

.activity-item,
.exam-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.4rem 0;
}

.activity-item {
  border-bottom: 1px solid #eef2f7;
  transition: border-color 0.3s ease;
}

:deep(.layout-page.dark-mode) .activity-item {
  border-bottom-color: #334155;
}

.dark-mode .activity-item .fw-semibold {
  color: #f1f5f9;
}

.dark-mode .activity-item .text-secondary {
  color: #94a3b8 !important;
}

.activity-item:last-child {
  border-bottom: 0;
}

.activity-icon {
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 0.65rem;
  font-size: 0.75rem;
}


.activity-item .activity-icon {
  margin-right: 0.75rem;
}

.activity-blue {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.activity-green {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.activity-violet {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}

.activity-orange {
  background: rgba(249, 115, 22, 0.11);
  color: #f97316;
}

.activity-sky {
  background: rgba(14, 165, 233, 0.1);
  color: #0ea5e9;
}

.exam-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
}

.panel.dark-mode .exam-item {
  background: #1e293b;
  border: 1px solid rgba(71, 85, 105, 0.3);
}

.panel.dark-mode .exam-item .fw-semibold {
  color: #f1f5f9;
}

.panel.dark-mode .exam-item .text-secondary {
  color: #94a3b8 !important;
}

.exam-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 600;
}

.badge-warm {
  color: #d97706;
  background: #fef3c7;
}

.badge-red {
  color: #ef4444;
  background: #fee2e2;
}

.badge-blue {
  color: #2563eb;
  background: #dbeafe;
}

@media (max-width: 991.98px) {
  .page-content {
    padding-inline: 0.75rem;
  }

  .class-bars {
    min-height: 110px;
  }
}

@media (max-width: 767.98px) {
  .page-content {
    padding-inline: 0.75rem;
  }

  .grade-row {
    grid-template-columns: 60px 1fr;
  }

  .class-bars {
    gap: 0.4rem;
    min-height: 100px;
  }

  .class-bar-track {
    min-height: 70px;
  }

  .activity-item,
  .exam-item {
    align-items: flex-start;
  }
}
</style>