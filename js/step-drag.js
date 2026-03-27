// Drag-and-drop reordering for step cards

Eddie.stepDrag = {
  dragIndex: null,

  init: function() {
    this.bind();
  },

  // Bind drag events to all step cards — called after each render
  bind: function() {
    var cards = document.querySelectorAll('#playbook-content .step-card[draggable]');
    var self = this;

    cards.forEach(function(card) {
      card.addEventListener('dragstart', function(e) { self.onDragStart(e, card); });
      card.addEventListener('dragend', function(e) { self.onDragEnd(e, card); });
      card.addEventListener('dragover', function(e) { self.onDragOver(e, card); });
      card.addEventListener('dragleave', function(e) { self.onDragLeave(e, card); });
      card.addEventListener('drop', function(e) { self.onDrop(e, card); });
    });
  },

  onDragStart: function(e, card) {
    // Only allow drag from the handle
    var handle = card.querySelector('.step-drag-handle');
    if (handle && !handle.contains(e.target)) {
      e.preventDefault();
      return;
    }

    this.dragIndex = parseInt(card.dataset.stepIndex, 10);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dragIndex);
  },

  onDragEnd: function(e, card) {
    card.classList.remove('dragging');
    this.dragIndex = null;
    // Clean up all drag-over indicators
    document.querySelectorAll('.step-card.drag-over').forEach(function(c) {
      c.classList.remove('drag-over');
    });
  },

  onDragOver: function(e, card) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    var targetIndex = parseInt(card.dataset.stepIndex, 10);
    if (targetIndex === this.dragIndex) return;

    // Remove drag-over from others, add to this one
    document.querySelectorAll('.step-card.drag-over').forEach(function(c) {
      c.classList.remove('drag-over');
    });
    card.classList.add('drag-over');
  },

  onDragLeave: function(e, card) {
    card.classList.remove('drag-over');
  },

  onDrop: function(e, card) {
    e.preventDefault();
    card.classList.remove('drag-over');

    var fromIndex = this.dragIndex;
    var toIndex = parseInt(card.dataset.stepIndex, 10);

    if (fromIndex === null || fromIndex === toIndex) return;

    // Perform the move
    var id = Eddie.state.activePlaybook;
    var parts = Eddie.ui._getPlaybookParts(id);
    if (!parts || fromIndex >= parts.steps.length || toIndex >= parts.steps.length) return;

    // Remove the step from its old position
    var moved = parts.steps.splice(fromIndex, 1)[0];

    // Insert at new position
    parts.steps.splice(toIndex, 0, moved);

    // Auto-renumber
    Eddie.ui.renumberSteps(parts);

    // Close editor if open
    if (Eddie.ui._editingStep) Eddie.ui.closeStepEditor();

    // Save and re-render
    Eddie.ui._saveAndRender(id, parts);

    // Open the moved step at its new position
    var cards = document.querySelectorAll('#playbook-content .step-card');
    cards.forEach(function(c) {
      if (parseInt(c.dataset.stepIndex, 10) === toIndex) {
        c.classList.add('open');
      }
    });
  }
};
