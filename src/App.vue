<template>
  <div class="app-layout">
    <Navigation v-if="showSidebar" />
    <main class="main-content" :class="{ 'with-sidebar': showSidebar }">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
}
</style>