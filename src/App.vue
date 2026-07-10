<template>
  <div
    :class="[
      showSidebar ? 'app-shell d-flex vh-100 overflow-hidden' : 'min-vh-100',
      'layout-page',
      { 'dark-mode': theme.isDark },
    ]"
  >
    <Navigation v-if="showSidebar" class="flex-shrink-0" />

    <main :class="showSidebar ? 'app-main flex-grow-1 overflow-auto' : ''">
      <AppHeader v-if="showSidebar" />
      <div class="router-wrap" v-if="showSidebar">
        <RouterView />
      </div>
      <RouterView v-else />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import Navigation from './components/Navigation.vue'
import AppHeader from './layouts/header.vue'
import { useThemeStore } from './stores/theme'

const route = useRoute()
const theme = useThemeStore()
const showSidebar = computed(() => route.path !== '/login')
</script>

<style scoped>
.app-main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.router-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.layout-page {
  transition: background-color 0.3s ease;
}

.layout-page {
  background-color: #f1f5f9;
}

.layout-page.dark-mode {
  background-color: #0f172a;
}
</style>
