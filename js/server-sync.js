// Server-side save/load for playbook data persistence

Eddie.serverSync = {
  init: function() {
    var saveBtn = document.getElementById('server-save-btn');
    var loadBtn = document.getElementById('server-load-btn');

    if (saveBtn) {
      saveBtn.addEventListener('click', function() { Eddie.serverSync.saveToServer(); });
    }
    if (loadBtn) {
      loadBtn.addEventListener('click', function() { Eddie.serverSync.loadFromServer(); });
    }

    // Check server status on load
    this.checkStatus();
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

  checkStatus: function() {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/status');
    xhr.onload = function() {
      if (xhr.status === 200) {
        var result = JSON.parse(xhr.responseText);
        if (result.hasSave && result.savedAt) {
          var date = new Date(result.savedAt);
          self.setStatus('info', 'Last server save: ' + date.toLocaleString());
        } else {
          self.setStatus('info', 'No server save found. Click "Save to Server" to create one.');
        }
      }
    };
    xhr.onerror = function() {
      self.setStatus('error', 'Cannot reach server API.');
    };
    xhr.send();
  },

  saveToServer: function() {
    var self = this;
    self.setStatus('saving', 'Saving to server...');

    var data = this.gatherData();
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/save');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status === 200) {
        var result = JSON.parse(xhr.responseText);
        var date = new Date(result.savedAt);
        self.setStatus('success', 'Saved to server at ' + date.toLocaleString());
      } else {
        self.setStatus('error', 'Save failed: ' + xhr.statusText);
      }
    };

    xhr.onerror = function() {
      self.setStatus('error', 'Network error — could not save.');
    };

    xhr.send(JSON.stringify(data));
  },

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
