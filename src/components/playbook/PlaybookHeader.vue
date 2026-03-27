<template>
  <div class="playbook-header">
    <h2 class="playbook-title">{{ playbook.title }}</h2>
    <div v-if="playbook.subtitle" class="playbook-subtitle">{{ playbook.subtitle }}</div>
    <span v-if="playbook.status === 'active'" class="status-pill active-pill">
      <span class="pill-dot"></span> Active
    </span>
    <span v-else-if="playbook.status === 'soon'" class="status-pill soon-pill">
      <span class="pill-dot"></span> Coming Soon
    </span>
    <div v-if="keywords.length" class="keywords-bar">
      <span v-for="(kw, i) in keywords" :key="i" class="tag tag-blue">{{ kw }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  playbook: {
    type: Object,
    required: true,
  },
})

const keywords = computed(() => {
  const kw = props.playbook.keywords
  if (!kw) return []
  if (Array.isArray(kw)) return kw.filter(Boolean)
  if (typeof kw === 'string') return kw.split(',').map(s => s.trim()).filter(Boolean)
  return []
})
</script>
