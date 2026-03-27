<template>
  <div class="sub-step-group">
    <div class="sub-step-connector"></div>
    <div class="sub-step-cards">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
// Wrapper for consecutive sub-steps (numbers matching /^\d+[A-Za-z]/)
// Provides the blue vertical connector line on the left and indented layout.
// Parent is responsible for grouping the correct StepCard children inside this slot.
</script>
