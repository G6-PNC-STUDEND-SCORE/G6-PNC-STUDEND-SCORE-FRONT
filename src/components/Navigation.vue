<template>
  <aside :class="['sidebar', { collapsed: sidebar.collapsed }]">
    <!-- Logo / Brand -->
    <div :class="['logo', 'd-flex', 'align-items-center', sidebar.collapsed ? 'justify-content-center px-0' : 'gap-2 px-3', 'border-bottom']" style="height: 64px">
      <div class="sidebar-logo-wrap">
        <img src="https://www.passerellesnumeriques.org/wp-content/uploads/2024/05/PN-Logo-English-Blue-Baseline.png" alt="Passerelles Numériques Cambodia" class="sidebar-logo">
      </div>
      <div class="sidebar-brand-text">
        <span class="brand-name">Passerelles</span>
        <span class="brand-name">Numériques</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="px-2 py-2 flex-grow-1">
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        :class="['sidebar-link', { collapsed: sidebar.collapsed }]"
        :title="sidebar.collapsed ? link.label : ''"
      >
        <component :is="link.icon" :size="20" />
        <span class="sidebar-link-text">{{ link.label }}</span>
      </RouterLink>

      <h6 class="menu-title mt-3 mb-2">Settings</h6>

      <RouterLink
        v-for="link in settingsLinks"
        :key="link.to"
        :to="link.to"
        :class="['sidebar-link', { collapsed: sidebar.collapsed }]"
        :title="sidebar.collapsed ? link.label : ''"
      >
        <component :is="link.icon" :size="20" />
        <span class="sidebar-link-text">{{ link.label }}</span>
      </RouterLink>
    </nav>

    <!-- Toggle Button -->
    <div class="toggle-section border-top">
      <button
        :class="['toggle-sidebar-btn', { collapsed: sidebar.collapsed }]"
        @click="sidebar.toggle()"
        :title="sidebar.collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <PanelLeftClose :size="18" :class="{ 'rotated': sidebar.collapsed }" />
        <span class="toggle-label">Collapse</span>
      </button>
    </div>

    <!-- User Section & Logout -->
    <div class="border-top">
      <div :class="['user-section', 'd-flex', 'align-items-center', sidebar.collapsed ? 'justify-content-center px-0 py-2' : 'px-3 py-2']">
        <div
          class="user d-flex align-items-center"
          :class="{ 'justify-content-center': sidebar.collapsed }"
          @click="goToProfile"
          @keydown.enter.prevent="goToProfile"
          role="button"
          tabindex="0"
          :title="sidebar.collapsed ? 'Profile' : ''"
        >
          <div class="avatar">
            <img v-if="userAvatarUrl" :src="userAvatarUrl" class="avatar-img" alt="avatar" />
            <span v-else class="initials">{{ getUserInitials() }}</span>
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

  <!-- Logout Confirmation Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
        <div class="modal-dialog-custom">
          <div class="modal-header-custom">
            <div class="modal-icon">
              <LogOut :size="24" />
            </div>
            <h5 class="mb-1">Confirm Logout</h5>
            <p class="mb-0 text-secondary">Are you sure you want to log out?</p>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showLogoutModal = false">
              <X :size="16" class="me-1" />
              Cancel
            </button>
            <button class="btn-logout" @click="handleLogout">
              <LogOut :size="16" class="me-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSidebarStore } from '@/stores/sidebar'
import { storageUrl } from '@/services/apiHttp'
import {
  LayoutDashboard, Users, BookOpen, UserCheck,
  GraduationCap, ClipboardList, FileText,
  User, Shield, LogOut, X, PanelLeftClose,
} from '@lucide/vue'
import type { Component } from 'vue'

const router = useRouter()
const auth = useAuthStore()
const sidebar = useSidebarStore()

const userAvatarUrl = computed(() => storageUrl((auth.user?.avatar as string | undefined) ?? null))
const showLogoutModal = ref(false)

interface NavLink {
  to: string
  label: string
  icon: Component
}

const navLinks: NavLink[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/classes', label: 'Classes', icon: Users },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/teachers', label: 'Teachers', icon: UserCheck },
  { to: '/students', label: 'Students', icon: GraduationCap },
  { to: '/scores', label: 'Scores', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: FileText },
]

const settingsLinks: NavLink[] = [
  { to: '/users', label: 'Users', icon: User },
  { to: '/roles', label: 'Roles & Permissions', icon: Shield },
]

function getUserInitials(): string {
  const name = auth.user?.name || ''
  if (!name) return 'U'
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getUserInitials(): string {
    const name = auth.user?.name || ''
    if (!name) return 'U'
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
}

function handleLogout() {
  showLogoutModal.value = false
  auth.logout()
  router.push('/login')
}

function goToProfile() {
  router.push('/profile')
}
</script>

<style scoped>
/* ── Sidebar Base ── */
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
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar.collapsed {
  width: 72px;
}

/* ── Logo ── */.sidebar-logo-wrap {
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
}

.sidebar.collapsed .sidebar-brand-text {
  opacity: 0;
  transform: translateX(-8px);
  width: 0;
  margin: 0;
  overflow: hidden;
  pointer-events: none;
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

/* ── Nav Links ── */
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
}

.sidebar-link.collapsed {
  justify-content: center;
  padding: 10px 0;
  margin-left: 4px;
  margin-right: 4px;
}

.sidebar-link:hover {
  background: #eef2ff;
  color: #2563eb;
}

.sidebar-link.router-link-active {
  background: #e8f1ff;
  color: #2563eb;
  font-weight: 600;
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

/* ── Toggle Button ── */
.toggle-section {
  padding: 0;
}

.toggle-sidebar-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  overflow: hidden;
  white-space: nowrap;
}

.toggle-sidebar-btn.collapsed {
  justify-content: center;
  padding: 10px 0;
}

.toggle-sidebar-btn:hover {
  background: #f8fafc;
  color: #2563eb;
}

.toggle-sidebar-btn:active {
  transform: scale(0.97);
}

.toggle-sidebar-btn .rotated {
  transform: rotate(180deg);
}

.toggle-label {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.sidebar.collapsed .toggle-label {
  opacity: 0;
  transform: translateX(-8px);
  pointer-events: none;
}

/* ── User Section ── */
.user-section {
  background: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.user {
  cursor: pointer;
  transition: background 0.2s ease;
  border-radius: 8px;
  padding: 4px 8px;
  overflow: hidden;
}

.user:hover {
  background: #f8fafc;
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
  color: #64748b;
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
  background: #f1f5f9;
  color: #ef4444;
}

/* ── Logout Modal ── */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-dialog-custom {
  background: #fff;
  border-radius: 16px;
  width: 360px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: modalBounce 0.3s ease-out;
}

@keyframes modalBounce {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header-custom {
  padding: 28px 28px 16px;
  text-align: center;
}

.modal-header-custom h5 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a2e;
}

.modal-header-custom p {
  font-size: 0.875rem;
  color: #6b7280;
}

.modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fef2f2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin: 0 auto 12px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  padding: 12px 28px 28px;
}

.modal-actions button {
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

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-logout {
  background: #ef4444;
  color: white;
}

.btn-logout:hover {
  background: #dc2626;
}

.modal-enter-active {
  transition: all 0.2s ease-out;
}

.modal-leave-active {
  transition: all 0.15s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-dialog-custom,
.modal-leave-to .modal-dialog-custom {
  transform: scale(0.9);
}
</style>
