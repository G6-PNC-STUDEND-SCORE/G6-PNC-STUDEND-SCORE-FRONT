 <template>
    <aside :class="['sidebar', 'd-flex', 'flex-column', { 'dark-mode': theme.isDark }]">
        <div class="logo d-flex align-items-center">
            <div class="logo-icon me-2">
                <img src="/images/images.png" alt="PNCStudentScore" class="logo-img">
            </div>
            <div class="logo-text">
                <h5 class="mb-0 fw-bold">PNCScore</h5>
                <small class="text-secondary">Student Score Management</small>
            </div>
        </div>
        <nav class="px-2 py-2 flex-grow-1">
            <RouterLink 
                v-for="route in sidebarRoutes" 
                :key="route.path" 
                :to="route.path" 
                class="sidebar-link"
                :class="{ 'submenu-item': route.meta?.parent }"
            >
                <i :class="route.meta?.icon || 'bi bi-link'"></i>
                {{ getRouteTitle(route) }}
            </RouterLink>

            <h6 v-if="hasSettingsRoutes" class="menu-title mt-3 mb-2">{{ t('nav.administration') }}</h6>

            <div 
                v-if="hasSettingsRoutes" 
                class="menu-parent" 
                @click="toggleSettings" 
                @keydown.enter.prevent="toggleSettings" 
                role="button"
                tabindex="0"
            >
                <i class="bi bi-gear-fill me-2"></i>
                {{ t('nav.settings') }}
                <i class="bi ms-auto chevron-icon" :class="settingsOpen ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
            </div>

            <Transition name="slide">
                <div v-if="settingsOpen" class="submenu">
                    <RouterLink 
                        v-for="route in settingsRoutes" 
                        :key="route.path" 
                        :to="route.path" 
                        class="sidebar-link submenu-item"
                    >
                        <i :class="route.meta?.icon || 'bi bi-link'"></i>
                        {{ getRouteTitle(route) }}
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import { routes } from '@/router/routes'

const { t } = useI18n()
const theme = useThemeStore()
const settingsOpen = ref(false)

const sidebarRoutes = computed(() => {
  return routes.filter(route => 
    route.meta?.showInSidebar === true && 
    route.meta?.parent !== 'settings' &&
    route.path !== '/login'
  )
})

const settingsRoutes = computed(() => {
  return routes.filter(route => 
    route.meta?.showInSidebar === true && 
    route.meta?.parent === 'settings'
  )
})

const hasSettingsRoutes = computed(() => settingsRoutes.value.length > 0)

function toggleSettings() {
    settingsOpen.value = !settingsOpen.value
}

function getRouteTitle(route: any) {
  const metaTitle = route.meta?.title
  if (metaTitle) {
    const translationKey = metaTitle.toLowerCase().replace(/\s+/g, '')
    const translated = t(`nav.${translationKey}`)
    return translated !== `nav.${translationKey}` ? translated : metaTitle
  }
  return route.name || 'Unknown'
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
    transition: background-color 0.3s ease, border-color 0.3s ease;
}

.sidebar.dark-mode {
    background: #1e293b;
    border-right-color: #334155;
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

.logo {
    height: 56px;
    padding: 0 16px;
    border-bottom: 2px solid #e9ecef;
    transition: border-color 0.3s ease;
}

.sidebar.dark-mode .logo {
    border-bottom-color: #334155;
}

.logo-text h5 {
    color: #253858;
    font-size: 0.95rem;
    line-height: 1.2;
    transition: color 0.3s ease;
}

.sidebar.dark-mode .logo-text h5 {
    color: #f1f5f9;
}

.logo-text small {
    font-size: 0.65rem;
    color: #64748b;
    transition: color 0.3s ease;
}

.sidebar.dark-mode .logo-text small {
    color: #94a3b8;
}

.menu-title {
    color: #94a3b8;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 0 12px;
    transition: color 0.3s ease;
}

.sidebar.dark-mode .menu-title {
    color: #64748b;
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

.sidebar.dark-mode .sidebar-link {
    color: #cbd5e1;
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

.sidebar.dark-mode .sidebar-link:hover {
    background: #334155;
    color: #60a5fa;
}

.sidebar-link.router-link-active {
    background: #e8f1ff;
    color: #2563eb;
    font-weight: 600;
}

.sidebar.dark-mode .sidebar-link.router-link-active {
    background: #1e40af;
    color: #60a5fa;
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

.sidebar.dark-mode .menu-parent {
    color: #cbd5e1;
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

.sidebar.dark-mode .menu-parent:hover {
    background: #334155;
    color: #60a5fa;
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
    transition: border-color 0.3s ease;
}

.sidebar.dark-mode .submenu {
    border-left-color: #334155;
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

.sidebar.dark-mode .user {
    background: #0f172a;
}

.user:hover {
    background: #f8fafc;
}

.sidebar.dark-mode .user:hover {
    background: #1e293b;
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
    transition: color 0.3s ease;
}

.sidebar.dark-mode .user h6 {
    color: #f1f5f9;
}

.user small {
    font-size: 0.65rem;
    color: #64748b;
    transition: color 0.3s ease;
}

.sidebar.dark-mode .user small {
    color: #94a3b8;
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
