// Mouse-based drag-and-drop reordering for step cards

Eddie.stepDrag = {
  dragging: false,
  dragCard: null,
  dragIndex: null,
  placeholder: null,
  offsetY: 0,
  startY: 0,

  init: function() {
    this.bind();
  },

  bind: function() {
    var handles = document.querySelectorAll('#playbook-content .step-drag-handle');
    var self = this;

    handles.forEach(function(handle) {
      handle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.onMouseDown(e, handle);
      });
    });
  },

  onMouseDown: function(e, handle) {
    var card = handle.closest('.step-card');
    if (!card) return;

    this.dragIndex = parseInt(card.dataset.stepIndex, 10);
    this.startY = e.clientY;
    this.dragging = false;

    var self = this;
    var onMove = function(e) { self.onMouseMove(e, card); };
    var onUp = function(e) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      self.onMouseUp(e);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  },

  onMouseMove: function(e, card) {
    // Start dragging after 4px threshold
    if (!this.dragging) {
      if (Math.abs(e.clientY - this.startY) < 4) return;
      this.startDrag(card, e);
    }

    // Move the floating card
    this.dragCard.style.top = (e.clientY - this.offsetY) + 'px';

    // Find which card we're hovering over
    var cards = document.querySelectorAll('#playbook-content .step-card:not(.drag-clone)');
    var self = this;

    cards.forEach(function(c) { c.classList.remove('drag-over-above', 'drag-over-below'); });

    var target = this.getDropTarget(e.clientY, cards);
    if (target && target.card) {
      var rect = target.card.getBoundingClientRect();
      var mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        target.card.classList.add('drag-over-above');
      } else {
        target.card.classList.add('drag-over-below');
      }
    }
  },

  startDrag: function(card, e) {
    this.dragging = true;

    var rect = card.getBoundingClientRect();
    this.offsetY = e.clientY - rect.top;

    // Create floating clone
    this.dragCard = card.cloneNode(true);
    this.dragCard.classList.add('drag-clone');
    this.dragCard.style.cssText =
      'position:fixed;left:' + rect.left + 'px;top:' + rect.top + 'px;' +
      'width:' + rect.width + 'px;z-index:9999;pointer-events:none;' +
      'opacity:0.85;box-shadow:0 8px 24px rgba(0,0,0,0.18);transform:scale(1.02);' +
      'transition:none;border:2px solid var(--accent,#008fc9);border-radius:8px;background:#fff;';
    document.body.appendChild(this.dragCard);

    // Dim original
    card.classList.add('dragging');
    card.style.opacity = '0.25';
  },

  getDropTarget: function(clientY, cards) {
    var closest = null;
    var closestDist = Infinity;

    cards.forEach(function(c) {
      if (c.classList.contains('dragging')) return;
      var rect = c.getBoundingClientRect();
      var mid = rect.top + rect.height / 2;
      var dist = Math.abs(clientY - mid);
      if (dist < closestDist) {
        closestDist = dist;
        closest = { card: c, index: parseInt(c.dataset.stepIndex, 10) };
      }
    });

    return closest;
  },

  onMouseUp: function(e) {
    if (!this.dragging) {
      this.cleanup();
      return;
    }

    // Find drop target
    var cards = document.querySelectorAll('#playbook-content .step-card:not(.drag-clone)');
    var target = this.getDropTarget(e.clientY, cards);

    this.cleanup();

    if (!target || target.index === this.dragIndex) return;

    // Determine insert position based on cursor position relative to target midpoint
    var rect = target.card.getBoundingClientRect();
    var mid = rect.top + rect.height / 2;
    var toIndex = target.index;
    if (e.clientY > mid && toIndex < this.dragIndex) toIndex++;
    if (e.clientY < mid && toIndex > this.dragIndex) toIndex--;

    if (toIndex === this.dragIndex) return;

    // Perform the reorder
    var id = Eddie.state.activePlaybook;
    var parts = Eddie.ui._getPlaybookParts(id);
    if (!parts || this.dragIndex >= parts.steps.length) return;

    var moved = parts.steps.splice(this.dragIndex, 1)[0];
    parts.steps.splice(toIndex, 0, moved);

    Eddie.ui.renumberSteps(parts);

    if (Eddie.ui._editingStep) Eddie.ui.closeStepEditor();

    Eddie.ui._saveAndRender(id, parts);

    // Open moved step at new position
    var newCards = document.querySelectorAll('#playbook-content .step-card');
    newCards.forEach(function(c) {
      if (parseInt(c.dataset.stepIndex, 10) === toIndex) {
        c.classList.add('open');
      }
    });
  },

  cleanup: function() {
    this.dragging = false;

    // Remove clone
    if (this.dragCard && this.dragCard.parentNode) {
      this.dragCard.parentNode.removeChild(this.dragCard);
    }
    this.dragCard = null;

    // Restore original cards
    document.querySelectorAll('#playbook-content .step-card').forEach(function(c) {
      c.classList.remove('dragging', 'drag-over-above', 'drag-over-below');
      c.style.opacity = '';
    });
  }
};
