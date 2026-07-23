import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const stored = localStorage.getItem('theme')
  const hasStored = stored !== null
  const prefersDark =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false

  const isDark = ref(hasStored ? stored === 'dark' : prefersDark)
  let userOverridden = hasStored

  function applyTheme(val: boolean) {
    // Set data attribute on html for CSS variable theming
    document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light')
    // Update meta theme-color for browser chrome
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', val ? '#0f172a' : '#f0f2f5')
    }
  }

  let currentOverlay: HTMLDivElement | null = null

  function toggle() {
    userOverridden = true
    const newVal = !isDark.value

    // Cancel any previous overlay animation
    if (currentOverlay) {
      currentOverlay.remove()
      currentOverlay = null
    }

    isDark.value = newVal

    // Subtle macOS-style full-screen flash overlay for smooth transition
    const overlay = document.createElement('div')
    currentOverlay = overlay
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 999999;
      pointer-events: none;
      background: ${newVal ? '#000' : '#fff'};
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `
    document.body.appendChild(overlay)
    // Animate in then out
    requestAnimationFrame(() => {
      overlay.getBoundingClientRect()
      overlay.style.opacity = '0.1'
      setTimeout(() => {
        if (currentOverlay === overlay) {
          overlay.style.opacity = '0'
          setTimeout(() => {
            if (currentOverlay === overlay) {
              overlay.remove()
              currentOverlay = null
            }
          }, 300)
        }
      }, 100)
    })
  }

  // Apply theme immediately on init
  if (typeof window !== 'undefined') {
    applyTheme(isDark.value)
  }

  watch(isDark, (val) => {
    localStorage.setItem('theme', val ? 'dark' : 'light')
    applyTheme(val)
  })

  // Listen for OS preference changes
  if (typeof window !== 'undefined') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', (e) => {
      if (!userOverridden) {
        isDark.value = e.matches
      }
    })
  }

  return {
    isDark,
    toggle,
  }
})
