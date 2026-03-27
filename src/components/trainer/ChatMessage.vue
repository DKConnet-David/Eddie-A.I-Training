<template>
  <div v-if="message.role === 'notice'" class="chat-notice">
    {{ message.content }}
  </div>
  <div v-else class="chat-msg" :class="message.role">
    <div class="chat-meta">
      {{ message.role === 'eddie' ? 'Eddie \u00b7 assistant' : 'You (trainer)' }}
    </div>
    <div class="chat-bubble" v-html="formattedContent"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: { type: Object, required: true },
})

const formattedContent = computed(() => {
  return formatText(props.message.content)
})

function formatText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /`(.+?)`/g,
      '<code style="background:var(--row-alt,#f5f5f5);padding:1px 5px;border-radius:4px;font-size:12px;border:1px solid var(--card-border,#e0e0e0)">$1</code>'
    )
    .replace(
      /\[Step:([^\]]+)\]/g,
      '<span class="tag tag-blue" style="margin-top:8px;display:inline-block">[Step:$1]</span>'
    )
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.chat-msg {
  max-width: 75%;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chat-msg.eddie { align-self: flex-start; }
.chat-msg.user  { align-self: flex-end; }

.chat-meta {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  color: var(--text-muted, #888);
  padding: 0 4px;
}

.chat-msg.user .chat-meta { text-align: right; }

.chat-bubble {
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.55;
  word-wrap: break-word;
}

.chat-msg.eddie .chat-bubble {
  background: var(--card, #fff);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: 4px var(--radius-lg, 10px) var(--radius-lg, 10px) var(--radius-lg, 10px);
  color: var(--text, #333);
}

.chat-msg.user .chat-bubble {
  background: var(--dk-light, #ebf5fb);
  border: 1px solid #bae2f5;
  border-radius: var(--radius-lg, 10px) 4px var(--radius-lg, 10px) var(--radius-lg, 10px);
  color: var(--text, #333);
}

.chat-notice {
  text-align: center;
  font-style: italic;
  color: var(--text-muted, #888);
  font-size: 12px;
  padding: 8px 0;
}
</style>
