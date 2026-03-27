<template>
  <div
    class="step-card"
    :class="{ open: isOpen, editing: isEditing }"
    :data-step-index="index"
  >
    <div class="step-header">
      <span class="step-drag-handle" title="Drag to reorder">&#9776;</span>
      <span class="step-number">{{ step.number }}</span>
      <span class="step-title">{{ step.title }}</span>
      <span
        class="step-edit-btn"
        title="Edit step"
        @click.stop="$emit('edit', index)"
      >&#9998;</span>
      <span
        class="step-chevron"
        title="Expand / Collapse"
        @click.stop="toggleOpen"
      >&#9660;</span>
    </div>
    <div class="step-body" v-show="isOpen">
      <div v-html="renderedBody" v-route-links="router"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { renderContent } from '@/lib/markdown.js'
import { vRouteLinks } from '@/directives/vRouteLinks.js'

const props = defineProps({
  step: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  isSubStep: {
    type: Boolean,
    default: false,
  },
  initialOpen: {
    type: Boolean,
    default: false,
  },
  forceOpen: {
    type: Boolean,
    default: undefined,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['edit'])

const router = useRouter()

const isOpen = ref(props.initialOpen)

// Watch forceOpen for expand/collapse all
watch(
  () => props.forceOpen,
  (val) => {
    if (val !== undefined) {
      isOpen.value = val
    }
  }
)

function toggleOpen() {
  isOpen.value = !isOpen.value
}

const renderedBody = computed(() => {
  // step.body comes from splitSteps (has body), step.markdown comes from splitMarkdownSteps
  const bodyText = props.step.body || props.step.markdown || ''
  return renderContent(bodyText.trim())
})

// Expose open/close for parent usage
defineExpose({ isOpen, toggleOpen })
</script>
