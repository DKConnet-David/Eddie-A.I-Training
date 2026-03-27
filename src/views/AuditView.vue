<template>
  <div id="tab-audit" class="tab-panel active" style="display: flex; flex-direction: row; flex: 1;">
    <!-- Sidebar: playbook selector + summary -->
    <aside class="audit-sidebar">
      <h3 class="audit-sidebar__heading">Playbook Audit</h3>

      <div class="audit-sidebar__field">
        <label for="audit-playbook-select">Select playbook</label>
        <select
          id="audit-playbook-select"
          v-model="selectedId"
          class="audit-sidebar__select"
        >
          <option value="">-- Choose a playbook --</option>
          <option
            v-for="id in playbookStore.playbookOrder"
            :key="id"
            :value="id"
          >
            {{ playbookLabel(id) }}
          </option>
        </select>
      </div>

      <!-- Summary counts -->
      <div v-if="report" class="audit-sidebar__summary">
        <div class="audit-sidebar__count audit-sidebar__count--error">
          <span class="audit-sidebar__count-num">{{ report.errors.length }}</span>
          <span>Errors</span>
        </div>
        <div class="audit-sidebar__count audit-sidebar__count--warning">
          <span class="audit-sidebar__count-num">{{ report.warnings.length }}</span>
          <span>Warnings</span>
        </div>
        <div class="audit-sidebar__count audit-sidebar__count--suggestion">
          <span class="audit-sidebar__count-num">{{ report.suggestions.length }}</span>
          <span>Suggestions</span>
        </div>
      </div>

      <!-- Run All button -->
      <button
        v-if="selectedId"
        class="audit-sidebar__rerun"
        @click="runAudit"
      >
        Re-run Audit
      </button>
    </aside>

    <!-- Main results area -->
    <main class="audit-main">
      <div v-if="!report" class="audit-main__placeholder">
        <p>Select a playbook from the sidebar to run an audit.</p>
      </div>
      <AuditResults
        v-else
        :report="report"
        @refresh="runAudit"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { usePlaybookStore } from '@/stores/playbook.js'
import { audit } from '@/lib/playbookAudit.js'
import AuditResults from '@/components/audit/AuditResults.vue'

const playbookStore = usePlaybookStore()

const selectedId = ref('')
const report = ref(null)

function playbookLabel(id) {
  const pb = playbookStore.playbooks[id]
  if (!pb) return id
  if (id === 'master') return 'Master Entry Point'
  if (id === 'rules') return 'Universal Rules'
  return 'Playbook ' + id.toUpperCase() + ' \u2014 ' + (pb.subtitle || pb.title)
}

function runAudit() {
  if (!selectedId.value) {
    report.value = null
    return
  }

  const pb = playbookStore.playbooks[selectedId.value]
  if (!pb) {
    report.value = null
    return
  }

  const md = playbookStore.effectiveMarkdown(selectedId.value)
  report.value = audit(pb, md)
}

watch(selectedId, () => {
  runAudit()
})
</script>

<style scoped>
.audit-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--card, #fff);
  border-right: 1px solid var(--card-border, #e0e0e0);
  padding: 16px 14px;
  overflow-y: auto;
}

.audit-sidebar__heading {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark, #1a1a1a);
  margin-bottom: 14px;
}

.audit-sidebar__field {
  margin-bottom: 16px;
}

.audit-sidebar__field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted, #888);
  margin-bottom: 4px;
}

.audit-sidebar__select {
  width: 100%;
  background: var(--body, #f5f6f8);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  padding: 7px 12px;
  color: var(--text, #333);
  font-family: var(--font-body, inherit);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a94a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.audit-sidebar__select:focus {
  border-color: var(--dk, #008fc9);
  box-shadow: 0 0 0 3px var(--dk-ring, rgba(0, 143, 201, 0.15));
}

.audit-sidebar__summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.audit-sidebar__count {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.audit-sidebar__count-num {
  font-size: 16px;
  font-weight: 700;
  min-width: 24px;
}

.audit-sidebar__count--error {
  background: #fef2f2;
  color: #e53e3e;
}

.audit-sidebar__count--warning {
  background: #fef3e0;
  color: #b47a1a;
}

.audit-sidebar__count--suggestion {
  background: #ebf5fb;
  color: #0369a1;
}

.audit-sidebar__rerun {
  width: 100%;
  padding: 8px;
  background: var(--card, #fff);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  color: var(--text-muted, #888);
  font-family: var(--font-body, inherit);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.audit-sidebar__rerun:hover {
  background: var(--dk-light, #ebf5fb);
  border-color: var(--dk, #008fc9);
  color: var(--dk, #008fc9);
}

.audit-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  min-width: 0;
}

.audit-main__placeholder {
  color: var(--text-muted, #888);
  font-style: italic;
  text-align: center;
  padding: 60px 16px;
  font-size: 14px;
}
</style>
