<template>
  <div class="language-switcher">
    <div class="dropdown" ref="dropdownRef">
      <button
        class="dropdown-toggle"
        @click="toggleDropdown"
        :aria-expanded="isOpen"
        aria-haspopup="true"
      >
        <span class="flag">{{ currentFlag }}</span>
        <span class="language-name">{{ currentLanguageName }}</span>
        <svg
          class="chevron"
          :class="{ rotated: isOpen }"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <div class="dropdown-menu" :class="{ show: isOpen }">
        <button
          v-for="lang in languages"
          :key="lang.code"
          class="dropdown-item"
          :class="{ active: currentLocale === lang.code }"
          @click="selectLanguage(lang.code)"
        >
          <span class="flag">{{ lang.flag }}</span>
          <span class="language-name">{{ lang.name }}</span>
          <svg
            v-if="currentLocale === lang.code"
            class="check-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M3.5 8L6.5 11L12.5 5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const languages = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'km', flag: '🇰🇭', name: 'ខ្មែរ' },
]

const currentLocale = computed(() => locale.value)

const currentFlag = computed(() => {
  const lang = languages.find((l) => l.code === locale.value)
  return lang?.flag || '🇺🇸'
})

const currentLanguageName = computed(() => {
  const lang = languages.find((l) => l.code === locale.value)
  return lang?.name || 'English'
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectLanguage = (langCode: string) => {
  locale.value = langCode as 'en' | 'km'
  localStorage.setItem('language', langCode)
  isOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
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
.language-switcher {
  position: relative;
}

.dropdown {
  position: relative;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
  min-width: 140px;
}

.dropdown-toggle:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.dropdown-toggle:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.flag {
  font-size: 18px;
  line-height: 1;
}

.language-name {
  flex: 1;
  text-align: left;
}

.chevron {
  color: #9ca3af;
  transition: transform 0.2s ease;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  min-width: 160px;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s ease;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: background 0.15s ease;
  text-align: left;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.dropdown-item.active {
  background: #eff6ff;
  color: #3b82f6;
}

.check-icon {
  margin-left: auto;
  color: #3b82f6;
}
</style>
