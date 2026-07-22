<template>
  <div class="app-layout">
    <Navigation v-if="showSidebar" />
    <div class="content-wrapper" :class="{ 'with-sidebar': showSidebar }" :style="showSidebar ? { marginLeft: sidebarMargin } : {}">
      <Header v-if="showSidebar" />
      <main class="main-content">
        <router-view />
      </main>
    </div>

    <!-- Login Success Toast -->
    <Transition name="toast-slide">
      <div v-if="showToast" class="login-toast" @click="dismissToast">
        <div class="toast-icon">
          <CheckIcon :size="20" />
        </div>
        <div class="toast-content">
          <div class="toast-title">Welcome!</div>
          <div class="toast-message">{{ toastMessage }}</div>
        </div>
        <div class="toast-progress" :style="{ animationDuration: '5s' }"></div>
        <button class="toast-close" @click.stop="dismissToast">
          <XIcon :size="16" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth.ts'
import { useSidebarStore } from './stores/sidebar.ts'
import router from './router/index.ts'
import Navigation from './components/Navigation.vue'
import Header from './layouts/Header.vue'
import { Check as CheckIcon, X as XIcon } from 'lucide-vue-next'

const route = useRoute()
const sidebar = useSidebarStore()
const auth = useAuthStore()

const publicPages = ['login']
const showSidebar = computed(() => !publicPages.includes(String(route.name)))

const sidebarMargin = computed(() =>
  sidebar.collapsed ? sidebar.SIDEBAR_COLLAPSED_WIDTH + 'px' : sidebar.SIDEBAR_WIDTH + 'px'
)

// ── Toast State ──
const showToast = ref(false)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showLoginToast(message: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toastMessage.value = message
  showToast.value = true

  toastTimer = setTimeout(() => {
    showToast.value = false
    auth.clearLoginMessage()
  }, 5000)
}

function dismissToast() {
  showToast.value = false
  auth.clearLoginMessage()
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
}

// Use the router's afterEach hook — fires reliably after EVERY navigation completes
onMounted(() => {
  const removeAfterEach = router.afterEach((to, from) => {
    if (from.name === 'login' && auth.loginMessage) {
      showLoginToast(auth.loginMessage)
    }
  })

  onUnmounted(removeAfterEach)
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
})
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
  height: 100vh;
  overflow: hidden;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content {
  flex: 1;
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
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

/* ── Login Success Toast ── */
.login-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 999999;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px 16px 18px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.06),
    0 20px 40px -8px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(226, 232, 240, 0.8);
  max-width: 400px;
  min-width: 300px;
  cursor: pointer;
  overflow: hidden;
  animation: toastBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes toastBounceIn {
  0% {
    opacity: 0;
    transform: translateX(60px) scale(0.92);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Progress bar at the bottom */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 0 0 0 16px;
  animation: toastShrink 5s linear forwards;
}

@keyframes toastShrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.toast-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  animation: toastIconPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
}

@keyframes toastIconPop {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
}

.toast-message {
  font-size: 0.8125rem;
  color: #475569;
  line-height: 1.4;
}

.toast-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  flex-shrink: 0;
  transition: all 0.2s ease;
  margin-top: 2px;
}

.toast-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.toast-close:active {
  transform: scale(0.9);
}

/* Toast transition for leaving */
.toast-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(60px) scale(0.92);
}

/* Toast hover effect */
.login-toast:hover {
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 24px 48px -8px rgba(0, 0, 0, 0.16);
}

.login-toast:hover .toast-progress {
  animation-play-state: paused;
}

@media (max-width: 480px) {
  .login-toast {
    top: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
    min-width: 0;
  }
}
</style>
