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
      <p class="loading-text">Loading your dashboard…</p>
    </div>

    <!-- Main Content -->
    <template v-else-if="portal">
      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-avatar-ring" @click="showLightbox = true" role="button" tabindex="0" @keydown.enter.prevent="showLightbox = true" title="View full photo">
          <div class="profile-avatar">
            <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="Student photo" @error="onAvatarError" />
            <span v-else class="avatar-initials">{{ avatarFallback }}</span>
          </div>
          <div class="status-dot" :class="portal.profile.academicStatus === 'Active' ? 'online' : 'away'"></div>
          <div class="avatar-expand-hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </div>
        </div>
        <div class="profile-info">
          <h1 class="profile-name">{{ portal.profile.name }}</h1>
          <div class="profile-meta">
            <span v-if="portal.profile.studentId" class="meta-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              {{ portal.profile.studentId }}
            </span>
            <span v-if="portal.profile.class" class="meta-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              {{ portal.profile.class }}
            </span>
            <span v-if="portal.profile.currentTerm" class="meta-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ portal.profile.currentTerm }}
            </span>
            <span v-if="portal.profile.academicStatus" class="meta-chip status-chip" :class="portal.profile.academicStatus.toLowerCase()">
              <span class="dot"></span>
              {{ portal.profile.academicStatus }}
            </span>
          </div>
        </div>
      </div>

      <!-- Summary Stats Grid -->
      <div class="stat-grid">
        <div
          v-for="(item, idx) in portal.summary"
          :key="item.label"
          class="stat-tile"
          :style="{ '--delay': `${idx * 0.08}s` }"
        >
          <div class="stat-icon" :class="item.iconClass">
            <i :class="item.icon"></i>
          </div>
          <div class="stat-body">
            <div class="stat-value">
              <template v-if="typeof item.value === 'string'">
                {{ item.value }}
              </template>
              <template v-else>
                {{ item.value.toFixed(item.decimals) }}
              </template>
            </div>
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-subtitle">{{ item.subtitle }}</div>
          </div>
          <div class="stat-glow" :class="item.iconClass"></div>
        </div>
      </div>

      <!-- Progress Bars -->
      <div class="progress-row" v-if="portal.progress">
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

      <!-- Current Subjects Section -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title-group">
            <svg class="section-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <h3 class="section-title">Current Subjects</h3>
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
                <th>Subject</th>
                <th>Teacher</th>
                <th class="col-center">Score</th>
                <th class="col-center">Grade</th>
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
                  <p>No subjects enrolled this term.</p>
                </td>
              </tr>
            </tbody>
          </table>
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
import { getPortal, type PortalData } from '@/services/studentPortalService'
import { storageUrl } from '@/services/apiHttp'
import { getUserInitials } from '@/utils'

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
  gap: 28px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 12px 0;
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

/* ── Profile Card ── */
.profile-card {
  display: flex;
  align-items: center;
  gap: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 28px 32px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(99, 102, 241, 0.06);
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}
.profile-card:hover {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 12px 40px rgba(99, 102, 241, 0.10);
  transform: translateY(-1px);
}

.profile-avatar-ring {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 20px;
  transition: transform 0.2s ease;
}
.profile-avatar-ring:hover {
  transform: scale(1.04);
}
.profile-avatar-ring:hover .avatar-expand-hint {
  opacity: 1;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
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
  font-size: 1.5rem;
  font-weight: 700;
}

.avatar-expand-hint {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 20px;
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
  bottom: -3px;
  right: -3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: #94a3b8;
}
.status-dot.online { background: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15); }
.status-dot.away { background: #f59e0b; }

.profile-info { flex: 1; min-width: 0; }
.profile-name {
  font-size: 1.45rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px;
  line-height: 1.3;
}
.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #475569;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 100px;
  white-space: nowrap;
}
.meta-chip svg { opacity: 0.6; flex-shrink: 0; }
.status-chip .dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.status-chip.active { color: #16a34a; background: #f0fdf4; }
.status-chip.inactive { color: #94a3b8; background: #f1f5f9; }
.status-chip.suspended { color: #dc2626; background: #fef2f2; }

/* ── Stats Grid ── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.stat-tile {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 24px 26px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.25s ease;
  animation: tileIn 0.5s ease both;
  animation-delay: var(--delay);
  overflow: hidden;
}
.stat-tile:hover {
  border-color: #cbd5e1;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(99, 102, 241, 0.08);
  transform: translateY(-3px);
}

@keyframes tileIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-icon {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  transition: transform 0.3s ease;
}
.stat-tile:hover .stat-icon { transform: scale(1.1) rotate(-4deg); }
.stat-icon.icon-blue { background: #eff6ff; color: #2563eb; }
.stat-icon.icon-green { background: #f0fdf4; color: #16a34a; }
.stat-icon.icon-violet { background: #f5f3ff; color: #7c3aed; }
.stat-icon.icon-orange { background: #fff7ed; color: #ea580c; }
.stat-icon.icon-purple { background: #faf5ff; color: #9333ea; }

.stat-body { flex: 1; min-width: 0; }
.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-top: 3px;
}
.stat-subtitle {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 2px;
  font-weight: 500;
}

.stat-glow {
  position: absolute;
  top: -40%;
  right: -20%;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  opacity: 0.04;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.stat-tile:hover .stat-glow { opacity: 0.08; }
.stat-glow.icon-blue { background: radial-gradient(circle, #2563eb, transparent); }
.stat-glow.icon-green { background: radial-gradient(circle, #16a34a, transparent); }
.stat-glow.icon-violet { background: radial-gradient(circle, #7c3aed, transparent); }
.stat-glow.icon-orange { background: radial-gradient(circle, #ea580c, transparent); }
.stat-glow.icon-purple { background: radial-gradient(circle, #9333ea, transparent); }

/* ── Progress Row ── */
.progress-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}
.progress-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s ease;
}
.progress-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}
.progress-info i { font-size: 1rem; color: #64748b; }
.progress-value {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #64748b;
}
.progress-track {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 100px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

/* ── Section Card ── */
.section-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 28px 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s ease;
}
.section-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-icon { color: #6366f1; flex-shrink: 0; }
.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.section-count {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #94a3b8;
  background: #f1f5f9;
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
  .portal-page { gap: 20px; padding: 8px 0; }
  .profile-card { flex-direction: column; text-align: center; padding: 24px 20px; }
  .profile-meta { justify-content: center; }
  .profile-avatar { width: 64px; height: 64px; }
  .avatar-initials { font-size: 1.25rem; }
  .stat-grid { grid-template-columns: 1fr 1fr; gap: 14px; }
  .stat-tile { flex-direction: column; align-items: flex-start; gap: 14px; padding: 18px; }
  .stat-icon { width: 44px; height: 44px; font-size: 1.1rem; }
  .stat-value { font-size: 1.4rem; }
  .section-card { padding: 20px; }
  .subjects-table thead th,
  .subjects-table tbody td { padding: 12px 14px; }
  .section-title { font-size: 0.95rem; }
  .lightbox-overlay { padding: 20px; }
  .lightbox-close { top: 16px; right: 16px; width: 40px; height: 40px; }
}
</style>
