<template>
  <div class="portal-page">
    <div v-if="error" class="alert-banner">{{ error }}</div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 2.25rem; height: 2.25rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <template v-else-if="portal">
      <div class="profile-card">
        <div class="profile-name">{{ portal.profile.name }}</div>
        <div class="profile-meta">
          <span v-if="portal.profile.studentId">{{ portal.profile.studentId }}</span>
          <span v-if="portal.profile.class">&middot; {{ portal.profile.class }}</span>
          <span v-if="portal.profile.generation">&middot; {{ portal.profile.generation }}</span>
          <span v-if="portal.profile.currentTerm">&middot; {{ portal.profile.currentTerm }}</span>
        </div>
      </div>

      <div class="stat-grid">
        <div v-for="item in portal.summary" :key="item.label" class="stat-tile">
          <div class="stat-value">{{ item.value.toFixed(item.decimals) }}</div>
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-subtitle">{{ item.subtitle }}</div>
        </div>
      </div>

      <div class="section-card">
        <h3 class="section-title">Current Subjects</h3>
        <div class="table-wrap">
          <table class="subjects-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Teacher</th>
                <th class="col-num">Score</th>
                <th class="col-num">Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in portal.currentSubjects" :key="s.id">
                <td>{{ s.name }}</td>
                <td>{{ s.teacher || '—' }}</td>
                <td class="col-num">{{ s.currentScore.toFixed(1) }}</td>
                <td class="col-num"><span class="grade-badge">{{ s.grade || '—' }}</span></td>
              </tr>
              <tr v-if="portal.currentSubjects.length === 0">
                <td colspan="4" class="empty-row">No subjects enrolled this term.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPortal, type PortalData } from '@/services/studentPortalService'

const portal = ref<PortalData | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    portal.value = await getPortal()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load your dashboard.'
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

.profile-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.profile-name { font-size: 1.15rem; font-weight: 700; color: #0f172a; }
.profile-meta { margin-top: 4px; font-size: 0.8125rem; color: #64748b; display: flex; gap: 6px; flex-wrap: wrap; }

.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.stat-tile {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.stat-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
.stat-label { font-size: 0.8125rem; font-weight: 600; color: #334155; margin-top: 2px; }
.stat-subtitle { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

.section-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.section-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 12px; }

.table-wrap { width: 100%; overflow-x: auto; }
.subjects-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.875rem; }
.subjects-table thead th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
}
.subjects-table tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f3f5; color: #475569; }
.subjects-table tbody tr:last-child td { border-bottom: none; }
.col-num { text-align: right; }
.grade-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.15rem 0.55rem;
  border-radius: 100px;
}
.empty-row { text-align: center; color: #94a3b8; padding: 2rem !important; }
</style>
