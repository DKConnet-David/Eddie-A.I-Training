<template>
  <aside class="trainer-sidebar">
    <h3>Training Scenarios</h3>
    <ScenarioCard
      v-for="scenario in scenarios"
      :key="scenario.id"
      :scenario="scenario"
      @select="handleSelect"
    />

    <!-- Custom scenario -->
    <div class="custom-scenario">
      <h4>Custom Scenario</h4>
      <textarea
        v-model="customText"
        class="custom-textarea"
        placeholder="Type a custom opening message..."
      ></textarea>
      <button
        class="custom-start-btn"
        :disabled="!customText.trim()"
        @click="startCustom"
      >
        Start Custom Scenario
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import scenarios from '@/data/scenarios.js'
import ScenarioCard from './ScenarioCard.vue'

const emit = defineEmits(['select-scenario', 'need-api-key'])

const customText = ref('')

function handleSelect(scenario) {
  emit('select-scenario', scenario)
}

function startCustom() {
  const text = customText.value.trim()
  if (!text) return

  emit('select-scenario', {
    id: 'custom-' + Date.now(),
    title: 'Custom Scenario',
    context: 'Custom trainer scenario: ' + text,
    openingMessage: text,
  })
}
</script>

<style scoped>
.trainer-sidebar {
  width: 300px;
  flex-shrink: 0;
  background: var(--card, #fff);
  border-left: 1px solid var(--card-border, #e0e0e0);
  overflow-y: auto;
  padding: 16px 14px;
}

.trainer-sidebar h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark, #1a1a1a);
  margin: 0 0 12px 0;
}

.custom-scenario {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--card-border, #e0e0e0);
}

.custom-scenario h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted, #888);
  margin: 0 0 6px 0;
}

.custom-textarea {
  width: 100%;
  background: var(--body, #f5f6f8);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  padding: 8px 12px;
  color: var(--text, #333);
  font-family: var(--font-body, inherit);
  font-size: 12px;
  resize: vertical;
  min-height: 64px;
  outline: none;
  margin-bottom: 6px;
  line-height: 1.4;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.custom-textarea:focus {
  border-color: var(--dk, #008fc9);
  box-shadow: 0 0 0 3px var(--dk-ring, rgba(0, 143, 201, 0.15));
  background: white;
}

.custom-textarea::placeholder { color: var(--text-muted, #888); }

.custom-start-btn {
  width: 100%;
  padding: 7px;
  background: var(--card, #fff);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  color: var(--text-muted, #888);
  font-family: var(--font-body, inherit);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.custom-start-btn:hover {
  background: var(--dk-light, #ebf5fb);
  border-color: var(--dk, #008fc9);
  color: var(--dk, #008fc9);
}

.custom-start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .trainer-sidebar {
    width: 100% !important;
    max-height: 300px;
    border-left: none !important;
    border-top: 1px solid var(--card-border, #e0e0e0);
  }
}
</style>
