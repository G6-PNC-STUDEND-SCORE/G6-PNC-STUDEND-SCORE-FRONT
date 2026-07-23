<template>
  <header :class="['app-header', { 'dark-mode': theme.isDark }]">
    <div class="header-bg"></div>

    <div class="header-left">
      <button class="icon-btn mobile-menu-btn d-md-none" @click="toggleSidebar" title="Toggle menu">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M3 5H17" />
          <path d="M3 10H17" />
          <path d="M3 15H17" />
        </svg>
      </button>

      <span class="header-title">
        <GraduationCap :size="22" class="header-title-icon" />
        <strong>Student Score Management System</strong>
      </span>
    </div>

    <div class="header-right">
      <!-- Search Trigger -->
      <div class="search-wrapper" ref="searchWrapperRef">
        <button class="icon-btn" @click="openSearch" title="Search">
          <Search :size="18" />
        </button>
        <Transition name="search-slide">
          <div v-if="showSearch" class="search-overlay">
            <div class="search-bar-container">
              <Search :size="20" class="search-input-icon" />
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                class="search-input"
                placeholder="Search students, classes, subjects..."
                @keydown.escape="closeSearch"
              />
              <button class="search-close-btn" @click="closeSearch">
                <X :size="18" />
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Language Switcher -->
      <LanguageSwitcher class="header-language-btn" />

      <!-- Theme Toggle -->
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



      <!-- User Profile Dropdown -->
      <div class="user-dropdown-container" ref="dropdownRef">
        <button
          class="user-profile-btn"
          @click="toggleDropdown"
          @keydown.enter.prevent="toggleDropdown"
          :class="{ 'active': showDropdown }"
        >
          <div class="user-avatar">
            <img v-if="userAvatarUrl" :src="userAvatarUrl" class="avatar-img" alt="avatar" />
            <span v-else class="initials">{{ getUserInitials() }}</span>
          </div>
          <div class="user-info">
            <div class="user-name">{{ auth.user?.name }}</div>
            <div class="user-role">{{ auth.user?.role }}</div>
          </div>
          <ChevronDown :size="14" class="dropdown-arrow" :class="{ 'rotated': showDropdown }" />
        </button>

        <Transition name="dropdown">
          <div v-if="showDropdown" class="dropdown-menu">
            <div class="dropdown-header">
              <div class="dropdown-user-avatar">
                <img v-if="userAvatarUrl" :src="userAvatarUrl" class="avatar-img" alt="avatar" />
                <span v-else class="initials">{{ getUserInitials() }}</span>
              </div>
              <div>
                <div class="dropdown-user-name">{{ auth.user?.name }}</div>
                <div class="dropdown-user-email">{{ auth.user?.email }}</div>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <RouterLink to="/profile" class="dropdown-item" @click="closeDropdown">
              <User :size="16" class="dropdown-item-icon" />
              <span>Profile</span>
            </RouterLink>
            <RouterLink to="/settings" class="dropdown-item" @click="closeDropdown">
              <Settings :size="16" class="dropdown-item-icon" />
              <span>Settings</span>
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { storageUrl } from '@/services/apiHttp'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import {
  ChevronDown,
  Search, X,
  MoonStar, Sun,
  GraduationCap,
  User, Settings, LogOut
} from "lucide-vue-next"

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const router = useRouter()
const theme = useThemeStore()
const auth = useAuthStore()

const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const showSearch = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const searchWrapperRef = ref<HTMLElement | null>(null)

const userAvatarUrl = computed(() => storageUrl((auth.user?.avatar as string | undefined) ?? null))

function toggleSidebar() {
  emit('toggle-sidebar')
}

function getUserInitials(): string {
  const name = auth.user?.name || ''
  if (!name) return 'U'
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function closeDropdown() {
  showDropdown.value = false
}

async function handleLogout() {
  showDropdown.value = false
  await auth.logout()
  router.push('/login')
}

function openSearch() {
  showSearch.value = true
}

function closeSearch() {
  showSearch.value = false
  searchQuery.value = ''
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node

  // Dropdown
  if (dropdownRef.value && !dropdownRef.value.contains(target)) {
    closeDropdown()
  }

  // Search overlay - close if clicking outside search bar
  if (showSearch.value && searchWrapperRef.value && !searchWrapperRef.value.contains(target)) {
    closeSearch()
  }
}

watch(showSearch, async (val) => {
  if (val) {
    await nextTick()
    searchInput.value?.focus()
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* ── Header Base ── */
.app-header {
  height: 72px;
  flex-shrink: 0;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.header-bg {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  transition: background 0.3s ease, border-color 0.3s ease;
  z-index: -1;
}

.app-header.dark-mode .header-bg {
  background: rgba(30, 41, 59, 0.82);
  border-bottom-color: rgba(51, 65, 85, 0.6);
}

/* ── Left Section ── */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

/* ── Header Title ── */
.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  color: #334155;
  transition: color 0.3s ease;
}

.header-title strong {
  color: #0f172a;
  font-weight: 700;
  transition: color 0.3s ease;
}

.header-title-icon {
  color: #2563eb;
  flex-shrink: 0;
}

.app-header.dark-mode .header-title {
  color: #cbd5e1;
}

.app-header.dark-mode .header-title strong {
  color: #f1f5f9;
}

/* ── Right Section ── */
.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

/* ── Icon Button ── */
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

.icon-btn:hover {
  background: rgba(37, 99, 235, 0.06);
  color: #2563eb;
}

.icon-btn:active {
  transform: scale(0.92);
}

.app-header.dark-mode .icon-btn {
  color: #94a3b8;
}

.app-header.dark-mode .icon-btn:hover {
  background: rgba(96, 165, 250, 0.08);
  color: #60a5fa;
}

/* ── Language Switcher ── */
.header-language-btn :deep(.dropdown-toggle) {
  background: transparent;
  border: 1px solid transparent;
  color: #64748b;
  padding: 6px 8px;
  border-radius: 10px;
  min-width: auto;
  transition: all 0.2s ease;
}

.header-language-btn :deep(.dropdown-toggle:hover) {
  background: rgba(37, 99, 235, 0.06);
  border-color: transparent;
  color: #2563eb;
}

.header-language-btn :deep(.language-name) {
  display: none;
}

.header-language-btn :deep(.flag) {
  font-size: 20px;
}

.app-header.dark-mode .header-language-btn :deep(.dropdown-toggle) {
  color: #94a3b8;
}

.app-header.dark-mode .header-language-btn :deep(.dropdown-toggle:hover) {
  background: rgba(96, 165, 250, 0.08);
  color: #60a5fa;
}

/* ── Theme Toggle Animation ── */
.theme-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.theme-icon-wrapper.rotate {
  transform: rotate(360deg);
}

/* ── Search ── */
.search-wrapper {
  position: relative;
}

.search-overlay {
  position: absolute;
  top: 50%;
  right: calc(100% + 8px);
  transform: translateY(-50%);
  z-index: 300;
}

.search-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0 16px;
  width: 340px;
  height: 44px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 20px -5px rgba(0, 0, 0, 0.08);
  animation: searchExpand 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes searchExpand {
  0% {
    transform: scaleX(0.85) translateX(10%);
    opacity: 0;
  }
  100% {
    transform: scaleX(1) translateX(0);
    opacity: 1;
  }
}

.search-input-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.9rem;
  color: #0f172a;
  font-family: inherit;
  background: transparent;
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.2s ease;
}

.search-close-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

.app-header.dark-mode .search-bar-container {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.4);
}

.app-header.dark-mode .search-input {
  color: #f1f5f9;
}

.app-header.dark-mode .search-input::placeholder {
  color: #64748b;
}

.app-header.dark-mode .search-close-btn:hover {
  background: #334155;
  color: #cbd5e1;
}

/* ── User Profile Button ── */
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
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  transition: color 0.3s ease;
}

.user-role {
  font-size: 0.68rem;
  color: #94a3b8;
  font-weight: 450;
  transition: color 0.3s ease;
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

/* ── Dropdown Menu ── */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 30px -5px rgba(0, 0, 0, 0.12);
  min-width: 220px;
  z-index: 9999;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.6);
  transform-origin: top right;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 12px;
}

.dropdown-user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
  overflow: hidden;
}

.dropdown-user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

.dropdown-user-email {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 1px;
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

.app-header.dark-mode .dropdown-user-name {
  color: #f1f5f9;
}

.app-header.dark-mode .dropdown-user-email {
  color: #94a3b8;
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

/* ── Transitions ── */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.search-slide-enter-active,
.search-slide-leave-active {
  transition: all 0.2s ease;
}

.search-slide-enter-from,
.search-slide-leave-to {
  opacity: 0;
}

/* ── Mobile ── */
.mobile-menu-btn {
  display: none;
}

@media (max-width: 767.98px) {
  .app-header {
    padding: 0 12px;
    height: 56px;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .user-info {
    display: none;
  }

  .search-overlay {
    right: auto;
    left: 0;
  }

  .search-bar-container {
    width: calc(100vw - 24px);
  }
}

@media (min-width: 768px) and (max-width: 991.98px) {
  .user-info {
    display: none;
  }
}
</style>
