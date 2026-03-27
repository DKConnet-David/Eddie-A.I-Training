import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──
  const apiKey = ref(sessionStorage.getItem('eddie_api_key') || '')
  const googleClientId = ref(localStorage.getItem('eddie_google_client_id') || '')

  // ── Actions ──
  function setApiKey(key) {
    apiKey.value = key
    sessionStorage.setItem('eddie_api_key', key)
  }

  function hasApiKey() {
    return !!apiKey.value
  }

  function clearApiKey() {
    apiKey.value = ''
    sessionStorage.removeItem('eddie_api_key')
  }

  function setGoogleClientId(id) {
    googleClientId.value = id
    localStorage.setItem('eddie_google_client_id', id)
  }

  return {
    apiKey,
    googleClientId,
    setApiKey,
    hasApiKey,
    clearApiKey,
    setGoogleClientId,
  }
})
