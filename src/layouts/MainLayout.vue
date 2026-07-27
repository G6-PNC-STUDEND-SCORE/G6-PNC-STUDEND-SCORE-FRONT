<template>
  <div class="app-layout">
    <Navigation />
    <div class="content-wrapper with-sidebar" :style="{ marginLeft: sidebarMargin }">
      <Header />
      <main class="main-content" :class="{ 'no-scroll': (SELF_MANAGED_SCROLL_PAGES as readonly string[]).includes(String(route.name)) }">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import { SELF_MANAGED_SCROLL_PAGES } from '@/constants'
import Navigation from '@/components/Navigation.vue'
import Header from '@/layouts/Header.vue'

const route = useRoute()
const sidebar = useSidebarStore()

const sidebarMargin = computed(() =>
  sidebar.collapsed ? sidebar.SIDEBAR_COLLAPSED_WIDTH + 'px' : sidebar.SIDEBAR_WIDTH + 'px',
)
</script>
