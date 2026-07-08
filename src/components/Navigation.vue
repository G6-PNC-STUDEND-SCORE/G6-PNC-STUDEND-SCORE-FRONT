<template>
    <aside class="sidebar d-flex flex-column">
        <div class="logo d-flex align-items-center px-3 py-2 border-bottom">
            <div class="logo-icon me-2">
                <img src="/images/images.png" alt="PNCStudentScore" class="logo-img">
            </div>
            <div class="logo-text">
                <h5 class="mb-0 fw-bold">PNCScore</h5>
                <small class="text-secondary">Student Score Management</small>
            </div>
        </div>
        <nav class="px-2 py-2 flex-grow-1">
            <RouterLink to="/dashboard" class="sidebar-link">
                <i class="bi bi-grid-fill me-2"></i>
                Dashboard
            </RouterLink>

            <RouterLink to="/classes" class="sidebar-link">
                <i class="bi bi-people-fill me-2"></i>
                Classes
            </RouterLink>

            <RouterLink to="/subjects" class="sidebar-link">
                <i class="bi bi-book-fill me-2"></i>
                Subjects
            </RouterLink>

            <RouterLink to="/students" class="sidebar-link">
                <i class="bi bi-person-badge-fill me-2"></i>
                Students
            </RouterLink>

            <RouterLink to="/scores" class="sidebar-link">
                <i class="bi bi-clipboard-data-fill me-2"></i>
                Scores
            </RouterLink>

            <RouterLink to="/reports" class="sidebar-link">
                <i class="bi bi-file-earmark-bar-graph-fill me-2"></i>
                Reports
            </RouterLink>

            <RouterLink to="/profile" class="sidebar-link">
                <i class="bi bi-person-circle me-2"></i>
                Profile
            </RouterLink>

            <h6 class="menu-title mt-3 mb-2">ADMINISTRATION</h6>

            <div class="menu-parent" @click="toggleSettings" @keydown.enter.prevent="toggleSettings" role="button"
                tabindex="0">
                <i class="bi bi-gear-fill me-2"></i>
                Settings
                <i class="bi ms-auto chevron-icon" :class="settingsOpen ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
            </div>

            <Transition name="slide">
                <div v-if="settingsOpen" class="submenu">
                    <RouterLink to="/users" class="sidebar-link submenu-item">
                        <i class="bi bi-person-fill me-2"></i>
                        Users
                    </RouterLink>
                    <RouterLink to="/roles" class="sidebar-link submenu-item">
                        <i class="bi bi-shield-lock-fill me-2"></i>
                        Roles & Permissions
                    </RouterLink>
                </div>
            </Transition>

        </nav>

        <!-- User Section & Logout -->
        <div class="border-top">
            <div class="user d-flex align-items-center px-3 py-2">
                <div class="avatar">
                    {{ displayInitials }}
                </div>
                <div class="ms-2 flex-grow-1">
                    <h6 class="mb-0 fw-bold text-truncate">{{ displayName }}</h6>
                    <small class="text-secondary">{{ displayRole }}</small>
                </div>
            </div>
            <button class="logout-btn w-100 d-flex align-items-center px-3 py-2" @click="showLogoutModal = true">
                <i class="bi bi-box-arrow-right me-2"></i>
                <span>Logout</span>
            </button>
        </div>

    </aside>

    <!-- Logout Confirmation Modal -->
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
                <div class="modal-dialog-custom">
                    <div class="modal-header-custom">
                        <div class="modal-icon">
                            <i class="bi bi-box-arrow-right"></i>
                        </div>
                        <h5 class="mb-1">Confirm Logout</h5>
                        <p class="mb-0 text-secondary">Are you sure you want to log out?</p>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-cancel" @click="showLogoutModal = false">
                            <i class="bi bi-x-lg me-1"></i>
                            Cancel
                        </button>
                        <button class="btn-logout" @click="handleLogout">
                            <i class="bi bi-box-arrow-right me-1"></i>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const settingsOpen = ref(false)
const showLogoutModal = ref(false)
const displayName = ref('User')
const displayRole = ref('Admin')
const displayInitials = ref('U')

watchEffect(() => {
  const u = authStore.user
  if (u) {
    displayName.value = u.name
    displayRole.value = u.role
    const parts = u.name.split(' ').filter(Boolean)
    displayInitials.value = parts.length >= 2
      ? (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase()
      : u.name.substring(0, 2).toUpperCase()
  } else {
    displayName.value = 'User'
    displayRole.value = 'Admin'
    displayInitials.value = 'U'
  }
})

function toggleSettings() {
    settingsOpen.value = !settingsOpen.value
}

function handleLogout() {
    showLogoutModal.value = false
    authStore.logout()
    router.push('/login')
}
</script>

<style scoped>
.sidebar {
    width: 220px;
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
}

.logo-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    overflow: hidden;
}

.logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.logo-text h5 {
    color: #253858;
    font-size: 0.95rem;
    line-height: 1.2;
}

.logo-text small {
    font-size: 0.65rem;
}

.menu-title {
    color: #94a3b8;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 0 12px;
}

.sidebar-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: #556987;
    padding: 8px 12px;
    margin-bottom: 2px;
    border-radius: 10px;
    transition: all 0.2s ease;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    font-family: "Inter", "Noto Sans Khmer", sans-serif;
}

.sidebar-link i {
    font-size: 1.05rem;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
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

.sidebar-link.router-link-active i {
    color: #2563eb;
}

.menu-parent {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: #4b5563;
    padding: 8px 12px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    user-select: none;
    outline: none;
}

.menu-parent:focus-visible {
    box-shadow: 0 0 0 2px #2563eb;
}

.menu-parent i:first-child {
    font-size: 1.05rem;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
}

.menu-parent i.chevron-icon {
    font-size: 0.75rem;
    color: #94a3b8;
    transition: color 0.2s ease;
}

.menu-parent:hover {
    background: #eef2ff;
    color: #2563eb;
}

.menu-parent:hover i.chevron-icon {
    color: #2563eb;
}

.submenu {
    padding-left: 6px;
    margin-top: 1px;
    margin-bottom: 2px;
    border-left: 2px solid #e2e8f0;
    margin-left: 22px;
}

.submenu-item {
    font-size: 12px;
    padding: 6px 12px;
}

.submenu-item i {
    font-size: 0.9rem;
    width: 18px;
}

.user {
    background: white;
    cursor: pointer;
    transition: background 0.2s ease;
}

.user:hover {
    background: #f8fafc;
}

.avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 0.75rem;
    flex-shrink: 0;
}

.user h6 {
    font-size: 0.8rem;
    color: #253858;
}

.user small {
    font-size: 0.65rem;
}

.logout-btn {
    background: transparent;
    border: none;
    color: #ef4444;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    gap: 2px;
    font-family: "Inter", "Noto Sans Khmer", sans-serif;
    text-decoration: none;
}

.logout-btn:hover {
    background: #fef2f2;
    color: #dc2626;
}

.logout-btn i {
    font-size: 1.05rem;
    width: 20px;
    text-align: center;
}


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


.slide-enter-active {
    transition: all 0.25s ease-out;
}

.slide-leave-active {
    transition: all 0.2s ease-in;
}

.slide-enter-from {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
}

.slide-enter-to {
    opacity: 1;
    max-height: 120px;
    overflow: hidden;
}

.slide-leave-from {
    opacity: 1;
    max-height: 120px;
    overflow: hidden;
}

.slide-leave-to {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
}
</style>
