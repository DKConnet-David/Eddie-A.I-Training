<template>
  <div class="export-gdocs-section">
    <h3 class="export-gdocs-section__heading">Google Docs Export</h3>
    <p class="export-gdocs-section__desc">
      Upload your playbooks as a native Google Doc. Requires a Google OAuth Client ID.
    </p>

    <div class="docsync-controls">
      <button class="docsync-sync-btn" @click="startExport">
        Export to Google Docs
      </button>
      <button class="export-gdocs-section__reset" @click="resetAuth">
        Reset Google Account
      </button>
    </div>

    <!-- Last doc link -->
    <div v-if="lastDocId" class="export-gdocs-section__last">
      Last export:
      <a
        :href="'https://docs.google.com/document/d/' + lastDocId + '/edit'"
        target="_blank"
        class="export-gdocs-section__link"
      >
        {{ lastDocName || 'Open document' }}
      </a>
    </div>

    <div v-if="statusMessage" class="docsync-status">
      <span class="status-dot" :style="{ background: statusColor }"></span>
      <span :style="{ color: statusColor }" v-html="statusMessage"></span>
    </div>

    <!-- Choice modal -->
    <GDocsChoiceModal
      v-if="showChoiceModal"
      :last-doc-id="lastDocId"
      :last-doc-name="lastDocName"
      @create-new="onCreateNew"
      @update-last="onUpdateLast"
      @pick-existing="onPickExisting"
      @cancel="showChoiceModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { usePlaybookStore } from '@/stores/playbook.js'
import { buildDocument } from '@/lib/docExport.js'
import GDocsChoiceModal from '@/components/modals/GDocsChoiceModal.vue'

const authStore = useAuthStore()
const playbookStore = usePlaybookStore()

const statusMessage = ref('')
const statusColor = ref('var(--text-muted, #888)')
const showChoiceModal = ref(false)

const lastDocId = ref(localStorage.getItem('eddie_gdocs_last_id') || '')
const lastDocName = ref(localStorage.getItem('eddie_gdocs_last_name') || '')

let accessToken = null
let tokenClient = null
let pickerLoaded = false
let targetFileId = null

onMounted(() => {
  lastDocId.value = localStorage.getItem('eddie_gdocs_last_id') || ''
  lastDocName.value = localStorage.getItem('eddie_gdocs_last_name') || ''
})

function setStatus(type, message) {
  const colors = {
    syncing: 'var(--warning, #b47a1a)',
    success: 'var(--success, #0a8)',
    error: 'var(--error, #e53e3e)',
  }
  statusColor.value = colors[type] || 'var(--text-muted, #888)'
  statusMessage.value = message
}

function ensureClientId() {
  let clientId = authStore.googleClientId
  if (clientId) return clientId

  clientId = prompt(
    'Enter your Google OAuth Client ID to enable Google Docs export.\n\n' +
    'You can create one at console.cloud.google.com under\n' +
    'APIs & Services > Credentials > OAuth 2.0 Client ID (Web application).\n\n' +
    'Make sure the Google Drive API and Google Picker API are enabled,\n' +
    'and your origin is in Authorized JavaScript Origins.'
  )

  if (clientId && clientId.trim()) {
    authStore.setGoogleClientId(clientId.trim())
    return clientId.trim()
  }
  return null
}

function initTokenClient(clientId, callback) {
  if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
    setStatus('error', 'Google Identity Services not loaded. Check your internet connection.')
    return
  }

  if (!tokenClient) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response) => {
        if (response.error) {
          setStatus('error', 'Auth failed: ' + response.error)
          return
        }
        accessToken = response.access_token
        if (callback) callback()
      },
    })
  }
}

function startExport() {
  const clientId = ensureClientId()
  if (!clientId) {
    setStatus('error', 'Google Client ID is required.')
    return
  }

  const proceed = () => {
    showChoiceModal.value = true
  }

  initTokenClient(clientId, proceed)

  if (accessToken) {
    proceed()
  } else {
    setStatus('syncing', 'Authenticating with Google...')
    tokenClient.requestAccessToken({ prompt: 'select_account' })
  }
}

function resetAuth() {
  accessToken = null
  tokenClient = null
  authStore.setGoogleClientId('')
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect()
  }
  setStatus('success', 'Google account reset. Click "Export to Google Docs" to sign in again.')
}

function buildDocHtml() {
  const content = buildDocument(
    playbookStore.playbooks,
    playbookStore.playbookOrder,
    playbookStore.overrides,
  )

  return [
    '<html><head><meta charset="utf-8">',
    '<style>',
    'body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.6; }',
    'h1 { font-size: 22pt; text-align: center; margin-bottom: 4pt; }',
    'h2 { font-size: 16pt; color: #0d0f12; margin-top: 24pt; border-bottom: 1px solid #ddd; padding-bottom: 4pt; }',
    'h3 { font-size: 13pt; color: #333; margin-top: 18pt; }',
    'h4 { font-size: 11pt; color: #555; margin-top: 12pt; }',
    '.step-card { border: 1px solid #e0e0e0; border-radius: 6px; margin: 10pt 0; padding: 0; }',
    '.step-header { background: #f8f8f8; padding: 8pt 12pt; font-weight: bold; }',
    '.step-number { display: inline-block; background: #eee; padding: 2pt 6pt; border-radius: 4px; font-size: 10pt; margin-right: 6pt; }',
    '.step-chevron { display: none; }',
    '.step-body { padding: 8pt 12pt; }',
    '.msg-block { background: #f0f7fb; border-left: 3px solid #008fc9; padding: 8pt 12pt; margin: 8pt 0; }',
    '.msg-block-label { font-size: 8pt; color: #0369a1; text-transform: uppercase; font-weight: bold; }',
    '.internal-block { background: #f5f5f5; border-left: 3px solid #999; padding: 8pt 12pt; margin: 8pt 0; }',
    '.internal-block-label { font-size: 8pt; color: #666; text-transform: uppercase; font-weight: bold; }',
    '.warn-block { background: #fef2f2; border-left: 3px solid #e53e3e; padding: 8pt 12pt; margin: 8pt 0; }',
    '.warn-block-label { font-size: 8pt; color: #e53e3e; text-transform: uppercase; font-weight: bold; }',
    '.tag { font-size: 8pt; padding: 1pt 6pt; border-radius: 3px; margin-right: 3pt; }',
    '.tag-green { background: #e6f9f0; color: #0369a1; }',
    '.tag-amber { background: #fef3e0; color: #b47a1a; }',
    '.tag-red { background: #fef2f2; color: #c53030; }',
    '.tag-blue { background: #ebf5fb; color: #2b6cb0; }',
    '.route-link { color: #0369a1; font-weight: bold; text-decoration: underline; }',
    'hr { border: none; border-top: 1px solid #ccc; margin: 20pt 0; }',
    'p { margin: 4pt 0; }',
    '</style></head><body>',
    '<h1>Eddie AI \u2014 Playbook Reference</h1>',
    '<p style="text-align:center;color:#666;font-size:10pt;margin-bottom:20pt;">Generated ' +
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '</p>',
    '<hr>',
    content,
    '</body></html>',
  ].join('\n')
}

function loadPicker(callback) {
  if (pickerLoaded) { callback(); return }
  gapi.load('picker', () => {
    pickerLoaded = true
    callback()
  })
}

function uploadToGoogleDocs() {
  const html = buildDocHtml()
  const fileId = targetFileId

  if (fileId) {
    setStatus('syncing', 'Updating existing document...')
    const boundary = '---EddieExport' + Date.now()
    const metadata = JSON.stringify({})

    const multipartBody =
      '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadata + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
      html + '\r\n' +
      '--' + boundary + '--'

    fetch('https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=multipart', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'multipart/related; boundary=' + boundary,
      },
      body: multipartBody,
    })
      .then((res) => {
        if (res.status === 401) {
          accessToken = null
          tokenClient.requestAccessToken({ prompt: 'select_account' })
          return
        }
        return res.json().then((result) => {
          if (res.ok) {
            const docUrl = 'https://docs.google.com/document/d/' + result.id + '/edit'
            localStorage.setItem('eddie_gdocs_last_id', result.id)
            localStorage.setItem('eddie_gdocs_last_name', result.name)
            lastDocId.value = result.id
            lastDocName.value = result.name
            setStatus('success', '\u2713 Updated Google Doc \u2014 <a href="' + docUrl + '" target="_blank" style="color:var(--accent, #008fc9);text-decoration:underline;">Open document</a>')
          } else {
            setStatus('error', result.error ? result.error.message : 'Update failed (HTTP ' + res.status + ')')
          }
        })
      })
      .catch(() => {
        setStatus('error', 'Network error \u2014 could not reach Google Drive.')
      })
  } else {
    setStatus('syncing', 'Creating new Google Doc...')
    const fileName = 'Eddie AI Playbooks \u2014 ' +
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const boundary = '---EddieExport' + Date.now()
    const metadata = JSON.stringify({ name: fileName, mimeType: 'application/vnd.google-apps.document' })

    const multipartBody =
      '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadata + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
      html + '\r\n' +
      '--' + boundary + '--'

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'multipart/related; boundary=' + boundary,
      },
      body: multipartBody,
    })
      .then((res) => {
        if (res.status === 401) {
          accessToken = null
          tokenClient.requestAccessToken({ prompt: 'select_account' })
          return
        }
        return res.json().then((result) => {
          if (res.ok) {
            const docUrl = 'https://docs.google.com/document/d/' + result.id + '/edit'
            localStorage.setItem('eddie_gdocs_last_id', result.id)
            localStorage.setItem('eddie_gdocs_last_name', result.name || fileName)
            lastDocId.value = result.id
            lastDocName.value = result.name || fileName
            setStatus('success', '\u2713 Exported to Google Docs \u2014 <a href="' + docUrl + '" target="_blank" style="color:var(--accent, #008fc9);text-decoration:underline;">Open document</a>')
          } else {
            setStatus('error', result.error ? result.error.message : 'Upload failed (HTTP ' + res.status + ')')
          }
        })
      })
      .catch(() => {
        setStatus('error', 'Network error \u2014 could not reach Google Drive.')
      })
  }
}

function onCreateNew() {
  showChoiceModal.value = false
  targetFileId = null
  uploadToGoogleDocs()
}

function onUpdateLast() {
  showChoiceModal.value = false
  targetFileId = lastDocId.value
  uploadToGoogleDocs()
}

function onPickExisting() {
  showChoiceModal.value = false
  setStatus('syncing', 'Opening file picker...')

  loadPicker(() => {
    const docsView = new google.picker.DocsView(google.picker.ViewId.DOCUMENTS)
      .setMimeTypes('application/vnd.google-apps.document')
      .setMode(google.picker.DocsViewMode.LIST)

    const picker = new google.picker.PickerBuilder()
      .setTitle('Select a Google Doc to overwrite')
      .addView(docsView)
      .setOAuthToken(accessToken)
      .setCallback((data) => {
        if (data.action === google.picker.Action.PICKED) {
          const doc = data.docs[0]
          targetFileId = doc.id
          setStatus('syncing', 'Updating "' + doc.name + '"...')
          uploadToGoogleDocs()
        } else if (data.action === google.picker.Action.CANCEL) {
          setStatus('', 'Export cancelled.')
        }
      })
      .build()
    picker.setVisible(true)
  })
}
</script>

<style scoped>
.export-gdocs-section {
  margin-bottom: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--card-border, #e0e0e0);
}

.export-gdocs-section__heading {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark, #1a1a1a);
  margin: 0 0 4px 0;
}

.export-gdocs-section__desc {
  font-size: 13px;
  color: var(--text-muted, #888);
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.docsync-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.docsync-sync-btn {
  padding: 8px 18px;
  background: var(--dk, #008fc9);
  border: 1px solid var(--dk, #008fc9);
  border-radius: var(--radius-md, 6px);
  color: white;
  font-family: var(--font-body, inherit);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.docsync-sync-btn:hover { background: var(--dk-hover, #0077a8); }

.export-gdocs-section__reset {
  padding: 8px 14px;
  background: transparent;
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  color: var(--text-muted, #888);
  font-family: var(--font-body, inherit);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.export-gdocs-section__reset:hover {
  color: var(--error, #e53e3e);
  border-color: var(--error, #e53e3e);
}

.export-gdocs-section__last {
  font-size: 12px;
  color: var(--text-muted, #888);
  margin-bottom: 10px;
}

.export-gdocs-section__link {
  color: var(--dk, #008fc9);
  text-decoration: underline;
}

.docsync-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  margin-bottom: 8px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
</style>
