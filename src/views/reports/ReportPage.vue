<template>
  <div :class="['reports-page', { 'dark-mode': theme.isDark }]">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <FileText :size="22" />
        </div>
        <div>
          <h2 class="page-title">Reports</h2>
          <p class="page-subtitle">Generate and view reports</p>
        </div>
      </div>
    </div>
    <div class="empty-state">
      <div class="empty-state-icon">
        <Inbox :size="24" />
      </div>
      <h5>Reports</h5>
      <p class="text-secondary">Report generation features coming soon.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { FileText, Inbox } from '@lucide/vue'

const theme = useThemeStore()
</script>

<style scoped>
.reports-page {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
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
  background: linear-gradient(135deg, #eef2ff, #dbeafe);
  color: #2563eb;
  border-radius: 12px;
  font-size: 1.2rem;
  flex-shrink: 0;
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
  font-weight: 400;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 16px;
  border: 1.5px dashed #e2e8f0;
}
.empty-state-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #eef2ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}
.empty-state h5 {
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}
.empty-state p {
  font-size: 0.875rem;
}

/* ── Dark Mode ── */
.dark-mode .reports-page {
  background: transparent;
}
.dark-mode .page-header-icon {
  background: linear-gradient(135deg, #1e3a5f, #1e40af);
  color: #60a5fa;
}
.dark-mode .empty-state {
  background: #1e293b;
  border-color: #334155;
}
.dark-mode .empty-state-icon {
  background: #1e3a5f;
  color: #60a5fa;
}
.dark-mode .empty-state h5 {
  color: #f1f5f9;
}
.dark-mode .empty-state p {
  color: #94a3b8;
}
</style>
