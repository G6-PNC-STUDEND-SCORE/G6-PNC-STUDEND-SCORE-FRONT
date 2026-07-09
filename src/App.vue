<template>
<<<<<<< HEAD
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
=======
  <div class="app-layout">
    <Navigation v-if="showSidebar" />
    <main class="main-content" :class="{ 'with-sidebar': showSidebar }">
      <router-view />
>>>>>>> e6ce300496dc71640e459534c2e098c9970f1676
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
<<<<<<< HEAD
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
=======
import { useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'

const route = useRoute()

const publicPages = ['login']
const showSidebar = computed(() => !publicPages.includes(String(route.name)))
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  min-height: 100vh;
  background: #f0f2f5;
}

.main-content.with-sidebar {
  padding-left: 220px;
>>>>>>> e6ce300496dc71640e459534c2e098c9970f1676
}
</style>
