import { ref } from 'vue'

/**
 * Composable for mouse-based drag-and-drop reordering of step cards.
 *
 * @param {import('vue').Ref<HTMLElement|null>} containerRef - ref to the container element holding .step-card elements
 * @param {(fromIndex: number, toIndex: number) => void} onReorder - callback when a reorder is confirmed
 * @returns {{ bind: () => void, isDragging: import('vue').Ref<boolean> }}
 */
export function useDragReorder(containerRef, onReorder) {
  const isDragging = ref(false)

  let dragState = null

  function getStepCards() {
    if (!containerRef.value) return []
    return Array.from(containerRef.value.querySelectorAll('.step-card[data-step-index]'))
  }

  function getCardIndex(card) {
    return parseInt(card.dataset.stepIndex, 10)
  }

  function clearIndicators() {
    getStepCards().forEach((c) => {
      c.classList.remove('drag-over-above', 'drag-over-below')
    })
  }

  function handleMouseDown(e) {
    const handle = e.target.closest('.step-drag-handle')
    if (!handle) return

    const card = handle.closest('.step-card[data-step-index]')
    if (!card) return

    e.preventDefault()

    const rect = card.getBoundingClientRect()
    const fromIndex = getCardIndex(card)

    // Create floating clone
    const clone = card.cloneNode(true)
    clone.style.position = 'fixed'
    clone.style.left = rect.left + 'px'
    clone.style.top = rect.top + 'px'
    clone.style.width = rect.width + 'px'
    clone.style.zIndex = '9999'
    clone.style.opacity = '0.85'
    clone.style.pointerEvents = 'none'
    clone.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'
    clone.style.transition = 'none'
    document.body.appendChild(clone)

    card.classList.add('dragging')

    dragState = {
      card,
      clone,
      fromIndex,
      startY: e.clientY,
      offsetY: e.clientY - rect.top,
      currentTarget: null,
      insertBefore: true,
    }

    isDragging.value = true

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e) {
    if (!dragState) return

    // Move clone
    dragState.clone.style.top = (e.clientY - dragState.offsetY) + 'px'

    // Find which card the mouse is over
    clearIndicators()
    const cards = getStepCards()
    let targetCard = null
    let above = true

    for (const c of cards) {
      if (c === dragState.card) continue
      const r = c.getBoundingClientRect()
      if (e.clientY >= r.top && e.clientY <= r.bottom) {
        targetCard = c
        above = e.clientY < r.top + r.height / 2
        break
      }
    }

    if (targetCard) {
      targetCard.classList.add(above ? 'drag-over-above' : 'drag-over-below')
      dragState.currentTarget = targetCard
      dragState.insertBefore = above
    } else {
      dragState.currentTarget = null
    }
  }

  function handleMouseUp() {
    if (!dragState) return

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    // Clean up
    clearIndicators()
    dragState.card.classList.remove('dragging')
    if (dragState.clone.parentNode) {
      dragState.clone.parentNode.removeChild(dragState.clone)
    }

    // Determine target index
    if (dragState.currentTarget) {
      const toIndex = getCardIndex(dragState.currentTarget)
      const fromIndex = dragState.fromIndex

      if (fromIndex !== toIndex) {
        const ok = confirm(
          `Move step from position ${fromIndex + 1} to position ${toIndex + 1}?`
        )
        if (ok) {
          onReorder(fromIndex, toIndex)
        }
      }
    }

    isDragging.value = false
    dragState = null
  }

  /**
   * Call after the container has rendered step cards to bind drag handlers.
   * Safe to call multiple times (re-binds).
   */
  function bind() {
    const container = containerRef.value
    if (!container) return

    // Remove old listener to prevent duplicates
    container.removeEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousedown', handleMouseDown)
  }

  return {
    bind,
    isDragging,
  }
}
