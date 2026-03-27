<template>
  <div class="server-backup-section">
    <h3 class="server-backup-section__heading">Sync Status</h3>

    <!-- Auto-save status -->
    <div v-if="syncStore.status.message" class="docsync-status">
      <span class="status-dot" :style="{ background: statusColor }"></span>
      <span :style="{ color: statusColor }">{{ syncStore.status.message }}</span>
    </div>
    <p v-else class="server-backup-section__desc">
      All changes are saved automatically.
    </p>
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
  margin: 0 0 8px 0;
}

.server-backup-section__desc {
  font-size: 13px;
  color: var(--text-muted, #888);
  margin: 0;
  line-height: 1.5;
}

.docsync-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
</style>
