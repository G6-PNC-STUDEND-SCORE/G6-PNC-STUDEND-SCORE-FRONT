<template>
  <Header />
  <div class="px-4 py-4">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><i class="bi bi-file-earmark-bar-graph-fill"></i></div>
        <div>
          <h2 class="page-title">Reports</h2>
          <p class="page-subtitle">View and generate report cards and transcripts</p>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
        <i :class="tab.icon"></i> {{ tab.label }}
      </button>
    </div>

    <!-- Report Cards -->
    <div v-if="activeTab === 'report-cards'" class="section">
      <div class="section-toolbar">
        <div class="section-toolbar-left">
          <h3>Report Cards</h3>
          <span class="badge" v-if="reportCards.length">{{ reportCards.length }} total</span>
        </div>
        <div class="section-toolbar-right">
          <select v-model="reportFilters.generation_id" class="form-input filter-select" @change="loadReportCards">
            <option :value="null">All Generations</option>
            <option v-for="g in generations" :key="g.id" :value="g.id">Gen {{ g.year }}</option>
          </select>
          <select v-model="reportFilters.term_id" class="form-input filter-select" @change="loadReportCards">
            <option :value="null">All Terms</option>
            <option v-for="t in terms" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-state"><div class="spinner"></div><span>Loading...</span></div>

      <div v-else-if="!reportCards.length" class="empty-state">
        <div class="empty-state-icon"><i class="bi bi-inbox"></i></div>
        <h5>No Report Cards Yet</h5>
        <p>Generate report cards from the score sheet or subject offerings.</p>
      </div>

      <table v-else class="report-table">
        <thead><tr><th>Student</th><th>Generation</th><th>Term</th><th>Average</th><th>Grade</th><th>Generated</th><th>By</th></tr></thead>
        <tbody>
          <tr v-for="rc in reportCards" :key="rc.id">
            <td class="cell-name">{{ rc.student?.user?.name || 'Unknown' }}</td>
            <td>{{ rc.generation?.year || '-' }}</td>
            <td>{{ rc.term?.name || '-' }}</td>
            <td class="cell-score" :class="scoreClass(rc.total_average)">{{ rc.total_average !== null ? rc.total_average.toFixed(2) : '-' }}</td>
            <td><span class="grade-badge" :class="'grade-' + (rc.grade?.toLowerCase() || 'none')">{{ rc.grade || '-' }}</span></td>
            <td class="cell-date">{{ rc.generated_at ? formatDate(rc.generated_at) : '-' }}</td>
            <td class="cell-date">{{ rc.generated_by ? 'System' : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Transcripts -->
    <div v-if="activeTab === 'transcripts'" class="section">
      <div class="section-toolbar">
        <div class="section-toolbar-left">
          <h3>Transcripts</h3>
          <span class="badge" v-if="transcripts.length">{{ transcripts.length }} total</span>
        </div>
        <div class="section-toolbar-right">
          <select v-model="transcriptFilters.generation_id" class="form-input filter-select" @change="loadTranscripts">
            <option :value="null">All Generations</option>
            <option v-for="g in generations" :key="g.id" :value="g.id">Gen {{ g.year }}</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-state"><div class="spinner"></div><span>Loading...</span></div>

      <div v-else-if="!transcripts.length" class="empty-state">
        <div class="empty-state-icon"><i class="bi bi-inbox"></i></div>
        <h5>No Transcripts Yet</h5>
        <p>Generate transcripts from existing report cards.</p>
      </div>

      <table v-else class="report-table">
        <thead><tr><th>Student</th><th>Generation</th><th>Average</th><th>Grade</th><th>Status</th><th>Generated</th></tr></thead>
        <tbody>
          <tr v-for="t in transcripts" :key="t.id">
            <td class="cell-name">{{ t.student?.user?.name || 'Unknown' }}</td>
            <td>{{ t.generation?.year || '-' }}</td>
            <td class="cell-score" :class="scoreClass(t.overall_average)">{{ t.overall_average !== null ? t.overall_average.toFixed(2) : '-' }}</td>
            <td><span class="grade-badge" :class="'grade-' + (t.overall_grade?.toLowerCase() || 'none')">{{ t.overall_grade || '-' }}</span></td>
            <td><span class="status-badge" :class="t.status === 'generated' ? 'status-active' : 'status-pending'">{{ t.status || 'pending' }}</span></td>
            <td class="cell-date">{{ t.generated_at ? formatDate(t.generated_at) : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import Header from '@/layouts/Header.vue'
import { reportCardService, type ReportCardItem, type TranscriptItem } from '@/services/reportCardService'
import { dashboardService } from '@/services/dashboardService'
import type { GenerationOption, TermOption } from '@/types/dashboard'

const tabs = [
  { key: 'report-cards', label: 'Report Cards', icon: 'bi bi-card-checklist' },
  { key: 'transcripts', label: 'Transcripts', icon: 'bi bi-file-text' },
]

const activeTab = ref('report-cards')
const loading = ref(false)
const reportCards = ref<ReportCardItem[]>([])
const transcripts = ref<TranscriptItem[]>([])
const generations = ref<GenerationOption[]>([])
const terms = ref<TermOption[]>([])

const reportFilters = reactive<{ generation_id: number | null; term_id: number | null }>({ generation_id: null, term_id: null })
const transcriptFilters = reactive<{ generation_id: number | null }>({ generation_id: null })

function scoreClass(score: number | null): string {
  if (score === null) return ''
  if (score >= 90) return 'score-excellent'
  if (score >= 75) return 'score-good'
  if (score >= 60) return 'score-average'
  return 'score-low'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function loadReportCards() {
  loading.value = true
  try {
    const params: any = {}
    if (reportFilters.generation_id) params.generation_id = reportFilters.generation_id
    if (reportFilters.term_id) params.term_id = reportFilters.term_id
    reportCards.value = await reportCardService.getReportCards(params)
  } catch (e) { console.error('Failed to load report cards', e) }
  finally { loading.value = false }
}

async function loadTranscripts() {
  loading.value = true
  try {
    const params: any = {}
    if (transcriptFilters.generation_id) params.generation_id = transcriptFilters.generation_id
    transcripts.value = await reportCardService.getTranscripts(params)
  } catch (e) { console.error('Failed to load transcripts', e) }
  finally { loading.value = false }
}

async function loadFilters() {
  try {
    const filters = await dashboardService.getFilterOptions()
    generations.value = filters.generations
    terms.value = filters.terms
  } catch (e) { console.error('Failed to load filters', e) }
}

onMounted(() => {
  loadFilters()
  loadReportCards()
  loadTranscripts()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.page-header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  color: #16a34a;
  border-radius: 12px;
  font-size: 1.2rem;
}
.page-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 1.5rem;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 10px;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border: none;
  background: transparent;
  border-radius: 7px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover { color: #334155; background: #e2e8f0; }
.tab-btn.active { background: #fff; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

.section { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; }

.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 10px;
}
.section-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-toolbar-left h3 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
.section-toolbar-right { display: flex; gap: 8px; }
.badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  background: #e2e8f0;
  color: #475569;
  font-weight: 600;
}
.filter-select {
  width: auto;
  min-width: 140px;
  font-size: 0.78rem;
  padding: 5px 10px;
}

.form-input {
  padding: 7px 10px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.15s;
}
.form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.report-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.report-table th {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 600;
  color: #475569;
  font-size: 0.72rem;
  text-transform: uppercase;
}
.report-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
.cell-name { font-weight: 600; color: #0f172a; }
.cell-score { font-weight: 600; }
.cell-date { font-size: 0.78rem; color: #64748b; }
.score-excellent { color: #16a34a; }
.score-good { color: #2563eb; }
.score-average { color: #d97706; }
.score-low { color: #dc2626; }

.grade-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.78rem;
}
.grade-a { background: #dcfce7; color: #16a34a; }
.grade-b { background: #dbeafe; color: #2563eb; }
.grade-b-plus { background: #dbeafe; color: #2563eb; }
.grade-c { background: #fef3c7; color: #d97706; }
.grade-c-plus { background: #fef3c7; color: #d97706; }
.grade-d { background: #fce4ec; color: #c62828; }
.grade-f { background: #fee2e2; color: #dc2626; }
.grade-none { background: #f1f5f9; color: #94a3b8; }

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.status-active { background: #dcfce7; color: #16a34a; }
.status-pending { background: #fef3c7; color: #d97706; }

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 3rem;
  color: #64748b;
}
.spinner {
  width: 24px; height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 3rem 2rem; text-align: center;
}
.empty-state-icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  background: #f8fafc;
  color: #94a3b8;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; margin-bottom: 0.75rem;
}
.empty-state h5 { font-weight: 700; color: #0f172a; margin: 0 0 4px; }
.empty-state p { font-size: 0.85rem; color: #64748b; margin: 0; }
</style>
