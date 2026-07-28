<template>
  <header ref="headerRef" :class="['app-header', { 'dark-mode': theme.isDark, 'scrolled': isScrolled }]">
    <div class="header-bg"></div>

    <div class="header-left">
      <button class="icon-btn mobile-menu-btn d-md-none" @click="toggleMenu" title="Toggle menu" :aria-expanded="sidebar.mobileOpen">
        <div class="hamburger-icon" :class="{ 'open': sidebar.mobileOpen }">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <span class="header-title">
        <GraduationCap :size="22" class="header-title-icon" />
        <strong class="title-text">Student Score Management System</strong>
        <strong class="title-text-short">SSMS</strong>
      </span>
    </div>

    <div class="header-right">
      <LanguageSwitcher class="header-language-btn" />

      <button
        class="icon-btn"
        @click="theme.toggle()"
        :title="theme.isDark ? 'Switch to Light mode' : 'Switch to Dark mode'"
      >
        <div class="theme-icon-wrapper" :class="{ 'rotate': theme.isDark }">
          <MoonStar v-if="theme.isDark" :size="18" />
          <Sun v-else :size="18" />
        </div>
      </button>

      <div class="user-dropdown-container" ref="dropdownRef">
        <button
          class="user-profile-btn"
          @click="toggleDropdown"
          @keydown.enter.prevent="toggleDropdown"
          :class="{ 'active': showDropdown }"
        >
          <div class="user-avatar">
            <img v-if="userAvatarUrl" :src="userAvatarUrl" class="avatar-img" alt="avatar" />
            <span v-else class="initials">{{ getUserInitials(auth.user?.name) }}</span>
          </div>
          <div class="user-info">
            <div class="user-name">{{ auth.user?.name }}</div>
            <div class="user-role">{{ auth.user?.role }}</div>
          </div>
          <ChevronDown :size="14" class="dropdown-arrow" :class="{ 'rotated': showDropdown }" />
        </button>

        <Transition name="dropdown-slide">
          <div v-show="showDropdown" class="dropdown-menu">
            <RouterLink to="/profile" class="dropdown-item" @click="closeDropdown">
              <User :size="16" class="dropdown-item-icon" />
              <span>Profile</span>
            </RouterLink>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item dropdown-item-danger" @click="handleLogout">
              <LogOut :size="16" class="dropdown-item-icon" />
              <span>Sign Out</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useSidebarStore } from '@/stores/sidebar'
import { useAuthStore } from '@/stores/auth'
import { storageUrl } from '@/services/apiHttp'
import { getUserInitials } from '@/utils'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import {
  ChevronDown,
  MoonStar, Sun,
  GraduationCap,
  User,  LogOut
} from "lucide-vue-next"

const router = useRouter()
const theme = useThemeStore()
const sidebar = useSidebarStore()
const auth = useAuthStore()

const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const headerRef = ref<HTMLElement | null>(null)
const isScrolled = ref(false)

const userAvatarUrl = computed(() => storageUrl((auth.user?.avatar as string | undefined) ?? null))

function toggleMenu() {
  sidebar.toggleMobile()
}

function closeDropdown() {
  showDropdown.value = false
}

async function handleLogout() {
  showDropdown.value = false
  await auth.logout()
  router.push('/login')
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node

  if (dropdownRef.value && !dropdownRef.value.contains(target)) {
    closeDropdown()
  }
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function handleScroll() {
  isScrolled.value = window.scrollY > 8
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>

/* ====================================================================
   HEADER — Premium Responsive Design
   ==================================================================== */

.app-header {
  height: 72px;
  flex-shrink: 0;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: height 0.25s ease, padding 0.25s ease;
}

.app-header.scrolled .header-bg {
  border-bottom-color: rgba(148, 163, 184, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.app-header.dark-mode.scrolled .header-bg {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

/* ─── Glass Background ─── */
.header-bg {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  z-index: -1;
}

.app-header.dark-mode .header-bg {
  background: rgba(15, 23, 42, 0.82);
  border-bottom-color: rgba(51, 65, 85, 0.5);
}

/* ─── Left Section ─── */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

/* ─── Title ─── */
.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  color: #334155;
  transition: color 0.3s ease;
  min-width: 0;
}

.title-text {
  color: #0f172a;
  font-weight: 700;
  transition: color 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-text-short {
  display: none;
  color: #0f172a;
  font-weight: 700;
  transition: color 0.3s ease;
}

.header-title-icon {
  color: #2563eb;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(37, 99, 235, 0.2));
  transition: transform 0.3s ease;
}

.header-title:hover .header-title-icon {
  transform: scale(1.1) rotate(-5deg);
}

.app-header.dark-mode .header-title {
  color: #cbd5e1;
}

.app-header.dark-mode .title-text,
.app-header.dark-mode .title-text-short {
  color: #f1f5f9;
}

/* ─── Right Section ─── */
.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

/* ─── Icon Buttons ─── */
.icon-btn {
  width: 38px;
  height: 38px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s ease;
  position: relative;
}

.icon-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: rgba(37, 99, 235, 0.06);
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
}

.icon-btn:hover::after {
  opacity: 1;
  transform: scale(1);
}

.icon-btn:hover {
  color: #2563eb;
}

.icon-btn:active {
  transform: scale(0.92);
}

.icon-btn :deep(svg) {
  position: relative;
  z-index: 1;
}

.app-header.dark-mode .icon-btn {
  color: #94a3b8;
}

.app-header.dark-mode .icon-btn::after {
  background: rgba(96, 165, 250, 0.08);
}

.app-header.dark-mode .icon-btn:hover {
  color: #60a5fa;
}

/* ─── Language Switcher ─── */
.header-language-btn :deep(.dropdown-toggle) {
  background: transparent;
  border: none;
  color: #64748b;
  padding: 6px 6px;
  border-radius: 10px;
  min-width: auto;
  transition: background 0.2s ease, color 0.2s ease;
}

.header-language-btn :deep(.dropdown-toggle:hover) {
  background: rgba(37, 99, 235, 0.06);
  color: #2563eb;
}

.header-language-btn :deep(.language-name) {
  display: none;
}

.header-language-btn :deep(.flag) {
  font-size: 20px;
  position: relative;
  z-index: 1;
  line-height: 1;
}

.header-language-btn :deep(.flag-icon) {
  font-size: 20px;
}

.app-header.dark-mode .header-language-btn :deep(.dropdown-toggle) {
  color: #94a3b8;
}

.app-header.dark-mode .header-language-btn :deep(.dropdown-toggle::after) {
  background: rgba(96, 165, 250, 0.08);
}

.app-header.dark-mode .header-language-btn :deep(.dropdown-toggle:hover) {
  color: #60a5fa;
}

/* ─── Theme Toggle ─── */
.theme-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 1;
}

.theme-icon-wrapper.rotate {
  transform: rotate(360deg);
}

/* ─── User Dropdown ─── */
.user-dropdown-container {
  position: relative;
}

.user-profile-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px 10px 5px 6px;
  border-radius: 10px;
  transition: all 0.2s ease;
  position: relative;
}

.user-profile-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: rgba(37, 99, 235, 0.04);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.user-profile-btn:hover::before,
.user-profile-btn.active::before {
  opacity: 1;
}

.user-profile-btn:active {
  transform: scale(0.97);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.user-profile-btn:hover .user-avatar {
  transform: scale(1.05);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  position: relative;
  z-index: 1;
  transition: opacity 0.2s ease, width 0.2s ease;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  transition: color 0.3s ease;
  white-space: nowrap;
}

.user-role {
  font-size: 0.68rem;
  color: #94a3b8;
  font-weight: 450;
  transition: color 0.3s ease;
  text-transform: capitalize;
}

.dropdown-arrow {
  color: #94a3b8;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease;
  position: relative;
  z-index: 1;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
  color: #2563eb;
}

.app-header.dark-mode .user-name {
  color: #f1f5f9;
}

.app-header.dark-mode .user-role {
  color: #64748b;
}

.app-header.dark-mode .dropdown-arrow {
  color: #64748b;
}

.app-header.dark-mode .dropdown-arrow.rotated {
  color: #60a5fa;
}

.app-header.dark-mode .user-profile-btn::before {
  background: rgba(96, 165, 250, 0.06);
}

.app-header.dark-mode .user-profile-btn:hover .user-avatar {
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}

/* ─── Dropdown Menu ─── */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 30px -5px rgba(0, 0, 0, 0.12);
  min-width: 180px;
  z-index: 9999;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.6);
  transform-origin: top right;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  color: #475569;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  width: 100%;
  text-align: left;
  position: relative;
}

.dropdown-item::before {
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

.dropdown-item:hover {
  background: #f8fafc;
  color: #2563eb;
  padding-left: 20px;
}

.dropdown-item:hover::before {
  transform: translateY(-50%) scaleY(1);
}

.dropdown-item-icon {
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.dropdown-item:hover .dropdown-item-icon {
  opacity: 1;
}

.dropdown-item-danger {
  color: #ef4444;
}

.dropdown-item-danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.dropdown-item-danger::before {
  background: #ef4444;
}

.dropdown-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 0;
}

.app-header.dark-mode .dropdown-menu {
  background: #1e293b;
  border-color: rgba(51, 65, 85, 0.6);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.4);
}

.app-header.dark-mode .dropdown-item {
  color: #cbd5e1;
}

.app-header.dark-mode .dropdown-item:hover {
  background: rgba(51, 65, 85, 0.5);
  color: #60a5fa;
}

.app-header.dark-mode .dropdown-divider {
  background: #334155;
}

/* ─── Dropdown Slide Animation ─── */
.dropdown-slide-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-slide-leave-active {
  transition: all 0.15s ease-in;
}

.dropdown-slide-enter-from,
.dropdown-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

/* ─── Mobile Menu Button ─── */
.mobile-menu-btn {
  display: none;
}

/* ─── Hamburger ─── */
.hamburger-icon {
  width: 20px;
  height: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  transition: transform 0.3s ease;
}

.hamburger-icon span {
  display: block;
  width: 18px;
  height: 2px;
  background: currentColor;
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.hamburger-icon.open span:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.hamburger-icon.open span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.hamburger-icon.open span:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/* ====================================================================
   RESPONSIVE BREAKPOINTS
   ==================================================================== */

/* ====================================================================
   RESPONSIVE BREAKPOINTS
   ==================================================================== */

/* Extra Small: ≤480px — Compact Phones */
@media (max-width: 480px) {
  .app-header {
    padding: 0 8px;
    height: 50px;
  }

  .mobile-menu-btn {
    display: flex;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(37, 99, 235, 0.04);
    flex-shrink: 0;
  }

  .mobile-menu-btn:active {
    background: rgba(37, 99, 235, 0.1);
    transform: scale(0.92);
  }

  .title-text {
    display: none;
  }

  .title-text-short {
    display: block;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70px;
  }

  .header-title-icon {
    width: 20px;
    height: 20px;
  }

  .header-title {
    gap: 7px;
  }

  .header-left {
    gap: 6px;
  }

  .header-right {
    gap: 0;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 9px;
  }

  .icon-btn:active {
    transform: scale(0.92);
    background: rgba(37, 99, 235, 0.08);
  }

  .user-info {
    display: none;
  }

  .user-profile-btn {
    padding: 2px 1px 2px 3px;
    gap: 4px;
  }

  .user-avatar {
    width: 30px;
    height: 30px;
    font-size: 0.65rem;
  }

  .dropdown-arrow {
    display: none;
  }

  .header-language-btn :deep(.flag) {
    font-size: 17px;
  }

  .header-language-btn :deep(.dropdown-toggle) {
    padding: 6px 4px;
  }

  .dropdown-menu {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    border-radius: 16px 16px 0 0;
    min-width: unset;
    width: 100%;
    max-width: 100%;
    box-shadow:
      0 -4px 20px rgba(0, 0, 0, 0.1),
      0 -1px 3px rgba(0, 0, 0, 0.05);
    transform-origin: bottom center;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .dropdown-slide-enter-from,
  .dropdown-slide-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(1);
  }

  .dropdown-item {
    padding: 14px 18px;
    font-size: 0.95rem;
    gap: 12px;
  }

  .dropdown-divider {
    margin: 2px 0;
  }
}

/* Small: 481px - 767.98px — Phones Landscape & Large Phones */
@media (min-width: 481px) and (max-width: 767.98px) {
  .app-header {
    padding: 0 12px;
    height: 54px;
  }

  .mobile-menu-btn {
    display: flex;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .mobile-menu-btn:active {
    background: rgba(37, 99, 235, 0.08);
    transform: scale(0.92);
  }

  .title-text {
    display: none;
  }

  .title-text-short {
    display: block;
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
  }

  .header-title-icon {
    width: 21px;
    height: 21px;
  }

  .header-left {
    gap: 8px;
  }

  .header-right {
    gap: 1px;
  }

  .icon-btn {
    width: 38px;
    height: 38px;
    border-radius: 10px;
  }

  .icon-btn:active {
    transform: scale(0.92);
    background: rgba(37, 99, 235, 0.08);
  }

  .user-info {
    display: none;
  }

  .user-profile-btn {
    padding: 3px 2px 3px 4px;
    gap: 5px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.7rem;
  }

  .dropdown-arrow {
    display: none;
  }

  .dropdown-menu {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    border-radius: 16px 16px 0 0;
    min-width: unset;
    width: 100%;
    max-width: 100%;
    box-shadow:
      0 -4px 20px rgba(0, 0, 0, 0.1),
      0 -1px 3px rgba(0, 0, 0, 0.05);
    transform-origin: bottom center;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .dropdown-slide-enter-from,
  .dropdown-slide-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(1);
  }

  .dropdown-item {
    padding: 14px 18px;
    font-size: 0.95rem;
    gap: 12px;
  }

  .dropdown-divider {
    margin: 2px 0;
  }
}

/* Medium: 768px - 991.98px — Tablet */
@media (min-width: 768px) and (max-width: 991.98px) {
  .app-header {
    padding: 0 18px;
  }

  .title-text {
    font-size: 0.95rem;
    max-width: 240px;
  }

  .title-text-short {
    display: none;
  }

  .user-info {
    display: flex;
  }

  .user-name {
    font-size: 0.8rem;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-role {
    font-size: 0.65rem;
  }
}

/* Large: 992px+ — Desktop */
@media (min-width: 992px) {
  .app-header {
    padding: 0 24px;
  }

  .title-text {
    font-size: 1.05rem;
    max-width: none;
  }

  .title-text-short {
    display: none;
  }

  .user-info {
    display: flex;
  }
}
</style>
