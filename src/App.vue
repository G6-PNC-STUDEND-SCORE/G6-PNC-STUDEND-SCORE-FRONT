<template>
  <div class="app-layout">
    <Navigation v-if="showSidebar" />
    <div class="content-wrapper" :class="{ 'with-sidebar': showSidebar }" :style="showSidebar ? { marginLeft: sidebarMargin } : {}">
      <Header v-if="showSidebar" />
      <main :class="['main-content', { 'dark-mode': theme.isDark && route.name !== 'login' }]">
        <div class="page-transition">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from './stores/theme.ts'
import { useSidebarStore } from './stores/sidebar.ts'
import Navigation from './components/Navigation.vue'
import Header from './layouts/Header.vue'

const route = useRoute()
const theme = useThemeStore()
const sidebar = useSidebarStore()

const publicPages = ['login']
const showSidebar = computed(() => !publicPages.includes(String(route.name)))

const sidebarMargin = computed(() =>
  sidebar.collapsed ? sidebar.SIDEBAR_COLLAPSED_WIDTH + 'px' : sidebar.SIDEBAR_WIDTH + 'px'
)
</script>

<style>
/* ══════════════════════════════════════════════════════════════
   🌈 CSS CUSTOM PROPERTIES — Complete Dark/Light Theming System
   ══════════════════════════════════════════════════════════════ */
:root {
  --transition-theme: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: 0.2s ease;
  --transition-bounce: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ── Light Mode Colors ── */
  --bg-body: #f0f2f5;
  --bg-card: #ffffff;
  --bg-card-hover: #fafbfc;
  --bg-sidebar: #ffffff;
  --bg-header: rgba(255, 255, 255, 0.72);
  --bg-input: #ffffff;
  --bg-dropdown: #ffffff;
  --bg-modal: #ffffff;
  --bg-tooltip: #1e293b;
  --bg-accent: #eef2ff;
  --bg-accent-hover: #e8f1ff;
  --bg-hover: #f8fafc;
  --bg-danger: #fef2f2;
  --bg-success: #f0fdf4;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  --text-muted: #94a3b8;
  --text-inverse: #ffffff;
  --text-link: #2563eb;
  --text-link-hover: #1d4ed8;
  --text-danger: #ef4444;
  --text-success: #10b981;
  --text-warning: #f59e0b;

  --border-color: #e2e8f0;
  --border-color-light: #f1f5f9;
  --border-color-accent: #dbeafe;
  --border-color-hover: #93c5fd;

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 20px -5px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.12);
  --shadow-glow-blue: 0 8px 30px rgba(59, 130, 246, 0.12);

  --accent-primary: #2563eb;
  --accent-primary-light: #60a5fa;
  --accent-secondary: #7c3aed;
  --accent-success: #10b981;
  --accent-warning: #f59e0b;
  --accent-danger: #ef4444;
  --accent-info: #0ea5e9;

  --scrollbar-thumb: #cbd5e1;
  --scrollbar-thumb-hover: #94a3b8;

  --gradient-primary: linear-gradient(135deg, #eef2ff, #dbeafe);
  --gradient-accent: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.06));
  --gradient-danger: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.06));
  --gradient-success: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.06));
  --gradient-header: linear-gradient(135deg, rgba(59, 130, 246, 0.04), rgba(139, 92, 246, 0.04));
}

/* ── Dark Mode Theme ── */
[data-theme="dark"] {
  --bg-body: #0f172a;
  --bg-card: rgba(30, 41, 59, 0.95);
  --bg-card-hover: rgba(30, 41, 59, 0.98);
  --bg-sidebar: linear-gradient(180deg, #1e293b 0%, #162032 100%);
  --bg-header: rgba(30, 41, 59, 0.82);
  --bg-input: #1e293b;
  --bg-dropdown: #1e293b;
  --bg-modal: #1e293b;
  --bg-tooltip: #f1f5f9;
  --bg-accent: rgba(59, 130, 246, 0.15);
  --bg-accent-hover: rgba(59, 130, 246, 0.2);
  --bg-hover: rgba(51, 65, 85, 0.3);
  --bg-danger: rgba(239, 68, 68, 0.12);
  --bg-success: rgba(16, 185, 129, 0.12);

  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --text-muted: #64748b;
  --text-inverse: #0f172a;
  --text-link: #60a5fa;
  --text-link-hover: #93c5fd;
  --text-danger: #f87171;
  --text-success: #34d399;
  --text-warning: #fbbf24;

  --border-color: rgba(71, 85, 105, 0.5);
  --border-color-light: rgba(51, 65, 85, 0.3);
  --border-color-accent: rgba(59, 130, 246, 0.2);
  --border-color-hover: rgba(96, 165, 250, 0.3);

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.15);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 30px -5px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.45);
  --shadow-glow-blue: 0 8px 30px rgba(59, 130, 246, 0.08);

  --accent-primary: #3b82f6;
  --accent-primary-light: #93c5fd;
  --accent-secondary: #8b5cf6;
  --accent-success: #34d399;
  --accent-warning: #fbbf24;
  --accent-danger: #f87171;
  --accent-info: #38bdf8;

  --scrollbar-thumb: #475569;
  --scrollbar-thumb-hover: #64748b;

  --gradient-primary: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.15));
  --gradient-accent: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08));
  --gradient-danger: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08));
  --gradient-success: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08));
  --gradient-header: linear-gradient(135deg, rgba(96, 165, 250, 0.06), rgba(167, 139, 250, 0.06));
}

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Smooth transitions for all themed elements */
html {
  background: #f0f2f5;
  transition: background var(--transition-theme);
}

html[data-theme="dark"] {
  background: #0f172a;
}

body {
  min-height: 100vh;
}

.app-layout {
  display: flex;
  min-height: 100vh;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content {
  flex: 1;
  background: var(--bg-body);
  padding: 20px;
  overflow-y: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
  transition: background var(--transition-theme);
}

.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: content-box;
  transition: background var(--transition-theme), border-color var(--transition-theme);
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
  background-clip: content-box;
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
  background: var(--gradient-primary);
  color: var(--accent-primary);
  border-radius: 12px;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.page-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
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
  background: var(--bg-card);
  border-radius: 16px;
  border: 1.5px dashed var(--border-color);
  transition: all var(--transition-theme);
}

.empty-state-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--gradient-primary);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transition: all var(--transition-theme);
}

.empty-state h5 {
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--text-tertiary);
}

/* ── Page Transition Wrapper ── */
.page-transition {
  animation: pageEnter 0.3s ease-out;
}

@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Card Base Styles ── */
.card {
  background: var(--bg-card);
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-theme);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

/* ── Dark Mode Enhanced (kept for backward compat + extra effects) ── */
.main-content.dark-mode {
  background: linear-gradient(180deg, #0f172a 0%, #0b1120 50%, #0a0f1a 100%);
}

.main-content.dark-mode .empty-state {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.main-content.dark-mode .empty-state-icon {
  box-shadow: 0 0 25px rgba(59, 130, 246, 0.12);
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
