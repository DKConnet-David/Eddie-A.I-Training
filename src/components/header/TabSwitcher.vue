<template>
  <nav class="tab-switcher">
    <router-link
      v-for="tab in tabs"
      :key="tab.route"
      :to="tab.route"
      class="tab-btn"
      :class="{ active: isActive(tab.route) }"
    >
      {{ tab.label }}
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { label: 'Playbooks', route: '/playbooks/master' },
  { label: 'Audit', route: '/audit' },
  { label: 'AI Trainer', route: '/trainer' },
  { label: 'Export', route: '/export' },
]

function isActive(path) {
  if (path.startsWith('/playbooks')) {
    return route.path.startsWith('/playbooks')
  }
  return route.path === path
}
</script>
