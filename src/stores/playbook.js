import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { defaultPlaybooks, defaultPlaybookOrder } from '@/data/playbooks/index.js'
import { splitMarkdownSteps, joinMarkdownSteps } from '@/lib/markdown.js'

export const usePlaybookStore = defineStore('playbook', () => {
  // ── State ──

  // All playbook data keyed by id (built-in + custom, with overrides applied)
  const playbooks = ref({})

  // Display order of playbook ids
  const playbookOrder = ref([])

  // Raw overrides from localStorage (edits to built-in playbooks)
  const overrides = ref({})

  // Custom playbooks from localStorage
  const customPlaybooks = ref({})

  // ── Getters ──

  const activePlaybooks = computed(() => {
    const result = {}
    for (const [id, pb] of Object.entries(playbooks.value)) {
      if (pb.status === 'active') {
        result[id] = pb
      }
    }
    return result
  })

  /**
   * Returns the effective markdown for a playbook.
   * Override markdown takes precedence over the default.
   */
  function effectiveMarkdown(id) {
    const override = overrides.value[id]
    if (override && override.markdown) {
      return override.markdown
    }
    const pb = playbooks.value[id]
    return pb ? pb.markdown : ''
  }

  /**
   * Groups playbooks for sidebar display: entry, playbooks, reference.
   */
  const sidebarGroups = computed(() => {
    const groups = {
      entry: { label: 'Entry', items: [] },
      playbooks: { label: 'Playbooks', items: [] },
      reference: { label: 'Reference', items: [] },
    }

    for (const id of playbookOrder.value) {
      const pb = playbooks.value[id]
      if (!pb) continue
      const group = groups[pb.group] || groups.playbooks
      group.items.push(pb)
    }

    // Include custom playbooks that may not be in the order array
    for (const [id, pb] of Object.entries(customPlaybooks.value)) {
      if (!playbooks.value[id]) continue
      const alreadyListed = playbookOrder.value.includes(id)
      if (!alreadyListed) {
        groups.playbooks.items.push(playbooks.value[id])
      }
    }

    return groups
  })

  // ── Actions ──

  /**
   * Initialize the store: load defaults, apply overrides and custom playbooks.
   */
  function init() {
    // Start with a deep copy of the built-in playbooks
    const pbs = {}
    for (const [id, pb] of Object.entries(defaultPlaybooks)) {
      pbs[id] = { ...pb }
    }
    playbooks.value = pbs
    playbookOrder.value = [...defaultPlaybookOrder]

    // Load overrides from localStorage
    try {
      overrides.value = JSON.parse(localStorage.getItem('eddie_playbook_overrides') || '{}')
    } catch {
      overrides.value = {}
    }

    // Load custom playbooks from localStorage
    try {
      customPlaybooks.value = JSON.parse(localStorage.getItem('eddie_custom_playbooks') || '{}')
    } catch {
      customPlaybooks.value = {}
    }

    // Merge custom playbooks into the main playbooks map and order
    for (const [id, pb] of Object.entries(customPlaybooks.value)) {
      if (!playbooks.value[id]) {
        playbooks.value[id] = { ...pb }
        if (!playbookOrder.value.includes(id)) {
          const rulesIdx = playbookOrder.value.indexOf('rules')
          if (rulesIdx > -1) {
            playbookOrder.value.splice(rulesIdx, 0, id)
          } else {
            playbookOrder.value.push(id)
          }
        }
      }
    }

    // Apply override metadata (title, subtitle, status) to playbooks
    for (const [id, override] of Object.entries(overrides.value)) {
      if (playbooks.value[id] && override) {
        if (override.title) playbooks.value[id].title = override.title
        if (override.subtitle) playbooks.value[id].subtitle = override.subtitle
        if (override.status) playbooks.value[id].status = override.status
      }
    }
  }

  /**
   * Save an override for a playbook (title, subtitle, status, markdown).
   */
  function saveOverride(id, data) {
    overrides.value[id] = data
    localStorage.setItem('eddie_playbook_overrides', JSON.stringify(overrides.value))

    // Also update the runtime playbook metadata
    if (playbooks.value[id]) {
      if (data.title) playbooks.value[id].title = data.title
      if (data.subtitle) playbooks.value[id].subtitle = data.subtitle
      if (data.status) playbooks.value[id].status = data.status
    }
  }

  /**
   * Remove an override, reverting the playbook to its default state.
   */
  function removeOverride(id) {
    delete overrides.value[id]
    localStorage.setItem('eddie_playbook_overrides', JSON.stringify(overrides.value))

    // Restore default metadata
    const defaultPb = defaultPlaybooks[id]
    if (defaultPb && playbooks.value[id]) {
      playbooks.value[id].title = defaultPb.title
      playbooks.value[id].subtitle = defaultPb.subtitle
      playbooks.value[id].status = defaultPb.status
    }
  }

  /**
   * Add a new custom playbook.
   */
  function addCustomPlaybook(playbook) {
    const id = playbook.id
    customPlaybooks.value[id] = playbook
    localStorage.setItem('eddie_custom_playbooks', JSON.stringify(customPlaybooks.value))

    playbooks.value[id] = { ...playbook }
    if (!playbookOrder.value.includes(id)) {
      const rulesIdx = playbookOrder.value.indexOf('rules')
      if (rulesIdx > -1) {
        playbookOrder.value.splice(rulesIdx, 0, id)
      } else {
        playbookOrder.value.push(id)
      }
    }
  }

  /**
   * Get the parsed parts (frontmatter, pre, steps) for a playbook.
   */
  function getPlaybookParts(id) {
    const md = effectiveMarkdown(id)
    if (!md) return null
    return splitMarkdownSteps(md)
  }

  /**
   * Join parts back into markdown and save as an override.
   */
  function saveAndRerender(id, parts) {
    const fullMd = joinMarkdownSteps(parts)
    const pb = playbooks.value[id]
    if (!pb) return

    saveOverride(id, {
      title: pb.title,
      subtitle: pb.subtitle,
      status: pb.status,
      markdown: fullMd,
    })
  }

  /**
   * Auto-renumber steps sequentially (1, 2, 3, ...),
   * preserving sub-step letter suffixes (3A, 3B, etc.).
   */
  function renumberSteps(parts) {
    let num = 1
    for (let i = 0; i < parts.steps.length; i++) {
      const step = parts.steps[i]
      const oldNum = step.number

      // Check if this is a sub-step (ends with a letter like 3A, 3B)
      const subMatch = oldNum.match(/^(\d+)([A-Za-z]+)$/)
      if (subMatch) {
        // Sub-step: use current parent number + letter
        step.number = String(num - 1 > 0 ? num - 1 : num) + subMatch[2].toUpperCase()
      } else {
        step.number = String(num)
        num++
      }
    }
    return parts
  }

  /**
   * Add a new blank step at the end of the active playbook.
   * Returns the index of the new step.
   */
  function addStep(playbookId) {
    const parts = getPlaybookParts(playbookId)
    if (!parts) return -1

    parts.steps.push({
      number: '0',
      title: 'New Step',
      markdown:
        ':::eddie\nEnter message here.\n:::\n\n- Condition A \u2192 Next Step\n- Condition B \u2192 \u2705 RESOLVED',
    })

    renumberSteps(parts)
    saveAndRerender(playbookId, parts)

    return parts.steps.length - 1
  }

  /**
   * Delete a step at the given index.
   */
  function deleteStep(playbookId, stepIndex) {
    const parts = getPlaybookParts(playbookId)
    if (!parts || stepIndex < 0 || stepIndex >= parts.steps.length) return

    parts.steps.splice(stepIndex, 1)
    renumberSteps(parts)
    saveAndRerender(playbookId, parts)
  }

  /**
   * Move a step from one index to another.
   */
  function moveStep(playbookId, fromIndex, toIndex) {
    const parts = getPlaybookParts(playbookId)
    if (!parts) return
    if (toIndex < 0 || toIndex >= parts.steps.length) return

    // Swap the two steps
    const temp = parts.steps[fromIndex]
    parts.steps[fromIndex] = parts.steps[toIndex]
    parts.steps[toIndex] = temp

    renumberSteps(parts)
    saveAndRerender(playbookId, parts)
  }

  return {
    // State
    playbooks,
    playbookOrder,
    overrides,
    customPlaybooks,

    // Getters
    activePlaybooks,
    sidebarGroups,

    // Actions
    init,
    effectiveMarkdown,
    saveOverride,
    removeOverride,
    addCustomPlaybook,
    getPlaybookParts,
    saveAndRerender,
    renumberSteps,
    addStep,
    deleteStep,
    moveStep,
  }
})
