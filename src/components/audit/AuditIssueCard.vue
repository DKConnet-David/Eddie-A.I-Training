<template>
  <div class="audit-issue" :class="'audit-issue--' + type">
    <p class="audit-issue__message">{{ issue.message }}</p>
    <button
      v-if="actionLabel"
      class="audit-issue__apply"
      @click="applyFix"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePlaybookStore } from '@/stores/playbook.js'

const props = defineProps({
  issue: { type: Object, required: true },
  type: { type: String, required: true }, // 'error' | 'warning' | 'suggestion'
  playbookId: { type: String, required: true },
})

const emit = defineEmits(['applied'])

const playbookStore = usePlaybookStore()

const actionLabel = computed(() => {
  switch (props.issue.type) {
    case 'missing_step': return 'Create Step ' + props.issue.step
    case 'dead_end': return 'Add Branches'
    case 'no_eddie_block': return 'Add Eddie Says Block'
    case 'no_internal': return 'Add Internal Note Block'
    default: return null
  }
})

function applyFix() {
  const parts = playbookStore.getPlaybookParts(props.playbookId)
  if (!parts) return

  switch (props.issue.type) {
    case 'missing_step':
      parts.steps.push({
        number: props.issue.step,
        title: 'New Step',
        markdown:
          ':::eddie\n[Enter what Eddie should say here.]\n:::\n\n' +
          ':::internal\n[Enter internal notes here.]\n:::\n\n' +
          '- Condition A \u2192 Next Step\n- Condition B \u2192 \u2705 RESOLVED',
      })
      playbookStore.saveAndRerender(props.playbookId, parts)
      break

    case 'dead_end':
      appendToStep(parts, props.issue.step, '\n\n- Condition A \u2192 Next Step\n- Condition B \u2192 \u2705 RESOLVED')
      break

    case 'no_eddie_block':
      appendToStep(parts, props.issue.step, '\n\n:::eddie\n[Enter what Eddie should say to the customer here.]\n:::')
      break

    case 'no_internal':
      appendToStep(parts, props.issue.step, '\n\n:::internal\n[Enter internal notes or instructions for agents here.]\n:::')
      break
  }

  emit('applied')
}

function appendToStep(parts, stepNumber, content) {
  for (let i = 0; i < parts.steps.length; i++) {
    if (parts.steps[i].number.toUpperCase() === stepNumber.toUpperCase()) {
      parts.steps[i].markdown = parts.steps[i].markdown.trimEnd() + content
      break
    }
  }
  playbookStore.saveAndRerender(props.playbookId, parts)
}
</script>

<style scoped>
.audit-issue {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 13px;
  border-left: 3px solid;
}

.audit-issue--error {
  background: #fef2f2;
  border-left-color: #e53e3e;
}

.audit-issue--warning {
  background: #fef3e0;
  border-left-color: #b47a1a;
}

.audit-issue--suggestion {
  background: #ebf5fb;
  border-left-color: #0369a1;
}

.audit-issue__message {
  margin: 0;
  line-height: 1.5;
  color: var(--text, #333);
}

.audit-issue__apply {
  margin-top: 6px;
  padding: 4px 12px;
  font-size: 11px;
  background: #0369a1;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-body, inherit);
  transition: background 0.15s;
}

.audit-issue__apply:hover {
  background: #025183;
}
</style>
