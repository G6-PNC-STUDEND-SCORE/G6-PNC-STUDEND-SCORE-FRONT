<template>
  <Modal :model-value="modelValue" max-width="960px" @update:model-value="$emit('update:modelValue', $event)">
    <div class="rc-modal" :class="{ 'dark-mode': isDark }">
      <!-- ── Toolbar ── -->
      <div class="rc-toolbar">
        <div class="rc-toolbar-title">
          <FileText :size="16" />
          <span>Student Report Card</span>
        </div>
        <div class="rc-toolbar-actions">
          <button v-if="canExport" class="rc-btn" :disabled="!card" @click="onExportPdf">
            <Download :size="14" />
            <span>PDF</span>
          </button>
          <button class="rc-btn" :disabled="!card" @click="onPrint">
            <Printer :size="14" />
            <span>Print</span>
          </button>
          <button class="rc-btn rc-btn-ghost" @click="$emit('update:modelValue', false)" aria-label="Close">
            <X :size="18" />
          </button>
        </div>
      </div>

      <!-- ── Loading ── -->
      <LoadingState v-if="loading" message="Building report card..." />

      <!-- ── Error ── -->
      <div v-else-if="error" class="rc-error">
        <AlertTriangle :size="16" />
        <span>{{ error }}</span>
      </div>

      <!-- ── Report Card Body ── -->
      <div v-else-if="card" id="report-card-printable" class="rc-body">
        <!-- Student Identity -->
        <div class="rc-identity">
          <div class="rc-identity-accent" :class="card.summary.result === 'pass' ? 'accent-pass' : 'accent-fail'" />
          <div class="rc-avatar">{{ getUserInitials(card.student.name) }}</div>
          <div class="rc-identity-main">
            <h3 class="rc-student-name">{{ card.student.name }}</h3>
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

        <!-- Stats Grid -->
        <div class="rc-stats">
          <div class="rc-stat">
            <div class="rc-stat-value">{{ card.summary.total_score.toFixed(2) }}</div>
            <div class="rc-stat-label">Total Score</div>
            <div class="rc-stat-sub">of {{ card.summary.max_possible }}</div>
          </div>
          <div class="rc-stat">
            <div class="rc-stat-value">{{ card.summary.average.toFixed(2) }}</div>
            <div class="rc-stat-label">Average</div>
            <div class="rc-stat-sub">across {{ card.summary.graded_count }} subjects</div>
          </div>
          <div class="rc-stat">
            <div class="rc-stat-value">{{ card.summary.rank ?? '—' }}</div>
            <div class="rc-stat-label">Rank in Class</div>
            <div class="rc-stat-sub">of {{ card.summary.class_size }} students</div>
          </div>
          <div class="rc-stat">
            <div class="rc-stat-value">{{ card.summary.class_average?.toFixed(2) ?? '—' }}</div>
            <div class="rc-stat-label">Class Average</div>
            <div class="rc-stat-sub">{{ comparisonLabel }}</div>
          </div>
        </div>

        <!-- Subjects Table -->
        <div class="rc-table-wrap">
          <table class="rc-table">
            <thead>
              <tr>
                <th class="rc-col-num">#</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th v-for="name in assessmentNames" :key="name" class="rc-col-num">
                  {{ name }}
                  <small v-if="weightFor(name) !== null">{{ weightFor(name) }}%</small>
                </th>
                <th class="rc-col-num">Total</th>
                <th class="rc-col-num">Grade</th>
                <th class="rc-col-num">Result</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(subject, index) in card.subjects" :key="`${subject.subject_id}-${subject.term_id}`">
                <td class="rc-col-num rc-col-muted">{{ index + 1 }}</td>
                <td>
                  <div class="rc-subject-name">{{ subject.subject_name }}</div>
                  <div v-if="subject.class_name" class="rc-subject-class">{{ subject.class_name }}</div>
                </td>
                <td class="rc-col-muted">{{ subject.teacher || '—' }}</td>
                <td v-for="name in assessmentNames" :key="name" class="rc-col-num rc-col-muted">
                  {{ markFor(subject, name) }}
                </td>
                <td class="rc-col-num rc-col-strong">{{ subject.total?.toFixed(2) ?? '—' }}</td>
                <td class="rc-col-num">
                  <span class="rc-grade" :style="gradeStyle(subject.grade)">{{ subject.grade ?? '—' }}</span>
                </td>
                <td class="rc-col-num">
                  <span class="rc-result" :class="subject.result === 'pass' ? 'is-pass' : 'is-fail'">
                    {{ subject.result ? subject.result.toUpperCase() : '—' }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td :colspan="3 + assessmentNames.length" class="rc-col-label">Overall</td>
                <td class="rc-col-num rc-col-strong">{{ card.summary.average.toFixed(2) }}</td>
                <td class="rc-col-num">
                  <span class="rc-grade" :style="gradeStyle(card.summary.grade)">{{ card.summary.grade }}</span>
                </td>
                <td class="rc-col-num">
                  <span class="rc-result" :class="card.summary.result === 'pass' ? 'is-pass' : 'is-fail'">
                    {{ card.summary.result.toUpperCase() }}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Footer -->
        <div class="rc-footer">
          <p>
            Pass mark is <strong>{{ card.scope.pass_mark }}</strong>.
            A student passes when the average clears the pass mark
            and no single subject is failed.
          </p>
          <p v-if="card.summary.failed_subjects > 0" class="rc-footer-warn">
            {{ card.summary.failed_subjects }} subject(s) below the pass mark.
          </p>
          <p v-if="card.generated_at" class="rc-footer-date">
            Generated {{ formatDate(card.generated_at) }}
          </p>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AlertTriangle, Download, FileText, Printer, X } from '@lucide/vue'
import Modal from '@/components/Modal.vue'
import LoadingState from '@/components/LoadingState.vue'
import { reportService } from '@/services/reportService'
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

const comparisonLabel = computed(() => {
  const summary = card.value?.summary
  if (!summary?.class_average) return 'No comparison data'
  const diff = summary.average - summary.class_average
  if (Math.abs(diff) < 0.01) return 'On class average'
  return `${diff > 0 ? '+' : ''}${diff.toFixed(2)} vs class avg`
})

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

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
  return color ? { color, background: `${color}14` } : {}
}

async function load() {
  if (!props.studentId) return
  loading.value = true
  error.value = ''
  try {
    card.value = await reportService.getStudentReportCard(props.studentId, props.filters)
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
    else card.value = null
  },
  { immediate: true },
)
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   Student Report Card Modal — Clean, Minimal, Professional
   ══════════════════════════════════════════════════════════════ */

.rc-modal {
  font-family: var(--font-family);
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

/* ── Toolbar ── */

.rc-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  background: var(--color-bg-card);
  z-index: 2;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.rc-toolbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
}

.rc-toolbar-title svg {
  color: var(--color-text-muted);
}

.rc-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.rc-btn:hover:not(:disabled) {
  background: var(--color-bg-subtle);
  border-color: var(--color-border-dark);
  color: var(--color-text);
}

.rc-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.rc-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rc-btn-ghost {
  width: 32px;
  padding: 0;
  border-color: transparent;
  background: transparent;
}

.rc-btn-ghost:hover:not(:disabled) {
  background: var(--color-bg-subtle);
  border-color: var(--color-border);
  color: var(--color-text);
}

/* ── Error ── */

.rc-error {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 24px;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
}

.rc-error svg {
  flex-shrink: 0;
}

/* ── Body ── */

.rc-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  flex: 1;
}

/* ── Identity Section ── */

.rc-identity {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.rc-identity-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.rc-identity-accent.accent-pass {
  background: var(--color-success);
}

.rc-identity-accent.accent-fail {
  background: var(--color-danger);
}

.rc-avatar {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.rc-identity-main {
  flex: 1;
  min-width: 0;
}

.rc-student-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 4px;
}

.rc-identity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.rc-identity-meta > span {
  position: relative;
}

.rc-identity-meta > span + span::before {
  content: '·';
  position: absolute;
  left: -10px;
  color: var(--color-border-dark);
}

/* ── Verdict ── */

.rc-verdict {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 10px 20px;
  border-radius: 10px;
  flex-shrink: 0;
  min-width: 80px;
}

.rc-verdict.is-pass {
  background: #f0fdf4;
}

.rc-verdict.is-fail {
  background: #fef2f2;
}

.rc-verdict-grade {
  display: block;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
}

.rc-verdict.is-pass .rc-verdict-grade { color: #16a34a; }
.rc-verdict.is-fail .rc-verdict-grade { color: #dc2626; }

.rc-verdict-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

/* ── Stats Grid ── */

.rc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.rc-stat {
  padding: 16px 14px;
  background: var(--color-bg-card);
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: background 0.15s ease;
}

.rc-stat + .rc-stat {
  border-left: 1px solid var(--color-border);
}

.rc-stat:hover {
  background: var(--color-bg-subtle);
}

.rc-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.rc-stat-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.rc-stat-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ── Table ── */

.rc-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.rc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.rc-table thead th {
  background: var(--color-bg-subtle);
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.rc-table thead th small {
  display: block;
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: none;
  letter-spacing: 0;
  margin-top: 1px;
}

.rc-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
}

.rc-table tbody tr:last-child td {
  border-bottom: none;
}

.rc-table tbody tr:hover td {
  background: var(--color-bg-subtle);
}

.rc-table tfoot td {
  padding: 11px 14px;
  border-top: 2px solid var(--color-border);
  background: var(--color-bg-subtle);
  font-weight: 700;
  color: var(--color-text);
}

.rc-table tfoot .rc-col-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  text-align: right;
}

.rc-col-num {
  text-align: right;
  white-space: nowrap;
}

.rc-col-muted {
  color: var(--color-text-muted);
}

.rc-col-strong {
  font-weight: 700;
  color: var(--color-text);
}

.rc-col-label {
  text-align: right;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.rc-subject-name {
  font-weight: 600;
  color: var(--color-text);
}

.rc-subject-class {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 1px;
}

.rc-grade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 22px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
}

.rc-result {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.rc-result.is-pass {
  color: #16a34a;
}

.rc-result.is-fail {
  color: #dc2626;
}

/* ── Footer ── */

.rc-footer {
  padding: 14px 18px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.rc-footer p {
  margin: 0;
}

.rc-footer p + p {
  margin-top: 4px;
}

.rc-footer strong {
  color: var(--color-text);
}

.rc-footer-warn {
  color: var(--color-danger);
}

.rc-footer-date {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ══ Dark Mode ═══════════════════════════════════════════════ */

.dark-mode.rc-modal {
  background: var(--color-dark-bg-surface);
}

.dark-mode .rc-toolbar {
  background: var(--color-dark-bg-card);
  border-bottom-color: var(--color-dark-border);
}

.dark-mode .rc-toolbar-title {
  color: var(--color-dark-text);
}

.dark-mode .rc-btn {
  background: transparent;
  border-color: var(--color-dark-border);
  color: var(--color-dark-text-secondary);
}

.dark-mode .rc-btn:hover:not(:disabled) {
  background: var(--color-dark-bg-hover);
  border-color: var(--color-dark-text-muted);
  color: var(--color-dark-text);
}

.dark-mode .rc-btn-ghost {
  border-color: transparent;
}

.dark-mode .rc-btn-ghost:hover:not(:disabled) {
  background: var(--color-dark-bg-hover);
  border-color: var(--color-dark-border);
}

.dark-mode .rc-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.dark-mode .rc-identity {
  border-color: var(--color-dark-border);
  background: var(--color-dark-bg-card);
}

.dark-mode .rc-student-name {
  color: var(--color-dark-text);
}

.dark-mode .rc-identity-meta {
  color: var(--color-dark-text-muted);
}

.dark-mode .rc-identity-meta > span + span::before {
  color: var(--color-dark-text-muted);
}

.dark-mode .rc-verdict.is-pass {
  background: rgba(22, 163, 74, 0.1);
}

.dark-mode .rc-verdict.is-fail {
  background: rgba(220, 38, 38, 0.1);
}

.dark-mode .rc-verdict-label {
  color: var(--color-dark-text-muted);
}

.dark-mode .rc-stats {
  border-color: var(--color-dark-border);
}

.dark-mode .rc-stat {
  background: transparent;
}

.dark-mode .rc-stat + .rc-stat {
  border-left-color: var(--color-dark-border);
}

.dark-mode .rc-stat:hover {
  background: rgba(51, 65, 85, 0.3);
}

.dark-mode .rc-stat-value {
  color: var(--color-dark-text);
}

.dark-mode .rc-stat-label {
  color: var(--color-dark-text-muted);
}

.dark-mode .rc-stat-sub {
  color: var(--color-dark-text-muted);
}

.dark-mode .rc-table-wrap {
  border-color: var(--color-dark-border);
}

.dark-mode .rc-table thead th {
  background: var(--color-dark-bg);
  color: var(--color-dark-text-muted);
  border-bottom-color: var(--color-dark-border);
}

.dark-mode .rc-table tbody td {
  color: var(--color-dark-text-secondary);
  border-bottom-color: rgba(51, 65, 85, 0.4);
}

.dark-mode .rc-table tbody tr:hover td {
  background: rgba(51, 65, 85, 0.3);
}

.dark-mode .rc-table tfoot td {
  border-top-color: var(--color-dark-border);
  background: var(--color-dark-bg);
  color: var(--color-dark-text);
}

.dark-mode .rc-table tfoot .rc-col-label {
  color: var(--color-dark-text-muted);
}

.dark-mode .rc-subject-name {
  color: var(--color-dark-text);
}

.dark-mode .rc-subject-class {
  color: var(--color-dark-text-muted);
}

.dark-mode .rc-col-muted {
  color: var(--color-dark-text-muted);
}

.dark-mode .rc-col-strong {
  color: var(--color-dark-text);
}

.dark-mode .rc-grade {
  background: rgba(51, 65, 85, 0.5);
  color: var(--color-dark-text-muted);
}

.dark-mode .rc-footer {
  background: var(--color-dark-bg-hover);
  border-color: var(--color-dark-border);
  color: var(--color-dark-text-secondary);
}

.dark-mode .rc-footer strong {
  color: var(--color-dark-text);
}

.dark-mode .rc-footer-warn {
  color: #f87171;
}

.dark-mode .rc-footer-date {
  color: var(--color-dark-text-muted);
}

/* ══ Responsive ══════════════════════════════════════════════ */

@media (max-width: 767.98px) {
  .rc-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .rc-stats .rc-stat:nth-child(2) {
    border-left: 1px solid var(--color-border);
  }

  .rc-stats .rc-stat:nth-child(3),
  .rc-stats .rc-stat:nth-child(4) {
    border-left: none;
    border-top: 1px solid var(--color-border);
  }

  .dark-mode .rc-stats .rc-stat:nth-child(2) {
    border-left-color: var(--color-dark-border);
  }

  .dark-mode .rc-stats .rc-stat:nth-child(3),
  .dark-mode .rc-stats .rc-stat:nth-child(4) {
    border-top-color: var(--color-dark-border);
  }

  .rc-body {
    padding: 16px;
  }

  .rc-toolbar {
    padding: 12px 16px;
  }

  .rc-identity {
    flex-wrap: wrap;
  }
}

@media (max-width: 479.98px) {
  .rc-stats {
    grid-template-columns: 1fr;
  }

  .rc-stats .rc-stat {
    border-left: none !important;
    border-top: 1px solid var(--color-border);
  }

  .rc-stats .rc-stat:first-child {
    border-top: none;
  }

  .dark-mode .rc-stats .rc-stat {
    border-top-color: var(--color-dark-border);
  }

  .rc-toolbar-title span {
    display: none;
  }

  .rc-btn span {
    display: none;
  }
}

/* ══ Print Styles ════════════════════════════════════════════ */

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
  .rc-body { padding: 0; }
  .rc-table-wrap { overflow: visible; border: 1px solid #ddd; }

  .rc-identity-accent { display: none; }
}
</style>
