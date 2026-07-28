<template>
  <div :class="['py-4', { 'dark-mode': isDark }]">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <Settings :size="22" />
        </div>
        <div>
          <h2 class="page-title">Settings</h2>
          <p class="page-subtitle">Manage your application preferences</p>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <h5>Appearance</h5>
      <p class="text-secondary">Theme and display settings coming soon.</p>
    </div>
    <div class="settings-section">
      <h5>Notifications</h5>
      <p class="text-secondary">Notification preferences coming soon.</p>
    </div>
    <div class="settings-section">
      <h5>Language</h5>
      <p class="text-secondary">Language settings coming soon.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { Settings } from '@lucide/vue'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)
</script>

<style scoped>
.page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.settings-section {
  background: #f8fafc;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
}
.settings-section h5 {
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}
.settings-section p {
  font-size: 0.875rem;
  margin: 0;
}

/* Dark mode */
.dark-mode .page-title { color: #f1f5f9; }
.dark-mode .page-subtitle { color: #94a3b8; }
.dark-mode .settings-section {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
}
.dark-mode .settings-section h5 { color: #f1f5f9; }
.dark-mode .settings-section .text-secondary { color: #94a3b8 !important; }
</style>
