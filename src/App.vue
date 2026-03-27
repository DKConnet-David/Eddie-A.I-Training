<template>
  <div id="app">
    <AppHeader />
    <div class="content-area">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import AppHeader from './components/header/AppHeader.vue'
</script>
