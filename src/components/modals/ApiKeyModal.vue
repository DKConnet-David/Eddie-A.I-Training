<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <h2>Anthropic API Key</h2>
        <p class="modal-desc">
          Enter your Anthropic API key to enable the AI Trainer. Your key is stored in
          session storage and never sent to our servers.
        </p>
        <input
          ref="inputRef"
          v-model="keyValue"
          type="password"
          placeholder="sk-ant-..."
          @keydown.enter="save"
        />
        <p class="modal-note">
          Get a key from <strong>console.anthropic.com</strong>. It starts with
          <code>sk-ant-</code>.
        </p>
        <button class="modal-confirm-btn" @click="save">
          Save Key
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'

const emit = defineEmits(['close', 'saved'])

const authStore = useAuthStore()
const keyValue = ref(authStore.apiKey || '')
const inputRef = ref(null)

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
})

function save() {
  const trimmed = keyValue.value.trim()
  if (!trimmed) return

  authStore.setApiKey(trimmed)
  emit('saved')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: white;
  border-radius: var(--radius-xl, 12px);
  box-shadow: var(--shadow-modal, 0 8px 32px rgba(0, 0, 0, 0.25));
  padding: 28px;
  width: 420px;
  max-width: 90vw;
}

.modal h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-dark, #1a1a1a);
  margin: 0 0 4px 0;
}

.modal-desc {
  font-size: 13px;
  color: var(--text-muted, #888);
  margin: 0 0 18px 0;
  line-height: 1.5;
}

.modal input[type="password"] {
  width: 100%;
  background: var(--body, #f5f6f8);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  padding: 8px 12px;
  color: var(--text, #333);
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  outline: none;
  margin-bottom: 6px;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.modal input[type="password"]:focus {
  border-color: var(--dk, #008fc9);
  box-shadow: 0 0 0 3px var(--dk-ring, rgba(0, 143, 201, 0.15));
  background: white;
}

.modal-note {
  font-size: 11px;
  color: var(--text-muted, #888);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.modal-note code {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  background: var(--row-alt, #f5f5f5);
  padding: 1px 4px;
  border-radius: 3px;
}

.modal-confirm-btn {
  width: 100%;
  padding: 9px;
  background: var(--dk, #008fc9);
  border: 1px solid var(--dk, #008fc9);
  border-radius: var(--radius-md, 6px);
  color: white;
  font-family: var(--font-body, inherit);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.modal-confirm-btn:hover { background: var(--dk-hover, #0077a8); }
</style>
