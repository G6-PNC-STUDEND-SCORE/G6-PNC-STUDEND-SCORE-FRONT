<template>
  <div class="placeholder-page">
    <div class="placeholder-card">
      <div class="icon-wrap">
        <i :class="iconClass"></i>
      </div>
      <h1>{{ title }}</h1>
      <p>This page is under development. Check back soon!</p>
      <router-link to="/dashboard" class="back-link">
        <i class="bi bi-arrow-left me-2"></i>
        Back to Dashboard
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => {
  return (route.meta?.title as string) || 'Page'
})

const iconMap: Record<string, string> = {
  classes: 'bi bi-people-fill',
  subjects: 'bi bi-book-fill',
  students: 'bi bi-person-badge-fill',
  scores: 'bi bi-clipboard-data-fill',
  reports: 'bi bi-file-earmark-bar-graph-fill',
  users: 'bi bi-person-fill',
  roles: 'bi bi-shield-lock-fill',
}

const iconClass = computed(() => {
  return iconMap[route.name as string] || 'bi bi-file-earmark'
})
</script>

<style scoped>
.placeholder-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.placeholder-card {
  text-align: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 48px 40px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 18px rgba(15, 23, 42, 0.04);
}

.icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.icon-wrap i {
  font-size: 2rem;
  color: #1565d8;
}

h1 {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
}

p {
  color: #64748b;
  font-size: 14px;
  margin: 0 0 24px;
  line-height: 1.5;
}

.back-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: #1565d8;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  transition: all 0.15s ease;
}

.back-link:hover {
  background: #eff6ff;
}
</style>
