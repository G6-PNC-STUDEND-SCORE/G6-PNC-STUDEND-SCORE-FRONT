<template>
  <div class="echart-wrapper">
    <VChart
      v-if="ready"
      ref="chartRef"
      :option="chartOption"
      :theme="chartTheme"
      autoresize
      class="chart-instance"
    />
    <div v-else class="skeleton-chart">
      <div class="skeleton-pulse skeleton-bar" />
      <div class="skeleton-pulse skeleton-bar" />
      <div class="skeleton-pulse skeleton-bar" />
      <div class="skeleton-pulse skeleton-bar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart, RadarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
} from 'echarts/components'
import type { EChartsOption } from 'echarts'
import { useThemeStore } from '@/stores/theme'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
])

const props = withDefaults(defineProps<{
  option: EChartsOption
  height?: string
  loading?: boolean
}>(), {
  height: '300px',
  loading: false,
})

const themeStore = useThemeStore()
const ready = computed(() => !props.loading && props.option?.series != null)
const chartTheme = computed(() => themeStore.isDark ? 'dark' : '')

const chartOption = computed<EChartsOption>(() => ({
  ...props.option,
  backgroundColor: 'transparent',
  animationDuration: 800,
  animationEasing: 'cubicOut',
}))
</script>

<style scoped>
.echart-wrapper {
  position: relative;
  width: 100%;
  height: v-bind(height);
  min-height: 200px;
}

.chart-instance {
  width: 100%;
  height: 100%;
}

.skeleton-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  height: 100%;
  justify-content: flex-end;
}

.skeleton-pulse {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: pulse 1.5s ease-in-out infinite;
  border-radius: 6px;
}

.dark-mode .skeleton-pulse {
  background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
  background-size: 200% 100%;
}

.skeleton-bar {
  height: 20px;
  width: 100%;
}

.skeleton-bar:nth-child(1) { width: 85%; }
.skeleton-bar:nth-child(2) { width: 70%; }
.skeleton-bar:nth-child(3) { width: 55%; }
.skeleton-bar:nth-child(4) { width: 40%; }

@keyframes pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
