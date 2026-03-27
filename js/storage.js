// Storage helpers — API key in sessionStorage, playbook edits in localStorage

Eddie.storage = {
  getApiKey: function() {
    return sessionStorage.getItem('eddie_api_key') || '';
  },

  setApiKey: function(key) {
    sessionStorage.setItem('eddie_api_key', key);
  },

  hasApiKey: function() {
    return !!sessionStorage.getItem('eddie_api_key');
  },

  // Custom playbook persistence
  getCustomPlaybooks: function() {
    try {
      return JSON.parse(localStorage.getItem('eddie_custom_playbooks') || '{}');
    } catch(e) { return {}; }
  },

  saveCustomPlaybooks: function(data) {
    localStorage.setItem('eddie_custom_playbooks', JSON.stringify(data));
  },

  // Playbook overrides (edits to built-in playbooks)
  getPlaybookOverrides: function() {
    try {
      return JSON.parse(localStorage.getItem('eddie_playbook_overrides') || '{}');
    } catch(e) { return {}; }
  },

  savePlaybookOverride: function(id, data) {
    var overrides = this.getPlaybookOverrides();
    overrides[id] = data;
    localStorage.setItem('eddie_playbook_overrides', JSON.stringify(overrides));
  },

  removePlaybookOverride: function(id) {
    var overrides = this.getPlaybookOverrides();
    delete overrides[id];
    localStorage.setItem('eddie_playbook_overrides', JSON.stringify(overrides));
  },

  getDocSyncUrl: function() {
    return localStorage.getItem('eddie_docsync_url') || 'https://docs.google.com/document/u/4/d/e/2PACX-1vQzylg-6X0BiU20Z-NGaXh9HsEMJNGImwalcHHE2pNCMd-DgqeSs9C4ZltiXsoBYVLnzq_P9G6K3U30/pub';
  },

  setDocSyncUrl: function(url) {
    localStorage.setItem('eddie_docsync_url', url);
  },

  getGoogleClientId: function() {
    return localStorage.getItem('eddie_google_client_id') || '';
  },

  setGoogleClientId: function(id) {
    localStorage.setItem('eddie_google_client_id', id);
  }
};
