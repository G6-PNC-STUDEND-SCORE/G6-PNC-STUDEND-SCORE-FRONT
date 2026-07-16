<template>
  <span>{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  value: number
  duration?: number
  decimals?: number
}>()

const displayValue = ref('0')
let animationId: number | null = null

function animate() {
  if (animationId) cancelAnimationFrame(animationId)
  const startTime = performance.now()
  const startValue = 0
  const endValue = props.value
  const dur = props.duration ?? 1200
  const dec = props.decimals ?? 0

  function step(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / dur, 1)
    // Ease-out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = startValue + (endValue - startValue) * eased

    displayValue.value = current.toLocaleString(undefined, {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    })

    if (progress < 1) {
      animationId = requestAnimationFrame(step)
    }
  }

  animationId = requestAnimationFrame(step)
}

watch(() => props.value, animate, { immediate: true })

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>
