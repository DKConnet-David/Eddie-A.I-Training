<template>
  <header class="header">
    <div class="header-left">
      <div class="logo">
        <div class="logo-mark">Ei</div>
        <div class="logo-text">
          <span>Eddie AI</span>
          <span>Training Console</span>
        </div>
      </div>
      <TabSwitcher />
    </div>
    <div class="header-right">
      <button class="action-btn" @click="$emit('add-playbook')">+ Add Playbook</button>
      <button class="sync-btn" @click="$emit('sync')">
        <span class="pulse-dot"></span>
        Export Doc
      </button>
    </div>
  </header>
</template>

<script setup>
import TabSwitcher from './TabSwitcher.vue'

defineEmits(['add-playbook', 'sync'])
</script>
