<template>
  <div
    :class="['kpi-card', 'card', 'border-0', { 'dark-mode': isDark }]"
  >
    <div class="card-body">
      <div class="kpi-header">
        <div class="kpi-icon" :class="iconClass">
          <i :class="icon" />
        </div>
      </div>
      <div class="kpi-value">
        <AnimatedNumber v-if="!loading" :value="value" :decimals="decimals" />
        <div v-else class="skeleton-value skeleton-pulse" />
      </div>
      <div class="kpi-label">{{ label }}</div>
      <div v-if="subtitle" class="kpi-subtitle">{{ subtitle }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AnimatedNumber from './AnimatedNumber.vue'
import { useThemeStore } from '@/stores/theme'
import { computed } from 'vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

withDefaults(defineProps<{
  label: string
  value: number
  icon: string
  iconClass: string
  subtitle?: string
  decimals?: number
  loading?: boolean
}>(), {
  subtitle: '',
  decimals: 0,
  loading: false,
})
</script>

<style scoped>
.kpi-card {
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
  min-height: 118px;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.kpi-card::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 3px;
  background: linear-gradient(90deg, #2563eb, #14b8a6, #f97316);
  opacity: 0.75;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.kpi-card.dark-mode {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.card-body {
  padding: 1rem;
  position: relative;
  z-index: 1;
  min-width: 0;
}

.kpi-header {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
}

.icon-blue { background: rgba(37, 99, 235, 0.09); color: #2563eb; }
.icon-violet { background: rgba(124, 58, 237, 0.09); color: #7c3aed; }
.icon-orange { background: rgba(249, 115, 22, 0.11); color: #f97316; }
.icon-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.icon-sky { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; }
.icon-rose { background: rgba(244, 63, 94, 0.1); color: #f43f5e; }
.icon-mint { background: rgba(20, 184, 166, 0.1); color: #14b8a6; }

.kpi-value {
  font-size: clamp(1.45rem, 1.8vw, 1.85rem);
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.dark-mode .kpi-value {
  color: #f1f5f9;
}

.kpi-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  margin-top: 0.25rem;
  line-height: 1.25;
  overflow-wrap: normal;
  word-break: normal;
  hyphens: none;
}

.dark-mode .kpi-label {
  color: #e2e8f0;
}

.kpi-subtitle {
  color: #64748b;
  font-size: 0.68rem;
  margin-top: 0.1rem;
}

.dark-mode .kpi-subtitle {
  color: #94a3b8;
}

.skeleton-value {
  height: 1.8rem;
  width: 60%;
  border-radius: 6px;
}

.skeleton-pulse {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
}

.dark-mode .skeleton-pulse {
  background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
  background-size: 200% 100%;
}

@keyframes pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
