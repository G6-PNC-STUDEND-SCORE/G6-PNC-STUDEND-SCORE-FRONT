<template>
  <component
    :is="to ? 'router-link' : 'div'"
    :to="to"
    :class="['kpi-card', { 'dark-mode': isDark, 'kpi-clickable': !!to }]"
  >
    <div class="kpi-glow"></div>
    <div class="kpi-bg-pattern"></div>
    <span v-if="subtitle" class="kpi-badge">{{ subtitle }}</span>
    <div class="kpi-content">
      <div class="kpi-top">
        <div class="kpi-icon-wrap" :class="iconClass">
          <component :is="resolvedIcon" :size="20" />
        </div>
      </div>
      <div class="kpi-value">
        <template v-if="!loading">
          <AnimatedNumber :value="value" :decimals="decimals" />
          <span v-if="suffix" class="kpi-suffix">{{ suffix }}</span>
        </template>
        <div v-else class="skeleton-value skeleton-pulse" />
      </div>
      <div class="kpi-label">{{ label }}</div>
      <div v-if="description" class="kpi-desc">{{ description }}</div>
    </div>
  </component>
</template>

<script setup lang="ts">
import AnimatedNumber from './AnimatedNumber.vue'
import { useThemeStore } from '@/stores/theme'
import { computed, type Component } from 'vue'
import {
  GraduationCap,
  UserCheck,
  Users,
  BarChart3,
  BookOpen,
  CalendarCheck,
  GitBranch,
  Building2,
} from '@lucide/vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const props = withDefaults(defineProps<{
  label: string
  value: number
  icon: string
  iconClass: string
  subtitle?: string
  suffix?: string
  description?: string
  decimals?: number
  loading?: boolean
  to?: string
}>(), {
  subtitle: '',
  suffix: '',
  description: '',
  decimals: 0,
  loading: false,
  to: undefined,
})

const iconMap: Record<string, Component> = {
  'mortarboard': GraduationCap,
  'person-check': UserCheck,
  'people': Users,
  'bar-chart': BarChart3,
  'book': BookOpen,
  'calendar-check': CalendarCheck,
  'diagram-3': GitBranch,
  'building': Building2,
  'trending-up': BarChart3,
}

const resolvedIcon = computed(() => iconMap[props.icon] || BookOpen)
</script>

<style scoped>
.kpi-card {
  position: relative;
  background: #ffffff;
  border-radius: 20px;
  padding: 1.25rem;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(15, 23, 42, 0.03);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  min-height: 140px;
  cursor: default;
}

.kpi-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 1.5px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3), transparent 60%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.kpi-card:hover::before {
  opacity: 1;
}

.kpi-card:hover {
  transform: translateY(-6px);
  box-shadow:
    0 8px 30px rgba(59, 130, 246, 0.12),
    0 20px 60px rgba(15, 23, 42, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
}

.kpi-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.kpi-card:hover .kpi-glow {
  opacity: 1;
}

.kpi-bg-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
  pointer-events: none;
}

.kpi-content {
  position: relative;
  z-index: 1;
}

.kpi-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.15);
  white-space: nowrap;
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 2;
}

.kpi-top {
  display: flex;
  align-items: center;
  margin-bottom: 0.85rem;
}

.kpi-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.kpi-card:hover .kpi-icon-wrap {
  transform: scale(1.08);
}

.icon-blue { background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06)); color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15); }
.icon-green { background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.06)); color: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15); }
.icon-violet { background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.06)); color: #8b5cf6; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15); }
.icon-orange { background: linear-gradient(135deg, rgba(249, 115, 22, 0.12), rgba(249, 115, 22, 0.06)); color: #f97316; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15); }
.icon-sky { background: linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(14, 165, 233, 0.06)); color: #0ea5e9; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15); }
.icon-rose { background: linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(244, 63, 94, 0.06)); color: #f43f5e; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.15); }
.icon-mint { background: linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(20, 184, 166, 0.06)); color: #14b8a6; box-shadow: 0 4px 12px rgba(20, 184, 166, 0.15); }
.icon-amber { background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.06)); color: #f59e0b; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15); }

.kpi-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.15);
  white-space: nowrap;
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1;
  color: #0f172a;
  letter-spacing: -0.03em;
  overflow-wrap: anywhere;
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
}

.kpi-suffix {
  font-size: 1rem;
  font-weight: 600;
  color: #94a3b8;
}

.dark-mode .kpi-suffix {
  color: #64748b;
}

.dark-mode .kpi-value {
  color: #f1f5f9;
}

.kpi-label {
  font-size: 0.77rem;
  font-weight: 600;
  color: #94a3b8;
  margin-top: 0.3rem;
  line-height: 1.25;
  letter-spacing: 0.01em;
}

.dark-mode .kpi-label {
  color: #94a3b8;
}

.kpi-desc {
  font-size: 0.72rem;
  font-weight: 500;
  color: #94a3b8;
  margin-top: 0.15rem;
  line-height: 1.3;
  letter-spacing: 0.01em;
}

.dark-mode .kpi-desc {
  color: #64748b;
}

.kpi-card.dark-mode {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(30, 41, 59, 0.96));
  border-color: rgba(71, 85, 105, 0.3);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.1);
}

.kpi-card.dark-mode::before {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(167, 139, 250, 0.3), transparent 60%);
}

.kpi-card.dark-mode:hover {
  border-color: rgba(96, 165, 250, 0.2);
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.35),
    0 20px 60px rgba(0, 0, 0, 0.25);
}

.kpi-card.kpi-clickable {
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: block;
}

.kpi-card.kpi-clickable:hover {
  transform: translateY(-6px) scale(1.02);
}

.kpi-card.dark-mode .kpi-glow {
  background: radial-gradient(circle, rgba(96, 165, 250, 0.06) 0%, transparent 70%);
}

.dark-mode .kpi-badge {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(16, 185, 129, 0.08));
  border-color: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}

.skeleton-value {
  height: 1.75rem;
  width: 60%;
  border-radius: 8px;
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
