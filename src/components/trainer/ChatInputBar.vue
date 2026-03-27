<template>
  <div class="chat-input-bar">
    <textarea
      ref="inputRef"
      v-model="text"
      class="chat-input"
      placeholder="Type a message as the customer..."
      :disabled="disabled"
      rows="1"
      @keydown="handleKeydown"
      @input="autoResize"
    ></textarea>
    <button
      class="send-btn"
      :disabled="disabled || !text.trim()"
      @click="send"
    >
      Send
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['send'])

const text = ref('')
const inputRef = ref(null)

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

function autoResize() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function send() {
  const trimmed = text.value.trim()
  if (!trimmed || props.disabled) return

  emit('send', trimmed)
  text.value = ''

  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.style.height = 'auto'
    }
  })
}
</script>

<style scoped>
.chat-input-bar {
  padding: 12px 16px;
  background: var(--card, #fff);
  border-top: 1px solid var(--card-border, #e0e0e0);
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  background: var(--body, #f5f6f8);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  padding: 8px 12px;
  color: var(--text, #333);
  font-family: var(--font-body, inherit);
  font-size: 13px;
  resize: none;
  min-height: 38px;
  max-height: 120px;
  line-height: 1.4;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.chat-input:focus {
  border-color: var(--dk, #008fc9);
  box-shadow: 0 0 0 3px var(--dk-ring, rgba(0, 143, 201, 0.15));
  background: white;
}

.chat-input::placeholder { color: var(--text-muted, #888); }

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  padding: 8px 18px;
  background: var(--dk, #008fc9);
  border: 1px solid var(--dk, #008fc9);
  border-radius: var(--radius-md, 6px);
  color: white;
  font-family: var(--font-body, inherit);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.send-btn:hover { background: var(--dk-hover, #0077a8); }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
