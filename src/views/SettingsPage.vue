<template>
  <div class="py-4">
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
import { Settings } from '@lucide/vue'
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
</style>
