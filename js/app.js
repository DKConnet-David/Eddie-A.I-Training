// App initialization — wired last after all modules

Eddie.ui = {
  // Currently editing step state
  _editingStep: null, // { playbookId, stepIndex, parts }

  toggleStep: function(headerEl) {
    var card = headerEl.parentElement;
    var wasOpen = card.classList.contains('open');

    // If opening a new step while editor has unsaved changes, check first
    if (!wasOpen && this._editingStep) {
      if (!this.checkUnsavedChanges()) return;
    }

    card.classList.toggle('open');

    // If opening a step, load it into the side editor
    if (!wasOpen) {
      var stepIndex = parseInt(card.dataset.stepIndex, 10);
      if (!isNaN(stepIndex) && stepIndex >= 0) {
        this.openStepEditor(stepIndex);
      }
    }
  },

  // ── Unsaved changes check ──
  _originalEditorValues: null,

  hasUnsavedChanges: function() {
    if (!this._editingStep || !this._originalEditorValues) return false;
    var orig = this._originalEditorValues;
    var currNumber = document.getElementById('step-editor-number').value;
    var currTitle = document.getElementById('step-editor-step-title').value;
    var currContent = document.getElementById('step-editor-content').value;
    return currNumber !== orig.number || currTitle !== orig.title || currContent !== orig.markdown;
  },

  // Returns true if safe to proceed (no changes, or user chose to discard/save)
  checkUnsavedChanges: function() {
    if (!this.hasUnsavedChanges()) return true;

    var step = this._editingStep.parts.steps[this._editingStep.stepIndex];
    var choice = confirm(
      'You have unsaved changes to Step ' + step.number + ': ' + step.title + '.\n\n' +
      'Click OK to save your changes, or Cancel to discard them.'
    );
    if (choice) {
      this.saveStepEdit();
    }
    return true;
  },

  // ── Step Editor ──
  openStepEditor: function(stepIndex) {
    var id = Eddie.state.activePlaybook;
    var pb = Eddie.playbooks[id];
    if (!pb) return;

    var overrides = Eddie.storage.getPlaybookOverrides();
    var md = (overrides[id] && overrides[id].markdown) ? overrides[id].markdown : pb.markdown;
    var parts = Eddie.markdown.splitMarkdownSteps(md);

    if (stepIndex >= parts.steps.length) return;

    var step = parts.steps[stepIndex];

    this._editingStep = {
      playbookId: id,
      stepIndex: stepIndex,
      parts: parts
    };

    // Store original values to detect changes
    this._originalEditorValues = {
      number: step.number,
      title: step.title,
      markdown: step.markdown
    };

    document.getElementById('step-editor-title').textContent = 'Step ' + step.number;
    document.getElementById('step-editor-number').value = step.number;
    document.getElementById('step-editor-step-title').value = step.title;
    document.getElementById('step-editor-content').value = step.markdown;

    document.getElementById('step-editor-panel').classList.remove('hidden');

    // Highlight active step card and scroll it into view
    document.querySelectorAll('#playbook-content .step-card').forEach(function(c) {
      var isTarget = parseInt(c.dataset.stepIndex, 10) === stepIndex;
      c.classList.toggle('editing', isTarget);
      if (isTarget) {
        setTimeout(function() {
          c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
      }
    });

    // Scroll editor panel to top
    document.getElementById('step-editor-panel').scrollTop = 0;
  },

  closeStepEditor: function(force) {
    if (!force && this.hasUnsavedChanges()) {
      if (!this.checkUnsavedChanges()) return;
    }
    this._editingStep = null;
    this._originalEditorValues = null;
    document.getElementById('step-editor-panel').classList.add('hidden');
    document.querySelectorAll('#playbook-content .step-card.editing').forEach(function(c) {
      c.classList.remove('editing');
    });
  },

  saveStepEdit: function() {
    if (!this._editingStep) return;

    var es = this._editingStep;
    var step = es.parts.steps[es.stepIndex];

    // Update step from editor fields
    step.number = document.getElementById('step-editor-number').value.trim() || step.number;
    step.title = document.getElementById('step-editor-step-title').value.trim() || step.title;
    step.markdown = document.getElementById('step-editor-content').value;

    // Reassemble full markdown
    var fullMd = Eddie.markdown.joinMarkdownSteps(es.parts);

    // Save as override
    var pb = Eddie.playbooks[es.playbookId];
    Eddie.storage.savePlaybookOverride(es.playbookId, {
      title: pb.title,
      subtitle: pb.subtitle,
      status: pb.status,
      markdown: fullMd
    });

    // Clear unsaved tracking and re-render
    this._originalEditorValues = null;
    this.closeStepEditor(true);
    Eddie.router.renderPlaybook(es.playbookId);

    // Re-open the step that was just edited
    var cards = document.querySelectorAll('#playbook-content .step-card');
    cards.forEach(function(c) {
      if (parseInt(c.dataset.stepIndex, 10) === es.stepIndex) {
        c.classList.add('open');
      }
    });
  },

  // ── Expand / Collapse All (toggle) ──
  _allExpanded: false,

  toggleAllSteps: function() {
    var cards = document.querySelectorAll('#playbook-content .step-card');
    var btn = document.getElementById('toggle-all-steps-btn');

    if (this._allExpanded) {
      cards.forEach(function(c) { c.classList.remove('open'); });
      if (this._editingStep) this.closeStepEditor();
      this._allExpanded = false;
      if (btn) {
        btn.innerHTML = '&#9660; Expand All';
        btn.style.background = '#e6f9f0';
        btn.style.color = '#0a8';
        btn.style.borderColor = '#0a8';
      }
    } else {
      cards.forEach(function(c) { c.classList.add('open'); });
      this._allExpanded = true;
      if (btn) {
        btn.innerHTML = '&#9650; Collapse All';
        btn.style.background = '#ebf5fb';
        btn.style.color = '#0369a1';
        btn.style.borderColor = '#0369a1';
      }
    }
  },

  // ── Step helpers ──

  // Get current playbook parts (frontmatter, pre, steps)
  _getPlaybookParts: function(id) {
    var pb = Eddie.playbooks[id];
    if (!pb) return null;
    var overrides = Eddie.storage.getPlaybookOverrides();
    var md = (overrides[id] && overrides[id].markdown) ? overrides[id].markdown : pb.markdown;
    return Eddie.markdown.splitMarkdownSteps(md);
  },

  // Save parts back and re-render
  _saveAndRender: function(id, parts) {
    var pb = Eddie.playbooks[id];
    var fullMd = Eddie.markdown.joinMarkdownSteps(parts);
    Eddie.storage.savePlaybookOverride(id, {
      title: pb.title,
      subtitle: pb.subtitle,
      status: pb.status,
      markdown: fullMd
    });
    Eddie.router.renderPlaybook(id);
  },

  // Auto-renumber steps sequentially (1, 2, 3, ...) preserving sub-step letters (3A, 3B, etc.)
  renumberSteps: function(parts) {
    var num = 1;
    for (var i = 0; i < parts.steps.length; i++) {
      var step = parts.steps[i];
      var oldNum = step.number;

      // Check if this is a sub-step (ends with a letter like 3A, 3B)
      var subMatch = oldNum.match(/^(\d+)([A-Za-z]+)$/);
      if (subMatch) {
        // Sub-step: use current parent number + letter
        step.number = String(num - 1 > 0 ? num - 1 : num) + subMatch[2].toUpperCase();
      } else {
        step.number = String(num);
        num++;
      }
    }
    return parts;
  },

  // ── Add Step ──
  addStep: function() {
    var id = Eddie.state.activePlaybook;
    var parts = this._getPlaybookParts(id);
    if (!parts) return;

    // Add new blank step at the end
    parts.steps.push({
      number: '0', // placeholder, will be renumbered
      title: 'New Step',
      markdown: ':::eddie\nEnter message here.\n:::\n\n- Condition A \u2192 Next Step\n- Condition B \u2192 \u2705 RESOLVED'
    });

    // Auto-renumber all steps
    this.renumberSteps(parts);
    this._saveAndRender(id, parts);

    // Open the new step in the editor
    var newIndex = parts.steps.length - 1;
    this.openStepEditor(newIndex);

    // Scroll to and open the new step card
    var cards = document.querySelectorAll('#playbook-content .step-card');
    cards.forEach(function(c) {
      if (parseInt(c.dataset.stepIndex, 10) === newIndex) {
        c.classList.add('open');
        c.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  },

  // ── Delete Step ──
  deleteStep: function(stepIndex) {
    if (!this._editingStep) return;
    var es = this._editingStep;

    var step = es.parts.steps[stepIndex];
    if (!confirm('Delete Step ' + step.number + ': ' + step.title + '?')) return;

    es.parts.steps.splice(stepIndex, 1);
    this.renumberSteps(es.parts);

    this.closeStepEditor();
    this._saveAndRender(es.playbookId, es.parts);
  },

  // ── Move Step ──
  moveStep: function(stepIndex, direction) {
    var id = Eddie.state.activePlaybook;
    var parts = this._getPlaybookParts(id);
    if (!parts) return;

    var newIndex = stepIndex + direction;
    if (newIndex < 0 || newIndex >= parts.steps.length) return;

    // Swap steps
    var temp = parts.steps[stepIndex];
    parts.steps[stepIndex] = parts.steps[newIndex];
    parts.steps[newIndex] = temp;

    // Auto-renumber to prevent conflicts
    this.renumberSteps(parts);

    // Close editor if open
    if (this._editingStep) this.closeStepEditor();

    this._saveAndRender(id, parts);

    // Re-open the moved step at its new position
    var cards = document.querySelectorAll('#playbook-content .step-card');
    cards.forEach(function(c) {
      if (parseInt(c.dataset.stepIndex, 10) === newIndex) {
        c.classList.add('open');
        c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  },

  // ── API Key Modal ──
  showApiKeyModal: function() {
    document.getElementById('api-key-modal').classList.remove('hidden');
    setTimeout(function() {
      document.getElementById('api-key-input').focus();
    }, 100);
  },

  hideApiKeyModal: function() {
    document.getElementById('api-key-modal').classList.add('hidden');
  },

  // ── Sidebar ──
  buildSidebarHTML: function() {
    var html = '';
    var groups = {
      entry: { label: 'Entry', items: [] },
      playbooks: { label: 'Playbooks', items: [] },
      reference: { label: 'Reference', items: [] }
    };

    Eddie.playbookOrder.forEach(function(id) {
      var pb = Eddie.playbooks[id];
      if (!pb) return;
      var group = groups[pb.group] || groups.playbooks;
      group.items.push(pb);
    });

    var customs = Eddie.storage.getCustomPlaybooks();
    Object.keys(customs).forEach(function(id) {
      if (!Eddie.playbooks[id]) {
        groups.playbooks.items.push(customs[id]);
      }
    });

    Object.keys(groups).forEach(function(key) {
      var group = groups[key];
      if (group.items.length === 0) return;

      html += '<div class="sidebar-group">';
      html += '<div class="sidebar-group-label">' + group.label + '</div>';

      group.items.forEach(function(pb) {
        var isActive = pb.id === Eddie.state.activePlaybook;
        var badgeClass = pb.status === 'active' ? 'active-badge' : 'soon-badge';
        var badgeLabel = pb.status === 'active' ? 'Active' : 'Soon';
        var dotColor = pb.status === 'active' ? 'var(--success)' : 'var(--warning)';

        var name = pb.id === 'master' ? 'Master Entry' :
                   pb.id === 'rules' ? 'Universal Rules' :
                   'Playbook ' + pb.id.toUpperCase();
        var sub = pb.subtitle || '';

        html += '<div class="nav-item' + (isActive ? ' active' : '') + '" data-route="' + pb.id + '">';
        html += '<div class="nav-dot" style="background:' + dotColor + '"></div>';
        html += '<div class="nav-info">';
        html += '<div class="nav-name">' + name + '</div>';
        html += '<div class="nav-sub">' + sub + '</div>';
        html += '</div>';
        html += '<span class="nav-badge ' + badgeClass + '">' + badgeLabel + '</span>';
        html += '</div>';
      });

      html += '</div>';
    });

    return html;
  },

  // ── Full Playbook Editor (modal) ──
  editPlaybook: function(id) {
    var pb = Eddie.playbooks[id];
    if (!pb) return;

    var overrides = Eddie.storage.getPlaybookOverrides();
    var currentMd = (overrides[id] && overrides[id].markdown) ? overrides[id].markdown : pb.markdown;

    document.getElementById('editor-title').textContent = 'Edit: ' + (pb.title || id);
    document.getElementById('editor-pb-title').value = overrides[id] ? (overrides[id].title || pb.title) : pb.title;
    document.getElementById('editor-pb-subtitle').value = overrides[id] ? (overrides[id].subtitle || pb.subtitle) : pb.subtitle;
    document.getElementById('editor-pb-status').value = overrides[id] ? (overrides[id].status || pb.status) : pb.status;
    document.getElementById('editor-pb-content').value = currentMd.trim();
    document.getElementById('editor-overlay').classList.remove('hidden');

    document.getElementById('editor-overlay').dataset.editingId = id;
  },

  savePlaybookEdit: function() {
    var id = document.getElementById('editor-overlay').dataset.editingId;
    if (!id) return;

    var title = document.getElementById('editor-pb-title').value.trim();
    var subtitle = document.getElementById('editor-pb-subtitle').value.trim();
    var status = document.getElementById('editor-pb-status').value;
    var markdown = document.getElementById('editor-pb-content').value;

    Eddie.storage.savePlaybookOverride(id, {
      title: title,
      subtitle: subtitle,
      status: status,
      markdown: markdown
    });

    if (Eddie.playbooks[id]) {
      Eddie.playbooks[id].title = title;
      Eddie.playbooks[id].subtitle = subtitle;
      Eddie.playbooks[id].status = status;
    }

    document.getElementById('editor-overlay').classList.add('hidden');
    Eddie.router.renderPlaybook(id);
    Eddie.router.rebuildSidebar();
  },

  resetPlaybook: function(id) {
    Eddie.storage.removePlaybookOverride(id);
    Eddie.router.renderPlaybook(id);
    Eddie.router.rebuildSidebar();
  },

  showAddPlaybookModal: function() {
    document.getElementById('editor-title').textContent = 'Add New Playbook';
    document.getElementById('editor-pb-title').value = '';
    document.getElementById('editor-pb-subtitle').value = '';
    document.getElementById('editor-pb-status').value = 'active';
    document.getElementById('editor-pb-content').value = '## Step 1: Step Title\n\n:::eddie\nMessage content here.\n:::\n\n- Condition A \u2192 Step 2\n- Condition B \u2192 \u2705 RESOLVED\n\n## Step 2: Next Step\n\n:::eddie\nNext message.\n:::\n\n:::internal\nInternal notes here.\n:::';
    document.getElementById('editor-overlay').classList.remove('hidden');
    document.getElementById('editor-overlay').dataset.editingId = '__new__';
  },

  saveNewPlaybook: function(id, title, subtitle, status, markdown) {
    var newId = id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!newId) newId = 'custom-' + Date.now();

    var pb = {
      id: newId,
      title: title,
      subtitle: subtitle,
      status: status,
      color: status === 'active' ? 'var(--success)' : 'var(--warning)',
      group: 'playbooks',
      keywords: [],
      markdown: markdown
    };

    var customs = Eddie.storage.getCustomPlaybooks();
    customs[newId] = pb;
    Eddie.storage.saveCustomPlaybooks(customs);

    Eddie.playbooks[newId] = pb;
    if (Eddie.playbookOrder.indexOf(newId) === -1) {
      var rulesIdx = Eddie.playbookOrder.indexOf('rules');
      if (rulesIdx > -1) {
        Eddie.playbookOrder.splice(rulesIdx, 0, newId);
      } else {
        Eddie.playbookOrder.push(newId);
      }
    }

    Eddie.router.rebuildSidebar();
    Eddie.router.navigatePlaybook(newId);
  }
};

// ── Initialize everything ──
document.addEventListener('DOMContentLoaded', function() {
  // Load custom playbooks into runtime
  var customs = Eddie.storage.getCustomPlaybooks();
  Object.keys(customs).forEach(function(id) {
    if (!Eddie.playbooks[id]) {
      Eddie.playbooks[id] = customs[id];
      if (Eddie.playbookOrder.indexOf(id) === -1) {
        var rulesIdx = Eddie.playbookOrder.indexOf('rules');
        if (rulesIdx > -1) {
          Eddie.playbookOrder.splice(rulesIdx, 0, id);
        } else {
          Eddie.playbookOrder.push(id);
        }
      }
    }
  });

  // Apply playbook overrides metadata
  var overrides = Eddie.storage.getPlaybookOverrides();
  Object.keys(overrides).forEach(function(id) {
    if (Eddie.playbooks[id] && overrides[id]) {
      if (overrides[id].title) Eddie.playbooks[id].title = overrides[id].title;
      if (overrides[id].subtitle) Eddie.playbooks[id].subtitle = overrides[id].subtitle;
      if (overrides[id].status) Eddie.playbooks[id].status = overrides[id].status;
    }
  });

  // Build sidebar
  document.getElementById('sidebar-nav').innerHTML = Eddie.ui.buildSidebarHTML();

  // Init modules
  Eddie.router.init();
  Eddie.chat.init();
  Eddie.scenarios.renderCards();
  Eddie.scenarios.initCustom();
  Eddie.docExport.init();
  Eddie.gdocsExport.init();
  Eddie.stepDrag.init();
  Eddie.serverSync.init();

  // Playbook audit — populate dropdown and bind
  var auditSelect = document.getElementById('audit-playbook-select');
  if (auditSelect) {
    Eddie.playbookOrder.forEach(function(id) {
      var pb = Eddie.playbooks[id];
      if (!pb) return;
      var label = id === 'master' ? 'Master Entry Point' :
                  id === 'rules' ? 'Universal Rules' :
                  'Playbook ' + id.toUpperCase() + ' — ' + pb.title;
      var opt = document.createElement('option');
      opt.value = id;
      opt.textContent = label;
      auditSelect.appendChild(opt);
    });

    auditSelect.addEventListener('change', function() {
      var resultsEl = document.getElementById('audit-results');
      var overlayResults = document.getElementById('audit-overlay-results');
      if (!auditSelect.value) {
        resultsEl.innerHTML = '';
        overlayResults.innerHTML = '';
        return;
      }
      var html = Eddie.playbookAudit.showAuditForPlaybook(auditSelect.value);
      resultsEl.innerHTML = html;
      overlayResults.innerHTML = html;
    });

    // Expand button — open full overlay
    document.getElementById('audit-expand-btn').addEventListener('click', function() {
      var overlay = document.getElementById('audit-overlay');
      var overlayResults = document.getElementById('audit-overlay-results');
      if (auditSelect.value) {
        overlayResults.innerHTML = Eddie.playbookAudit.showAuditForPlaybook(auditSelect.value);
      } else {
        overlayResults.innerHTML = '<p style="color:var(--text-muted);">Select a playbook first.</p>';
      }
      overlay.classList.remove('hidden');
      overlay.style.display = 'flex';
    });

    document.getElementById('audit-overlay-close').addEventListener('click', function() {
      var overlay = document.getElementById('audit-overlay');
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
    });

    document.getElementById('audit-overlay').addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.add('hidden');
        this.style.display = 'none';
      }
    });
  }

  // API key modal
  document.getElementById('api-key-confirm').addEventListener('click', function() {
    var key = document.getElementById('api-key-input').value.trim();
    if (key) {
      Eddie.storage.setApiKey(key);
      Eddie.ui.hideApiKeyModal();
    }
  });

  document.getElementById('api-key-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('api-key-confirm').click();
    }
  });

  // Full playbook editor modal
  document.getElementById('editor-save-btn').addEventListener('click', function() {
    var editingId = document.getElementById('editor-overlay').dataset.editingId;
    if (editingId === '__new__') {
      var title = document.getElementById('editor-pb-title').value.trim();
      var subtitle = document.getElementById('editor-pb-subtitle').value.trim();
      var status = document.getElementById('editor-pb-status').value;
      var markdown = document.getElementById('editor-pb-content').value;
      if (title) {
        Eddie.ui.saveNewPlaybook(null, title, subtitle, status, markdown);
      }
      document.getElementById('editor-overlay').classList.add('hidden');
    } else {
      Eddie.ui.savePlaybookEdit();
    }
  });

  document.getElementById('editor-cancel-btn').addEventListener('click', function() {
    document.getElementById('editor-overlay').classList.add('hidden');
  });

  document.getElementById('editor-close-btn').addEventListener('click', function() {
    document.getElementById('editor-overlay').classList.add('hidden');
  });

  // Step editor panel
  document.getElementById('step-editor-save').addEventListener('click', function() {
    Eddie.ui.saveStepEdit();
  });

  document.getElementById('step-editor-cancel').addEventListener('click', function() {
    Eddie.ui.closeStepEditor();
  });

  document.getElementById('step-editor-close').addEventListener('click', function() {
    Eddie.ui.closeStepEditor();
  });

  document.getElementById('step-editor-delete').addEventListener('click', function() {
    if (Eddie.ui._editingStep) {
      Eddie.ui.deleteStep(Eddie.ui._editingStep.stepIndex);
    }
  });

  // Add playbook button
  document.getElementById('add-playbook-btn').addEventListener('click', function() {
    Eddie.ui.showAddPlaybookModal();
  });

  // Check if API key needed on trainer tab
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (btn.dataset.tab === 'trainer' && !Eddie.storage.hasApiKey()) {
        setTimeout(function() { Eddie.ui.showApiKeyModal(); }, 200);
      }
    });
  });
});
