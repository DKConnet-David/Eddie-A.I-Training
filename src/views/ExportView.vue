<template>
  <div id="tab-docsync" class="tab-panel active" style="display: flex; flex-direction: column; flex: 1;">
    <div class="docsync-panel">
      <div class="docsync-header">
        <h2>Export &amp; Backup</h2>
      </div>

      <!-- Word Doc export -->
      <ExportDocSection />

      <!-- Google Docs export -->
      <ExportGDocsSection />

      <!-- Server backup -->
      <ServerBackupSection />

      <!-- Document preview -->
      <div class="docsync-body">
        <h3 class="export-preview__heading">Document Contents</h3>
        <ul class="export-preview__list">
          <li
            v-for="item in activePlaybookList"
            :key="item.id"
            class="export-preview__item"
          >
            {{ item.label }}
            <span class="export-preview__subtitle">{{ item.subtitle }}</span>
            <span class="tag tag-green">Active</span>
          </li>
        </ul>
        <p class="export-preview__note">
          {{ activePlaybookList.length }} active playbooks will be included.
          "Coming Soon" playbooks are excluded. Edited playbooks use your saved changes.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePlaybookStore } from '@/stores/playbook.js'
import ExportDocSection from '@/components/export/ExportDocSection.vue'
import ExportGDocsSection from '@/components/export/ExportGDocsSection.vue'
import ServerBackupSection from '@/components/export/ServerBackupSection.vue'

const playbookStore = usePlaybookStore()

const activePlaybookList = computed(() => {
  const result = []
  for (const id of playbookStore.playbookOrder) {
    const pb = playbookStore.playbooks[id]
    if (!pb) continue

    // Check override status first
    const override = playbookStore.overrides[id]
    const status = (override && override.status) ? override.status : pb.status
    if (status !== 'active') continue

    let label = id === 'master' ? 'Master Entry Point'
      : id === 'rules' ? 'Universal Rules'
      : 'Playbook ' + id.toUpperCase()

    result.push({
      id,
      label,
      subtitle: pb.subtitle || '',
    })
  }
  return result
})
</script>

<style scoped>
.docsync-panel {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}

.docsync-header {
  max-width: 700px;
  margin-bottom: 20px;
}

.docsync-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-dark, #1a1a1a);
  margin: 0 0 4px 0;
}

.docsync-body {
  background: var(--card, #fff);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-lg, 10px);
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
  padding: 20px;
  min-height: 200px;
  max-width: 900px;
}

.export-preview__heading {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark, #1a1a1a);
  margin: 0 0 12px 0;
}

.export-preview__list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: var(--text-muted, #888);
}

.export-preview__item {
  padding: 4px 0;
  color: var(--text, #333);
}

.export-preview__subtitle {
  color: var(--text-muted, #888);
  margin-left: 4px;
}

.export-preview__note {
  margin-top: 16px;
  font-size: 12px;
  color: var(--text-muted, #888);
  line-height: 1.5;
}

.tag {
  display: inline-block;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 9px;
  border-radius: 9999px;
  margin-left: 6px;
}

.tag-green {
  background: var(--success-bg, #e6f9f0);
  color: var(--success, #0a8);
}
</style>
