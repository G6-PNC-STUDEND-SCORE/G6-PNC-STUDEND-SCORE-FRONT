
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useAuthStore } from './stores/auth'
import router from './router/index.ts'
import i18n from './i18n'

const app = createApp(App)
app.use(createPinia())
app.use(router)

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(i18n)

const authStore = useAuthStore()
authStore.init()

app.mount('#app')

