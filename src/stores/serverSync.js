import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePlaybookStore } from './playbook.js'
import { useAuthStore } from './auth.js'

export const useServerSyncStore = defineStore('serverSync', () => {
  // ── State ──

  // JSON snapshot of last saved data, used to detect actual changes
  const lastSaveJson = ref(null)

  // Current sync status for display in the UI
  const status = ref({ type: 'info', message: '' })

  // Internal debounce timer id
  let saveTimer = null

  // Reference to the $subscribe unsubscribe function
  let unsubscribe = null

  // ── Helpers ──

  /**
   * Gather all persistent data from stores and localStorage into one object.
   */
  function gatherData() {
    const playbookStore = usePlaybookStore()
    const authStore = useAuthStore()

    return {
      playbook_overrides: playbookStore.overrides,
      custom_playbooks: playbookStore.customPlaybooks,
      docsync_url: localStorage.getItem('eddie_docsync_url') || null,
      google_client_id: authStore.googleClientId || null,
      api_key: authStore.apiKey || null,
      gdocs_last_id: localStorage.getItem('eddie_gdocs_last_id') || null,
      gdocs_last_name: localStorage.getItem('eddie_gdocs_last_name') || null,
      syntax_blocks: JSON.parse(localStorage.getItem('eddie_syntax_blocks') || '[]'),
    }
  }

  /**
   * Restore data from the server into stores and localStorage.
   */
  function restoreData(data) {
    const playbookStore = usePlaybookStore()
    const authStore = useAuthStore()

    if (data.playbook_overrides) {
      localStorage.setItem(
        'eddie_playbook_overrides',
        JSON.stringify(data.playbook_overrides),
      )
    }
    if (data.custom_playbooks) {
      localStorage.setItem(
        'eddie_custom_playbooks',
        JSON.stringify(data.custom_playbooks),
      )
    }
    if (data.docsync_url) {
      localStorage.setItem('eddie_docsync_url', data.docsync_url)
    }
    if (data.google_client_id) {
      localStorage.setItem('eddie_google_client_id', data.google_client_id)
      authStore.googleClientId = data.google_client_id
    }
    if (data.api_key) {
      localStorage.setItem('eddie_api_key', data.api_key)
      authStore.apiKey = data.api_key
    }
    if (data.gdocs_last_id) {
      localStorage.setItem('eddie_gdocs_last_id', data.gdocs_last_id)
    }
    if (data.gdocs_last_name) {
      localStorage.setItem('eddie_gdocs_last_name', data.gdocs_last_name)
    }
    if (data.syntax_blocks) {
      localStorage.setItem('eddie_syntax_blocks', JSON.stringify(data.syntax_blocks))
    }

    // Re-initialize playbook store so it picks up restored overrides/customs
    playbookStore.init()
  }

  function setStatus(type, message) {
    status.value = { type, message }
  }

  // ── Actions ──

  /**
   * Initialize server sync: auto-load from server, then watch for store changes.
   */
  async function init() {
    await autoLoad()
    watchForChanges()
  }

  /**
   * Auto-load data from the server on startup.
   * If server data differs from local, restore it and re-init the playbook store.
   */
  async function autoLoad() {
    try {
      const res = await fetch('/api/load')
      if (!res.ok) {
        setStatus('error', 'Cannot reach server \u2014 auto-save unavailable.')
        return
      }

      const result = await res.json()

      if (result.saved && result.data) {
        // Compare server overrides with local overrides (ignore _savedAt)
        const serverOverrides = JSON.stringify(result.data.playbook_overrides || {})
        const localOverrides = JSON.stringify(gatherData().playbook_overrides || {})
        const serverCustom = JSON.stringify(result.data.custom_playbooks || {})
        const localCustom = JSON.stringify(gatherData().custom_playbooks || {})

        if (serverOverrides !== localOverrides || serverCustom !== localCustom) {
          // Server has different data — restore it
          restoreData(result.data)
          setStatus('info', 'Synced from server.')
        }

        lastSaveJson.value = JSON.stringify(gatherData())
        const date = new Date(result.data._savedAt)
        setStatus('info', 'Auto-save active. Last save: ' + date.toLocaleString())
      } else {
        lastSaveJson.value = JSON.stringify(gatherData())
        setStatus('info', 'Auto-save active. No previous save found.')
      }
    } catch {
      setStatus('error', 'Cannot reach server \u2014 auto-save unavailable.')
    }
  }

  /**
   * Watch for changes in the playbook store using Pinia $subscribe.
   * Replaces the old monkey-patching of localStorage.setItem.
   */
  function watchForChanges() {
    const playbookStore = usePlaybookStore()

    // Clean up any previous subscription
    if (unsubscribe) {
      unsubscribe()
    }

    unsubscribe = playbookStore.$subscribe(
      () => {
        scheduleAutoSave()
      },
      { detached: true },
    )
  }

  /**
   * Debounced auto-save: waits 2 seconds after the last change before saving.
   */
  function scheduleAutoSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      autoSave()
    }, 2000)
  }

  /**
   * Perform an auto-save if data has actually changed since the last save.
   */
  async function autoSave() {
    const data = gatherData()
    const json = JSON.stringify(data)

    // Skip if nothing changed
    if (json === lastSaveJson.value) return

    lastSaveJson.value = json
    setStatus('saving', 'Auto-saving...')

    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
      })

      if (res.ok) {
        const result = await res.json()
        const date = new Date(result.savedAt)
        setStatus('success', 'Auto-saved at ' + date.toLocaleTimeString())
      } else {
        setStatus('error', 'Auto-save failed: ' + res.statusText)
      }
    } catch {
      setStatus('error', 'Auto-save failed \u2014 network error.')
    }
  }

  /**
   * Manual save: force a save even if no changes detected.
   */
  async function saveToServer() {
    lastSaveJson.value = null
    await autoSave()
  }

  /**
   * Manual load: fetch data from the server and restore it.
   * Returns true if data was restored, false otherwise.
   */
  async function loadFromServer() {
    setStatus('saving', 'Loading from server...')

    try {
      const res = await fetch('/api/load')
      if (!res.ok) {
        setStatus('error', 'Load failed: ' + res.statusText)
        return false
      }

      const result = await res.json()
      if (!result.saved || !result.data) {
        setStatus('info', 'No saved data found on server.')
        return false
      }

      restoreData(result.data)
      setStatus('success', 'Data loaded from server.')
      return true
    } catch {
      setStatus('error', 'Network error \u2014 could not load.')
      return false
    }
  }

  /**
   * Clean up the store subscription when the store is no longer needed.
   */
  function dispose() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
  }

  return {
    // State
    lastSaveJson,
    status,

    // Actions
    init,
    saveToServer,
    loadFromServer,
    scheduleAutoSave,
    dispose,
  }
})
