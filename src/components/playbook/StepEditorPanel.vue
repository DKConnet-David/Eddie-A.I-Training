<template>
  <div class="step-editor-panel" :class="{ hidden: !visible }">
    <div class="step-editor-header">
      <h3 id="step-editor-title">Step {{ form.number }}</h3>
      <button
        class="editor-close-btn"
        title="Close editor"
        @click="onCancel"
      >&times;</button>
    </div>

    <div class="step-editor-body">
      <div class="editor-field">
        <label for="step-editor-number">Step Number</label>
        <input
          id="step-editor-number"
          v-model="form.number"
          type="text"
        />
      </div>

      <div class="editor-field">
        <label for="step-editor-step-title">Title</label>
        <input
          id="step-editor-step-title"
          v-model="form.title"
          type="text"
        />
      </div>

      <div class="editor-field" style="flex: 1; display: flex; flex-direction: column;">
        <label for="step-editor-content">Content (Markdown)</label>
        <textarea
          id="step-editor-content"
          v-model="form.markdown"
          style="flex: 1; min-height: 200px;"
        ></textarea>
      </div>

      <!-- Syntax Reference -->
      <div class="editor-field">
        <button
          class="action-btn"
          style="width: 100%; justify-content: center; font-size: 12px; padding: 5px 10px;"
          @click="syntaxOpen = !syntaxOpen"
        >
          {{ syntaxOpen ? '&#9650; Hide' : '&#9660; Show' }} Syntax Reference
        </button>
        <div v-if="syntaxOpen" style="margin-top: 8px; font-size: 11px; color: var(--text-muted); line-height: 1.7; font-family: var(--font-mono);">
          <div><strong>:::eddie</strong> ... <strong>:::</strong> &mdash; Eddie message block</div>
          <div><strong>:::internal</strong> ... <strong>:::</strong> &mdash; Internal note</div>
          <div><strong>:::warn</strong> ... <strong>:::</strong> &mdash; Warning / Never block</div>
          <div><strong>:::ok</strong> ... <strong>:::</strong> &mdash; Resolution block</div>
          <div><strong>- Condition &#8594; Destination</strong> &mdash; Branch row</div>
          <div><strong>- Condition &#8594; &#9989; RESOLVED</strong> &mdash; Resolved branch</div>
          <div><strong>[[id|Label]]</strong> &mdash; Route link to another playbook</div>
          <div><strong>{green|Text}</strong> &mdash; Colored tag (green/amber/red/blue)</div>
          <div><strong>**bold**</strong> <strong>*italic*</strong> <strong>`code`</strong></div>
          <div><strong>| Col | Col |</strong> &mdash; Table row</div>
          <div><strong>### Heading</strong> &mdash; Sub-heading inside step</div>
        </div>
      </div>
    </div>

    <div class="step-editor-footer">
      <button
        class="action-btn danger"
        @click="onDelete"
      >Delete</button>
      <div style="display: flex; gap: 8px;">
        <button
          class="editor-cancel-btn"
          @click="onCancel"
        >Cancel</button>
        <button
          class="editor-save-btn"
          @click="onSave"
        >Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges.js'

const props = defineProps({
  step: {
    type: Object,
    default: null,
  },
  stepIndex: {
    type: Number,
    default: -1,
  },
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['save', 'cancel', 'delete'])

const syntaxOpen = ref(false)

const form = reactive({
  number: '',
  title: '',
  markdown: '',
})

// Track original values for unsaved-changes detection
const originalValues = ref(null)
const currentValues = computed(() => ({
  number: form.number,
  title: form.title,
  markdown: form.markdown,
}))

const { hasChanges, checkUnsavedChanges } = useUnsavedChanges(originalValues, currentValues)

// When step prop changes, populate the form
watch(
  () => props.step,
  (newStep) => {
    if (newStep) {
      form.number = newStep.number || ''
      form.title = newStep.title || ''
      form.markdown = newStep.markdown || ''

      // Store original values for change detection
      originalValues.value = {
        number: newStep.number || '',
        title: newStep.title || '',
        markdown: newStep.markdown || '',
      }
    }
  },
  { immediate: true }
)

function onSave() {
  emit('save', {
    number: form.number.trim() || form.number,
    title: form.title.trim() || form.title,
    markdown: form.markdown,
    stepIndex: props.stepIndex,
  })
  // After save, update original to current so hasChanges becomes false
  originalValues.value = { ...currentValues.value }
}

function onCancel() {
  if (hasChanges.value) {
    checkUnsavedChanges(() => onSave())
  }
  emit('cancel')
}

function onDelete() {
  const step = props.step
  if (!step) return
  if (!confirm(`Delete Step ${step.number}: ${step.title}?`)) return
  emit('delete', props.stepIndex)
}

// Expose for parent component to check before navigating away
defineExpose({ hasChanges, checkUnsavedChanges: () => checkUnsavedChanges(() => onSave()) })
</script>
