<template>
  <div id="tab-trainer" class="tab-panel active" style="display: flex; flex-direction: row; flex: 1;">
    <ChatArea />
    <TrainerSidebar
      @select-scenario="handleScenario"
    />
    <ApiKeyModal
      v-if="showApiKeyModal"
      @close="showApiKeyModal = false"
      @saved="onApiKeySaved"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat.js'
import { useAuthStore } from '@/stores/auth.js'
import ChatArea from '@/components/trainer/ChatArea.vue'
import TrainerSidebar from '@/components/trainer/TrainerSidebar.vue'
import ApiKeyModal from '@/components/modals/ApiKeyModal.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()

const showApiKeyModal = ref(false)
const pendingScenario = ref(null)

function handleScenario(scenario) {
  if (!authStore.hasApiKey()) {
    pendingScenario.value = scenario
    showApiKeyModal.value = true
    return
  }
  chatStore.loadScenario(scenario)
}

function onApiKeySaved() {
  showApiKeyModal.value = false
  if (pendingScenario.value) {
    chatStore.loadScenario(pendingScenario.value)
    pendingScenario.value = null
  }
}
</script>

<style scoped>
</style>
