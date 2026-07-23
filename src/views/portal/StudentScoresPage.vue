<template>
  <div class="portal-page">
    <div v-if="error" class="alert-banner">{{ error }}</div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 2.25rem; height: 2.25rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <template v-else>
      <div v-for="termBlock in terms" :key="termBlock.term" class="section-card">
        <h3 class="section-title">{{ termBlock.term }}</h3>
        <div class="table-wrap">
          <table class="scores-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th class="col-num">Quiz</th>
                <th class="col-num">Assignment</th>
                <th class="col-num">Midterm</th>
                <th class="col-num">Final</th>
                <th class="col-num">Total</th>
                <th class="col-num">Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in termBlock.subjects" :key="s.subject">
                <td>{{ s.subject }}</td>
                <td class="col-num">{{ fmt(s.quiz) }}</td>
                <td class="col-num">{{ fmt(s.assignment) }}</td>
                <td class="col-num">{{ fmt(s.midterm) }}</td>
                <td class="col-num">{{ fmt(s.final) }}</td>
                <td class="col-num total-cell">{{ fmt(s.total) }}</td>
                <td class="col-num"><span class="grade-badge">{{ s.grade || '—' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="terms.length === 0" class="empty-container">No scores recorded yet.</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getScores, type TermScores } from '@/services/studentPortalService'

const terms = ref<TermScores[]>([])
const loading = ref(true)
const error = ref('')

function fmt(v: number | null): string {
  return v === null || v === undefined ? '—' : v.toFixed(1)
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
.portal-page { font-family: 'Inter', 'Noto Sans Khmer', sans-serif; display: flex; flex-direction: column; gap: 16px; }

.alert-banner {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  font-size: 0.8125rem;
}

.section-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.section-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 12px; }

.table-wrap { width: 100%; overflow-x: auto; }
.scores-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.875rem; }
.scores-table thead th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}
.scores-table tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f3f5; color: #475569; }
.scores-table tbody tr:last-child td { border-bottom: none; }
.col-num { text-align: right; }
.total-cell { font-weight: 700; color: #0f172a; }
.grade-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.15rem 0.55rem;
  border-radius: 100px;
}

.empty-container {
  text-align: center;
  color: #94a3b8;
  padding: 2.5rem;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
}
</style>
