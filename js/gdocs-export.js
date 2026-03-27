// Google Docs export — uploads playbook HTML to Google Drive as a native Google Doc
// Supports creating new docs or updating existing ones via Google Picker

Eddie.gdocsExport = {
  accessToken: null,
  tokenClient: null,
  pickerLoaded: false,
  targetFileId: null, // set when updating an existing doc

  init: function() {
    var btn = document.getElementById('docsync-gdocs-btn');
    if (btn) {
      btn.addEventListener('click', function() { Eddie.gdocsExport.startExport(); });
    }
    var resetBtn = document.getElementById('docsync-gdocs-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() { Eddie.gdocsExport.resetAuth(); });
    }
    this.showLastDoc();
  },

  resetAuth: function() {
    this.accessToken = null;
    this.tokenClient = null;
    Eddie.storage.setGoogleClientId('');
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
    Eddie.docExport.setStatus('success', 'Google account reset. Click "Export to Google Docs" to sign in again.');
  },

  // Show last exported doc link
  showLastDoc: function() {
    var lastId = localStorage.getItem('eddie_gdocs_last_id');
    var lastName = localStorage.getItem('eddie_gdocs_last_name');
    var el = document.getElementById('gdocs-last-doc');
    var link = document.getElementById('gdocs-last-doc-link');
    if (lastId && el && link) {
      link.href = 'https://docs.google.com/document/d/' + lastId + '/edit';
      link.textContent = lastName || 'Open document';
      el.style.display = 'block';
    }
  },

  // Prompt for Client ID if not stored
  ensureClientId: function() {
    var clientId = Eddie.storage.getGoogleClientId();
    if (clientId) return clientId;

    clientId = prompt(
      'Enter your Google OAuth Client ID to enable Google Docs export.\n\n' +
      'You can create one at console.cloud.google.com under\n' +
      'APIs & Services > Credentials > OAuth 2.0 Client ID (Web application).\n\n' +
      'Make sure the Google Drive API and Google Picker API are enabled,\n' +
      'and your origin is in Authorized JavaScript Origins.'
    );
    if (clientId && clientId.trim()) {
      Eddie.storage.setGoogleClientId(clientId.trim());
      return clientId.trim();
    }
    return null;
  },

  // Initialize the Google token client (GIS)
  initTokenClient: function(clientId, callback) {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
      Eddie.docExport.setStatus('error', 'Google Identity Services not loaded. Check your internet connection.');
      return;
    }

    // Recreate token client if not yet created
    if (!this.tokenClient) {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: function(response) {
          if (response.error) {
            Eddie.docExport.setStatus('error', 'Auth failed: ' + response.error);
            return;
          }
          Eddie.gdocsExport.accessToken = response.access_token;
          if (callback) callback();
        }
      });
    }
  },

  // Load Google Picker API
  loadPicker: function(callback) {
    if (this.pickerLoaded) { callback(); return; }
    gapi.load('picker', function() {
      Eddie.gdocsExport.pickerLoaded = true;
      callback();
    });
  },

  startExport: function() {
    var clientId = this.ensureClientId();
    if (!clientId) {
      Eddie.docExport.setStatus('error', 'Google Client ID is required.');
      return;
    }

    var self = this;

    // Ensure auth, then show choice
    var proceed = function() {
      self.showChoiceDialog();
    };

    self.initTokenClient(clientId, proceed);

    if (self.accessToken) {
      proceed();
    } else {
      Eddie.docExport.setStatus('syncing', 'Authenticating with Google...');
      self.tokenClient.requestAccessToken({ prompt: 'select_account' });
    }
  },

  // Show a dialog: create new or pick existing
  showChoiceDialog: function() {
    // Remove any existing dialog
    var existing = document.getElementById('gdocs-choice-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'gdocs-choice-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';

    var dialog = document.createElement('div');
    dialog.style.cssText = 'background:var(--bg1,#fff);border-radius:12px;padding:28px 32px;max-width:400px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.25);font-family:inherit;';

    var lastId = localStorage.getItem('eddie_gdocs_last_id');
    var lastName = localStorage.getItem('eddie_gdocs_last_name');
    var updateLastBtn = '';
    if (lastId) {
      updateLastBtn =
        '<button id="gdocs-choice-last" style="width:100%;padding:12px;margin-bottom:10px;border:1px solid var(--accent,#4285f4);' +
        'background:var(--bg2,#f8f9fa);color:var(--text1,#333);border-radius:8px;cursor:pointer;font-size:14px;text-align:left;">' +
        '<strong>Update last export</strong><br><span style="font-size:12px;color:var(--text-muted,#666);">' +
        (lastName || 'Previous document') + '</span></button>';
    }

    dialog.innerHTML =
      '<h3 style="margin:0 0 16px 0;font-size:17px;">Export to Google Docs</h3>' +
      '<button id="gdocs-choice-new" style="width:100%;padding:12px;margin-bottom:10px;background:#4285f4;color:#fff;' +
      'border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;">Create New Document</button>' +
      updateLastBtn +
      '<button id="gdocs-choice-pick" style="width:100%;padding:12px;margin-bottom:10px;border:1px solid var(--accent,#4285f4);' +
      'background:var(--bg2,#f8f9fa);color:var(--text1,#333);border-radius:8px;cursor:pointer;font-size:14px;text-align:left;">' +
      '<strong>Choose existing document</strong><br><span style="font-size:12px;color:var(--text-muted,#666);">Browse Google Drive to select a doc to overwrite</span></button>' +
      '<button id="gdocs-choice-cancel" style="width:100%;padding:8px;background:none;border:none;color:var(--text-muted,#888);' +
      'cursor:pointer;font-size:13px;">Cancel</button>';

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    var self = this;

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });

    document.getElementById('gdocs-choice-cancel').addEventListener('click', function() {
      overlay.remove();
    });

    document.getElementById('gdocs-choice-new').addEventListener('click', function() {
      overlay.remove();
      self.targetFileId = null;
      self.uploadToGoogleDocs();
    });

    if (lastId) {
      document.getElementById('gdocs-choice-last').addEventListener('click', function() {
        overlay.remove();
        self.targetFileId = lastId;
        self.uploadToGoogleDocs();
      });
    }

    document.getElementById('gdocs-choice-pick').addEventListener('click', function() {
      overlay.remove();
      self.openPicker();
    });
  },

  // Open Google Picker to select an existing Google Doc
  openPicker: function() {
    var self = this;
    Eddie.docExport.setStatus('syncing', 'Opening file picker...');

    this.loadPicker(function() {
      var docsView = new google.picker.DocsView(google.picker.ViewId.DOCUMENTS)
        .setMimeTypes('application/vnd.google-apps.document')
        .setMode(google.picker.DocsViewMode.LIST);

      var picker = new google.picker.PickerBuilder()
        .setTitle('Select a Google Doc to overwrite')
        .addView(docsView)
        .setOAuthToken(self.accessToken)
        .setCallback(function(data) {
          if (data.action === google.picker.Action.PICKED) {
            var doc = data.docs[0];
            self.targetFileId = doc.id;
            Eddie.docExport.setStatus('syncing', 'Updating "' + doc.name + '"...');
            self.uploadToGoogleDocs();
          } else if (data.action === google.picker.Action.CANCEL) {
            Eddie.docExport.setStatus('', 'Export cancelled.');
          }
        })
        .build();
      picker.setVisible(true);
    });
  },

  buildDocHtml: function() {
    var content = Eddie.docExport.buildDocument();

    return [
      '<html><head><meta charset="utf-8">',
      '<style>',
      'body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.6; }',
      'h1 { font-size: 22pt; text-align: center; margin-bottom: 4pt; }',
      'h2 { font-size: 16pt; color: #0d0f12; margin-top: 24pt; border-bottom: 1px solid #ddd; padding-bottom: 4pt; }',
      'h3 { font-size: 13pt; color: #333; margin-top: 18pt; }',
      'h4 { font-size: 11pt; color: #555; margin-top: 12pt; }',
      '.playbook-header { margin-bottom: 16pt; }',
      '.playbook-title { font-size: 18pt; color: #0d0f12; margin-bottom: 2pt; }',
      '.playbook-subtitle { font-size: 10pt; color: #666; margin-bottom: 6pt; }',
      '.status-pill { font-size: 9pt; padding: 2px 8px; border-radius: 10px; }',
      '.status-pill.active-pill { background: #e6f9f0; color: #0369a1; }',
      '.status-pill.soon-pill { background: #fef3e0; color: #b47a1a; }',
      '.step-card { border: 1px solid #e0e0e0; border-radius: 6px; margin: 10pt 0; padding: 0; }',
      '.step-header { background: #f8f8f8; padding: 8pt 12pt; font-weight: bold; }',
      '.step-number { display: inline-block; background: #eee; padding: 2pt 6pt; border-radius: 4px; font-size: 10pt; margin-right: 6pt; }',
      '.step-chevron { display: none; }',
      '.step-body { padding: 8pt 12pt; }',
      '.msg-block { background: #f0f7fb; border-left: 3px solid #008fc9; padding: 8pt 12pt; margin: 8pt 0; }',
      '.msg-block-label { font-size: 8pt; color: #0369a1; text-transform: uppercase; font-weight: bold; }',
      '.internal-block { background: #f5f5f5; border-left: 3px solid #999; padding: 8pt 12pt; margin: 8pt 0; }',
      '.internal-block-label { font-size: 8pt; color: #666; text-transform: uppercase; font-weight: bold; }',
      '.warn-block { background: #fef2f2; border-left: 3px solid #e53e3e; padding: 8pt 12pt; margin: 8pt 0; }',
      '.warn-block-label { font-size: 8pt; color: #e53e3e; text-transform: uppercase; font-weight: bold; }',
      '.ok-block { background: #f0f7fb; border-left: 3px solid #008fc9; padding: 8pt 12pt; margin: 8pt 0; }',
      '.ok-block-label { font-size: 8pt; color: #0369a1; text-transform: uppercase; font-weight: bold; }',
      '.tag { font-size: 8pt; padding: 1pt 6pt; border-radius: 3px; margin-right: 3pt; }',
      '.tag-green { background: #e6f9f0; color: #0369a1; }',
      '.tag-amber { background: #fef3e0; color: #b47a1a; }',
      '.tag-red { background: #fef2f2; color: #c53030; }',
      '.tag-blue { background: #ebf5fb; color: #2b6cb0; }',
      '.route-link { color: #0369a1; font-weight: bold; text-decoration: underline; }',
      '.routing-table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10.5pt; }',
      '.routing-table th { background: #f0f0f0; text-align: left; padding: 6pt 10pt; border: 1px solid #ddd; }',
      '.routing-table td { padding: 6pt 10pt; border: 1px solid #ddd; }',
      'hr { border: none; border-top: 1px solid #ccc; margin: 20pt 0; }',
      'p { margin: 4pt 0; }',
      '</style></head><body>',
      '<h1>Eddie AI — Playbook Reference</h1>',
      '<p style="text-align:center;color:#666;font-size:10pt;margin-bottom:20pt;">Generated ' +
        new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '</p>',
      '<hr>',
      content,
      '</body></html>'
    ].join('\n');
  },

  uploadToGoogleDocs: function() {
    var html = this.buildDocHtml();
    var self = this;
    var fileId = this.targetFileId;

    if (fileId) {
      // Update existing document — replace contents via Drive API
      Eddie.docExport.setStatus('syncing', 'Updating existing document...');

      var boundary = '---EddieExport' + Date.now();
      var metadata = JSON.stringify({});

      var multipartBody =
        '--' + boundary + '\r\n' +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        metadata + '\r\n' +
        '--' + boundary + '\r\n' +
        'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
        html + '\r\n' +
        '--' + boundary + '--';

      var xhr = new XMLHttpRequest();
      xhr.open('PATCH', 'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=multipart');
      xhr.setRequestHeader('Authorization', 'Bearer ' + self.accessToken);
      xhr.setRequestHeader('Content-Type', 'multipart/related; boundary=' + boundary);

      xhr.onload = function() {
        if (xhr.status === 200) {
          var result = JSON.parse(xhr.responseText);
          var docUrl = 'https://docs.google.com/document/d/' + result.id + '/edit';
          localStorage.setItem('eddie_gdocs_last_id', result.id);
          localStorage.setItem('eddie_gdocs_last_name', result.name);
          self.showLastDoc();
          Eddie.docExport.setStatus('success',
            '&#10003; Updated Google Doc — <a href="' + docUrl + '" target="_blank" ' +
            'style="color:var(--accent);text-decoration:underline;">Open document</a>');
        } else if (xhr.status === 401) {
          self.accessToken = null;
          self.tokenClient.requestAccessToken({ prompt: 'select_account' });
        } else {
          var errMsg = 'Update failed (HTTP ' + xhr.status + ')';
          try { errMsg = JSON.parse(xhr.responseText).error.message; } catch(e) {}
          Eddie.docExport.setStatus('error', errMsg);
        }
      };

      xhr.onerror = function() {
        Eddie.docExport.setStatus('error', 'Network error — could not reach Google Drive.');
      };

      xhr.send(multipartBody);

    } else {
      // Create new document
      Eddie.docExport.setStatus('syncing', 'Creating new Google Doc...');

      var fileName = 'Eddie AI Playbooks — ' +
        new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      var boundary = '---EddieExport' + Date.now();
      var metadata = JSON.stringify({
        name: fileName,
        mimeType: 'application/vnd.google-apps.document'
      });

      var multipartBody =
        '--' + boundary + '\r\n' +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        metadata + '\r\n' +
        '--' + boundary + '\r\n' +
        'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
        html + '\r\n' +
        '--' + boundary + '--';

      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
      xhr.setRequestHeader('Authorization', 'Bearer ' + self.accessToken);
      xhr.setRequestHeader('Content-Type', 'multipart/related; boundary=' + boundary);

      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 201) {
          var result = JSON.parse(xhr.responseText);
          var docUrl = 'https://docs.google.com/document/d/' + result.id + '/edit';
          localStorage.setItem('eddie_gdocs_last_id', result.id);
          localStorage.setItem('eddie_gdocs_last_name', result.name || fileName);
          self.showLastDoc();
          Eddie.docExport.setStatus('success',
            '&#10003; Exported to Google Docs — <a href="' + docUrl + '" target="_blank" ' +
            'style="color:var(--accent);text-decoration:underline;">Open document</a>');
        } else if (xhr.status === 401) {
          self.accessToken = null;
          self.tokenClient.requestAccessToken({ prompt: 'select_account' });
        } else {
          var errMsg = 'Upload failed (HTTP ' + xhr.status + ')';
          try { errMsg = JSON.parse(xhr.responseText).error.message; } catch(e) {}
          Eddie.docExport.setStatus('error', errMsg);
        }
      };

      xhr.onerror = function() {
        Eddie.docExport.setStatus('error', 'Network error — could not reach Google Drive.');
      };

      xhr.send(multipartBody);
    }
  }
};
