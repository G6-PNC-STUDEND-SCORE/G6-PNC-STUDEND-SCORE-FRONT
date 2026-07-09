<template>
  <div class="page-header" :class="{ 'dark-mode': theme.isDark }">
    <div class="header-content">
      <div class="welcome-section">
        <span class="welcome-icon">
          <i class="bi bi-hand-wave"></i>
        </span>
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>
      
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <ol class="breadcrumb-list">
          <li 
            v-for="(item, index) in breadcrumbItems" 
            :key="index" 
            class="breadcrumb-item"
            :class="{ 'active': index === breadcrumbItems.length - 1 }"
          >
            <RouterLink 
              v-if="index < breadcrumbItems.length - 1" 
              :to="item.path"
              class="breadcrumb-link"
            >
              {{ item.title }}
            </RouterLink>
            <span v-else>{{ item.title }}</span>
          </li>
        </ol>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const theme = useThemeStore()

interface BreadcrumbItem {
  title: string
  path: string
}

const pageTitle = computed(() => {
  const metaTitle = route.meta.title as string
  if (metaTitle) {
    // Try to get translation, fallback to meta title
    const translationKey = metaTitle.toLowerCase().replace(/\s+/g, '')
    const translated = t(`nav.${translationKey}`)
    return translated !== `nav.${translationKey}` ? translated : metaTitle
  }
  return 'Dashboard'
})

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = []
  
  // Always add Dashboard as first item
  items.push({
    title: t('dashboard'),
    path: '/dashboard'
  })
  
  // Add current page if not dashboard
  if (route.path !== '/dashboard' && route.meta.title) {
    items.push({
      title: pageTitle.value,
      path: route.path
    })
  }
  
  return items
})
</script>

<style scoped>
.page-header {
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
  padding: 16px 24px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.page-header.dark-mode {
  background: #1e293b;
  border-bottom-color: #334155;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.welcome-icon {
  font-size: 24px;
  color: #f59e0b;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  transition: color 0.3s ease;
}

.page-header.dark-mode .page-title {
  color: #f1f5f9;
}

.breadcrumb {
  padding: 0;
  margin: 0;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 8px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #64748b;
}

.breadcrumb-item:not(:last-child)::after {
  content: '/';
  margin-left: 8px;
  color: #94a3b8;
}

.breadcrumb-item.active {
  color: #1f2937;
  font-weight: 500;
}

.page-header.dark-mode .breadcrumb-item.active {
  color: #f1f5f9;
}

.breadcrumb-link {
  color: #64748b;
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: #3b82f6;
}

.page-header.dark-mode .breadcrumb-link {
  color: #94a3b8;
}

.page-header.dark-mode .breadcrumb-link:hover {
  color: #60a5fa;
}
</style>
