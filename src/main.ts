
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useAuthStore } from './stores/auth'
import router from './router'
import i18n from './i18n'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(i18n)

const authStore = useAuthStore()

// Wait for auth initialization (load user from token) before mounting the app
// This prevents the router guard from redirecting to /login before init() completes
authStore.init().finally(() => {
  app.mount('#app')
})

