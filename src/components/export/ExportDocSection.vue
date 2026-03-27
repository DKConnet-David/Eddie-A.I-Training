<template>
  <div class="export-doc-section">
    <h3 class="export-doc-section__heading">Download Word Document</h3>
    <p class="export-doc-section__desc">
      Export all active playbooks as a .doc file for offline reference or sharing.
    </p>
    <div class="docsync-controls">
      <button class="docsync-sync-btn" @click="handleExport">
        Download .doc
      </button>
    </div>
    <div v-if="statusMessage" class="docsync-status">
      <span class="status-dot" :style="{ background: statusColor }"></span>
      <span :style="{ color: statusColor }">{{ statusMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePlaybookStore } from '@/stores/playbook.js'
import { exportWord } from '@/lib/docExport.js'

const playbookStore = usePlaybookStore()

const statusMessage = ref('')
const statusColor = ref('var(--text-muted, #888)')

function handleExport() {
  try {
    exportWord(
      playbookStore.playbooks,
      playbookStore.playbookOrder,
      playbookStore.overrides,
    )
    statusMessage.value = '\u2713 Exported \u2014 ' + new Date().toLocaleString()
    statusColor.value = 'var(--success, #0a8)'
  } catch (err) {
    statusMessage.value = 'Export failed: ' + (err.message || 'Unknown error')
    statusColor.value = 'var(--error, #e53e3e)'
  }
}
</script>

<style scoped>
.export-doc-section {
  margin-bottom: 24px;
}

.export-doc-section__heading {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark, #1a1a1a);
  margin: 0 0 4px 0;
}

.export-doc-section__desc {
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
