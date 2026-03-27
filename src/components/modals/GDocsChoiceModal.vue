<template>
  <Teleport to="body">
    <div class="gdocs-overlay" @click.self="$emit('cancel')">
      <div class="gdocs-dialog">
        <h3>Export to Google Docs</h3>

        <button class="gdocs-btn gdocs-btn--primary" @click="$emit('create-new')">
          Create New Document
        </button>

        <button
          v-if="lastDocId"
          class="gdocs-btn gdocs-btn--secondary"
          @click="$emit('update-last')"
        >
          <strong>Update last export</strong>
          <span class="gdocs-btn__sub">{{ lastDocName || 'Previous document' }}</span>
        </button>

        <button class="gdocs-btn gdocs-btn--secondary" @click="$emit('pick-existing')">
          <strong>Choose existing document</strong>
          <span class="gdocs-btn__sub">Browse Google Drive to select a doc to overwrite</span>
        </button>

        <button class="gdocs-btn gdocs-btn--cancel" @click="$emit('cancel')">
          Cancel
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  lastDocId: { type: String, default: '' },
  lastDocName: { type: String, default: '' },
})

defineEmits(['create-new', 'update-last', 'pick-existing', 'cancel'])
</script>

<style scoped>
.gdocs-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gdocs-dialog {
  background: var(--bg1, #fff);
  border-radius: 12px;
  padding: 28px 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.gdocs-dialog h3 {
  margin: 0 0 16px 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-dark, #1a1a1a);
}

.gdocs-btn {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-family: var(--font-body, inherit);
  text-align: left;
  transition: all 0.15s;
}

.gdocs-btn--primary {
  background: #4285f4;
  color: #fff;
  border: none;
  font-weight: 700;
  text-align: center;
}

.gdocs-btn--primary:hover {
  background: #3367d6;
}

.gdocs-btn--secondary {
  background: var(--bg2, #f8f9fa);
  color: var(--text1, #333);
  border: 1px solid var(--accent, #4285f4);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gdocs-btn--secondary:hover {
  background: var(--dk-light, #ebf5fb);
}

.gdocs-btn__sub {
  font-size: 12px;
  color: var(--text-muted, #666);
  font-weight: 400;
}

.gdocs-btn--cancel {
  background: none;
  border: none;
  color: var(--text-muted, #888);
  font-size: 13px;
  text-align: center;
  padding: 8px;
}

.gdocs-btn--cancel:hover {
  color: var(--text, #333);
}
</style>
