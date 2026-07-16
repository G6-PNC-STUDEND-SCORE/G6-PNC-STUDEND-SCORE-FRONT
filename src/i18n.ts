import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import km from './locales/km.json'

// Migrate 'kh' to 'km' if exists in localStorage
const savedLang = localStorage.getItem('language')
if (savedLang === 'kh') {
  localStorage.setItem('language', 'km')
}

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('language') || 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    km
  }
})

export default i18n
