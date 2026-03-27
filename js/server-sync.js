// Server-side save/load for playbook data persistence
// Auto-saves on every edit, auto-loads on startup

Eddie.serverSync = {
  _saveTimer: null,
  _lastSaveJson: null,

  init: function() {
    var saveBtn = document.getElementById('server-save-btn');
    var loadBtn = document.getElementById('server-load-btn');

    if (saveBtn) {
      saveBtn.addEventListener('click', function() { Eddie.serverSync.saveToServer(); });
    }
    if (loadBtn) {
      loadBtn.addEventListener('click', function() { Eddie.serverSync.loadFromServer(); });
    }

    // Auto-load from server on startup
    this.autoLoad();

    // Watch for localStorage changes to auto-save
    this.watchForChanges();
  },

  // Gather all localStorage data that needs persisting
  gatherData: function() {
    return {
      playbook_overrides: Eddie.storage.getPlaybookOverrides(),
      custom_playbooks: Eddie.storage.getCustomPlaybooks(),
      docsync_url: Eddie.storage.getDocSyncUrl(),
      google_client_id: Eddie.storage.getGoogleClientId(),
      gdocs_last_id: localStorage.getItem('eddie_gdocs_last_id') || null,
      gdocs_last_name: localStorage.getItem('eddie_gdocs_last_name') || null
    };
  },

  // Restore data into localStorage
  restoreData: function(data) {
    if (data.playbook_overrides) {
      localStorage.setItem('eddie_playbook_overrides', JSON.stringify(data.playbook_overrides));
    }
    if (data.custom_playbooks) {
      localStorage.setItem('eddie_custom_playbooks', JSON.stringify(data.custom_playbooks));
    }
    if (data.docsync_url) {
      localStorage.setItem('eddie_docsync_url', data.docsync_url);
    }
    if (data.google_client_id) {
      localStorage.setItem('eddie_google_client_id', data.google_client_id);
    }
    if (data.gdocs_last_id) {
      localStorage.setItem('eddie_gdocs_last_id', data.gdocs_last_id);
    }
    if (data.gdocs_last_name) {
      localStorage.setItem('eddie_gdocs_last_name', data.gdocs_last_name);
    }
  },

  setStatus: function(type, message) {
    var el = document.getElementById('server-sync-status');
    if (!el) return;
    var colors = {
      saving: 'var(--warning, #b47a1a)',
      success: 'var(--success, #0a8)',
      error: 'var(--error, #e53e3e)',
      info: 'var(--text-muted, #888)'
    };
    var color = colors[type] || colors.info;
    el.innerHTML = '<span style="color:' + color + '">' + message + '</span>';
  },

  // ── Auto-load on startup ──
  autoLoad: function() {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/load');
    xhr.onload = function() {
      if (xhr.status === 200) {
        var result = JSON.parse(xhr.responseText);
        if (result.saved && result.data) {
          // Always restore server data to keep browsers in sync
          var serverJson = JSON.stringify(result.data);
          var localJson = JSON.stringify(self.gatherData());

          // Only reload if server data differs from local
          if (serverJson !== localJson) {
            self.restoreData(result.data);

            // Check if data actually changed after restore
            var afterRestore = JSON.stringify(self.gatherData());
            if (afterRestore !== localJson) {
              self._lastSaveJson = afterRestore;
              self.setStatus('info', 'Synced from server. Reloading...');
              setTimeout(function() { location.reload(); }, 300);
              return;
            }
          }

          self._lastSaveJson = JSON.stringify(self.gatherData());
          var date = new Date(result.data._savedAt);
          self.setStatus('info', 'Auto-save active. Last save: ' + date.toLocaleString());
        } else {
          self._lastSaveJson = JSON.stringify(self.gatherData());
          self.setStatus('info', 'Auto-save active. No previous save found.');
        }
      }
    };
    xhr.onerror = function() {
      self.setStatus('error', 'Cannot reach server — auto-save unavailable.');
    };
    xhr.send();
  },

  // ── Watch for changes and auto-save ──
  watchForChanges: function() {
    var self = this;

    // Override localStorage.setItem to detect changes
    var originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
      originalSetItem(key, value);
      // Only auto-save for eddie_ keys
      if (key.indexOf('eddie_') === 0) {
        self.scheduleAutoSave();
      }
    };
  },

  scheduleAutoSave: function() {
    var self = this;
    // Debounce — wait 2 seconds after last change before saving
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(function() {
      self.autoSave();
    }, 2000);
  },

  autoSave: function() {
    var data = this.gatherData();
    var json = JSON.stringify(data);

    // Skip if nothing changed
    if (json === this._lastSaveJson) return;

    this._lastSaveJson = json;
    this.setStatus('saving', 'Auto-saving...');

    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/save');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status === 200) {
        var result = JSON.parse(xhr.responseText);
        var date = new Date(result.savedAt);
        self.setStatus('success', 'Auto-saved at ' + date.toLocaleTimeString());
      } else {
        self.setStatus('error', 'Auto-save failed: ' + xhr.statusText);
      }
    };

    xhr.onerror = function() {
      self.setStatus('error', 'Auto-save failed — network error.');
    };

    xhr.send(json);
  },

  // ── Manual save ──
  saveToServer: function() {
    this._lastSaveJson = null; // Force save even if no detected changes
    this.autoSave();
  },

  // ── Manual load ──
  loadFromServer: function() {
    var self = this;
    self.setStatus('saving', 'Loading from server...');

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/load');

    xhr.onload = function() {
      if (xhr.status === 200) {
        var result = JSON.parse(xhr.responseText);
        if (!result.saved || !result.data) {
          self.setStatus('info', 'No saved data found on server.');
          return;
        }

        if (!confirm('Load server data? This will overwrite your current browser data and reload the page.')) {
          self.setStatus('info', 'Load cancelled.');
          return;
        }

        self.restoreData(result.data);
        self.setStatus('success', 'Data loaded. Reloading...');
        setTimeout(function() { location.reload(); }, 500);
      } else {
        self.setStatus('error', 'Load failed: ' + xhr.statusText);
      }
    };

    xhr.onerror = function() {
      self.setStatus('error', 'Network error — could not load.');
    };

    xhr.send();
  }
};
