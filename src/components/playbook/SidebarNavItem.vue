<template>
  <div
    class="nav-item"
    :class="{ active: isActive }"
    @click="$emit('navigate', playbook.id)"
  >
    <div class="nav-dot" :style="{ background: dotColor }"></div>
    <div class="nav-info">
      <div class="nav-name">{{ displayName }}</div>
      <div class="nav-sub">{{ playbook.subtitle || '' }}</div>
    </div>
    <span class="nav-badge" :class="badgeClass">{{ badgeLabel }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  playbook: {
    type: Object,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['navigate'])

const displayName = computed(() => {
  const id = props.playbook.id
  if (id === 'master') return 'Master Entry'
  if (id === 'rules') return 'Universal Rules'
  return 'Playbook ' + id.toUpperCase()
})

const dotColor = computed(() => {
  return props.playbook.status === 'active' ? 'var(--success)' : 'var(--warning)'
})

const badgeClass = computed(() => {
  return props.playbook.status === 'active' ? 'active-badge' : 'soon-badge'
})

const badgeLabel = computed(() => {
  return props.playbook.status === 'active' ? 'Active' : 'Soon'
})
</script>
