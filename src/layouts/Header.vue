<template>
  <header :class="['app-header', 'd-flex', 'align-items-center', 'justify-content-between', { 'dark-mode': theme.isDark }]">
    <div class="d-flex align-items-center gap-2">
      <span class="welcome-text">
        <i class="bi bi-hand-wave me-1"></i>
        {{ t('welcome') }}, {{ pageTitle }}
      </span>
    </div>

    <div class="d-flex align-items-center gap-3">
      <!-- Language Switcher -->
      <LanguageSwitcher />

      <!-- Theme Toggle -->
      <button
        class="toggle-btn theme-toggle d-flex align-items-center justify-content-center"
        @click="theme.toggle()"
        :title="theme.isDark ? 'Switch to Light mode' : 'Switch to Dark mode'"
      >
        <i v-if="theme.isDark" class="bi bi-moon-stars-fill"></i>
        <i v-else class="bi bi-sun-fill"></i>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const route = useRoute()
const { t } = useI18n()
const auth = useAuthStore()
const theme = useThemeStore()

const userName = computed(() => auth.user?.name || 'User')

const pageTitle = computed(() => {
  const metaTitle = route.meta.title as string
  if (metaTitle) {
    const translationKey = metaTitle.toLowerCase().replace(/\s+/g, '')
    const translated = t(`nav.${translationKey}`)
    return translated !== `nav.${translationKey}` ? translated : metaTitle
  }
  return 'Dashboard'
})
</script>

<style scoped>
.app-header {
  height: 56px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 10;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.app-header.dark-mode {
  background: #1e293b;
  border-bottom-color: #334155;
}

.welcome-text {
  color: #334155;
  font-size: 0.92rem;
  line-height: 56px;
  transition: color 0.3s ease;
}




.app-header.dark-mode .welcome-text {
  color: #cbd5e1;
}

.welcome-text strong {
  color: #0f172a;
  transition: color 0.3s ease;
}

.app-header.dark-mode .welcome-text strong {
  color: #f1f5f9;
}

.welcome-text i {
  color: #f59e0b;
}

/* Toggle button base */
.toggle-btn {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 10px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 500;
  outline: none;
  user-select: none;
}

.toggle-btn:hover {
  border-color: #2563eb;
  background: #f8faff;
  color: #2563eb;
}

.toggle-btn:active {
  transform: scale(0.96);
}

.app-header.dark-mode .toggle-btn {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.app-header.dark-mode .toggle-btn:hover {
  border-color: #60a5fa;
  background: #1e293b;
  color: #60a5fa;
}

/* Theme toggle specific */
.theme-toggle {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 10px;
}

.theme-toggle i {
  font-size: 1rem;
}

.app-header.dark-mode .theme-toggle i {
  color: #fbbf24;
}
</style>
