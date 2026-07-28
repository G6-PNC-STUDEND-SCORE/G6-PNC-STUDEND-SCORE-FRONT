<template>
  <div class="score-card-page">
    <!-- Loading State -->
    <div v-if="loading" class="state-wrapper">
      <div class="spinner-lg">
        <div class="spinner-ring"></div>
      </div>
      <p class="state-text">Loading your score card...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="state-wrapper">
      <div class="error-card">
        <AlertTriangle :size="20" />
        <span>{{ error }}</span>
      </div>
      <button class="btn-retry" @click="loadData">
        <RefreshCw :size="14" /> Try Again
      </button>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Toolbar -->
      <div class="sc-toolbar" :class="{ 'dark-mode': isDark }">
        <div class="sc-toolbar-left">
          <FileText :size="18" class="sc-toolbar-icon" />
          <div>
            <h1 class="sc-toolbar-title">Student Score Card</h1>
            <p class="sc-toolbar-sub">Comprehensive academic performance overview</p>
          </div>
        </div>
        <div class="sc-toolbar-actions">
          <button class="sc-btn sc-btn-pdf" @click="onExportPdf" :disabled="pdfExporting" title="Download as PDF">
            <Download :size="15" />
            <span class="d-none d-sm-inline">{{ pdfExporting ? 'Exporting...' : 'PDF' }}</span>
          </button>
          <button class="sc-btn sc-btn-print" @click="onPrint" title="Print">
            <Printer :size="15" />
            <span class="d-none d-sm-inline">Print</span>
          </button>
        </div>
      </div>

      <div id="score-card-printable" class="sc-content">
        <!-- ── Profile Header ──────────────────────────────────── -->
        <div class="sc-profile" :class="{ 'dark-mode': isDark }">
          <div class="sc-profile-avatar-wrap">
            <div class="sc-profile-avatar">
              <img v-if="avatarUrl" :src="avatarUrl" class="sc-avatar-img" alt="avatar" />
              <span v-else class="sc-avatar-initials">{{ initials }}</span>
            </div>
            <div v-if="profile.academicStatus" class="sc-status-dot" :class="statusClass"></div>
          </div>

          <div class="sc-profile-info">
            <h2 class="sc-profile-name">{{ profile.name || 'Student' }}</h2>
            <div class="sc-profile-meta">
              <span v-if="profile.studentId" class="sc-meta-chip">
                <Hash :size="12" /> {{ profile.studentId }}
              </span>
              <span v-if="profile.class" class="sc-meta-chip">
                <Users :size="12" /> {{ profile.class }}
              </span>
              <span v-if="profile.generation" class="sc-meta-chip">
                <Calendar :size="12" /> {{ profile.generation }}
              </span>
              <span v-if="profile.department" class="sc-meta-chip">
                <Building2 :size="12" /> {{ profile.department }}
              </span>
            </div>
            <div class="sc-profile-detail">
              <span v-if="profile.email" class="sc-detail-item">
                <Mail :size="13" /> {{ profile.email }}
              </span>
              <span v-if="profile.currentTerm" class="sc-detail-item">
                <Clock :size="13" /> {{ profile.currentTerm }}
              </span>
            </div>
          </div>

          <div class="sc-verdict" :class="overallResult === 'pass' ? 'is-pass' : 'is-fail'">
            <div class="sc-verdict-grade">{{ overallGrade || '—' }}</div>
            <div class="sc-verdict-label">{{ overallResult === 'pass' ? 'PASSED' : 'FAILED' }}</div>
          </div>
        </div>

        <!-- ── KPI Summary ─────────────────────────────────────── -->
        <div class="sc-kpis">
          <div v-for="item in summaryItems" :key="item.label" class="sc-kpi-card" :class="{ 'dark-mode': isDark }">
            <div class="sc-kpi-icon" :class="item.iconClass">
              <component :is="item.icon" :size="18" />
            </div>
            <div class="sc-kpi-body">
              <span class="sc-kpi-value">{{ item.value }}</span>
              <span class="sc-kpi-label">{{ item.label }}</span>
              <span class="sc-kpi-sub">{{ item.subtitle }}</span>
            </div>
          </div>
        </div>

        <!-- ── Scores by Term ──────────────────────────────────── -->
        <div v-for="(termBlock, tIndex) in termScores" :key="tIndex" class="sc-term-section" :class="{ 'dark-mode': isDark }">
          <div class="sc-term-header">
            <div class="sc-term-header-left">
              <GraduationCap :size="18" class="sc-term-icon" />
              <h3 class="sc-term-title">{{ termBlock.term }}</h3>
            </div>
            <div class="sc-term-stats">
              <span class="sc-term-stat">Subjects: <strong>{{ termBlock.subjects.length }}</strong></span>
              <span class="sc-term-stat">Term Avg: <strong class="term-avg-value">{{ termAverage(termBlock).toFixed(1) }}</strong></span>
            </div>
          </div>

          <div class="sc-table-wrap">
            <div class="sc-table-scroll">
              <table class="sc-table">
                <thead>
                  <tr>
                    <th class="sc-col-index">#</th>
                    <th class="sc-col-subject">Subject</th>
                    <th class="sc-col-num">Quiz</th>
                    <th class="sc-col-num">Assignment</th>
                    <th class="sc-col-num">Midterm</th>
                    <th class="sc-col-num">Final</th>
                    <th class="sc-col-num sc-col-total">Total</th>
                    <th class="sc-col-num">Grade</th>
                    <th class="sc-col-result">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(subject, sIndex) in termBlock.subjects" :key="sIndex" class="sc-subject-row">
                    <td class="sc-col-index">{{ sIndex + 1 }}</td>
                    <td class="sc-col-subject">
                      <span class="sc-subject-name">{{ subject.subject }}</span>
                    </td>
                    <td class="sc-col-num">{{ fmtScore(subject.quiz) }}</td>
                    <td class="sc-col-num">{{ fmtScore(subject.assignment) }}</td>
                    <td class="sc-col-num">{{ fmtScore(subject.midterm) }}</td>
                    <td class="sc-col-num">{{ fmtScore(subject.final) }}</td>
                    <td class="sc-col-num sc-col-total">{{ fmtScore(subject.total) }}</td>
                    <td class="sc-col-num">
                      <span class="sc-grade-badge" :style="gradeStyle(subject.grade)">{{ subject.grade || '—' }}</span>
                    </td>
                    <td class="sc-col-result">
                      <span class="sc-result-badge" :class="resultClass(subject.total)">
                        {{ subject.total !== null ? (subject.total >= passMark ? 'PASS' : 'FAIL') : '—' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="termBlock.subjects.length > 0">
                  <tr>
                    <td colspan="2" class="sc-foot-label">Term Summary</td>
                    <td class="sc-col-num sc-foot-avg">{{ avgFor(termBlock, 'quiz') }}</td>
                    <td class="sc-col-num sc-foot-avg">{{ avgFor(termBlock, 'assignment') }}</td>
                    <td class="sc-col-num sc-foot-avg">{{ avgFor(termBlock, 'midterm') }}</td>
                    <td class="sc-col-num sc-foot-avg">{{ avgFor(termBlock, 'final') }}</td>
                    <td class="sc-col-num sc-foot-total">{{ termAverage(termBlock).toFixed(1) }}</td>
                    <td class="sc-col-num">
                      <span class="sc-grade-badge" :style="gradeStyle(termGrade(termBlock))">{{ termGrade(termBlock) }}</span>
                    </td>
                    <td class="sc-col-result">
                      <span class="sc-result-badge" :class="termResultClass(termBlock)">
                        {{ termPassFail(termBlock) }}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Term Progress Bar -->
          <div class="sc-term-progress">
            <div class="sc-progress-header">
              <span>Term Performance</span>
              <span class="sc-progress-pct">{{ termAverage(termBlock).toFixed(1) }}%</span>
            </div>
            <div class="sc-progress-track">
              <div
                class="sc-progress-fill"
                :style="{ width: Math.min(termAverage(termBlock), 100) + '%', background: termProgressColor(termBlock) }"
              ></div>
            </div>
            <div class="sc-progress-labels">
              <span>0%</span>
              <span>Pass {{ passMark }}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <!-- ── Empty State ─────────────────────────────────────── -->
        <div v-if="termScores.length === 0" class="sc-empty">
          <ClipboardList :size="40" class="sc-empty-icon" />
          <h3 class="sc-empty-title">No Scores Recorded Yet</h3>
          <p class="sc-empty-text">Your academic scores will appear here once your teachers have entered them.</p>
        </div>

        <!-- ── Overall Result Summary ──────────────────────────── -->
        <div v-if="termScores.length > 0" class="sc-overall" :class="{ 'dark-mode': isDark }">
          <div class="sc-overall-header">
            <Award :size="20" />
            <h3>Overall Academic Result</h3>
          </div>
          <div class="sc-overall-grid">
            <div class="sc-overall-stat">
              <span class="sc-overall-label">Overall Average</span>
              <span class="sc-overall-value">{{ overallAverage.toFixed(1) }}</span>
            </div>
            <div class="sc-overall-stat">
              <span class="sc-overall-label">Total Subjects</span>
              <span class="sc-overall-value">{{ totalSubjects }}</span>
            </div>
            <div class="sc-overall-stat">
              <span class="sc-overall-label">Subjects Passed</span>
              <span class="sc-overall-value sc-pass-value">{{ passedCount }}</span>
            </div>
            <div class="sc-overall-stat">
              <span class="sc-overall-label">Subjects Failed</span>
              <span class="sc-overall-value" :class="failedCount > 0 ? 'sc-fail-value' : ''">{{ failedCount }}</span>
            </div>
            <div class="sc-overall-stat sc-overall-stat-wide">
              <span class="sc-overall-label">Final Grade</span>
              <span class="sc-overall-grade" :style="gradeStyle(overallGrade)">{{ overallGrade || '—' }}</span>
            </div>
            <div class="sc-overall-stat sc-overall-stat-wide">
              <span class="sc-overall-label">Result</span>
              <span class="sc-overall-result" :class="overallResult === 'pass' ? 'is-pass' : 'is-fail'">
                {{ overallResult === 'pass' ? 'PASSED' : 'FAILED' }}
              </span>
            </div>
          </div>
          <div class="sc-overall-note">
            <Info :size="14" />
            <span>Pass mark is <strong>{{ passMark }}</strong>. A student passes when the overall average clears the pass mark.</span>
          </div>
        </div>
      </div>

      <!-- ── Footer ────────────────────────────────────────────── -->
      <div class="sc-footer" :class="{ 'dark-mode': isDark }">
        <p>Student Score Card &mdash; Generated {{ generatedDate }}</p>
        <p class="sc-footer-brand">Passerelles Numériques Cambodia &middot; Student Score Management System</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { storageUrl } from '@/services/apiHttp'
import { getPortal, getScores, type PortalData, type TermScores } from '@/services/studentPortalService'
import { getUserInitials, extractErrorMessage } from '@/utils'
import { GRADE_COLORS } from '@/constants'
import { exportScoreCardToPdf, type ScoreCardExportData } from '@/utils/scoreCardExport'
import {
  FileText, Download, Printer, Hash, Users, Calendar, Building2,
  Mail, Clock, AlertTriangle, RefreshCw, GraduationCap, Award,
  ClipboardList, Info, BookOpen, TrendingUp, Target,
} from '@lucide/vue'
import type { Component } from 'vue'

const theme = useThemeStore()
const isDark = computed(() => theme.isDark)

// ── State ─────────────────────────────────────────────────
const loading = ref(true)
const error = ref('')
const portal = ref<PortalData | null>(null)
const termScores = ref<TermScores[]>([])
const passMark = 50
const pdfExporting = ref(false)

const generatedDate = new Date().toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
})

// ── Computed: Profile ─────────────────────────────────────
const profile = computed(() => portal.value?.profile ?? { name: null, studentId: null, email: null, class: null, generation: null, department: null, currentTerm: null, academicStatus: null, avatar: null, avatarDataUrl: null })

const initials = computed(() => getUserInitials(profile.value.name))
const avatarUrl = computed(() => storageUrl(profile.value.avatar))

const statusClass = computed(() => {
  const status = (profile.value.academicStatus || '').toLowerCase()
  if (status === 'active') return 'status-active'
  if (status === 'inactive' || status === 'suspended') return 'status-inactive'
  return 'status-pending'
})

// ── Computed: KPI Summary ─────────────────────────────────
interface SummaryCard {
  label: string
  value: string | number
  subtitle: string
  icon: Component
  iconClass: string
}

const summaryItems = computed<SummaryCard[]>(() => {
  const items = portal.value?.summary ?? []
  const iconMap: Record<string, Component> = {
    'bi bi-speedometer2': TrendingUp,
    'bi bi-graph-up-arrow': TrendingUp,
    'bi bi-book-half': BookOpen,
    'bi bi-patch-check': Target,
  }
  return items.map(item => ({
    label: item.label,
    value: item.decimals > 0 ? item.value.toFixed(item.decimals) : item.value,
    subtitle: item.subtitle,
    icon: iconMap[item.icon] || TrendingUp,
    iconClass: item.iconClass,
  }))
})

// ── Computed: Grade helpers ────────────────────────────────
function computeGrade(total: number | null): string | null {
  if (total === null) return null
  const t = total
  if (t >= 90) return 'A'
  if (t >= 80) return 'B+'
  if (t >= 70) return 'B'
  if (t >= 60) return 'C'
  if (t >= 50) return 'D'
  return 'F'
}

function gradeStyle(grade: string | null) {
  const color = grade ? GRADE_COLORS[grade] : undefined
  if (!color) return {}
  return {
    color,
    background: `${color}14`,
    borderColor: `${color}30`,
  }
}

// ── Computed: Score helpers ────────────────────────────────
function fmtScore(v: number | null): string {
  return v === null || v === undefined ? '—' : v.toFixed(1)
}

function termAverage(term: TermScores): number {
  const scored = term.subjects.filter(s => s.total !== null)
  if (scored.length === 0) return 0
  return scored.reduce((sum, s) => sum + (s.total ?? 0), 0) / scored.length
}

function avgFor(term: TermScores, field: keyof typeof term.subjects[0]): string {
  const vals = term.subjects.map(s => s[field] as number | null).filter((v): v is number => v !== null)
  if (vals.length === 0) return '—'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function termGrade(term: TermScores): string {
  return computeGrade(termAverage(term)) || '—'
}

function termPassFail(term: TermScores): string {
  const avg = termAverage(term)
  return avg >= passMark ? 'PASS' : 'FAIL'
}

function termResultClass(term: TermScores): string {
  return termAverage(term) >= passMark ? 'is-pass' : 'is-fail'
}

function resultClass(total: number | null): string {
  if (total === null) return ''
  return total >= passMark ? 'is-pass' : 'is-fail'
}

function termProgressColor(term: TermScores): string {
  const avg = termAverage(term)
  if (avg >= 80) return '#10b981'
  if (avg >= passMark) return '#3b82f6'
  if (avg >= 35) return '#f59e0b'
  return '#ef4444'
}

// ── Computed: Overall ──────────────────────────────────────
const allSubjects = computed(() => termScores.value.flatMap(t => t.subjects))
const totalSubjects = computed(() => allSubjects.value.length)
const scoredSubjects = computed(() => allSubjects.value.filter(s => s.total !== null))

const overallAverage = computed(() => {
  const scored = scoredSubjects.value
  if (scored.length === 0) return 0
  return scored.reduce((sum, s) => sum + (s.total ?? 0), 0) / scored.length
})

const overallGrade = computed(() => computeGrade(overallAverage.value))

const passedCount = computed(() => scoredSubjects.value.filter(s => (s.total ?? 0) >= passMark).length)
const failedCount = computed(() => scoredSubjects.value.filter(s => (s.total ?? 0) < passMark).length)

const overallResult = computed(() => {
  if (scoredSubjects.value.length === 0) return 'pass'
  return overallAverage.value >= passMark ? 'pass' : 'fail'
})

// ── Computed: GPA for PDF export ────────────────────────────
const kpiGpa = computed(() => {
  const item = portal.value?.summary?.find(s => s.label === 'Grand')
  return item ? item.value.toFixed(item.decimals) : '—'
})

// ── Methods ────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [portalData, scoresData] = await Promise.all([
      getPortal(),
      getScores(),
    ])
    portal.value = portalData
    termScores.value = scoresData
  } catch (e: any) {
    error.value = extractErrorMessage(e) || 'Failed to load your score card.'
  } finally {
    loading.value = false
  }
}

function onPrint() {
  window.print()
}

async function onExportPdf() {
  if (!portal.value) return
  pdfExporting.value = true
  try {
    const exportData: ScoreCardExportData = {
      profile: profile.value,
      terms: termScores.value,
      overallAverage: overallAverage.value,
      overallGrade: overallGrade.value,
      totalSubjects: totalSubjects.value,
      passedCount: passedCount.value,
      failedCount: failedCount.value,
      overallResult: overallResult.value as 'pass' | 'fail',
      gpa: kpiGpa.value,
      avatarDataUrl: profile.value.avatarDataUrl || '',
    }
    await exportScoreCardToPdf(exportData)
  } catch (e) {
    console.error('PDF export failed:', e)
  } finally {
    pdfExporting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ==============================================================
   SCORE CARD PAGE
   ============================================================== */
.score-card-page {
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px 16px 32px;
}

/* ── State Wrappers ───────────────────────────────────────── */
.state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
}

.spinner-lg {
  position: relative;
  width: 48px;
  height: 48px;
}

.spinner-ring {
  width: 48px;
  height: 48px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-text {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.error-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-retry:hover {
  background: #e8f1ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

/* ── Toolbar ────────────────────────────────────────────────── */
.sc-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  transition: background 0.3s, border-color 0.3s;
}

.sc-toolbar.dark-mode {
  background: #1e293b;
  border-color: #334155;
}

.sc-toolbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sc-toolbar-icon {
  color: #2563eb;
  flex-shrink: 0;
}

.sc-toolbar-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

.sc-toolbar.dark-mode .sc-toolbar-title {
  color: #f1f5f9;
}

.sc-toolbar-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.3;
}

.sc-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sc-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  border-radius: 10px;
  padding: 0.5rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  font-family: inherit;
}

.sc-btn:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

.sc-btn:active {
  transform: scale(0.97);
}

/* ── Profile Card ──────────────────────────────────────────── */
.sc-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  margin-bottom: 16px;
  transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
  flex-wrap: wrap;
}

.sc-profile:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.sc-profile.dark-mode {
  background: #1e293b;
  border-color: #334155;
}

.sc-profile-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.sc-profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

.sc-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sc-status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2.5px solid #fff;
}

.sc-profile.dark-mode .sc-status-dot {
  border-color: #1e293b;
}

.status-active { background: #10b981; }
.status-inactive { background: #ef4444; }
.status-pending { background: #f59e0b; }

.sc-profile-info {
  flex: 1;
  min-width: 0;
}

.sc-profile-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
}

.sc-profile.dark-mode .sc-profile-name {
  color: #f1f5f9;
}

.sc-profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.3rem;
}

.sc-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 500;
  color: #475569;
  background: #f8fafc;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  white-space: nowrap;
  transition: background 0.2s;
}

.sc-profile.dark-mode .sc-meta-chip {
  background: rgba(51, 65, 85, 0.6);
  color: #94a3b8;
}

.sc-meta-chip:hover {
  background: #e8f1ff;
}

.sc-profile-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.sc-detail-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* ── Verdict Stamp ──────────────────────────────────────────── */
.sc-verdict {
  text-align: center;
  padding: 0.45rem 0.9rem;
  border-radius: 10px;
  flex-shrink: 0;
  min-width: 64px;
  transition: all 0.3s;
}

.sc-verdict.is-pass {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border: 1px solid #a7f3d0;
}

.sc-verdict.is-fail {
  background: linear-gradient(135deg, #fef2f2, #fecaca);
  border: 1px solid #fca5a5;
}

.sc-profile.dark-mode .sc-verdict.is-pass {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.25);
}

.sc-profile.dark-mode .sc-verdict.is-fail {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.25);
}

.sc-verdict-grade {
  display: block;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.1;
}

.sc-verdict.is-pass .sc-verdict-grade { color: #10b981; }
.sc-verdict.is-fail .sc-verdict-grade { color: #ef4444; }

.sc-verdict-label {
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin-top: 0.05rem;
}

/* ── KPI Grid ───────────────────────────────────────────────── */
.sc-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.sc-kpi-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 0.85rem 1rem;
  transition: all 0.25s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.sc-kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  border-color: #dbeafe;
}

.sc-kpi-card.dark-mode {
  background: #1e293b;
  border-color: #334155;
}

.sc-kpi-card.dark-mode:hover {
  border-color: #475569;
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
}

.sc-kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-blue { background: #eff6ff; color: #2563eb; }
.icon-green { background: #ecfdf5; color: #10b981; }
.icon-violet { background: #f5f3ff; color: #7c3aed; }
.icon-orange { background: #fff7ed; color: #f97316; }
.icon-sky { background: #f0f9ff; color: #0ea5e9; }

.sc-kpi-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.sc-kpi-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.1;
}

.sc-kpi-card.dark-mode .sc-kpi-value {
  color: #f1f5f9;
}

.sc-kpi-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  margin-top: 0.1rem;
}

.sc-kpi-card.dark-mode .sc-kpi-label {
  color: #94a3b8;
}

.sc-kpi-sub {
  font-size: 0.65rem;
  color: #94a3b8;
  margin-top: 0.05rem;
}

/* ── Term Sections ──────────────────────────────────────────── */
.sc-term-section {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 1.25rem 1.25rem 1rem;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: background 0.3s, border-color 0.3s;
}

.sc-term-section.dark-mode {
  background: #1e293b;
  border-color: #334155;
}

.sc-term-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.85rem;
}

.sc-term-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sc-term-icon {
  color: #2563eb;
}

.sc-term-section.dark-mode .sc-term-icon {
  color: #60a5fa;
}

.sc-term-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.sc-term-section.dark-mode .sc-term-title {
  color: #f1f5f9;
}

.sc-term-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sc-term-stat {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 500;
}

.sc-term-stat strong {
  color: #0f172a;
  font-weight: 700;
}

.sc-term-section.dark-mode .sc-term-stat {
  color: #94a3b8;
}

.sc-term-section.dark-mode .sc-term-stat strong {
  color: #f1f5f9;
}

.term-avg-value {
  color: #2563eb !important;
}

/* ── Table ──────────────────────────────────────────────────── */
.sc-table-wrap {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.85rem;
}

.sc-term-section.dark-mode .sc-table-wrap {
  border-color: #475569;
}

.sc-table-scroll {
  overflow-x: auto;
  overflow-y: visible;
}

.sc-table-scroll::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.sc-table-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sc-table-scroll::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.sc-table-scroll::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.sc-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.8125rem;
}

/* Table Header */
.sc-table thead th {
  background: #f8fafc;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  padding: 10px 12px;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.sc-term-section.dark-mode .sc-table thead th {
  background: #0f172a;
  color: #cbd5e1;
  border-bottom-color: #334155;
}

/* Table Body */
.sc-table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f3f5;
  color: #475569;
  background: #fff;
  transition: background 0.15s;
}

.sc-term-section.dark-mode .sc-table tbody td {
  background: #1e293b;
  color: #e2e8f0;
  border-bottom-color: #334155;
}

.sc-table tbody tr:hover td {
  background: rgba(59, 130, 246, 0.03);
}

.sc-term-section.dark-mode .sc-table tbody tr:hover td {
  background: rgba(59, 130, 246, 0.06);
}

.sc-table tbody tr:last-child td {
  border-bottom: none;
}

/* Table Footer */
.sc-table tfoot td {
  padding: 10px 12px;
  background: #f8fafc;
  font-weight: 700;
  color: #0f172a;
  border-top: 2px solid #e5e7eb;
  font-size: 0.78rem;
}

.sc-term-section.dark-mode .sc-table tfoot td {
  background: #0f172a;
  color: #f1f5f9;
  border-top-color: #334155;
}

.sc-foot-label {
  text-align: left;
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.05em;
  color: #64748b !important;
}

/* Column widths */
.sc-col-index {
  width: 36px;
  min-width: 36px;
  max-width: 36px;
  text-align: center;
  color: #94a3b8 !important;
  font-size: 0.75rem;
  font-weight: 500;
}

.sc-col-subject {
  min-width: 140px;
  font-weight: 600;
  color: #0f172a !important;
}

.sc-term-section.dark-mode .sc-col-subject {
  color: #f1f5f9 !important;
}

.sc-subject-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.sc-col-num {
  text-align: right;
  white-space: nowrap;
  min-width: 52px;
  font-variant-numeric: tabular-nums;
}

.sc-col-total {
  font-weight: 700;
  color: #0f172a !important;
}

.sc-col-result {
  text-align: center;
  min-width: 52px;
}

/* Grade Badge */
.sc-grade-badge {
  display: inline-block;
  min-width: 34px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
  text-align: center;
  border: 1px solid transparent;
}

/* Result Badge */
.sc-result-badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
}

.sc-result-badge.is-pass {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.sc-result-badge.is-fail {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Footer averages */
.sc-foot-avg {
  color: #64748b !important;
  font-weight: 600 !important;
}

.sc-foot-total {
  color: #2563eb !important;
  font-weight: 800 !important;
}

/* ── Term Progress ──────────────────────────────────────────── */
.sc-term-progress {
  padding: 0.5rem 0 0;
}

.sc-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 0.3rem;
}

.sc-term-section.dark-mode .sc-progress-header {
  color: #94a3b8;
}

.sc-progress-pct {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.8rem;
}

.sc-term-section.dark-mode .sc-progress-pct {
  color: #f1f5f9;
}

.sc-progress-track {
  height: 6px;
  background: #f1f5f9;
  border-radius: 100px;
  overflow: hidden;
}

.sc-term-section.dark-mode .sc-progress-track {
  background: #334155;
}

.sc-progress-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sc-progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: #94a3b8;
  margin-top: 0.2rem;
}

/* ── Empty State ────────────────────────────────────────────── */
.sc-empty {
  text-align: center;
  padding: 3rem 1.5rem;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
}

.sc-empty-icon {
  color: #94a3b8;
  margin-bottom: 0.75rem;
}

.sc-empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.35rem;
}

.sc-empty-text {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

/* ── Overall Result Summary ──────────────────────────────────── */
.sc-overall {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  margin-bottom: 16px;
  transition: background 0.3s, border-color 0.3s;
}

.sc-overall.dark-mode {
  background: #1e293b;
  border-color: #334155;
}

.sc-overall:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

.sc-overall.dark-mode:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.sc-overall-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #2563eb;
}

.sc-overall.dark-mode .sc-overall-header {
  color: #60a5fa;
}

.sc-overall-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.sc-overall.dark-mode .sc-overall-header h3 {
  color: #f1f5f9;
}

.sc-overall-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.sc-overall-stat {
  background: #f8fafc;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  transition: all 0.2s;
}

.sc-overall.dark-mode .sc-overall-stat {
  background: rgba(15, 23, 42, 0.6);
  border-color: #475569;
}

.sc-overall-stat:hover {
  border-color: #dbeafe;
  background: #eff6ff;
}

.sc-overall.dark-mode .sc-overall-stat:hover {
  border-color: #64748b;
  background: rgba(59, 130, 246, 0.06);
}

.sc-overall-stat-wide {
  grid-column: span 1;
}

.sc-overall-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #94a3b8;
}

.sc-overall-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
}

.sc-overall.dark-mode .sc-overall-value {
  color: #f1f5f9;
}

.sc-pass-value { color: #10b981 !important; }
.sc-fail-value { color: #ef4444 !important; }

.sc-overall-grade {
  display: inline-block;
  font-size: 1.3rem;
  font-weight: 800;
  padding: 0.2rem 0.7rem;
  border-radius: 8px;
  line-height: 1.2;
  align-self: flex-start;
  background: rgba(148, 163, 184, 0.1);
  color: #64748b;
}

.sc-overall-result {
  display: inline-block;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.7rem;
  border-radius: 8px;
  line-height: 1.3;
  align-self: flex-start;
}

.sc-overall-result.is-pass {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.sc-overall-result.is-fail {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.sc-overall-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #94a3b8;
  padding: 0.6rem 0.8rem;
  background: #f8fafc;
  border-radius: 8px;
}

.sc-overall.dark-mode .sc-overall-note {
  background: rgba(15, 23, 42, 0.6);
}

.sc-overall-note strong {
  color: #475569;
}

.sc-overall.dark-mode .sc-overall-note strong {
  color: #cbd5e1;
}

/* ── Footer ──────────────────────────────────────────────────── */
.sc-footer {
  text-align: center;
  padding: 1rem;
  font-size: 0.72rem;
  color: #94a3b8;
  border-top: 1px solid #e9ecef;
  margin-top: 0.5rem;
  transition: color 0.3s, border-color 0.3s;
}

.sc-footer.dark-mode {
  border-top-color: #334155;
  color: #64748b;
}

.sc-footer p {
  margin: 0;
  line-height: 1.6;
}

.sc-footer-brand {
  font-weight: 500;
}

/* ── Print Styles ────────────────────────────────────────────── */
/* Global print styles are in styles/_base.css. Only component-specific overrides here. */
@media print {
  .sc-progress-fill {
    transition: none !important;
  }
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 991.98px) {
  .sc-kpis {
    grid-template-columns: repeat(2, 1fr);
  }

  .sc-overall-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767.98px) {
  .score-card-page {
    padding: 12px;
  }

  .sc-toolbar {
    padding: 0.75rem 1rem;
  }

  .sc-toolbar-left {
    flex: 1;
  }

  .sc-toolbar-sub {
    display: none;
  }

  .sc-kpis {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .sc-kpi-card {
    padding: 0.65rem 0.8rem;
  }

  .sc-profile {
    padding: 1rem;
    gap: 0.75rem;
  }

  .sc-profile-avatar {
    width: 44px;
    height: 44px;
    font-size: 0.9rem;
  }

  .sc-overall-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .sc-overall {
    padding: 1rem;
  }

  .sc-overall-stat-wide {
    grid-column: span 1;
  }

  .sc-term-section {
    padding: 1rem;
  }

  .sc-term-stats {
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .sc-table {
    font-size: 0.75rem;
  }

  .sc-table thead th,
  .sc-table tbody td,
  .sc-table tfoot td {
    padding: 7px 8px;
  }

  .sc-col-subject {
    min-width: 100px;
  }

  .sc-subject-name {
    max-width: 100px;
  }
}

@media (max-width: 480px) {
  .sc-kpis {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .sc-overall-grid {
    grid-template-columns: 1fr 1fr;
  }

  .sc-profile-meta {
    flex-direction: column;
    gap: 0.2rem;
  }

  .sc-verdict {
    min-width: 54px;
    padding: 0.35rem 0.6rem;
  }

  .sc-verdict-grade {
    font-size: 1rem;
  }

  .sc-table thead th,
  .sc-table tbody td,
  .sc-table tfoot td {
    padding: 5px 6px;
    font-size: 0.7rem;
  }

  .sc-table thead th {
    font-size: 0.6rem;
  }

  .sc-col-num {
    min-width: 38px;
  }
}
</style>
