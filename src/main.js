import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'

import './assets/css/variables.css'
import './assets/css/layout.css'
import './assets/css/components.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
