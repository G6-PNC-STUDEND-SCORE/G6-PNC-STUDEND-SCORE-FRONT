<template>
  <header :class="['app-header', 'd-flex', 'align-items-center', 'justify-content-between', { 'dark-mode': theme.isDark }]">
    <div class="d-flex align-items-center gap-2">
      <span class="welcome-text">
        <strong>Student Score Management System</strong>
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
        <MoonStar v-if="theme.isDark" :size="18" />
        <Sun v-else :size="18" />
      </button>

      <!-- User Profile Dropdown -->
      <div class="user-dropdown-container" ref="dropdownRef">
        <button 
          class="user-profile-btn d-flex align-items-center gap-2" 
          @click="toggleDropdown"
          @keydown.enter.prevent="toggleDropdown"
        >
          <div class="user-avatar">
            <img v-if="userAvatarUrl" :src="userAvatarUrl" class="avatar-img" alt="avatar" />
            <span v-else class="initials">{{ getUserInitials() }}</span>
          </div>
          <div class="user-info text-start">
            <div class="user-name">{{ auth.user?.name }}</div>
            <div class="user-role">{{ auth.user?.role }}</div>
          </div>
          <ChevronDown :size="14" class="dropdown-arrow" />
        </button>

        <!-- Dropdown Menu -->
        <Transition name="dropdown">
          <div v-if="showDropdown" class="dropdown-menu">
            <RouterLink to="/profile" class="dropdown-item" @click="closeDropdown">
              <User :size="16" class="me-2" />
              Profile
            </RouterLink>
            <RouterLink to="/settings" class="dropdown-item" @click="closeDropdown">
              <Settings :size="16" class="me-2" />
              Settings
            </RouterLink>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item dropdown-item-danger w-100 text-start" @click="handleLogout">
              <LogOut :size="16" class="me-2" />
              Sign Out
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
import { useAuthStore } from '@/stores/auth'
import { storageUrl } from '@/services/apiHttp'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { MoonStar, Sun, ChevronDown, User, Settings, LogOut } from '@lucide/vue'

const router = useRouter()
const theme = useThemeStore()
const auth = useAuthStore()

const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const userAvatarUrl = computed(() => storageUrl((auth.user?.avatar as string | undefined) ?? null))

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

function handleLogout() {
  showDropdown.value = false
  auth.logout()
  router.push('/login')
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-header {
  height: 59.5px;
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
  font-size: 1.05rem;
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

.app-header.dark-mode .theme-toggle :deep(svg) {
  color: #fbbf24;
}

/* User Profile Dropdown */
.user-dropdown-container {
  position: relative;
}

.user-profile-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.user-profile-btn:hover {
  background: #f8fafc;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 0.8rem;
  flex-shrink: 0;
  overflow: hidden;
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
  line-height: 1.2;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
}

.user-role {
  font-size: 0.7rem;
  color: #64748b;
}

.dropdown-arrow {
  transition: transform 0.2s ease;
}

.user-profile-btn:hover .dropdown-arrow {
  color: #2563eb;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  z-index: 9999;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  color: #475569;
  text-decoration: none;
  font-size: 0.875rem;
  transition: background 0.2s ease, color 0.2s ease;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
}

.dropdown-item:hover {
  background: #f8fafc;
  color: #2563eb;
}

.dropdown-item-danger {
  color: #ef4444;
}

.dropdown-item-danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Dark mode */
.app-header.dark-mode .user-profile-btn:hover {
  background: #334155;
}

.app-header.dark-mode .user-name {
  color: #f1f5f9;
}

.app-header.dark-mode .user-role {
  color: #94a3b8;
}

.app-header.dark-mode .dropdown-arrow {
  color: #94a3b8;
}

.app-header.dark-mode .user-profile-btn:hover .dropdown-arrow {
  color: #60a5fa;
}

.app-header.dark-mode .dropdown-menu {
  background: #1e293b;
  border-color: #334155;
}

.app-header.dark-mode .dropdown-item {
  color: #cbd5e1;
}

.app-header.dark-mode .dropdown-item:hover {
  background: #334155;
  color: #60a5fa;
}

.app-header.dark-mode .dropdown-divider {
  background: #334155;
}
</style>
