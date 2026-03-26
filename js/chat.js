// Chat UI: message rendering, input handling

Eddie.chat = {
  init: function() {
    var input = document.getElementById('chat-input');
    var sendBtn = document.getElementById('send-btn');

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        Eddie.chat.send();
      }
    });

    // Auto-resize textarea
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    sendBtn.addEventListener('click', function() {
      Eddie.chat.send();
    });
  },

  send: function() {
    if (Eddie.state.isSending) return;

    var input = document.getElementById('chat-input');
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';

    this.addMessage('user', text);
    Eddie.state.chatHistory.push({ role: 'user', content: text });

    this.showTyping();
    Eddie.state.isSending = true;
    document.getElementById('send-btn').disabled = true;

    Eddie.api.sendMessage(
      Eddie.state.chatHistory,
      function(response) {
        Eddie.chat.hideTyping();
        Eddie.chat.addMessage('eddie', response);
        Eddie.state.chatHistory.push({ role: 'assistant', content: response });
        Eddie.state.isSending = false;
        document.getElementById('send-btn').disabled = false;
      },
      function(error) {
        Eddie.chat.hideTyping();
        Eddie.chat.addMessage('eddie', '⚠ Error: ' + error);
        Eddie.state.isSending = false;
        document.getElementById('send-btn').disabled = false;
      }
    );
  },

  addMessage: function(role, text) {
    var container = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'chat-msg ' + role;

    var meta = document.createElement('div');
    meta.className = 'chat-meta';
    meta.textContent = role === 'eddie' ? 'Eddie · assistant' : 'You (trainer)';

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = this.formatText(text);

    div.appendChild(meta);
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  addNotice: function(text) {
    var container = document.getElementById('chat-messages');
    var div = document.createElement('div');
    div.className = 'chat-notice';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  clearChat: function() {
    document.getElementById('chat-messages').innerHTML = '';
    Eddie.state.chatHistory = [];
  },

  showTyping: function() {
    var container = document.getElementById('chat-messages');
    var existing = container.querySelector('.typing-indicator');
    if (existing) return;

    var div = document.createElement('div');
    div.className = 'typing-indicator';
    div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  hideTyping: function() {
    var indicator = document.querySelector('.typing-indicator');
    if (indicator) indicator.remove();
  },

  formatText: function(text) {
    // Basic markdown-ish formatting
    var html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:var(--row-alt);padding:1px 5px;border-radius:4px;font-size:12px;border:1px solid var(--card-border)">$1</code>')
      .replace(/\[Step:([^\]]+)\]/g, '<span class="tag tag-blue" style="margin-top:8px;display:inline-block">[Step:$1]</span>')
      .replace(/\n/g, '<br>');
    return html;
  },

  loadScenario: function(scenario) {
    this.clearChat();
    this.addNotice('Scenario loaded: ' + scenario.title);

    // Show client opening message
    var clientMsg = scenario.openingMessage;
    this.addMessage('user', clientMsg);

    // Build the hidden context message
    var setupMsg = '[TRAINER SETUP — not visible to client]: The trainer has loaded a scenario. ' +
      'Context: ' + scenario.context + '. ' +
      'The client\'s opening message is shown below. Respond as Eddie following the correct playbook.\n\n' +
      clientMsg;

    Eddie.state.chatHistory = [{ role: 'user', content: setupMsg }];

    this.showTyping();
    Eddie.state.isSending = true;
    document.getElementById('send-btn').disabled = true;

    Eddie.api.sendMessage(
      Eddie.state.chatHistory,
      function(response) {
        Eddie.chat.hideTyping();
        Eddie.chat.addMessage('eddie', response);
        Eddie.state.chatHistory.push({ role: 'assistant', content: response });
        Eddie.state.isSending = false;
        document.getElementById('send-btn').disabled = false;
      },
      function(error) {
        Eddie.chat.hideTyping();
        Eddie.chat.addMessage('eddie', '⚠ Error: ' + error);
        Eddie.state.isSending = false;
        document.getElementById('send-btn').disabled = false;
      }
    );
  }
};
