<template>
  <div class="server-backup-section">
    <h3 class="server-backup-section__heading">Server Backup</h3>
    <p class="server-backup-section__desc">
      Save your playbook data to the server for persistence across browsers, or load previously saved data.
    </p>

    <div class="docsync-controls">
      <button class="docsync-sync-btn" @click="handleSave">
        Save to Server
      </button>
      <button class="server-backup-section__load" @click="handleLoad">
        Load from Server
      </button>
    </div>

    <!-- Auto-save status -->
    <div v-if="syncStore.status.message" class="docsync-status">
      <span class="status-dot" :style="{ background: statusColor }"></span>
      <span :style="{ color: statusColor }">{{ syncStore.status.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useServerSyncStore } from '@/stores/serverSync.js'

const syncStore = useServerSyncStore()

const statusColor = computed(() => {
  const colors = {
    saving: 'var(--warning, #b47a1a)',
    success: 'var(--success, #0a8)',
    error: 'var(--error, #e53e3e)',
    info: 'var(--text-muted, #888)',
  }
  return colors[syncStore.status.type] || colors.info
})

async function handleSave() {
  await syncStore.saveToServer()
}

async function handleLoad() {
  const confirmed = window.confirm(
    'Load server data? This will overwrite your current browser data.'
  )
  if (!confirmed) return

  const loaded = await syncStore.loadFromServer()
  if (loaded) {
    // Re-initialize after loading data
    window.location.reload()
  }
}
</script>

<style scoped>
.server-backup-section {
  margin-bottom: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--card-border, #e0e0e0);
}

.server-backup-section__heading {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark, #1a1a1a);
  margin: 0 0 4px 0;
}

.server-backup-section__desc {
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

.server-backup-section__load {
  padding: 8px 18px;
  background: var(--card, #fff);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  color: var(--text-muted, #888);
  font-family: var(--font-body, inherit);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.server-backup-section__load:hover {
  background: var(--dk-light, #ebf5fb);
  border-color: var(--dk, #008fc9);
  color: var(--dk, #008fc9);
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
