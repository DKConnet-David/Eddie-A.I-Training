<template>
  <div class="scenario-card" @click="$emit('select', scenario)">
    <h4>{{ scenario.title }}</h4>
    <p>{{ scenario.description }}</p>
    <div class="scenario-tags">
      <span
        v-for="(tag, i) in scenario.tags"
        :key="i"
        class="tag"
        :class="'tag-' + tag.color"
      >
        {{ tag.label }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  scenario: { type: Object, required: true },
})

defineEmits(['select'])
</script>

<style scoped>
.scenario-card {
  background: var(--body, #f5f6f8);
  border: 1px solid var(--card-border, #e0e0e0);
  border-radius: var(--radius-md, 6px);
  padding: 10px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.scenario-card:hover {
  border-color: var(--dk, #008fc9);
  background: var(--dk-light, #ebf5fb);
}

.scenario-card h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark, #1a1a1a);
  margin: 0 0 3px 0;
}

.scenario-card p {
  font-size: 12px;
  color: var(--text-muted, #888);
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.scenario-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  display: inline-block;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 9px;
  border-radius: 9999px;
  margin: 2px 3px 2px 0;
}

.tag-green { background: var(--success-bg, #e6f9f0); color: var(--success, #0a8); }
.tag-amber { background: var(--warning-bg, #fef3e0); color: var(--warning, #b47a1a); }
.tag-red   { background: var(--error-bg, #fef2f2); color: var(--error, #e53e3e); }
.tag-blue  { background: var(--dk-light, #ebf5fb); color: var(--dk, #008fc9); }
</style>
