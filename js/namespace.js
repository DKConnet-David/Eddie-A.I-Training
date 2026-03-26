window.Eddie = {
  playbooks: {},
  playbookOrder: ['master', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'rules'],
  state: {
    activeTab: 'playbooks',
    activePlaybook: 'master',
    chatHistory: [],
    isSending: false
  },
  config: {
    API_URL: 'https://api.anthropic.com/v1/messages',
    MODEL: 'claude-sonnet-4-20250514',
    MAX_TOKENS: 1000
  },
  ui: {},
  api: {},
  storage: {},
  router: {},
  chat: {},
  docSync: {},
  scenarios: {}
};
