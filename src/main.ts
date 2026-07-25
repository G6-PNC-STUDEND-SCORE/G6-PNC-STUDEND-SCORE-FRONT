import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useAuthStore } from './stores/auth'
import router from './router'
import i18n from './i18n'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(i18n)

const authStore = useAuthStore()

authStore.ensureReady().finally(() => {
  app.mount('#app')
})
