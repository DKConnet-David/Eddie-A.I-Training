<template>
  <div class="typing-indicator">
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  background: var(--card, #fff);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: 4px var(--radius-lg, 10px) var(--radius-lg, 10px) var(--radius-lg, 10px);
  align-self: flex-start;
  max-width: 70px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted, #888);
  animation: typingPulse 1.4s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingPulse {
  0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1); }
}
</style>
