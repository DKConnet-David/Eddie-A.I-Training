import { defineStore } from 'pinia'
import { ref } from 'vue'

const DEFAULT_BLOCK_TYPES = [
  { id: 'eddie', label: 'Eddie says', borderColor: '#008fc9', bgColor: '#f0f7fb', labelColor: '#0369a1' },
  { id: 'internal', label: 'Internal note', borderColor: '#999', bgColor: '#f5f5f5', labelColor: '#666' },
  { id: 'warn', label: 'Never', borderColor: '#e53e3e', bgColor: '#fef2f2', labelColor: '#e53e3e' },
  { id: 'ok', label: 'Resolution', borderColor: '#008fc9', bgColor: '#f0f7fb', labelColor: '#0369a1' },
]

const DEFAULT_IDS = DEFAULT_BLOCK_TYPES.map(b => b.id)

export const useSyntaxStore = defineStore('syntax', () => {
  const blockTypes = ref([])

  function init() {
    // Start with copies of defaults
    const merged = DEFAULT_BLOCK_TYPES.map(b => ({ ...b }))

    // Load custom block types from localStorage
    let custom = []
    try {
      custom = JSON.parse(localStorage.getItem('eddie_syntax_blocks') || '[]')
    } catch {
      custom = []
    }

    // Apply saved overrides to defaults and add custom types
    for (const saved of custom) {
      const defaultIdx = merged.findIndex(b => b.id === saved.id)
      if (defaultIdx > -1) {
        // Override default with saved values
        merged[defaultIdx] = { ...merged[defaultIdx], ...saved }
      } else {
        // Custom block type
        merged.push({ ...saved })
      }
    }

    blockTypes.value = merged
  }

  function _saveToLocalStorage() {
    // Save all block types (both modified defaults and custom)
    // We save everything so overrides to default colors are preserved
    localStorage.setItem('eddie_syntax_blocks', JSON.stringify(blockTypes.value))
  }

  function addBlockType(block) {
    // Prevent duplicate ids
    if (blockTypes.value.find(b => b.id === block.id)) return
    blockTypes.value.push({ ...block })
    _saveToLocalStorage()
  }

  function updateBlockType(id, data) {
    const idx = blockTypes.value.findIndex(b => b.id === id)
    if (idx === -1) return
    blockTypes.value[idx] = { ...blockTypes.value[idx], ...data }
    _saveToLocalStorage()
  }

  function removeBlockType(id) {
    // Only allow removing custom types, not the 4 defaults
    if (DEFAULT_IDS.includes(id)) return
    blockTypes.value = blockTypes.value.filter(b => b.id !== id)
    _saveToLocalStorage()
  }

  function getBlockConfig(id) {
    return blockTypes.value.find(b => b.id === id) || null
  }

  function isDefault(id) {
    return DEFAULT_IDS.includes(id)
  }

  return {
    blockTypes,
    init,
    addBlockType,
    updateBlockType,
    removeBlockType,
    getBlockConfig,
    isDefault,
  }
})
