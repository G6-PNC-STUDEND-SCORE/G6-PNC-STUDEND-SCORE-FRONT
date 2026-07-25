<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <slot name="icon"><Inbox :size="24" /></slot>
    </div>
    <h5>{{ title }}</h5>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { Inbox } from '@lucide/vue'

defineProps<{
  title: string
  message?: string
}>()
</script>

<!--
  No scoped styles here on purpose — this relies on the .empty-state /
  .empty-state-icon classes already defined globally in App.vue, instead of
  every page redefining its own copy.
-->
