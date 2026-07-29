<template>
  <Modal :model-value="modelValue" max-width="min(1100px, calc(100vw - 32px))" @update:model-value="$emit('update:modelValue', $event)">
    <div class="rc-modal" :class="{ 'dark-mode': isDark }">
      <div class="rc-toolbar">
        <div class="rc-toolbar-title">
          <FileText :size="16" />
          <span>Student Report Card</span>
        </div>
        <div class="rc-toolbar-actions">
          <button v-if="canExport" class="rc-btn" :disabled="!card" @click="onExportPdf">
            <Download :size="14" /> PDF
          </button>
          <button class="rc-btn" :disabled="!card" @click="onPrint">
            <Printer :size="14" /> Print
          </button>
          <button class="rc-btn rc-btn-icon" @click="$emit('update:modelValue', false)">
            <X :size="16" />
          </button>
        </div>
      </div>

      <Transition name="rc-fade" mode="out-in">
        <div v-if="loading" key="loading" class="rc-state-wrapper">
          <LoadingState message="Building report card..." />
        </div>

        <div v-else-if="error" key="error" class="rc-state-wrapper">
          <div class="rc-error">{{ error }}</div>
        </div>

        <div v-else-if="card" key="content" id="report-card-printable" class="rc-body">
        <div class="rc-identity">
          <div class="rc-avatar">{{ getUserInitials(card.student.name) }}</div>
          <div class="rc-identity-main">
            <h3>{{ card.student.name }}</h3>
            <div class="rc-identity-meta">
              <span v-if="card.student.student_number">{{ card.student.student_number }}</span>
              <span v-if="card.student.class_name">{{ card.student.class_name }}</span>
              <span v-if="card.student.generation">{{ card.student.generation }}</span>
              <span v-if="card.scope.terms.length">{{ card.scope.terms.join(', ') }}</span>
            </div>
          </div>
          <div class="rc-verdict" :class="card.summary.result === 'pass' ? 'is-pass' : 'is-fail'">
            <span class="rc-verdict-grade">{{ card.summary.grade }}</span>
            <span class="rc-verdict-label">{{ card.summary.result === 'pass' ? 'PASSED' : 'FAILED' }}</span>
          </div>
        </div>

        <div class="rc-stats">
          <div class="rc-stat">
            <span class="rc-stat-label">Total Score</span>
            <span class="rc-stat-value">{{ card.summary.total_score.toFixed(2) }}</span>
            <span class="rc-stat-sub">of {{ card.summary.max_possible }}</span>
          </div>
          <div class="rc-stat">
            <span class="rc-stat-label">Average</span>
            <span class="rc-stat-value">{{ card.summary.average.toFixed(2) }}</span>
            <span class="rc-stat-sub">across {{ card.summary.graded_count }} subjects</span>
          </div>
          <div class="rc-stat">
            <span class="rc-stat-label">Rank in Class</span>
            <span class="rc-stat-value">{{ card.summary.rank ?? '—' }}</span>
            <span class="rc-stat-sub">of {{ card.summary.class_size }} students</span>
          </div>
        </div>

        <div class="rc-table-wrap">
          <div class="rc-table-scroll">
            <table class="rc-table">
              <thead>
                <tr>
                  <th class="rc-col-index">#</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th v-for="name in assessmentNames" :key="name" class="rc-num">
                    {{ name }}
                    <small v-if="weightFor(name) !== null">{{ weightFor(name) }}%</small>
                  </th>
                  <th class="rc-num">Total</th>
                  <th class="rc-num">Grade</th>
                  <th class="rc-num">Result</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(subject, index) in card.subjects" :key="`${subject.subject_id}-${subject.term_id}`">
                  <td class="rc-col-index">{{ index + 1 }}</td>
                  <td class="rc-subject">
                    <span class="rc-subject-name">{{ subject.subject_name }}</span>
                  </td>
                  <td class="rc-muted">{{ subject.teacher ?? '—' }}</td>
                  <td v-for="name in assessmentNames" :key="name" class="rc-num">
                    {{ markFor(subject, name) }}
                  </td>
                  <td class="rc-num rc-total">{{ subject.total?.toFixed(2) ?? '—' }}</td>
                  <td class="rc-num">
                    <span class="rc-grade" :style="gradeStyle(subject.grade)">{{ subject.grade ?? '—' }}</span>
                  </td>
                  <td class="rc-num">
                    <span class="rc-result" :class="subject.result === 'pass' ? 'is-pass' : 'is-fail'">
                      {{ subject.result ? subject.result.toUpperCase() : '—' }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td :colspan="3 + assessmentNames.length" class="rc-foot-label">Overall</td>
                  <td class="rc-num rc-total">{{ card.summary.average.toFixed(2) }}</td>
                  <td class="rc-num">
                    <span class="rc-grade" :style="gradeStyle(card.summary.grade)">{{ card.summary.grade }}</span>
                  </td>
                  <td class="rc-num">
                    <span class="rc-result" :class="card.summary.result === 'pass' ? 'is-pass' : 'is-fail'">
                      {{ card.summary.result.toUpperCase() }}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p class="rc-note">
          Pass mark is {{ card.scope.pass_mark }}. A student passes when the average clears the pass mark
          and no single subject is failed<span v-if="card.summary.failed_subjects > 0">
            — {{ card.summary.failed_subjects }} subject(s) below the pass mark</span>.
        </p>
      </div>
      </Transition>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Download, FileText, Printer, X } from '@lucide/vue'
import Modal from '@/components/Modal.vue'
import LoadingState from '@/components/LoadingState.vue'
import { reportService } from '@/services/reportService'
import { cacheService } from '@/services/cacheService'
import { exportReportCardToPdf } from '@/utils/reportExport'
import { extractErrorMessage, getUserInitials } from '@/utils'
import { GRADE_COLORS } from '@/constants'
import { useThemeStore } from '@/stores/theme'
import { usePermission } from '@/composables/usePermission'
import type { ReportCardSubject, ReportFilters, StudentReportCard } from '@/types'

const props = defineProps<{
  modelValue: boolean
  studentId: number | null
  filters: ReportFilters
}>()

defineEmits<{ 'update:modelValue': [value: boolean] }>()

const theme = useThemeStore()
const { hasPermission } = usePermission()

const isDark = computed(() => theme.isDark)
const canExport = computed(() => hasPermission('export-reports'))

const card = ref<StudentReportCard | null>(null)
const loading = ref(false)
const error = ref('')

const assessmentNames = computed(() => {
  if (!card.value) return []
  return Array.from(new Set(card.value.subjects.flatMap((s) => s.assessments.map((a) => a.name))))
})

function weightFor(name: string): number | null {
  const found = card.value?.subjects.flatMap((s) => s.assessments).find((a) => a.name === name)
  return found ? found.weight_percent : null
}

function markFor(subject: ReportCardSubject, name: string): string {
  const found = subject.assessments.find((a) => a.name === name)
  return found?.average != null ? found.average.toFixed(1) : '—'
}

function gradeStyle(grade: string | null) {
  const color = grade ? GRADE_COLORS[grade] : undefined
  return color ? { color, background: `${color}1a` } : {}
}

function getMessage(): string {
  if (!card.value) return ''
  const { student, summary } = card.value
  const firstName = (student.name ?? 'Student').split(' ')[0]
  if (summary.result === 'pass') {
    return summary.rank === 1
      ? `Outstanding work, ${firstName}! You're ranked #1 in your class this term.`
      : `Great job, ${firstName}! Keep up the strong performance.`
  }
  return `${firstName}, this term didn't go as planned — talk to your teacher about a plan to catch up next term.`
}

const CACHE_TTL = 5 * 60_000

function cacheKey() {
  return `report_card_${props.studentId}_${JSON.stringify(props.filters)}`
}

async function load() {
  if (!props.studentId) return
  const cached = cacheService.get<StudentReportCard>(cacheKey())
  if (cached) {
    error.value = ''
    card.value = cached
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data = await reportService.getStudentReportCard(props.studentId, props.filters)
    cacheService.set(cacheKey(), data, CACHE_TTL)
    card.value = data
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

function onExportPdf() {
  if (card.value) exportReportCardToPdf(card.value)
}

function onPrint() {
  window.print()
}

watch(
  () => [props.modelValue, props.studentId],
  ([open]) => {
    if (open) load()
    else { card.value = null }
  },
  { immediate: true },
)
</script>

<style scoped>
.rc-modal {
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

/* ─── Toolbar ─────────────────────────────── */
.rc-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eef2f7;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  flex-shrink: 0;
}
.rc-toolbar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}
.rc-toolbar-actions { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }

/* ─── Buttons ──────────────────────────── */
.rc-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  border-radius: 9px;
  padding: 0.45rem 0.8rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.rc-btn:hover:not(:disabled) { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
.rc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.rc-btn-icon { padding: 0.45rem; }

/* ─── State wrapper (loading/error) ──────── */
.rc-state-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* ─── Error ─────────────────────────────── */
.rc-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 0.8125rem;
}

/* ─── Body (scrollable area below toolbar) ───── */
.rc-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

/* ─── Student Identity ──────────────────── */
.rc-identity {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1.1rem;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  transition: box-shadow 0.15s;
}
.rc-identity:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.rc-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}
.rc-identity-main {
  flex: 1;
  min-width: 0;
}
.rc-identity-main h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rc-identity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  font-size: 0.68rem;
  color: #64748b;
}
.rc-identity-meta span {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  white-space: nowrap;
  background: #f8fafc;
  color: #64748b;
}

/* ─── Verdict ───────────────────────────── */
.rc-verdict {
  text-align: center;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  flex-shrink: 0;
  min-width: 60px;
}
.rc-verdict.is-pass {
  background: #ecfdf5;
  border: 1px solid #d1fae5;
}
.rc-verdict.is-fail {
  background: #fef2f2;
  border: 1px solid #fecaca;
}
.rc-verdict-grade { display: block; font-size: 1.15rem; font-weight: 800; line-height: 1; }
.rc-verdict.is-pass .rc-verdict-grade { color: #10b981; }
.rc-verdict.is-fail .rc-verdict-grade { color: #ef4444; }
.rc-verdict-label { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.06em; color: #94a3b8; margin-top: 0.1rem; }

/* ─── Stats Cards ──────────────────────────── */
.rc-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
.rc-stat {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.45rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  transition: box-shadow 0.15s;
}
.rc-stat:hover {
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.rc-stat-label {
  font-size: 0.55rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #94a3b8;
}
.rc-stat-value {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
}
.rc-stat-sub {
  font-size: 0.58rem;
  color: #94a3b8;
}

/* ─── Table ────────────────────────────────── */
.rc-table-wrap {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}
.rc-table-scroll {
  overflow-x: auto;
  overflow-y: visible;
}

/* Modern thin scrollbar */
.rc-table-scroll::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.rc-table-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.rc-table-scroll::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}
.rc-table-scroll::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.rc-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.8125rem;
}

/* ─── Sticky header ───────────────────── */
.rc-table thead {
  position: sticky;
  top: 0;
  z-index: 3;
}
.rc-table thead th {
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
  position: relative;
}
.rc-table thead th small {
  display: block;
  font-size: 0.6rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: none;
  margin-top: 0.05rem;
}

/* ─── Sticky first column ─────────────── */
.rc-table thead th.rc-col-index,
.rc-table tbody td.rc-col-index {
  position: sticky;
  left: 0;
  z-index: 2;
}
.rc-table thead th.rc-col-index {
  z-index: 4;
}
.rc-table thead th.rc-col-index::after,
.rc-table tbody td.rc-col-index::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #e5e7eb;
  pointer-events: none;
}

/* ─── Cells ───────────────────────────── */
.rc-table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f3f5;
  color: #475569;
  background: #fff;
}
.rc-table tbody tr:hover td {
  background: rgba(59, 130, 246, 0.03);
}
.rc-table tbody tr:last-child td {
  border-bottom: none;
}

/* ─── Footer ──────────────────────────── */
.rc-table tfoot td {
  padding: 11px 12px;
  background: #f8fafc;
  font-weight: 700;
  color: #0f172a;
  border-top: 2px solid #e5e7eb;
  position: relative;
}
.rc-foot-label {
  text-align: right;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  color: #64748b;
}

/* ─── Column styles ───────────────────── */
.rc-col-index {
  width: 44px;
  min-width: 44px;
  max-width: 44px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 500;
}
.rc-num {
  text-align: right;
  white-space: nowrap;
  min-width: 60px;
}
.rc-subject {
  font-weight: 600;
  color: #0f172a;
  min-width: 140px;
}
.rc-subject-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
.rc-muted {
  color: #94a3b8;
  font-size: 0.78rem;
  min-width: 80px;
}
.rc-total {
  font-weight: 700;
  color: #0f172a;
}

.rc-grade {
  display: inline-block;
  min-width: 36px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
  text-align: center;
}
.rc-result {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.rc-result.is-pass { color: #10b981; }
.rc-result.is-fail { color: #ef4444; }

/* ─── Note ────────────────────────────── */
.rc-note {
  font-size: 0.74rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.6;
}

/* ─── Body → Content transition ─────────── */
.rc-fade-enter-active,
.rc-fade-leave-active {
  transition: all 0.2s ease;
}
.rc-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.rc-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.rc-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ─── Dark Mode ──────────────────────────── */
.dark-mode.rc-modal { background: #1e293b; }
.dark-mode .rc-toolbar { background: #1e293b; border-bottom-color: #334155; }
.dark-mode .rc-toolbar-title { color: #f1f5f9; }
.dark-mode .rc-btn { background: rgba(51, 65, 85, 0.6); border-color: #475569; color: #cbd5e1; }
.dark-mode .rc-identity {
  background: #1e293b;
  border-color: #334155;
}
.dark-mode .rc-identity:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.dark-mode .rc-identity-main h3 { color: #f1f5f9; }
.dark-mode .rc-identity-meta span {
  background: rgba(51, 65, 85, 0.6);
  color: #94a3b8;
}
.dark-mode .rc-verdict.is-pass { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.15); }
.dark-mode .rc-verdict.is-fail { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.15); }
.dark-mode .rc-stat {
  background: rgba(30, 41, 59, 0.9);
  border-color: #475569;
}
.dark-mode .rc-stat:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  border-color: #64748b;
}
.dark-mode .rc-stat-value { color: #f1f5f9; }
.dark-mode .rc-table-wrap { border-color: #475569; }
.dark-mode .rc-table thead th {
  background: #0f172a;
  color: #cbd5e1;
  border-bottom-color: #334155;
}
.dark-mode .rc-table thead th.rc-col-index::after,
.dark-mode .rc-table tbody td.rc-col-index::after {
  background: #334155;
}
.dark-mode .rc-table tbody td {
  background: #1e293b;
  color: #e2e8f0;
  border-bottom-color: #334155;
}
.dark-mode .rc-table tbody tr:hover td {
  background: rgba(59, 130, 246, 0.06);
}
.dark-mode .rc-table tfoot td {
  background: #0f172a;
  color: #f1f5f9;
  border-top-color: #334155;
}
.dark-mode .rc-subject,
.dark-mode .rc-total { color: #f8fafc; }
.dark-mode .rc-table-scroll::-webkit-scrollbar-thumb {
  background: #475569;
}
.dark-mode .rc-table-scroll::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* ─── Responsive ──────────────────────────── */
@media (max-width: 991.98px) {
  .rc-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 767.98px) {
  .rc-toolbar { flex-wrap: wrap; gap: 0.5rem; }
  .rc-toolbar-actions { width: 100%; justify-content: flex-end; }
  .rc-stats { grid-template-columns: repeat(2, 1fr); gap: 0.65rem; }
  .rc-identity { flex-wrap: wrap; gap: 0.85rem; }
  .rc-identity-meta span { background: none; padding: 0; border: none; }
  .rc-identity-meta span::before { display: none; }
  .rc-body { padding: 1rem; gap: 1rem; }
  .rc-stat-value { font-size: 1.15rem; }
}
@media (max-width: 480px) {
  .rc-stats { grid-template-columns: 1fr; }
  .rc-identity { flex-direction: column; text-align: center; }
  .rc-identity-meta { justify-content: center; }
  .rc-verdict { align-self: center; }
}

/* ─── Print ────────────────────────────── */
@media print {
  :global(#app) { display: none !important; }
  :global(body) { background: #fff !important; }
  :global(.modal-overlay) {
    position: static !important;
    padding: 0 !important;
    background: none !important;
    backdrop-filter: none !important;
    display: block !important;
  }
  :global(.modal-content-panel) {
    max-width: none !important;
    width: 100% !important;
    max-height: none !important;
    overflow: visible !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    animation: none !important;
  }
  .rc-toolbar { display: none; }
  .rc-body {
    padding: 0;
    overflow: visible;
  }
  .rc-table-scroll { overflow: visible; }
}
</style>
