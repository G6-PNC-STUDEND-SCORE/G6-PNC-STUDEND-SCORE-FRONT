<template>
  <div class="py-4">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <FileText :size="22" />
        </div>
        <div>
          <h2 class="page-title">Reports</h2>
          <p class="page-subtitle">Generate and view reports</p>
        </div>
      </div>
    </div>
    <div class="empty-state">
      <div class="empty-state-icon">
        <Inbox :size="24" />
      </div>
      <h5>Reports</h5>
      <p class="text-secondary">Report generation features coming soon.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileText, Inbox } from '@lucide/vue'
</script>

<style scoped>
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
</style>
