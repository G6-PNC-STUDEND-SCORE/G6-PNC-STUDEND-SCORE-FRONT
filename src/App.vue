<template>
  <div class="app-layout">
    <Navigation v-if="showSidebar" />
    <div class="content-wrapper" :class="{ 'with-sidebar': showSidebar }" :style="showSidebar ? { marginLeft: sidebarMargin } : {}">
      <Header v-if="showSidebar" />
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from './stores/sidebar.ts'
import Navigation from './components/Navigation.vue'
import Header from './layouts/Header.vue'

const route = useRoute()
const sidebar = useSidebarStore()

const publicPages = ['login']
const showSidebar = computed(() => !publicPages.includes(String(route.name)))

const sidebarMargin = computed(() =>
  sidebar.collapsed ? sidebar.SIDEBAR_COLLAPSED_WIDTH + 'px' : sidebar.SIDEBAR_WIDTH + 'px'
)
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

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}


.main-content {
  flex: 1;
  background: #f0f2f5;
  padding: 20px;
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
  font-size: 1.5rem;
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

@media (max-width: 767.98px) {
  .main-content.with-sidebar {
    padding-left: 0;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
