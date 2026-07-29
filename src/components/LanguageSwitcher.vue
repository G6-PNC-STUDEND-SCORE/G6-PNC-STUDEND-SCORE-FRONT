<template>
  <div class="language-switcher" ref="dropdownRef">
    <button
      class="lang-toggle"
      @click="toggleDropdown"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      :title="currentLanguageName"
    >
      <img
        :src="currentFlagSrc"
        :alt="currentLanguageName"
        class="flag-img"
        width="22"
        height="16"
      />
      <span class="lang-label">{{ currentLanguageName }}</span>
      <svg
        class="chevron"
        :class="{ rotated: isOpen }"
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
      >
        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <Transition name="lang-dropdown">
      <div v-if="isOpen" class="lang-menu">
        <button
          v-for="lang in languages"
          :key="lang.code"
          class="lang-option"
          :class="{ selected: currentLocale === lang.code }"
          @click="selectLanguage(lang.code)"
        >
          <div class="option-left">
            <img
              :src="getFlagSrc(lang.code)"
              :alt="lang.name"
              class="flag-img"
              width="24"
              height="18"
            />
            <div class="option-text">
              <span class="option-name">{{ lang.name }}</span>
              <span class="option-native">{{ lang.native }}</span>
            </div>
          </div>
          <div v-if="currentLocale === lang.code" class="check-badge">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import UKFlag from '@/assets/images/UK.png'
import KHFlag from '@/assets/images/KH.png'

const { locale } = useI18n()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const languages = [
  {
    code: 'en',
    flag: UKFlag,
    name: 'English',
    native: 'English',
  },
  {
    code: 'km',
    flag: KHFlag,
    name: 'Khmer',
    native: 'ភាសាខ្មែរ',
  },
]

const currentLocale = computed(() => locale.value)

const currentFlagSrc = computed(() => {
  const lang = languages.find((l) => l.code === locale.value)
  return lang?.flag || UKFlag
})

const currentLanguageName = computed(() => {
  const lang = languages.find((l) => l.code === locale.value)
  return lang?.name || 'English'
})

function getFlagSrc(code: string) {
  const lang = languages.find((l) => l.code === code)
  return lang?.flag || UKFlag
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function selectLanguage(langCode: string) {
  locale.value = langCode as 'en' | 'km'
  localStorage.setItem('language', langCode)
  document.documentElement.setAttribute('lang', langCode)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
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
/* ─── Container ─── */
.language-switcher {
  position: relative;
  user-select: none;
}

/* ─── Toggle Button ─── */
.lang-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  white-space: nowrap;
  font-family: inherit;
}

.lang-toggle:hover {
  background: rgba(255, 255, 255, 1);
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.lang-toggle:active {
  transform: translateY(0px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.lang-toggle:focus-visible {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* ─── Flag Image ─── */
.flag-img {
  border-radius: 3px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  display: block;
}

.lang-toggle .flag-img {
  width: 22px;
  height: 16px;
}

/* ─── Label ─── */
.lang-label {
  flex: 1;
  text-align: left;
  line-height: 1;
}

/* ─── Chevron ─── */
.chevron {
  color: #94a3b8;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.chevron.rotated {
  transform: rotate(180deg);
}

/* ─── Dropdown Menu ─── */
.lang-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.06),
    0 10px 24px -4px rgba(0, 0, 0, 0.08);
  min-width: 200px;
  padding: 4px;
  z-index: 1000;
}

/* ─── Transition ─── */
.lang-dropdown-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.lang-dropdown-leave-active {
  transition: all 0.15s ease-in;
}
.lang-dropdown-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
.lang-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}

/* ─── Dropdown Option ─── */
.lang-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  transition: all 0.15s ease;
  text-align: left;
  font-family: inherit;
  gap: 8px;
}

.lang-option:hover {
  background: #f1f5f9;
}

.lang-option.selected {
  background: #eff6ff;
  color: #2563eb;
}

.lang-option:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px #3b82f6;
}

.option-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.option-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.option-name {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.3;
  color: #1e293b;
}

.lang-option.selected .option-name {
  color: #2563eb;
}

.option-native {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.3;
}

.lang-option.selected .option-native {
  color: #60a5fa;
}

.check-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  border-radius: 50%;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
}

.lang-option:not(.selected) .check-badge {
  display: none;
}
</style>
