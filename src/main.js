import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'

import './assets/css/variables.css'
import './assets/css/layout.css'
import './assets/css/components.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')

// Initialize stores after mount
import { usePlaybookStore } from './stores/playbook.js'
import { useServerSyncStore } from './stores/serverSync.js'

const playbookStore = usePlaybookStore()
playbookStore.init()

const serverSyncStore = useServerSyncStore()
serverSyncStore.init()
