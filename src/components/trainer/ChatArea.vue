<template>
  <div class="chat-area">
    <div ref="messagesRef" class="chat-messages">
      <ChatMessage
        v-for="(msg, i) in chatStore.messages"
        :key="i"
        :message="msg"
      />
      <TypingIndicator v-if="chatStore.isSending" />
    </div>
    <ChatInputBar
      :disabled="chatStore.isSending"
      @send="handleSend"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat.js'
import ChatMessage from './ChatMessage.vue'
import ChatInputBar from './ChatInputBar.vue'
import TypingIndicator from './TypingIndicator.vue'

const chatStore = useChatStore()
const messagesRef = ref(null)

function handleSend(text) {
  chatStore.sendMessage(text)
}

// Auto-scroll to bottom when messages change or typing indicator appears
watch(
  () => [chatStore.messages.length, chatStore.isSending],
  () => {
    nextTick(() => {
      if (messagesRef.value) {
        messagesRef.value.scrollTop = messagesRef.value.scrollHeight
      }
    })
  },
)
</script>

<style scoped>
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--body, #f5f6f8);
  min-width: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
