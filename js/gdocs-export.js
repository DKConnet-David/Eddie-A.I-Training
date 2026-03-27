// Google Docs export — uploads playbook HTML to Google Drive as a native Google Doc

Eddie.gdocsExport = {
  accessToken: null,
  tokenClient: null,

  init: function() {
    var btn = document.getElementById('docsync-gdocs-btn');
    if (btn) {
      btn.addEventListener('click', function() { Eddie.gdocsExport.startExport(); });
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
      'Make sure the Google Drive API is enabled and your origin is in Authorized JavaScript Origins.'
    );
    if (clientId && clientId.trim()) {
      Eddie.storage.setGoogleClientId(clientId.trim());
      return clientId.trim();
    }
    return null;
  },

  // Initialize the Google token client (GIS)
  initTokenClient: function(clientId) {
    if (this.tokenClient) return;

    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
      Eddie.docExport.setStatus('error', 'Google Identity Services not loaded. Check your internet connection.');
      return;
    }

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: function(response) {
        if (response.error) {
          Eddie.docExport.setStatus('error', 'Auth failed: ' + response.error);
          return;
        }
        Eddie.gdocsExport.accessToken = response.access_token;
        Eddie.gdocsExport.uploadToGoogleDocs();
      }
    });
  },

  startExport: function() {
    var clientId = this.ensureClientId();
    if (!clientId) {
      Eddie.docExport.setStatus('error', 'Google Client ID is required.');
      return;
    }

    Eddie.docExport.setStatus('syncing', 'Authenticating with Google...');
    this.initTokenClient(clientId);

    if (!this.tokenClient) return;

    // If we already have a token, try to use it; otherwise request one
    if (this.accessToken) {
      this.uploadToGoogleDocs();
    } else {
      this.tokenClient.requestAccessToken({ prompt: '' });
    }
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
    Eddie.docExport.setStatus('syncing', 'Uploading to Google Docs...');

    var html = this.buildDocHtml();
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
    xhr.setRequestHeader('Authorization', 'Bearer ' + this.accessToken);
    xhr.setRequestHeader('Content-Type', 'multipart/related; boundary=' + boundary);

    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 201) {
        var result = JSON.parse(xhr.responseText);
        var docUrl = 'https://docs.google.com/document/d/' + result.id + '/edit';
        Eddie.docExport.setStatus('success',
          '&#10003; Exported to Google Docs — <a href="' + docUrl + '" target="_blank" ' +
          'style="color:var(--accent);text-decoration:underline;">Open document</a>');
      } else if (xhr.status === 401) {
        // Token expired — clear and retry
        Eddie.gdocsExport.accessToken = null;
        Eddie.gdocsExport.tokenClient.requestAccessToken({ prompt: '' });
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
};
