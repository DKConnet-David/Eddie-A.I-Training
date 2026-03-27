import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sendMessage as anthropicSendMessage } from '@/lib/anthropicApi.js'
import { useAuthStore } from './auth.js'

export const useChatStore = defineStore('chat', () => {
  // ── State ──

  // Visible messages shown in the chat UI
  const messages = ref([])

  // Conversation history sent to the Anthropic API (role: user | assistant)
  const chatHistory = ref([])

  // Whether a message is currently being sent / awaiting response
  const isSending = ref(false)

  // ── Actions ──

  /**
   * Add a visible message to the chat panel.
   * @param {'user'|'eddie'|'notice'} role
   * @param {string} content
   */
  function addMessage(role, content) {
    messages.value.push({ role, content })
  }

  /**
   * Send a user message, call the Anthropic API, and append the response.
   */
  async function sendMessage(text) {
    if (isSending.value) return
    if (!text.trim()) return

    const authStore = useAuthStore()
    if (!authStore.hasApiKey()) {
      addMessage('notice', 'No API key set. Please enter your Anthropic API key.')
      return
    }

    // Add user message to UI and API history
    addMessage('user', text)
    chatHistory.value.push({ role: 'user', content: text })

    isSending.value = true

    try {
      const response = await anthropicSendMessage(
        authStore.apiKey,
        chatHistory.value,
      )
      addMessage('eddie', response)
      chatHistory.value.push({ role: 'assistant', content: response })
    } catch (err) {
      const errorMsg = err.message || 'Network error — check your connection.'
      addMessage('eddie', '\u26a0 Error: ' + errorMsg)
    } finally {
      isSending.value = false
    }
  }

  /**
   * Load a training scenario: clear chat, set up context, call the API
   * for Eddie's initial response.
   */
  async function loadScenario(scenario) {
    const authStore = useAuthStore()
    if (!authStore.hasApiKey()) {
      addMessage('notice', 'No API key set. Please enter your Anthropic API key.')
      return
    }

    clearChat()
    addMessage('notice', 'Scenario loaded: ' + scenario.title)

    // Show the client's opening message
    addMessage('user', scenario.openingMessage)

    // Build the hidden context for the API
    const setupMsg =
      '[TRAINER SETUP \u2014 not visible to client]: The trainer has loaded a scenario. ' +
      'Context: ' + scenario.context + '. ' +
      "The client's opening message is shown below. Respond as Eddie following the correct playbook.\n\n" +
      scenario.openingMessage

    chatHistory.value = [{ role: 'user', content: setupMsg }]

    isSending.value = true

    try {
      const response = await anthropicSendMessage(
        authStore.apiKey,
        chatHistory.value,
      )
      addMessage('eddie', response)
      chatHistory.value.push({ role: 'assistant', content: response })
    } catch (err) {
      const errorMsg = err.message || 'Network error — check your connection.'
      addMessage('eddie', '\u26a0 Error: ' + errorMsg)
    } finally {
      isSending.value = false
    }
  }

  /**
   * Clear all messages and API history.
   */
  function clearChat() {
    messages.value = []
    chatHistory.value = []
  }

  return {
    // State
    messages,
    chatHistory,
    isSending,

    // Actions
    addMessage,
    sendMessage,
    loadScenario,
    clearChat,
  }
})
