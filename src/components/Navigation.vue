<template>
  <!-- Mobile backdrop -->
  <Transition name="backdrop">
    <div
      v-if="sidebar.mobileOpen"
      class="sidebar-backdrop"
      @click="sidebar.closeMobile()"
      @touchmove.prevent
    ></div>
  </Transition>

  <aside
    :class="[
      'sidebar',
      { collapsed: sidebar.collapsed },
      { 'mobile-open': sidebar.mobileOpen }
    ]"
  >
    <div :class="['logo', sidebar.collapsed ? 'logo-collapsed' : 'logo-expanded', 'border-bottom']">
      <div class="sidebar-logo-wrap">
        <img src="https://www.passerellesnumeriques.org/wp-content/uploads/2024/05/PN-Logo-English-Blue-Baseline.png" alt="Passerelles Numériques Cambodia" class="sidebar-logo">
      </div>
      <div class="sidebar-brand-text">
        <span class="brand-name">Passerelles</span>
        <span class="brand-name">Numériques</span>
      </div>
    </div>

    <nav class="px-2 py-2 flex-grow-1">
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        :class="['sidebar-link', { collapsed: sidebar.collapsed }]"
        :title="sidebar.collapsed ? link.label : ''"
        @click="sidebar.closeMobile()"
      >
        <component :is="link.icon" :size="20" />
        <span class="sidebar-link-text">{{ link.label }}</span>
      </RouterLink>

      <template v-if="settingsLinks.length > 0">
        <h6 class="menu-title mt-3 mb-2">Settings</h6>

        <RouterLink
          v-for="link in settingsLinks"
          :key="link.to"
          :to="link.to"
          :class="['sidebar-link', { collapsed: sidebar.collapsed }]"
          :title="sidebar.collapsed ? link.label : ''"
          @click="sidebar.closeMobile()"
        >
          <component :is="link.icon" :size="20" />
          <span class="sidebar-link-text">{{ link.label }}</span>
        </RouterLink>
      </template>
    </nav>

    <div class="toggle-wrap">
      <button class="sidebar-toggle" @click="sidebar.toggle()" :title="sidebar.collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
        <ChevronLeft :size="16" :class="{ 'flip': sidebar.collapsed }" />
        <span class="toggle-label">{{ sidebar.collapsed ? 'Expand' : 'Collapse' }}</span>
      </button>
    </div>

    <div class="border-top">
      <div :class="['user-section', 'd-flex', 'align-items-center', sidebar.collapsed ? 'justify-content-center px-0 py-2' : 'justify-content-between px-3 py-2', { 'user-section-active': isProfileActive }]">
        <div
          class="user d-flex align-items-center"
          :class="[
            { 'justify-content-center': sidebar.collapsed },
            { 'user-active': isProfileActive }
          ]"
          @click="goToProfile"
          @mouseenter="onUserMouseEnter"
          @touchstart.passive="onUserMouseEnter"
          @keydown.enter.prevent="goToProfile"
          role="button"
          tabindex="0"
          :title="sidebar.collapsed ? 'Profile' : ''"
        >
          <div class="avatar">
            <img v-if="userAvatarUrl" :src="userAvatarUrl" class="avatar-img" alt="avatar" />
            <span v-else class="initials">{{ getUserInitials(auth.user?.name) }}</span>
          </div>
          <div class="ms-2 user-text">
            <h6 class="mb-0 fw-bold text-truncate">{{ auth.user?.name }}</h6>
            <small class="text-secondary">{{ auth.user?.role }}</small>
          </div>
        </div>
        <button class="logout-icon-btn" @click="showLogoutModal = true" title="Logout">
          <LogOut :size="18" />
        </button>
      </div>
    </div>

  </aside>

  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showLogoutModal"
        class="modal-overlay"
        @click.self="showLogoutModal = false"
        ref="modalOverlayRef"
      >
        <div
          class="logout-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          @keydown.escape="showLogoutModal = false"
          @keydown.tab.prevent="trapFocus"
        >
          <div class="logout-modal-header">
            <div class="logout-icon-wrap">
              <LogOut :size="20" />
            </div>
            <h3 id="logout-title" class="logout-title">Confirm Logout</h3>
            <button class="logout-close-btn" @click="showLogoutModal = false" aria-label="Close modal">
              <X :size="18" />
            </button>
          </div>

          <div class="logout-modal-body">
            <p class="logout-message">Are you sure you want to log out?</p>
          </div>

          <div class="logout-modal-footer">
            <button class="logout-btn logout-btn-cancel" @click="showLogoutModal = false" ref="cancelBtnRef">
              <X :size="16" />
              Cancel
            </button>
            <button class="logout-btn logout-btn-confirm" @click="handleLogout" ref="confirmBtnRef">
              <LogOut :size="16" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'
import { storageUrl } from '@/services/apiHttp'
import { getUserInitials } from '@/utils'
import { getProfile } from '@/services/profileService'
import { cacheService } from '@/services/cacheService'
import {
  LayoutDashboard, Users, BookOpen, UserCheck,
  GraduationCap, ClipboardList, FileText, History,
  User, Shield, LogOut, X, ChevronLeft,
} from '@lucide/vue'
import type { Component } from 'vue'

const PROFILE_CACHE_KEY = 'user_profile_data'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const sidebar = useSidebarStore()

let profilePreloaded = false

const isProfileActive = computed(() => route.path === '/profile')

const userAvatarUrl = computed(() => storageUrl((auth.user?.avatar as string | undefined) ?? null))
const showLogoutModal = ref(false)
const modalOverlayRef = ref<HTMLElement | null>(null)
const confirmBtnRef = ref<HTMLButtonElement | null>(null)
const cancelBtnRef = ref<HTMLButtonElement | null>(null)

// ── Preload profile data in background so clicking profile is instant ──
async function preloadProfile() {
  if (profilePreloaded) return
  profilePreloaded = true
  // Preload the UserProfile component (dynamic import triggers lazy loading)
  import('@/views/UserProfile.vue').catch(() => {})
  // Pre-fetch the profile data and cache it
  try {
    const profile = await getProfile()
    cacheService.set(PROFILE_CACHE_KEY, profile, 5 * 60_000) // 5 min cache
  } catch {
    // Silently fail — UserProfile will fetch on its own
  }
}

// Preload on hover over the user section (mouseenter)
function onUserMouseEnter() {
  preloadProfile()
}

watch(showLogoutModal, (val) => {
  if (val) {
    nextTick(() => confirmBtnRef.value?.focus())
  }
})

function trapFocus(e: KeyboardEvent) {
  const focusable = [cancelBtnRef.value, confirmBtnRef.value].filter(Boolean) as HTMLElement[]
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus()
  }
}

interface NavLink {
  to: string
  label: string
  icon: Component
  permission?: string
}

const navLinks = computed<NavLink[]>(() => {
  if (auth.user?.role === 'student') {
    return [
      { to: '/portal', label: 'My Dashboard', icon: LayoutDashboard },
      { to: '/portal/scores', label: 'My Scores', icon: ClipboardList },
      { to: '/portal/transcript', label: 'My Transcript', icon: FileText },
    ]
  }
  const links: NavLink[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/classes', label: 'Classes', icon: Users, permission: 'view-classes' },
    { to: '/subjects', label: 'Subjects', icon: BookOpen, permission: 'view-subjects' },
    { to: '/teachers', label: 'Teachers', icon: UserCheck, permission: 'view-teachers' },
    { to: '/students', label: 'Students', icon: GraduationCap, permission: 'view-students' },
    { to: '/scores', label: 'Scores', icon: ClipboardList, permission: 'view-scores' },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/activity-logs', label: 'Activity Log', icon: History, permission: 'view-activity-logs' },
  ]
  return links.filter(link => !link.permission || auth.hasPermission(link.permission))
})

const settingsLinks = computed<NavLink[]>(() => {
  if (auth.user?.role !== 'admin') return []
  const links: NavLink[] = []
  if (auth.hasPermission('view-users')) {
    links.push({ to: '/users', label: 'Users', icon: User })
  }
  if (auth.hasPermission('manage-roles-permissions')) {
    links.push({ to: '/roles', label: 'Roles & Permissions', icon: Shield })
  }
  return links
})

async function handleLogout() {
  showLogoutModal.value = false
  await auth.logout()
  router.push('/login')
}

function goToProfile() {
  // Close mobile sidebar overlay (like other nav links do)
  sidebar.closeMobile()
  // Start preloading immediately on click (no await — fire and forget)
  preloadProfile()
  router.push('/profile')
}
</script>

<style scoped>

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 999;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.backdrop-enter-active {
  transition: all 0.3s ease-out;
}

.backdrop-leave-active {
  transition: all 0.2s ease-in;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.sidebar {
  width: 240px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar.collapsed {
  width: 72px;
}

.logo-expanded {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px 0 14px;
  height: 72px;
}

.logo-collapsed {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 72px;
  padding: 0 0 0 14px;
}

.sidebar-logo-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: left center;
  transition: transform 0.3s ease;
}

.sidebar-logo-wrap:hover .sidebar-logo {
  transform: scale(1.08);
}

.sidebar-brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: left;
  flex: 1;
}

.sidebar.collapsed .sidebar-brand-text {
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
  flex: 0;
  margin: 0;
}

.brand-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1e3a5f;
  white-space: nowrap;
}

.menu-title {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 0 12px;
  white-space: nowrap;
  overflow: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.sidebar.collapsed .menu-title {
  opacity: 0;
  transform: translateX(-8px);
  pointer-events: none;
}


.sidebar-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #556987;
  padding: 10px 14px;
  margin-bottom: 3px;
  border-radius: 10px;
  transition: all 0.2s ease;
  font-size: 14.5px;
  font-weight: 500;
  cursor: pointer;
  font-family: "Inter", "Noto Sans Khmer", sans-serif;
  white-space: nowrap;
  overflow: hidden;
  position: relative;
}

.sidebar-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 20px;
  background: #2563eb;
  border-radius: 0 4px 4px 0;
  transition: transform 0.2s ease;
}

.sidebar-link.collapsed {
  justify-content: center;
  padding: 10px 0;
  margin-left: 4px;
  margin-right: 4px;
}

.sidebar-link.collapsed:hover {
  padding-left: 0;
}

.sidebar-link:hover {
  background: #f8fafc;
  color: #2563eb;
  padding-left: 20px;
}

.sidebar-link:hover::before {
  transform: translateY(-50%) scaleY(1);
}

.sidebar-link.router-link-active {
  background: #e8f1ff;
  color: #2563eb;
  font-weight: 600;
}

.sidebar-link.router-link-active::before {
  transform: translateY(-50%) scaleY(1);
}

.sidebar-link-text {
  margin-left: 10px;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.sidebar.collapsed .sidebar-link-text {
  opacity: 0;
  transform: translateX(-8px);
  width: 0;
  margin-left: 0;
  overflow: hidden;
  pointer-events: none;
}


.user-section {
  background: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-section-active {
  background: #e8f1ff;
}

.user {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 10px;
  padding: 8px 12px;
  overflow: hidden;
  flex: 1;
}

.user:hover {
  background: #eef2ff;
  color: #2563eb;
}

.user-active {
  background: #e8f1ff;
  color: #2563eb;
  font-weight: 600;
}

.user-active .avatar {
  box-shadow: 0 0 0 2px #2563eb;
}

.user-active .user-text h6 {
  color: #2563eb;
}

.user-active .user-text small {
  color: #2563eb;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 0.95rem;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.user-text {
  overflow: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.sidebar.collapsed .user-text {
  opacity: 0;
  transform: translateX(-8px);
  pointer-events: none;
}

.sidebar.collapsed .logout-icon-btn {
  display: none;
}


.user h6 {
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 700;
}

.user small {
  font-size: 0.8rem;
  color: #64748b;
}

.logout-icon-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logout-icon-btn:hover {
  background: #fef2f2;
  color: #dc2626;
}


.toggle-wrap {
  flex-shrink: 0;
  padding: 8px 10px;
  position: relative;
}

/* Thin separator line above toggle */
.toggle-wrap::before {
  content: '';
  display: block;
  margin: 0 4px 10px;
  height: 1px;
  background: linear-gradient(to right, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent);
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 13px;
  font-weight: 500;
  font-family: "Inter", "Noto Sans Khmer", sans-serif;
}

.sidebar-toggle:hover {
  background: #eef2ff;
  color: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1);
}

.sidebar-toggle:active {
  transform: scale(0.96) translateY(0);
  box-shadow: none;
}

.sidebar-toggle svg {
  flex-shrink: 0;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-toggle .flip {
  transform: rotate(180deg);
}

.toggle-label {
  transition: opacity 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
}

.sidebar.collapsed .toggle-label {
  opacity: 0;
  transform: translateX(-6px);
  width: 0;
  overflow: hidden;
  margin: 0;
  pointer-events: none;
}

.sidebar.collapsed .sidebar-toggle {
  justify-content: center;
  padding: 8px 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  padding: 1rem;
}

.logout-modal {
  background: #ffffff;
  border-radius: 14px;
  width: 380px;
  max-width: 100%;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 12px 30px -4px rgba(0, 0, 0, 0.12),
    0 24px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* ─── Header ─── */
.logout-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 0;
  position: relative;
}

.logout-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #fef2f2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logout-title {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
}

.logout-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.logout-close-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

.logout-close-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ─── Body ─── */
.logout-modal-body {
  padding: 16px 24px 0;
}

.logout-message {
  font-size: 0.9rem;
  color: #475569;
  margin: 0;
  text-align: center;
  line-height: 1.6;
}

/* ─── Footer ─── */
.logout-modal-footer {
  display: flex;
  gap: 10px;
  padding: 20px 24px 24px;
}

.logout-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  font-family: "Inter", "Noto Sans Khmer", sans-serif;
}

.logout-btn-cancel {
  background: #f1f5f9;
  color: #334155;
}

.logout-btn-cancel:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.logout-btn-cancel:active {
  transform: translateY(0);
}

.logout-btn-confirm {
  background: #ef4444;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
}

.logout-btn-confirm:hover {
  background: #dc2626;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
  transform: translateY(-1px);
}

.logout-btn-confirm:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(239, 68, 68, 0.2);
}

.logout-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ─── Animations ─── */
.modal-enter-active {
  transition: all 0.25s ease-out;
}

.modal-leave-active {
  transition: all 0.15s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .logout-modal,
.modal-leave-to .logout-modal {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

.modal-enter-active .logout-modal {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active .logout-modal {
  transition: all 0.15s ease-in;
}



/* ─── Mobile (< 768px) ─── */
@media (max-width: 767.98px) {
  .sidebar {
    transform: translateX(-100%);
    width: 280px;
    box-shadow: 4px 0 40px rgba(0, 0, 0, 0.18);
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .sidebar.collapsed {
    width: 280px;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar.collapsed .sidebar-brand-text {
    opacity: 1;
    width: auto;
    height: auto;
    overflow: visible;
    pointer-events: auto;
    flex: 1;
  }

  .sidebar-link {
    padding: 12px 14px;
    margin-bottom: 2px;
    font-size: 15px;
  }

  .sidebar-link:active {
    background: #e8f1ff;
    transform: scale(0.98);
  }

  .sidebar.collapsed .sidebar-link-text {
    opacity: 1;
    transform: translateX(0);
    width: auto;
    margin-left: 10px;
    overflow: visible;
    pointer-events: auto;
  }

  .sidebar.collapsed .sidebar-link {
    justify-content: flex-start;
    padding: 12px 14px;
    margin-left: 0;
    margin-right: 0;
  }

  .menu-title {
    font-size: 12px;
    padding: 0 14px;
    margin-top: 12px !important;
    margin-bottom: 6px !important;
  }

  .sidebar.collapsed .menu-title {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  .user-section {
    padding: 0.5rem 0.75rem !important;
  }

  .sidebar.collapsed .user-text {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  .sidebar.collapsed .logout-icon-btn {
    display: flex;
  }

  .sidebar.collapsed .user-section {
    justify-content: space-between !important;
    padding: 0.5rem 0.75rem !important;
  }

  .sidebar.collapsed .user {
    justify-content: flex-start !important;
  }

  .sidebar.collapsed .toggle-label {
    opacity: 1;
    width: auto;
    overflow: visible;
    margin-left: 10px;
    pointer-events: auto;
  }

  .sidebar.collapsed .sidebar-toggle {
    justify-content: flex-start;
    padding: 8px 12px;
  }

  .user {
    padding: 8px 10px;
  }

  .user h6 {
    font-size: 0.9rem;
  }

  .user small {
    font-size: 0.75rem;
  }

  .avatar {
    width: 40px;
    height: 40px;
    font-size: 0.85rem;
  }

  .logout-icon-btn {
    padding: 8px;
    margin-right: -2px;
  }

  .logout-modal {
    width: 100%;
    max-width: 380px;
    border-radius: 12px;
  }

  .logout-modal-header {
    padding: 20px 20px 0;
  }

  .logout-modal-body {
    padding: 14px 20px 0;
  }

  .logout-modal-footer {
    padding: 16px 20px 20px;
    gap: 8px;
  }

  .logout-btn {
    padding: 12px 12px;
    font-size: 0.875rem;
  }

  .logout-icon-wrap {
    width: 40px;
    height: 40px;
  }

  .logout-title {
    font-size: 1rem;
  }

  .logout-btn-cancel:active,
  .logout-btn-confirm:active {
    transform: scale(0.97);
  }
}

/* Extra small phones: ≤420px */
@media (max-width: 420px) {
  .sidebar {
    width: 100%;
    max-width: 100%;
    border-radius: 0;
  }

  .sidebar-link {
    padding: 14px 16px;
    font-size: 16px;
    border-radius: 8px;
  }

  .logo-expanded,
  .logo-collapsed {
    height: 56px;
    padding: 0 10px;
  }

  .sidebar-logo-wrap {
    width: 38px;
    height: 38px;
  }

  .brand-name {
    font-size: 0.85rem;
  }

  .avatar {
    width: 38px;
    height: 38px;
  }

  .user {
    padding: 6px 8px;
  }
}
</style>
