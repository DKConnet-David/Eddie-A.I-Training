<template>
  <div style="text-align: center; margin: 20px 0;">
    <button
      class="action-btn"
      style="padding: 8px 20px; font-size: 13px;"
      @click="$emit('add')"
    >
      + Add Step
    </button>
  </div>
</template>

<script setup>
defineEmits(['add'])
</script>
