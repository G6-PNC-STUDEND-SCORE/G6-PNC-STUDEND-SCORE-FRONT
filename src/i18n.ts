import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import km from './locales/km.json'

const savedLang = localStorage.getItem('language')
if (savedLang === 'kh') {
  localStorage.setItem('language', 'km')
}

const initialLocale = localStorage.getItem('language') || 'en'

// Sync <html> lang attribute so CSS can target Khmer-specific styling
document.documentElement.setAttribute('lang', initialLocale)

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    km
  }
})

export default i18n
