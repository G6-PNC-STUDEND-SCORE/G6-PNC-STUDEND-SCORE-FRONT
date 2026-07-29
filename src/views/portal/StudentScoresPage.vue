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
      <p class="loading-text">{{ t('portal.loadingScores') }}</p>
    </div>

    <template v-else>
      <div class="master-card">
        <!-- Card Header -->
        <div class="master-header">
          <div class="master-header-left">
            <div class="master-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="4" width="3" height="14" rx="1"/></svg>
            </div>
            <div>
              <h1 class="master-title">{{ t('nav.myScores') }}</h1>
              <p class="master-subtitle">
                {{ terms.length }} {{ terms.length !== 1 ? t('portal.terms') : t('portal.term') }} ·
                {{ totalSubjects }} {{ totalSubjects !== 1 ? t('portal.subjectRecords') : t('portal.subjectRecord') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Term Blocks -->
        <div
          v-for="(termBlock, idx) in terms"
          :key="termBlock.term"
          class="master-section"
          :style="{ '--delay': `${idx * 0.07}s` }"
        >
          <div class="section-header">
            <div class="section-title-group">
              <span class="term-dot"></span>
              <h3 class="section-title">{{ termBlock.term }}</h3>
              <span class="section-count">
                {{ termBlock.subjects.length }} subject{{ termBlock.subjects.length !== 1 ? 's' : '' }}
              </span>
            </div>
            <span v-if="termAverage(termBlock) !== null" class="term-avg">
              <span class="term-avg-label">{{ t('portal.average') }}</span>
              <span class="term-avg-value">{{ termAverage(termBlock)!.toFixed(2) }}</span>
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
        <div v-if="terms.length === 0" class="master-section">
          <div class="empty-container">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 9l-5 5-3-3-4 4"/></svg>
            <h4>{{ t('portal.noScoresYet') }}</h4>
            <p>{{ t('portal.noScoresDesc') }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getScores, type TermScores } from '@/services/studentPortalService'

const { t } = useI18n()
const terms = ref<TermScores[]>([])
const loading = ref(true)
const error = ref('')

const totalSubjects = computed(() =>
  terms.value.reduce((sum, t) => sum + t.subjects.length, 0),
)

function fmt(v: number | null): string {
  return v === null || v === undefined ? '—' : v.toFixed(1)
}

/** The API doesn't send a per-term average here, so derive it from graded totals. */
function termAverage(block: TermScores): number | null {
  const totals = block.subjects.map((s) => s.total).filter((t): t is number => t !== null && t !== undefined)
  if (!totals.length) return null
  return totals.reduce((a, b) => a + b, 0) / totals.length
}

function scoreClass(score: number | null): string {
  if (score === null || score === undefined) return 'score-none'
  if (score >= 90) return 'score-excellent'
  if (score >= 75) return 'score-good'
  if (score >= 60) return 'score-average'
  return 'score-low'
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

onMounted(async () => {
  try {
    terms.value = await getScores()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load your scores.'
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
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f1f3;
}
.master-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.master-header-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06));
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.section-title-group { display: flex; align-items: center; gap: 10px; }
.term-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  flex-shrink: 0;
}
.section-title { font-size: 0.9rem; font-weight: 700; color: #0f172a; margin: 0; }
.section-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  padding: 4px 10px;
  border-radius: 100px;
}

.term-avg {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 6px 14px;
  border-radius: 100px;
}
.term-avg-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #60a5fa;
}
.term-avg-value {
  font-size: 0.9375rem;
  font-weight: 800;
  color: #2563eb;
  font-variant-numeric: tabular-nums;
}

/* ── Table ── */
.table-wrap { width: 100%; overflow-x: auto; }
.scores-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
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
  .master-header { padding: 16px; }
  .master-section { padding: 14px 16px 20px; }
  .section-header { margin-bottom: 12px; }
  .scores-table { font-size: 0.8125rem; }
  .scores-table thead th, .scores-table tbody td { padding: 10px 12px; }
}
</style>
