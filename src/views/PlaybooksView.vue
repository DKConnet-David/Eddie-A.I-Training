<template>
  <div id="tab-playbooks" class="tab-panel active" style="display: flex;">
    <!-- Left: Sidebar -->
    <PlaybookSidebar
      :active-id="activeId"
      @check-unsaved="onCheckUnsaved"
    />

    <!-- Center: Main playbook content -->
    <main class="main-panel" id="playbook-content">
      <PlaybookContent
        :playbook-id="activeId"
        :editing-step-index="editingStepIndex"
        @edit-playbook="editPlaybook"
        @open-editor="openStepEditor"
        @add-step="addStep"
        @reset="resetPlaybook"
      />
    </main>

    <!-- Right: Step editor panel (conditional) -->
    <StepEditorPanel
      ref="editorPanel"
      :step="editingStep"
      :step-index="editingStepIndex"
      :visible="editorVisible"
      @save="saveStepEdit"
      @cancel="closeStepEditor"
      @delete="deleteStep"
    />

    <!-- Full playbook editor modal -->
    <div
      v-if="editorModalVisible"
      class="editor-overlay"
      @click.self="editorModalVisible = false"
    >
      <div class="editor-modal">
        <div class="editor-modal-header">
          <h2 id="editor-title">{{ editorModalTitle }}</h2>
          <button class="editor-close-btn" @click="editorModalVisible = false">&times;</button>
        </div>
        <div class="editor-modal-body">
          <div class="editor-field">
            <label>Title</label>
            <input v-model="modalForm.title" type="text" />
          </div>
          <div class="editor-field">
            <label>Subtitle</label>
            <input v-model="modalForm.subtitle" type="text" />
          </div>
          <div class="editor-field">
            <label>Status</label>
            <select v-model="modalForm.status">
              <option value="active">Active</option>
              <option value="soon">Coming Soon</option>
            </select>
          </div>
          <div class="editor-field">
            <label>Content (Markdown)</label>
            <textarea v-model="modalForm.markdown"></textarea>
          </div>
        </div>
        <div class="editor-modal-footer">
          <button class="editor-cancel-btn" @click="editorModalVisible = false">Cancel</button>
          <button class="editor-save-btn" @click="savePlaybookEdit">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlaybookStore } from '@/stores/playbook.js'
import PlaybookSidebar from '@/components/playbook/PlaybookSidebar.vue'
import PlaybookContent from '@/components/playbook/PlaybookContent.vue'
import StepEditorPanel from '@/components/playbook/StepEditorPanel.vue'

const route = useRoute()
const router = useRouter()
const store = usePlaybookStore()

// Initialize the store on first use (loads defaults, overrides, custom playbooks)
if (!store.playbookOrder.length) {
  store.init()
}

// ── Active playbook from route ──

const activeId = computed(() => route.params.id || 'master')

// Redirect to master if no id specified
watch(
  () => route.params.id,
  (id) => {
    if (!id) {
      router.replace('/playbooks/master')
    }
  },
  { immediate: true }
)

// ── Step Editor State ──

const editorVisible = ref(false)
const editingStepIndex = ref(-1)
const editingStep = ref(null)
const editorPanel = ref(null)

function openStepEditor(stepIndex) {
  // Check unsaved changes before switching to a different step
  if (editorVisible.value && editingStepIndex.value !== stepIndex) {
    if (editorPanel.value && editorPanel.value.hasChanges) {
      editorPanel.value.checkUnsavedChanges()
    }
  }

  const parts = store.getPlaybookParts(activeId.value)
  if (!parts || stepIndex >= parts.steps.length) return

  const step = parts.steps[stepIndex]
  editingStep.value = { ...step }
  editingStepIndex.value = stepIndex
  editorVisible.value = true
}

function closeStepEditor() {
  editorVisible.value = false
  editingStepIndex.value = -1
  editingStep.value = null
}

function saveStepEdit(formData) {
  const parts = store.getPlaybookParts(activeId.value)
  if (!parts || formData.stepIndex >= parts.steps.length) return

  const step = parts.steps[formData.stepIndex]
  step.number = formData.number || step.number
  step.title = formData.title || step.title
  step.markdown = formData.markdown

  store.saveAndRerender(activeId.value, parts)

  // Update the editing step to reflect saved values
  editingStep.value = { ...step }
}

function deleteStep(stepIndex) {
  store.deleteStep(activeId.value, stepIndex)
  closeStepEditor()
}

function addStep() {
  const newIndex = store.addStep(activeId.value)
  if (newIndex >= 0) {
    nextTick(() => {
      openStepEditor(newIndex)
    })
  }
}

// ── Unsaved changes guard for navigation ──

function onCheckUnsaved(proceedFn) {
  if (editorPanel.value && editorVisible.value && editorPanel.value.hasChanges) {
    editorPanel.value.checkUnsavedChanges()
  }
  closeStepEditor()
  proceedFn()
}

// Close editor when playbook changes
watch(activeId, () => {
  closeStepEditor()
})

// ── Full Playbook Editor Modal ──

const editorModalVisible = ref(false)
const editorModalTitle = ref('')
const modalForm = ref({
  title: '',
  subtitle: '',
  status: 'active',
  markdown: '',
})

function editPlaybook() {
  const pb = store.playbooks[activeId.value]
  if (!pb) return

  const override = store.overrides[activeId.value]
  const md = store.effectiveMarkdown(activeId.value)

  editorModalTitle.value = 'Edit: ' + (pb.title || activeId.value)
  modalForm.value = {
    title: override?.title || pb.title || '',
    subtitle: override?.subtitle || pb.subtitle || '',
    status: override?.status || pb.status || 'active',
    markdown: md.trim(),
  }
  editorModalVisible.value = true
}

function savePlaybookEdit() {
  const id = activeId.value
  store.saveOverride(id, {
    title: modalForm.value.title.trim(),
    subtitle: modalForm.value.subtitle.trim(),
    status: modalForm.value.status,
    markdown: modalForm.value.markdown,
  })
  editorModalVisible.value = false
}

function resetPlaybook() {
  store.removeOverride(activeId.value)
}
</script>
