<template>
  <div class="playbook-actions">
    <button class="action-btn" @click="$emit('edit')">Edit Playbook</button>
    <button
      class="action-btn"
      :style="toggleStyle"
      @click="$emit('toggle-all')"
    >
      <span v-html="toggleIcon"></span> {{ allExpanded ? 'Collapse All' : 'Expand All' }}
    </button>
    <button
      v-if="hasOverride"
      class="action-btn danger"
      @click="$emit('reset')"
    >
      Reset to Default
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  allExpanded: {
    type: Boolean,
    default: false,
  },
  hasOverride: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['edit', 'toggle-all', 'reset'])

const toggleIcon = computed(() => {
  return props.allExpanded ? '&#9650;' : '&#9660;'
})

const toggleStyle = computed(() => {
  if (props.allExpanded) {
    return {
      background: '#ebf5fb',
      color: '#0369a1',
      borderColor: '#0369a1',
    }
  }
  return {
    background: '#e6f9f0',
    color: '#0a8',
    borderColor: '#0a8',
  }
})
</script>
