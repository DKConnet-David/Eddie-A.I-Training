<template>
  <div class="syntax-panel">
    <div class="syntax-header">
      <h2>Block Syntax Configuration</h2>
      <p class="syntax-desc">
        Define custom block types for playbooks. Each block type creates a
        <code>:::keyword</code> syntax that renders as a styled content block.
      </p>
    </div>

    <!-- Block Type Cards -->
    <div class="syntax-cards">
      <div
        v-for="block in syntaxStore.blockTypes"
        :key="block.id"
        class="syntax-card"
      >
        <div class="syntax-card-header">
          <div class="syntax-card-info">
            <span class="syntax-card-id">:::{{ block.id }}</span>
            <span v-if="syntaxStore.isDefault(block.id)" class="syntax-badge default-badge">Built-in</span>
            <span v-else class="syntax-badge custom-badge">Custom</span>
          </div>
          <div class="syntax-card-actions">
            <button class="action-btn" @click="startEdit(block)">&#9998; Edit</button>
            <button
              v-if="!syntaxStore.isDefault(block.id)"
              class="action-btn danger"
              @click="confirmDelete(block)"
            >&#10005; Delete</button>
          </div>
        </div>

        <!-- Live Preview -->
        <div class="syntax-card-preview">
          <div
            :style="{
              background: block.bgColor,
              borderLeft: '3px solid ' + block.borderColor,
              padding: '8pt 12pt',
              margin: '0',
              borderRadius: '0 4px 4px 0',
            }"
          >
            <div
              :style="{
                fontSize: '8pt',
                color: block.labelColor,
                textTransform: 'uppercase',
                letterSpacing: '0.5pt',
                marginBottom: '3pt',
                fontWeight: 'bold',
                fontFamily: 'var(--font-mono)',
              }"
            >{{ block.label }}</div>
            <p style="font-size:13px;color:var(--text);line-height:1.55;margin:0;">
              This is sample content inside a <strong>:::{{ block.id }}</strong> block.
            </p>
          </div>
        </div>

        <!-- Usage -->
        <div class="syntax-card-usage">
          <code>:::{{ block.id }}</code><br>
          <code>Your content here</code><br>
          <code>:::</code>
        </div>
      </div>
    </div>

    <!-- Add Block Type Button -->
    <button class="add-block-btn" @click="startAdd()">+ Add Block Type</button>

    <!-- Edit / Add Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal" style="width:480px;">
        <h2>{{ isAdding ? 'Add Block Type' : 'Edit Block Type' }}</h2>
        <p class="modal-desc">
          {{ isAdding ? 'Create a new custom block type.' : 'Modify the block type settings.' }}
        </p>

        <div class="editor-field" style="margin-bottom:12px;">
          <label>Keyword (lowercase, no spaces)</label>
          <input
            v-model="form.id"
            type="text"
            placeholder="e.g. action"
            :disabled="!isAdding"
            @input="form.id = form.id.toLowerCase().replace(/[^a-z0-9]/g, '')"
          />
          <div v-if="idError" style="color:#e53e3e;font-size:12px;margin-top:4px;">{{ idError }}</div>
        </div>

        <div class="editor-field" style="margin-bottom:12px;">
          <label>Default Label</label>
          <input v-model="form.label" type="text" placeholder="e.g. Action Required" />
        </div>

        <div class="color-fields">
          <div class="color-field">
            <label>Border Color</label>
            <div class="color-input-row">
              <input type="color" v-model="form.borderColor" />
              <input type="text" v-model="form.borderColor" class="color-text" />
            </div>
          </div>
          <div class="color-field">
            <label>Background Color</label>
            <div class="color-input-row">
              <input type="color" v-model="form.bgColor" />
              <input type="text" v-model="form.bgColor" class="color-text" />
            </div>
          </div>
          <div class="color-field">
            <label>Label Color</label>
            <div class="color-input-row">
              <input type="color" v-model="form.labelColor" />
              <input type="text" v-model="form.labelColor" class="color-text" />
            </div>
          </div>
        </div>

        <!-- Modal Preview -->
        <div style="margin-top:16px;">
          <label style="font-size:13px;font-weight:500;color:var(--text);display:block;margin-bottom:6px;">Preview</label>
          <div
            :style="{
              background: form.bgColor,
              borderLeft: '3px solid ' + form.borderColor,
              padding: '8pt 12pt',
              borderRadius: '0 4px 4px 0',
            }"
          >
            <div
              :style="{
                fontSize: '8pt',
                color: form.labelColor,
                textTransform: 'uppercase',
                letterSpacing: '0.5pt',
                marginBottom: '3pt',
                fontWeight: 'bold',
                fontFamily: 'var(--font-mono)',
              }"
            >{{ form.label || 'Label' }}</div>
            <p style="font-size:13px;color:var(--text);line-height:1.55;margin:0;">
              Sample block content preview.
            </p>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;">
          <button class="editor-cancel-btn" @click="closeModal">Cancel</button>
          <button class="editor-save-btn" @click="saveForm">{{ isAdding ? 'Add' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal" style="width:400px;">
        <h2>Delete Block Type</h2>
        <p class="modal-desc">
          Are you sure you want to delete the <code>:::{{ deleteTarget?.id }}</code> block type?
          This cannot be undone.
        </p>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;">
          <button class="editor-cancel-btn" @click="showDeleteModal = false">Cancel</button>
          <button class="editor-save-btn" style="background:#e53e3e;border-color:#e53e3e;" @click="doDelete">Delete</button>
        </div>
      </div>
    </div>

    <!-- Syntax Reference -->
    <div class="syntax-reference">
      <h3>Syntax Reference</h3>

      <div class="ref-section">
        <h4>Content Blocks</h4>
        <div class="ref-table">
          <div class="ref-row">
            <code class="ref-syntax">:::keyword<br>Content<br>:::</code>
            <span class="ref-desc">Styled content block. Use any configured keyword above.</span>
          </div>
          <div class="ref-row">
            <code class="ref-syntax">:::eddie Custom Label<br>Content<br>:::</code>
            <span class="ref-desc">Block with a custom label override (text after keyword).</span>
          </div>
        </div>
      </div>

      <div class="ref-section">
        <h4>Steps</h4>
        <div class="ref-table">
          <div class="ref-row">
            <code class="ref-syntax">## Step 1: Title</code>
            <span class="ref-desc">Creates a numbered step card. First step opens by default.</span>
          </div>
          <div class="ref-row">
            <code class="ref-syntax">## Step 3A: Title</code>
            <span class="ref-desc">Sub-step card (letter suffix groups them visually).</span>
          </div>
        </div>
      </div>

      <div class="ref-section">
        <h4>Branches</h4>
        <div class="ref-table">
          <div class="ref-row">
            <code class="ref-syntax">- Condition &#8594; Destination</code>
            <span class="ref-desc">Branch row. Use the arrow character (&#8594;).</span>
          </div>
          <div class="ref-row">
            <code class="ref-syntax">- Condition &#8594; RESOLVED</code>
            <span class="ref-desc">Resolved branch (highlighted green).</span>
          </div>
          <div class="ref-row">
            <code class="ref-syntax">- Condition &#8594; [[a|Playbook]]</code>
            <span class="ref-desc">Branch linking to another playbook.</span>
          </div>
        </div>
      </div>

      <div class="ref-section">
        <h4>Inline Formatting</h4>
        <div class="ref-table">
          <div class="ref-row">
            <code class="ref-syntax">**bold text**</code>
            <span class="ref-desc">Bold text.</span>
          </div>
          <div class="ref-row">
            <code class="ref-syntax">*italic text*</code>
            <span class="ref-desc">Italic text.</span>
          </div>
          <div class="ref-row">
            <code class="ref-syntax">`inline code`</code>
            <span class="ref-desc">Inline code snippet.</span>
          </div>
          <div class="ref-row">
            <code class="ref-syntax">[[id|Link Text]]</code>
            <span class="ref-desc">Route link to another playbook by id.</span>
          </div>
          <div class="ref-row">
            <code class="ref-syntax">{green|Tag Text}</code>
            <span class="ref-desc">Colored tag pill (green, amber, red, blue).</span>
          </div>
        </div>
      </div>

      <div class="ref-section">
        <h4>Tables</h4>
        <div class="ref-table">
          <div class="ref-row">
            <code class="ref-syntax">| Col 1 | Col 2 |<br>| --- | --- |<br>| Data | Data |</code>
            <span class="ref-desc">Markdown table with header row and separator.</span>
          </div>
        </div>
      </div>

      <div class="ref-section">
        <h4>Headings</h4>
        <div class="ref-table">
          <div class="ref-row">
            <code class="ref-syntax">### Heading 3</code>
            <span class="ref-desc">Section heading inside step content.</span>
          </div>
          <div class="ref-row">
            <code class="ref-syntax">#### Heading 4</code>
            <span class="ref-desc">Sub-section heading inside step content.</span>
          </div>
        </div>
      </div>

      <div class="ref-section">
        <h4>Frontmatter</h4>
        <div class="ref-table">
          <div class="ref-row">
            <code class="ref-syntax">---<br>title: My Playbook<br>subtitle: Description<br>status: active<br>keywords: tag1, tag2<br>---</code>
            <span class="ref-desc">YAML-like metadata block at the top of a playbook.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSyntaxStore } from '@/stores/syntax.js'
import { configureBlockTypes } from '@/lib/markdown.js'

const syntaxStore = useSyntaxStore()

// Modal state
const showModal = ref(false)
const isAdding = ref(false)
const editingId = ref(null)
const idError = ref('')

const form = ref({
  id: '',
  label: '',
  borderColor: '#008fc9',
  bgColor: '#f0f7fb',
  labelColor: '#0369a1',
})

// Delete modal
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

function startAdd() {
  isAdding.value = true
  editingId.value = null
  idError.value = ''
  form.value = {
    id: '',
    label: '',
    borderColor: '#008fc9',
    bgColor: '#f0f7fb',
    labelColor: '#0369a1',
  }
  showModal.value = true
}

function startEdit(block) {
  isAdding.value = false
  editingId.value = block.id
  idError.value = ''
  form.value = {
    id: block.id,
    label: block.label,
    borderColor: block.borderColor,
    bgColor: block.bgColor,
    labelColor: block.labelColor,
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  idError.value = ''
}

function saveForm() {
  const f = form.value
  idError.value = ''

  if (!f.id) {
    idError.value = 'Keyword is required.'
    return
  }

  if (!f.label) {
    idError.value = 'Label is required.'
    return
  }

  if (isAdding.value) {
    // Check for duplicate
    if (syntaxStore.getBlockConfig(f.id)) {
      idError.value = 'A block type with this keyword already exists.'
      return
    }
    syntaxStore.addBlockType({ ...f })
  } else {
    syntaxStore.updateBlockType(editingId.value, {
      label: f.label,
      borderColor: f.borderColor,
      bgColor: f.bgColor,
      labelColor: f.labelColor,
    })
  }

  // Update the markdown parser config
  configureBlockTypes(syntaxStore.blockTypes)
  closeModal()
}

function confirmDelete(block) {
  deleteTarget.value = block
  showDeleteModal.value = true
}

function doDelete() {
  if (deleteTarget.value) {
    syntaxStore.removeBlockType(deleteTarget.value.id)
    configureBlockTypes(syntaxStore.blockTypes)
  }
  showDeleteModal.value = false
  deleteTarget.value = null
}
</script>

<style scoped>
.syntax-panel {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}

.syntax-header {
  max-width: 800px;
  margin-bottom: 24px;
}

.syntax-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 4px;
}

.syntax-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

.syntax-desc code {
  background: var(--row-alt);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  border: 1px solid var(--card-border);
}

.syntax-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 800px;
  margin-bottom: 16px;
}

.syntax-card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 16px 20px;
}

.syntax-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.syntax-card-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.syntax-card-id {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

.syntax-badge {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 9999px;
}

.default-badge {
  background: var(--dk-light);
  color: var(--dk);
}

.custom-badge {
  background: var(--success-bg);
  color: var(--success);
}

.syntax-card-actions {
  display: flex;
  gap: 6px;
}

.syntax-card-preview {
  margin-bottom: 10px;
}

.syntax-card-usage {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  background: var(--row-alt);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  line-height: 1.6;
}

.add-block-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: var(--dk);
  border: 1px solid var(--dk);
  border-radius: var(--radius-md);
  color: white;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
  margin-bottom: 32px;
}

.add-block-btn:hover {
  background: var(--dk-hover);
}

/* Color fields */
.color-fields {
  display: flex;
  gap: 12px;
}

.color-field {
  flex: 1;
}

.color-field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 4px;
}

.color-input-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.color-input-row input[type="color"] {
  width: 36px;
  height: 32px;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 2px;
  background: var(--body);
}

.color-text {
  flex: 1;
  width: 100%;
  background: var(--body);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  padding: 6px 8px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 12px;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.color-text:focus {
  border-color: var(--dk);
  box-shadow: 0 0 0 3px var(--dk-ring);
  background: white;
}

/* Syntax Reference */
.syntax-reference {
  max-width: 800px;
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 20px 24px;
}

.syntax-reference h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 16px;
}

.ref-section {
  margin-bottom: 18px;
}

.ref-section h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.ref-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ref-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 6px 0;
  border-bottom: 1px solid var(--row-divider, #f0f0f0);
}

.ref-row:last-child {
  border-bottom: none;
}

.ref-syntax {
  flex: 0 0 280px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-dark);
  background: var(--row-alt);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  line-height: 1.6;
}

.ref-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.55;
  padding-top: 2px;
}
</style>
