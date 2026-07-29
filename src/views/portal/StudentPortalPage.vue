<template>
  <div class="portal-page">
    <!-- Error Banner -->
    <Transition name="fade">
      <div v-if="error" class="alert-banner">
        <svg class="alert-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>{{ error }}</span>
      </div>
    </Transition>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner-ring">
        <div class="ring"></div>
        <div class="ring"></div>
        <div class="ring"></div>
      </div>
      <p class="loading-text">{{ t('portal.loadingDashboard') }}</p>
    </div>

    <!-- Main Content — one master card, matching the admin/teacher dashboard -->
    <template v-else-if="portal">
      <div class="master-card">
        <!-- Card Header -->
        <div class="master-header">
          <div class="master-header-left">
            <div class="profile-avatar-ring" @click="showLightbox = true" role="button" tabindex="0" @keydown.enter.prevent="showLightbox = true" title="View full photo">
              <div class="profile-avatar">
                <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="Student photo" @error="onAvatarError" />
                <span v-else class="avatar-initials">{{ avatarFallback }}</span>
              </div>
              <div class="status-dot" :class="portal.profile.academicStatus === 'Active' ? 'online' : 'away'"></div>
              <div class="avatar-expand-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </div>
            </div>
            <div>
              <h1 class="master-title">{{ portal.profile.name }}</h1>
              <p class="master-subtitle">{{ t('portal.academicPerformance') }}</p>
            </div>
          </div>
          <div class="master-header-right">
            <span v-if="hasValue(portal.profile.studentId)" class="meta-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2.5"/><circle cx="8.5" cy="10.5" r="2"/><path d="M5.5 16c0.8-1.7 2.2-2.5 3-2.5s2.2 0.8 3 2.5"/><line x1="14" y1="9" x2="19" y2="9"/><line x1="14" y1="12.5" x2="19" y2="12.5"/></svg>
              {{ portal.profile.studentId }}
            </span>
            <span v-if="hasValue(portal.profile.class)" class="meta-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              {{ portal.profile.class }}
            </span>
            <span v-if="hasValue(portal.profile.currentTerm)" class="meta-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ portal.profile.currentTerm }}
            </span>
            <span v-if="hasValue(portal.profile.academicStatus)" class="status-badge" :class="portal.profile.academicStatus!.toLowerCase()">
              <span class="dot"></span>
              {{ portal.profile.academicStatus }}
            </span>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="master-section">
          <div class="stat-grid">
            <div
              v-for="(item, idx) in portal.summary"
              :key="item.label"
              class="stat-tile"
              :style="{ '--delay': `${idx * 0.08}s` }"
            >
              <div class="stat-tile-top">
                <div class="stat-icon" :class="item.iconClass">
                  <i :class="item.icon"></i>
                </div>
                <span v-if="item.subtitle" class="stat-pill">{{ item.subtitle }}</span>
              </div>
              <div class="stat-value">
                <template v-if="typeof item.value === 'string'">
                  {{ item.value }}
                </template>
                <template v-else>
                  {{ item.value.toFixed(item.decimals) }}
                </template>
              </div>
              <div class="stat-label">{{ item.label }}</div>
            </div>
          </div>
        </div>

        <!-- Progress Bars -->
        <div class="master-section" v-if="portal.progress">
          <div class="progress-row">
            <div v-for="p in portal.progress" :key="p.label" class="progress-item">
              <div class="progress-header">
                <div class="progress-info">
                  <i :class="p.icon"></i>
                  <span class="progress-label">{{ p.label }}</span>
                </div>
                <span class="progress-value">{{ p.display }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: p.value + '%', background: p.color }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Subjects -->
        <div class="master-section">
          <div class="section-header">
            <div class="section-title-group">
              <svg class="section-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <h3 class="section-title">{{ t('portal.currentSubjects') }}</h3>
            </div>
            <span class="section-count">{{ portal.currentSubjects.length }} subject{{ portal.currentSubjects.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="table-wrap">
            <table class="subjects-table">
              <colgroup>
                <col class="col-subject" />
                <col class="col-teacher" />
                <col class="col-score" />
                <col class="col-grade" />
              </colgroup>
              <thead>
                <tr>
                  <th>{{ t('portal.subject') }}</th>
                  <th>{{ t('portal.teacher') }}</th>
                  <th class="col-center">{{ t('portal.score') }}</th>
                  <th class="col-center">{{ t('portal.grade') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in portal.currentSubjects" :key="s.id" class="subject-row">
                  <td>
                    <span class="subject-name">{{ s.name }}</span>
                  </td>
                  <td>
                    <span class="cell-teacher">{{ s.teacher || '—' }}</span>
                  </td>
                  <td class="col-center">
                    <span class="score-value" :class="scoreClass(s.currentScore)">{{ s.currentScore.toFixed(1) }}</span>
                  </td>
                  <td class="col-center">
                    <span v-if="s.grade" class="grade-badge" :class="gradeClass(s.grade)">{{ s.grade }}</span>
                    <span v-else class="grade-badge grade-none">—</span>
                  </td>
                </tr>
                <tr v-if="portal.currentSubjects.length === 0">
                  <td colspan="4" class="empty-row">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    <p>{{ t('portal.noSubjectsEnrolled') }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- Avatar Lightbox -->
    <Teleport to="body">
      <Transition name="lightbox">
        <div v-if="showLightbox && avatarUrl" class="lightbox-overlay" @click.self="showLightbox = false">
          <button class="lightbox-close" @click="showLightbox = false" aria-label="Close">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img :src="avatarUrl" class="lightbox-image" alt="Student photo" @click="showLightbox = false" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPortal, type PortalData } from '@/services/studentPortalService'
import { storageUrl } from '@/services/apiHttp'
import { getUserInitials } from '@/utils'

const { t } = useI18n()
const portal = ref<PortalData | null>(null)
const loading = ref(true)
const error = ref('')
const showLightbox = ref(false)
const avatarLoadFailed = ref(false)

const avatarUrl = computed(() => {
  if (avatarLoadFailed.value) return ''
  return storageUrl(portal.value?.profile?.avatar ?? null)
})

const avatarFallback = computed(() => {
  return getUserInitials(portal.value?.profile?.name)
})

function onAvatarError() {
  avatarLoadFailed.value = true
}

/** Backend sends '—' as a placeholder for unset fields — treat it as absent so we don't render an empty-looking chip. */
function hasValue(v: string | null | undefined): boolean {
  return !!v && v.trim() !== '' && v.trim() !== '—'
}

function scoreClass(score: number): string {
  if (score >= 90) return 'score-excellent'
  if (score >= 75) return 'score-good'
  if (score >= 60) return 'score-average'
  return 'score-low'
}

function gradeClass(grade: string): string {
  const g = grade.toUpperCase()
  if (['A+', 'A', 'A-'].includes(g)) return 'grade-a'
  if (['B+', 'B', 'B-'].includes(g)) return 'grade-b'
  if (['C+', 'C', 'C-'].includes(g)) return 'grade-c'
  if (['D+', 'D'].includes(g)) return 'grade-d'
  return 'grade-f'
}

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
/* ── Portal Page Container ── */
.portal-page {
  font-family: 'Inter', 'Noto Sans Khmer', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 8px 0;
}

/* ── Fade Transition ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Alert Banner ── */
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
.spinner-ring {
  position: relative;
  width: 56px;
  height: 56px;
}
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

/* ── Internal Sections ── */
.master-section {
  padding: 16px 24px 24px;
}
.master-section + .master-section {
  border-top: 1px solid #f0f1f3;
  margin-top: 0;
  padding-top: 20px;
}

.profile-avatar-ring {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 12px;
  transition: transform 0.2s ease;
}
.profile-avatar-ring:hover {
  transform: scale(1.04);
}
.profile-avatar-ring:hover .avatar-expand-hint {
  opacity: 1;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06));
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
  overflow: hidden;
  position: relative;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.avatar-initials {
  font-size: 0.85rem;
  font-weight: 700;
  color: #3b82f6;
}

.avatar-expand-hint {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s ease;
  backdrop-filter: blur(2px);
}

.status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: #94a3b8;
}
.status-dot.online { background: #22c55e; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15); }
.status-dot.away { background: #f59e0b; }

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

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 5px 11px;
  border-radius: 100px;
  white-space: nowrap;
  border: 1px solid transparent;
}
.status-badge .dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.status-badge.active { color: #16a34a; background: #f0fdf4; border-color: #bbf7d0; }
.status-badge.inactive { color: #64748b; background: #f8fafc; border-color: #e5e7eb; }
.status-badge.suspended { color: #dc2626; background: #fef2f2; border-color: #fecaca; }

/* ── Stats Grid ── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.stat-tile {
  position: relative;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.25s ease;
  animation: tileIn 0.5s ease both;
  animation-delay: var(--delay);
}
.stat-tile:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

@keyframes tileIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-tile-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}

.stat-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
}
/* One consistent blue, matching the admin/teacher dashboard's KPI icons —
   every stat uses the same color there regardless of what it measures. */
.stat-icon,
.stat-icon.icon-blue,
.stat-icon.icon-green,
.stat-icon.icon-violet,
.stat-icon.icon-orange,
.stat-icon.icon-purple {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06));
  color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.stat-pill {
  font-size: 0.7rem;
  font-weight: 700;
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.2rem 0.55rem;
  border-radius: 100px;
  white-space: nowrap;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.stat-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  margin-top: 4px;
}

/* ── Progress Row ── */
.progress-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}
.progress-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.25s ease, transform 0.2s ease;
}
.progress-item:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.progress-info {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 0.825rem;
  font-weight: 600;
  color: #334155;
}
.progress-info i {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06));
  border-radius: 9px;
}
.progress-value {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
.progress-track {
  width: 100%;
  height: 9px;
  background: #f1f5f9;
  border-radius: 100px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
}
.progress-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.08);
}
.progress-fill[style*="width: 0%"] { box-shadow: none; }

/* ── Section Header (within a master-section) ── */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-icon {
  flex-shrink: 0;
  color: #3b82f6;
  width: 32px;
  height: 32px;
  padding: 7px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06));
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
}
.section-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.section-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  padding: 5px 12px;
  border-radius: 100px;
}

.table-wrap { width: 100%; overflow-x: auto; }

/* ── Subjects Table ── */
.subjects-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

/* Column widths */
.col-subject { width: auto; }
.col-teacher { width: auto; }
.col-score { width: 110px; }
.col-grade { width: 100px; }

.subjects-table thead th {
  padding: 14px 18px;
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  border-bottom: 1.5px solid #f1f5f9;
}
.subjects-table thead th.col-center {
  text-align: center;
}

.subjects-table tbody td {
  padding: 16px 18px;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
}
.subject-row { transition: background 0.15s ease; }
.subject-row:hover { background: #f8fafc; }
.subject-row:last-child td { border-bottom: none; }

.subject-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9375rem;
}

/* Teacher cell */
.cell-teacher {
  color: #475569;
  font-size: 0.9rem;
}

/* Center-aligned cells */
.col-center {
  text-align: center;
}

.score-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  min-width: 44px;
  padding: 2px 8px;
  border-radius: 8px;
  background: #f8fafc;
}
.score-value.score-excellent {
  background: #f0fdf4;
  color: #16a34a;
}
.score-value.score-good {
  background: #eff6ff;
  color: #2563eb;
}
.score-value.score-average {
  background: #fffbeb;
  color: #d97706;
}
.score-value.score-low {
  background: #fef2f2;
  color: #dc2626;
}

.grade-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.25rem 0.85rem;
  border-radius: 100px;
  min-width: 44px;
  text-align: center;
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
  padding: 48px 16px !important;
}
.empty-row p {
  margin: 10px 0 0;
  font-size: 0.9375rem;
  font-weight: 500;
}

/* ── Avatar Lightbox ── */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  cursor: zoom-out;
}
.lightbox-image {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 20px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  object-fit: contain;
  cursor: zoom-out;
}
.lightbox-close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.08);
}

.lightbox-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.lightbox-leave-active {
  transition: all 0.2s ease-in;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
.lightbox-enter-from .lightbox-image,
.lightbox-leave-to .lightbox-image {
  transform: scale(0.92);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .portal-page { gap: 14px; padding: 8px 0; }
  .master-header { flex-direction: column; align-items: flex-start; padding: 16px; }
  .master-header-right { width: 100%; }
  .master-section { padding: 14px 16px 20px; }
  .profile-avatar { width: 36px; height: 36px; }
  .avatar-initials { font-size: 0.8rem; }
  .stat-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
  .stat-tile { padding: 14px; }
  .stat-icon { width: 36px; height: 36px; font-size: 0.95rem; }
  .stat-value { font-size: 1.3rem; }
  .subjects-table thead th,
  .subjects-table tbody td { padding: 12px 14px; }
  .section-title { font-size: 0.85rem; }
  .lightbox-overlay { padding: 20px; }
  .lightbox-close { top: 16px; right: 16px; width: 40px; height: 40px; }
}
</style>
