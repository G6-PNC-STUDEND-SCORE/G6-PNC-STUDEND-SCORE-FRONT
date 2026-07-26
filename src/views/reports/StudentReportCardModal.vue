<template>
  <Modal :model-value="modelValue" max-width="960px" @update:model-value="$emit('update:modelValue', $event)">
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

      <LoadingState v-if="loading" message="Building report card..." />

      <div v-else-if="error" class="rc-error">{{ error }}</div>

      <div v-else-if="card" id="report-card-printable" class="rc-body">
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
          <div class="rc-stat">
            <span class="rc-stat-label">Class Average</span>
            <span class="rc-stat-value">{{ card.summary.class_average?.toFixed(2) ?? '—' }}</span>
            <span class="rc-stat-sub">{{ comparisonLabel }}</span>
          </div>
        </div>

        <div class="rc-table-wrap">
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
                <td class="rc-subject">{{ subject.subject_name }}</td>
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

        <p class="rc-note">
          Pass mark is {{ card.scope.pass_mark }}. A student passes when the average clears the pass mark
          and no single subject is failed<span v-if="card.summary.failed_subjects > 0">
            — {{ card.summary.failed_subjects }} subject(s) below the pass mark</span>.
        </p>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Download, FileText, Printer, X } from '@lucide/vue'
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
  if (!summary?.class_average) return 'no comparison'
  const diff = summary.average - summary.class_average
  if (Math.abs(diff) < 0.01) return 'on the class average'
  return `${diff > 0 ? '+' : ''}${diff.toFixed(2)} vs class`
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
.rc-modal { font-family: 'Inter', 'Noto Sans Khmer', sans-serif; }

.rc-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #eef2f7;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 2;
}
.rc-toolbar-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; color: #0f172a; }
.rc-toolbar-actions { display: flex; align-items: center; gap: 0.4rem; }

.rc-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  border-radius: 9px;
  padding: 0.4rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.rc-btn:hover:not(:disabled) { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
.rc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.rc-btn-icon { padding: 0.4rem; }

.rc-error {
  margin: 1.25rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  font-size: 0.8125rem;
}

.rc-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }

.rc-identity {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.15rem;
  background: linear-gradient(135deg, #f8fafc, #eff6ff);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}
.rc-avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.05rem;
  flex-shrink: 0;
}
.rc-identity-main { flex: 1; min-width: 0; }
.rc-identity-main h3 { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0; }
.rc-identity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
}
.rc-identity-meta span:not(:last-child)::after { content: ' •'; color: #cbd5e1; }

.rc-verdict {
  text-align: center;
  padding: 0.55rem 1rem;
  border-radius: 12px;
  flex-shrink: 0;
}
.rc-verdict.is-pass { background: rgba(16, 185, 129, 0.1); }
.rc-verdict.is-fail { background: rgba(239, 68, 68, 0.1); }
.rc-verdict-grade { display: block; font-size: 1.5rem; font-weight: 900; line-height: 1; }
.rc-verdict.is-pass .rc-verdict-grade { color: #10b981; }
.rc-verdict.is-fail .rc-verdict-grade { color: #ef4444; }
.rc-verdict-label { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.08em; color: #64748b; }

.rc-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
.rc-stat {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.rc-stat-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; }
.rc-stat-value { font-size: 1.2rem; font-weight: 800; color: #0f172a; line-height: 1.1; }
.rc-stat-sub { font-size: 0.7rem; color: #94a3b8; }

.rc-table-wrap { overflow-x: auto; border: 1px solid #e9ecef; border-radius: 12px; }
.rc-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.8125rem; }
.rc-table thead th {
  background: #f8fafc;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  padding: 9px 12px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}
.rc-table thead th small { display: block; font-size: 0.6rem; font-weight: 600; color: #94a3b8; text-transform: none; }
.rc-table tbody td { padding: 9px 12px; border-bottom: 1px solid #f1f3f5; color: #475569; }
.rc-table tfoot td { padding: 10px 12px; background: #f8fafc; font-weight: 700; color: #0f172a; }
.rc-foot-label { text-align: right; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; color: #64748b; }
.rc-col-index { width: 36px; text-align: center; color: #94a3b8; }
.rc-num { text-align: right; }
.rc-subject { font-weight: 600; color: #0f172a; }
.rc-muted { color: #94a3b8; }
.rc-total { font-weight: 700; color: #0f172a; }

.rc-grade {
  display: inline-block;
  min-width: 34px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
  text-align: center;
}
.rc-result { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.04em; }
.rc-result.is-pass { color: #10b981; }
.rc-result.is-fail { color: #ef4444; }

.rc-note { font-size: 0.72rem; color: #94a3b8; margin: 0; }

.dark-mode.rc-modal { background: #1e293b; }
.dark-mode .rc-toolbar { background: #1e293b; border-bottom-color: #334155; }
.dark-mode .rc-toolbar-title { color: #f1f5f9; }
.dark-mode .rc-btn { background: rgba(51, 65, 85, 0.6); border-color: #475569; color: #cbd5e1; }
.dark-mode .rc-identity { background: rgba(51, 65, 85, 0.35); border-color: #475569; }
.dark-mode .rc-identity-main h3 { color: #f1f5f9; }
.dark-mode .rc-stat { background: rgba(30, 41, 59, 0.9); border-color: #475569; }
.dark-mode .rc-stat-value { color: #f1f5f9; }
.dark-mode .rc-table-wrap { border-color: #475569; }
.dark-mode .rc-table thead th { background: #0f172a; color: #cbd5e1; border-bottom-color: #334155; }
.dark-mode .rc-table tbody td { color: #e2e8f0; border-bottom-color: #334155; }
.dark-mode .rc-table tfoot td { background: #0f172a; color: #f1f5f9; }
.dark-mode .rc-subject,
.dark-mode .rc-total { color: #f8fafc; }

@media (max-width: 767.98px) {
  .rc-stats { grid-template-columns: repeat(2, 1fr); }
  .rc-identity { flex-wrap: wrap; }
}

/* Print: the modal is teleported next to #app, so hide the app behind it and
   flatten the fixed overlay into a normal page. */
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
  .rc-table-wrap { overflow: visible; }
}
</style>
