<template>
  <div class="portal-page">
    <!-- Error Banner -->
    <Transition name="fade">
      <div v-if="error" class="alert-banner">
        <svg class="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>{{ error }}</span>
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner-ring">
        <div class="ring"></div>
        <div class="ring"></div>
        <div class="ring"></div>
      </div>
      <p class="loading-text">{{ t('portal.loadingTranscript') }}</p>
    </div>

    <template v-else-if="transcript">
      <div class="master-card">
        <!-- Card Header -->
        <div class="master-header">
          <div class="master-header-left">
            <div class="header-avatar">{{ initials }}</div>
            <div>
              <h1 class="master-title">{{ transcript.student.name || t('portal.unknownStudent') }}</h1>
              <p class="master-subtitle">{{ t('portal.academicTranscript') }}</p>
            </div>
          </div>
          <div class="master-header-right">
            <span v-if="transcript.student.studentId" class="meta-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2.5"/><circle cx="8.5" cy="10.5" r="2"/><path d="M5.5 16c0.8-1.7 2.2-2.5 3-2.5s2.2 0.8 3 2.5"/><line x1="14" y1="9" x2="19" y2="9"/><line x1="14" y1="12.5" x2="19" y2="12.5"/></svg>
              {{ transcript.student.studentId }}
            </span>
            <span v-if="transcript.student.generation" class="meta-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              {{ transcript.student.generation }}
            </span>
            <button class="btn-download" :disabled="downloading" @click="onDownload">
              <span v-if="downloading" class="btn-spinner"></span>
              <Download v-else :size="15" />
              {{ downloading ? t('portal.preparing') : t('portal.downloadTranscript') }}
            </button>
          </div>
        </div>

        <!-- Overall Stats -->
        <div v-if="transcript.terms.length" class="master-section">
          <div class="stat-strip">
            <div class="stat-tile">
              <div class="stat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
              </div>
              <div>
                <div class="stat-value">{{ overallAverage.toFixed(2) }}</div>
                <div class="stat-label">{{ t('portal.overallAverage') }}</div>
              </div>
            </div>
            <div class="stat-tile">
              <div class="stat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
              <div>
                <div class="stat-value">{{ transcript.terms.length }}</div>
                <div class="stat-label">{{ t('portal.termsCompleted') }}</div>
              </div>
            </div>
            <div class="stat-tile">
              <div class="stat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div>
                <div class="stat-value">{{ totalSubjects }}</div>
                <div class="stat-label">{{ t('portal.subjectRecords') }}</div>
              </div>
            </div>
            <div class="stat-tile">
              <div class="stat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5L17 22l-5-3-5 3 1.5-8.5"/></svg>
              </div>
              <div>
                <div class="stat-value">{{ bestTerm?.average.toFixed(2) ?? '—' }}</div>
                <div class="stat-label">{{ bestTerm ? `${t('portal.best')} — ${bestTerm.term}` : t('portal.bestTerm') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Term Timeline -->
        <div
          v-for="(termBlock, idx) in transcript.terms"
          :key="termBlock.term"
          class="master-section"
          :style="{ '--delay': `${idx * 0.07}s` }"
        >
          <div class="section-header">
            <div class="section-title-group">
              <span class="term-index">{{ idx + 1 }}</span>
              <div>
                <h3 class="section-title">{{ termBlock.term }}</h3>
                <span class="section-count">
                  {{ termBlock.subjects.length }} subject{{ termBlock.subjects.length !== 1 ? 's' : '' }}
                </span>
              </div>
            </div>
            <span class="term-avg" :class="avgClass(termBlock.average)">
              <span class="term-avg-label">{{ t('portal.average') }}</span>
              <span class="term-avg-value">{{ termBlock.average.toFixed(2) }}</span>
            </span>
          </div>

          <div class="table-wrap">
            <table class="scores-table">
              <thead>
                <tr>
                  <th class="col-subject">{{ t('portal.subject') }}</th>
                  <th class="col-num">{{ t('portal.quiz') }}</th>
                  <th class="col-num">{{ t('portal.assignment') }}</th>
                  <th class="col-num">{{ t('portal.midterm') }}</th>
                  <th class="col-num">{{ t('portal.final') }}</th>
                  <th class="col-num">{{ t('portal.total') }}</th>
                  <th class="col-center">{{ t('portal.grade') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in termBlock.subjects" :key="s.subject ?? ''" class="subject-row">
                  <td><span class="subject-name">{{ s.subject || '—' }}</span></td>
                  <td class="col-num">{{ fmt(s.quiz) }}</td>
                  <td class="col-num">{{ fmt(s.assignment) }}</td>
                  <td class="col-num">{{ fmt(s.midterm) }}</td>
                  <td class="col-num">{{ fmt(s.final) }}</td>
                  <td class="col-num">
                    <span class="score-value" :class="scoreClass(s.total)">{{ fmt(s.total) }}</span>
                  </td>
                  <td class="col-center">
                    <span class="grade-badge" :class="gradeClass(s.grade)">{{ s.grade || '—' }}</span>
                  </td>
                </tr>
                <tr v-if="termBlock.subjects.length === 0">
                  <td colspan="7" class="empty-row">{{ t('portal.noSubjectsRecorded') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="transcript.terms.length === 0" class="master-section">
          <div class="empty-container">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h3"/></svg>
            <h4>{{ t('portal.noTranscriptYet') }}</h4>
            <p>{{ t('portal.noTranscriptDesc') }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download } from '@lucide/vue'
import { getTranscript, downloadTranscript, type TranscriptData } from '@/services/studentPortalService'
import { getUserInitials } from '@/utils'

const { t } = useI18n()
const transcript = ref<TranscriptData | null>(null)
const loading = ref(true)
const downloading = ref(false)
const error = ref('')

const initials = computed(() => getUserInitials(transcript.value?.student?.name))

const totalSubjects = computed(() =>
  (transcript.value?.terms ?? []).reduce((sum, t) => sum + t.subjects.length, 0),
)

const overallAverage = computed(() => {
  const terms = transcript.value?.terms ?? []
  if (!terms.length) return 0
  return terms.reduce((sum, t) => sum + t.average, 0) / terms.length
})

const bestTerm = computed(() => {
  const terms = transcript.value?.terms ?? []
  let best: (typeof terms)[number] | null = null
  for (const t of terms) {
    if (!best || t.average > best.average) best = t
  }
  return best
})

function fmt(v: number | null): string {
  return v === null || v === undefined ? '—' : v.toFixed(1)
}

function scoreClass(score: number | null): string {
  if (score === null || score === undefined) return 'score-none'
  if (score >= 90) return 'score-excellent'
  if (score >= 75) return 'score-good'
  if (score >= 60) return 'score-average'
  return 'score-low'
}

function avgClass(avg: number): string {
  if (avg >= 75) return 'avg-high'
  if (avg >= 60) return 'avg-mid'
  return 'avg-low'
}

function gradeClass(grade: string | null): string {
  const g = (grade ?? '').toUpperCase()
  if (['A+', 'A', 'A-'].includes(g)) return 'grade-a'
  if (['B+', 'B', 'B-'].includes(g)) return 'grade-b'
  if (['C+', 'C', 'C-'].includes(g)) return 'grade-c'
  if (['D+', 'D'].includes(g)) return 'grade-d'
  if (g === 'F') return 'grade-f'
  return 'grade-none'
}

async function onDownload() {
  downloading.value = true
  error.value = ''
  try {
    await downloadTranscript()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to download transcript.'
  } finally {
    downloading.value = false
  }
}

onMounted(async () => {
  try {
    transcript.value = await getTranscript()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load your transcript.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ── Container ── */
.portal-page {
  font-family: 'Inter', 'Noto Sans Khmer', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 8px 0;
}

/* ── Fade ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Alert ── */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%);
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 0.9375rem;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(220, 38, 38, 0.08);
}
.alert-icon { flex-shrink: 0; }

/* ── Loading ── */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  gap: 24px;
}
.spinner-ring { position: relative; width: 56px; height: 56px; }
.spinner-ring .ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3.5px solid transparent;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}
.spinner-ring .ring:nth-child(1) { border-top-color: #6366f1; animation-delay: 0s; }
.spinner-ring .ring:nth-child(2) { border-right-color: #8b5cf6; animation-delay: 0.15s; }
.spinner-ring .ring:nth-child(3) { border-bottom-color: #a78bfa; animation-delay: 0.3s; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { color: #64748b; font-size: 1rem; font-weight: 500; }

/* ── Master Card ── */
/* One card wraps the whole page — same shell as the admin/teacher dashboard. */
.master-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.04);
}

/* ── Card Header ── */
.master-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f1f3;
}
.master-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.master-header-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
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

.header-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06));
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  padding: 5px 11px;
  border-radius: 100px;
  white-space: nowrap;
}
.meta-chip svg { opacity: 0.7; flex-shrink: 0; }

.btn-download {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}
.btn-download:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}
.btn-download:active:not(:disabled) { transform: translateY(0); }
.btn-download:disabled { opacity: 0.65; cursor: not-allowed; }
.btn-spinner {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

/* ── Internal Sections ── */
.master-section {
  padding: 16px 24px 24px;
  animation: sectionIn 0.4s ease both;
  animation-delay: var(--delay);
}
.master-section + .master-section {
  border-top: 1px solid #f0f1f3;
  padding-top: 20px;
}
@keyframes sectionIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Stat Strip ── */
.stat-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.stat-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.stat-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}
/* One consistent blue, matching the admin/teacher dashboard's KPI icons. */
.stat-icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06));
  color: #3b82f6;
}
.stat-value {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.stat-label { font-size: 0.72rem; font-weight: 600; color: #94a3b8; margin-top: 2px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.section-title-group { display: flex; align-items: center; gap: 12px; }
.term-index {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 800;
  color: #fff;
  background: #3b82f6;
  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.28);
}
.section-title { font-size: 1.02rem; font-weight: 700; color: #0f172a; margin: 0; }
.section-count { font-size: 0.75rem; font-weight: 500; color: #94a3b8; }

.term-avg {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 100px;
  border: 1px solid transparent;
}
.term-avg-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
}
.term-avg-value { font-size: 0.9375rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.term-avg.avg-high { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }
.term-avg.avg-mid { background: #fffbeb; border-color: #fde68a; color: #d97706; }
.term-avg.avg-low { background: #fef2f2; border-color: #fecaca; color: #dc2626; }

/* ── Table ── */
.table-wrap { width: 100%; overflow-x: auto; }
.scores-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.scores-table thead th {
  padding: 12px 16px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  border-bottom: 1.5px solid #f1f5f9;
  white-space: nowrap;
}
.scores-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
  color: #475569;
  font-variant-numeric: tabular-nums;
}
.subject-row { transition: background 0.15s ease; }
.subject-row:hover { background: #f8fafc; }
.subject-row:last-child td { border-bottom: none; }
.subject-name { font-weight: 600; color: #0f172a; }

.col-num, th.col-num { text-align: right; }
.col-center, th.col-center { text-align: center; }
.col-subject { text-align: left; }

.score-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9375rem;
  min-width: 48px;
  padding: 3px 9px;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
}
.score-value.score-excellent { background: #f0fdf4; color: #16a34a; }
.score-value.score-good { background: #eff6ff; color: #2563eb; }
.score-value.score-average { background: #fffbeb; color: #d97706; }
.score-value.score-low { background: #fef2f2; color: #dc2626; }
.score-value.score-none { background: #f1f5f9; color: #94a3b8; }

.grade-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 0.25rem 0.85rem;
  border-radius: 100px;
  min-width: 44px;
  letter-spacing: 0.02em;
}
.grade-a { color: #16a34a; background: #f0fdf4; }
.grade-b { color: #2563eb; background: #eff6ff; }
.grade-c { color: #d97706; background: #fffbeb; }
.grade-d { color: #ea580c; background: #fff7ed; }
.grade-f { color: #dc2626; background: #fef2f2; }
.grade-none { color: #94a3b8; background: #f1f5f9; }

.empty-row {
  text-align: center;
  color: #94a3b8;
  font-weight: 500;
  padding: 32px 16px !important;
}

/* ── Empty State ── */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  padding: 48px 24px;
}
.empty-container h4 { margin: 12px 0 0; font-size: 1rem; font-weight: 700; color: #334155; }
.empty-container p { margin: 0; font-size: 0.875rem; color: #94a3b8; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .portal-page { gap: 14px; padding: 8px 0; }
  .master-header { flex-direction: column; align-items: flex-start; padding: 16px; }
  .master-header-right { width: 100%; }
  .btn-download { justify-content: center; width: 100%; }
  .master-section { padding: 14px 16px 20px; }
  .stat-strip { grid-template-columns: 1fr 1fr; gap: 12px; }
  .stat-tile { padding: 14px; gap: 10px; }
  .stat-icon { width: 36px; height: 36px; border-radius: 12px; }
  .stat-value { font-size: 1.1rem; }
  .scores-table { font-size: 0.8125rem; }
  .scores-table thead th, .scores-table tbody td { padding: 10px 12px; }
}
</style>
