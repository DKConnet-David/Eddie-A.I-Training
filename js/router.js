// Tab switching, sidebar navigation, hash-based routing

Eddie.router = {
  init: function() {
    this.bindTabs();
    this.bindSidebar();
    this.bindRouteLinks();
    this.handleHash();
    window.addEventListener('hashchange', function() { Eddie.router.handleHash(); });
  },

  bindTabs: function() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        Eddie.router.switchTab(btn.dataset.tab);
      });
    });
  },

  switchTab: function(tab) {
    Eddie.state.activeTab = tab;

    document.querySelectorAll('.tab-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });

    document.querySelectorAll('.tab-panel').forEach(function(p) {
      p.classList.toggle('active', p.id === 'tab-' + tab);
    });

    if (tab !== 'playbooks') {
      location.hash = tab;
    }
  },

  bindSidebar: function() {
    document.getElementById('sidebar-nav').addEventListener('click', function(e) {
      var item = e.target.closest('.nav-item');
      if (!item) return;
      var route = item.dataset.route;
      if (route) {
        Eddie.router.navigatePlaybook(route);
      }
    });
  },

  navigatePlaybook: function(id) {
    this.switchTab('playbooks');
    Eddie.state.activePlaybook = id;
    location.hash = 'playbook/' + id;

    // Close step editor when changing playbook
    if (Eddie.ui.closeStepEditor) Eddie.ui.closeStepEditor();

    document.querySelectorAll('#sidebar-nav .nav-item').forEach(function(item) {
      item.classList.toggle('active', item.dataset.route === id);
    });

    this.renderPlaybook(id);
  },

  renderPlaybook: function(id) {
    var panel = document.getElementById('playbook-content');
    var pb = Eddie.playbooks[id];
    if (!pb) {
      panel.innerHTML = '<p style="color:var(--text-muted)">Playbook not found.</p>';
      return;
    }

    // Check for overrides (now stored as markdown)
    var overrides = Eddie.storage.getPlaybookOverrides();
    var md = (overrides[id] && overrides[id].markdown) ? overrides[id].markdown : pb.markdown;

    // Render markdown → HTML
    var rendered = Eddie.markdown.render(md, {
      title: pb.title,
      subtitle: pb.subtitle,
      status: pb.status,
      keywords: (pb.keywords || []).join(', ')
    });

    // Add edit/management buttons
    var actions = '<div class="playbook-actions">';
    actions += '<button class="action-btn" onclick="Eddie.ui.editPlaybook(\'' + id + '\')">Edit Playbook</button>';
    if (overrides[id]) {
      actions += '<button class="action-btn danger" onclick="Eddie.ui.resetPlaybook(\'' + id + '\')">Reset to Default</button>';
    }
    actions += '</div>';

    // Add step button after all step cards
    var addStepBtn = '<div style="text-align:center;margin:20px 0;">' +
      '<button class="action-btn" onclick="Eddie.ui.addStep()" style="padding:8px 20px;font-size:13px;">' +
      '+ Add Step</button></div>';

    panel.innerHTML = actions + rendered + addStepBtn;
    this.bindRouteLinks();
    if (Eddie.stepDrag) Eddie.stepDrag.bind();
  },

  bindRouteLinks: function() {
    document.querySelectorAll('.route-link[data-route]').forEach(function(link) {
      link.onclick = function(e) {
        e.preventDefault();
        Eddie.router.navigatePlaybook(link.dataset.route);
      };
    });
  },

  handleHash: function() {
    var hash = location.hash.replace('#', '');
    if (!hash) {
      this.switchTab('playbooks');
      this.navigatePlaybook('master');
      return;
    }

    if (hash.startsWith('playbook/')) {
      var id = hash.split('/')[1];
      this.navigatePlaybook(id);
    } else if (hash === 'trainer') {
      this.switchTab('trainer');
    } else if (hash === 'docsync') {
      this.switchTab('docsync');
    } else {
      this.switchTab('playbooks');
      this.navigatePlaybook('master');
    }
  },

  rebuildSidebar: function() {
    var nav = document.getElementById('sidebar-nav');
    nav.innerHTML = Eddie.ui.buildSidebarHTML();
    this.bindSidebar();
    // Re-highlight active
    document.querySelectorAll('#sidebar-nav .nav-item').forEach(function(item) {
      item.classList.toggle('active', item.dataset.route === Eddie.state.activePlaybook);
    });
  }
};
