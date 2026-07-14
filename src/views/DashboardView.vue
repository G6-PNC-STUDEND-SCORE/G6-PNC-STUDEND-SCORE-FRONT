<template>
  <Header />
  <div class="px-4 py-4 dashboard-page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <i class="bi bi-speedometer2"></i>
        </div>
        <div>
          <h2 class="page-title">Admin Dashboard</h2>
          <p class="page-subtitle">Live academic performance and operations overview</p>
        </div>
      </div>
    </div>

    <!-- Error Banner -->
    <div
      v-if="dashboard.error"
      class="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 rounded-3 border-0"
      style="font-size: 0.82rem;"
    >
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span class="flex-grow-1">{{ dashboard.error }}</span>
      <button class="btn btn-sm btn-outline-danger rounded-pill px-3" @click="dashboard.fetchDashboardData">
        Retry
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="dashboard.loading" class="row g-2 g-xl-3 mb-3">
      <div v-for="i in 4" :key="i" class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 h-100" style="background: #ffffff; min-height: 100px;">
          <div class="card-body">
            <div class="skeleton-pulse skeleton-bar mb-2" style="height: 1.5rem; width: 60%;"></div>
            <div class="skeleton-pulse skeleton-bar" style="height: 2rem; width: 80%;"></div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useDashboardStore } from '@/stores/dashboard'
import Header from '@/layouts/Header.vue'

const theme = useThemeStore()
const dashboard = useDashboardStore()

// ── Lifecycle ─────────────────────────────────────────────────────────
onMounted(() => {
  dashboard.initialize()
})

onUnmounted(() => {
  // Cleanup if needed
})
</script>

<style scoped>
.dashboard-page {
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
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
  color: #64748b;
  font-size: 0.8125rem;
  margin-bottom: 0;
  font-weight: 400;
}


.dark-mode .page-title { color: #f1f5f9; }
.dark-mode .page-subtitle { color: #94a3b8; }

.dashboard-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  padding: 0.35rem;
  margin-bottom: 1rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.dashboard-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.5rem 0.75rem;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.dashboard-tabs button:hover {
  background: #f1f5f9;
  color: #0f172a;
  transform: translateY(-1px);
}

.dashboard-tabs button.active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
}

.dashboard-tabs.dark-mode {
  background: rgba(30, 41, 59, 0.92);
  border-color: rgba(71, 85, 105, 0.5);
}

.dashboard-tabs.dark-mode button {
  color: #cbd5e1;
}

.dashboard-tabs.dark-mode button:hover {
  background: rgba(51, 65, 85, 0.9);
  color: #f8fafc;
}

.dashboard-tabs.dark-mode button.active {
  background: #e2e8f0;
  color: #0f172a;
}

.panel-title { color: #0f172a; font-size: 0.85rem; font-weight: 700; }
.panel-subtitle { color: #64748b; font-size: 0.72rem; }
.dark-mode .panel-title { color: #f1f5f9; }
.dark-mode .panel-subtitle { color: #94a3b8; }

.panel {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.panel {
  background: #ffffff;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.panel:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.panel.dark-mode {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

@media (max-width: 991.98px) {
  .dashboard-page { padding-inline: 0.75rem !important; }
  .page-header { align-items: flex-start; flex-direction: column; }
}

@media (max-width: 575.98px) {
  .dashboard-tabs {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }
}
</style>
