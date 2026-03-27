<template>
  <Teleport to="body">
    <div class="editor-overlay" @click.self="$emit('cancel')">
      <div class="editor-modal">
        <div class="editor-modal-header">
          <h2>{{ isNew ? 'Add Playbook' : 'Edit Playbook' }}</h2>
          <button class="editor-close-btn" @click="$emit('cancel')">&times;</button>
        </div>

        <div class="editor-modal-body">
          <div class="editor-field">
            <label>Title</label>
            <input v-model="form.title" type="text" placeholder="Playbook title" />
          </div>

          <div class="editor-field">
            <label>Subtitle</label>
            <input v-model="form.subtitle" type="text" placeholder="Short description" />
          </div>

          <div class="editor-field">
            <label>Status</label>
            <select v-model="form.status">
              <option value="active">Active</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </div>

          <div class="editor-field">
            <label>Markdown</label>
            <textarea v-model="form.markdown" placeholder="Enter playbook markdown..."></textarea>
          </div>
        </div>

        <div class="editor-modal-footer">
          <button class="editor-cancel-btn" @click="$emit('cancel')">Cancel</button>
          <button class="editor-save-btn" @click="save">Save</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { usePlaybookStore } from '@/stores/playbook.js'

const props = defineProps({
  playbookId: { type: String, default: '' },
  isNew: { type: Boolean, default: false },
})

const emit = defineEmits(['cancel', 'saved'])

const playbookStore = usePlaybookStore()

const form = reactive({
  title: '',
  subtitle: '',
  status: 'active',
  markdown: '',
})

onMounted(() => {
  if (!props.isNew && props.playbookId) {
    const pb = playbookStore.playbooks[props.playbookId]
    if (pb) {
      form.title = pb.title || ''
      form.subtitle = pb.subtitle || ''
      form.status = pb.status || 'active'
      form.markdown = playbookStore.effectiveMarkdown(props.playbookId) || ''
    }
  }
})

function save() {
  if (!form.title.trim()) return

  if (props.isNew) {
    // Generate an id from the title
    const id = form.title.trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      || 'custom-' + Date.now()

    playbookStore.addCustomPlaybook({
      id,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      status: form.status,
      markdown: form.markdown,
      group: 'playbooks',
      keywords: [],
    })
  } else if (props.playbookId) {
    playbookStore.saveOverride(props.playbookId, {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      status: form.status,
      markdown: form.markdown,
    })
  }

  emit('saved')
}
</script>

<style scoped>
.editor-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.editor-modal {
  background: white;
  border-radius: var(--radius-xl, 12px);
  box-shadow: var(--shadow-modal, 0 8px 32px rgba(0, 0, 0, 0.25));
  width: 700px;
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.editor-modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--card-border, #e0e0e0);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-modal-header h2 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark, #1a1a1a);
  margin: 0;
}

.editor-close-btn {
  background: none;
  border: none;
  color: var(--text-muted, #888);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm, 4px);
  transition: background 0.15s;
}

.editor-close-btn:hover {
  background: var(--row-alt, #f5f5f5);
  color: var(--text, #333);
}

.editor-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text, #333);
  margin-bottom: 4px;
}

.editor-field input,
.editor-field select {
  width: 100%;
  background: var(--body, #f5f6f8);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  padding: 7px 12px;
  color: var(--text, #333);
  font-family: var(--font-body, inherit);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.editor-field input:focus,
.editor-field select:focus {
  border-color: var(--dk, #008fc9);
  box-shadow: 0 0 0 3px var(--dk-ring, rgba(0, 143, 201, 0.15));
  background: white;
}

.editor-field select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a94a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
}

.editor-field textarea {
  width: 100%;
  background: var(--body, #f5f6f8);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  padding: 10px 12px;
  color: var(--text, #333);
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  outline: none;
  resize: vertical;
  min-height: 250px;
  line-height: 1.5;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.editor-field textarea:focus {
  border-color: var(--dk, #008fc9);
  box-shadow: 0 0 0 3px var(--dk-ring, rgba(0, 143, 201, 0.15));
  background: white;
}

.editor-modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--card-border, #e0e0e0);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.editor-cancel-btn {
  padding: 7px 16px;
  background: var(--card, #fff);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  color: var(--text-muted, #888);
  font-family: var(--font-body, inherit);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.editor-cancel-btn:hover {
  background: var(--row-alt, #f5f5f5);
  color: var(--text, #333);
}

.editor-save-btn {
  padding: 7px 20px;
  background: var(--dk, #008fc9);
  border: 1px solid var(--dk, #008fc9);
  border-radius: var(--radius-md, 6px);
  color: white;
  font-family: var(--font-body, inherit);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.editor-save-btn:hover { background: var(--dk-hover, #0077a8); }
</style>
