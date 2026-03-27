import { computed } from 'vue'

/**
 * Composable for detecting unsaved changes in a form.
 *
 * @param {import('vue').Ref<{number: string, title: string, markdown: string}|null>} originalValues
 *   The original field values when the editor was opened.
 * @param {import('vue').Ref<{number: string, title: string, markdown: string}>} currentValues
 *   The current (live) field values from the form.
 * @returns {{ hasChanges: import('vue').ComputedRef<boolean>, checkUnsavedChanges: (saveFn?: Function) => boolean }}
 */
export function useUnsavedChanges(originalValues, currentValues) {
  const hasChanges = computed(() => {
    const orig = originalValues.value
    const curr = currentValues.value
    if (!orig || !curr) return false
    return (
      curr.number !== orig.number ||
      curr.title !== orig.title ||
      curr.markdown !== orig.markdown
    )
  })

  /**
   * Prompts user if there are unsaved changes.
   * If user clicks OK, calls saveFn (if provided).
   * Returns true if safe to proceed (no changes, or user chose to handle them).
   */
  function checkUnsavedChanges(saveFn) {
    if (!hasChanges.value) return true

    const orig = originalValues.value
    const label = orig ? `Step ${orig.number}: ${orig.title}` : 'this step'

    const choice = confirm(
      `You have unsaved changes to ${label}.\n\n` +
      'Click OK to save your changes, or Cancel to discard them.'
    )

    if (choice && saveFn) {
      saveFn()
    }

    // Always return true — user has made their choice
    return true
  }

  return {
    hasChanges,
    checkUnsavedChanges,
  }
}
