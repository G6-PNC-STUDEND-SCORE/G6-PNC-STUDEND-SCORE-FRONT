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
            <RouterLink to="/" class="sidebar-link">
                <i class="bi bi-grid-fill me-2"></i>
                Dashboard
            </RouterLink>

            <RouterLink to="/class" class="sidebar-link">
                <i class="bi bi-people-fill me-2"></i>
                Classes
            </RouterLink>

            <RouterLink to="/subject" class="sidebar-link">
                <i class="bi bi-book-fill me-2"></i>
                Subjects
            </RouterLink>

            <RouterLink to="/student" class="sidebar-link">
                <i class="bi bi-person-badge-fill me-2"></i>
                Students
            </RouterLink>

            <RouterLink to="/score" class="sidebar-link">
                <i class="bi bi-clipboard-data-fill me-2"></i>
                Scores
            </RouterLink>

            <RouterLink to="/report" class="sidebar-link">
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
        <div class="user d-flex align-items-center border-top px-3 py-2">
            <div class="avatar">
                SV
            </div>
            <div class="ms-2">
                <h6 class="mb-0 fw-bold">Sreyvik Von</h6>
                <small class="text-secondary">Admin</small>
            </div>
        </div>

    </aside>
</template>

<script setup lang="ts">

import { ref } from 'vue'

const settingsOpen = ref(false)

function toggleSettings() {
    settingsOpen.value = !settingsOpen.value
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
