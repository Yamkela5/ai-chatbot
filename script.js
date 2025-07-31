class ChatBot {
    constructor() {
        this.chatBox = document.getElementById('chat-box');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.apiKey = 'AIzaSyDPGWdHD0l6zOeDpenjfDTAoMfsaiyYiro';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
        this.init();
    }

    init() {
        this.showWelcomeMessage();
        this.bindEvents();
        this.checkApiKey();
    }

    bindEvents() {
        this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        this.userInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
    }

    autoResizeTextarea() {
        this.userInput.style.height = 'auto';
        this.userInput.style.height = Math.min(this.userInput.scrollHeight, 200) + 'px';
    }

    checkApiKey() {
        if (!this.apiKey) {
            this.showApiKeyMessage();
        }
    }

    showWelcomeMessage() {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <h4>🤖 Welcome to AI Chatbot</h4>
            <p>I'm powered by Google Gemini AI. I can help you with questions, creative writing, coding, analysis, and much more!</p>
            <small>To get started, you'll need to add your free Google Gemini API key.</small>
        `;
        this.chatBox.appendChild(welcomeDiv);
    }

    showApiKeyMessage() {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container bot-container';
        messageContainer.innerHTML = `
            <div class="message-content">
                <div class="avatar bot-avatar">🔑</div>
                <div class="message-text">
                    <div class="api-key-message">
                        <h4>🔑 API Key Required</h4>
                        <p>To use this chatbot, please follow these steps:</p>
                        <ol>
                            <li>Go to <a href="https://aistudio.google.com/" target="_blank">Google AI Studio</a></li>
                            <li>Create a free account and generate an API key</li>
                            <li>Copy your API key and paste it in the script.js file where it says <code>apiKey = ''</code></li>
                            <li>Refresh this page</li>
                        </ol>
                        <small>Don't worry - it's completely free! 🎉</small>
                    </div>
                </div>
            </div>
        `;
        this.chatBox.appendChild(messageContainer);
        this.scrollToBottom();
    }

    async handleSendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        if (!this.apiKey) {
            this.showMessage('Please add your Google Gemini API key first! Check the instructions above.', 'bot', true);
            return;
        }

        this.showMessage(message, 'user');
        this.userInput.value = '';
        this.autoResizeTextarea();

        this.toggleSendButton(false);
        this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(message);
            this.removeTypingIndicator();
            this.showMessage(response, 'bot');
        } catch (error) {
            this.removeTypingIndicator();
            let errorMessage = 'Sorry, I encountered an error. Please try again later.';
            if (error.message.includes('403')) {
                errorMessage = 'API key is invalid or has insufficient permissions. Please check your API key.';
            } else if (error.message.includes('429')) {
                errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
            } else if (error.message.includes('404')) {
                errorMessage = 'API endpoint not found. Please check if your API key is valid.';
            } else if (error.message.includes('503')) {
                errorMessage = 'The AI service is overloaded. Please try again in a few moments.';
            }
            this.showMessage(errorMessage, 'bot', true);
            console.error('API Error:', error);
        } finally {
            this.toggleSendButton(true);
        }
    }

    async callGeminiAPI(message, retries = 3, delay = 2000) {
        const requestBody = {
            contents: [{
                parts: [{ text: message }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
        };

        for (let attempt = 0; attempt < retries; attempt++) {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    return data.candidates[0].content.parts[0].text;
                } else if (data.candidates?.[0]?.finishReason === 'SAFETY') {
                    return "I can't respond to that request due to safety guidelines. Please rephrase your question.";
                } else {
                    throw new Error('Invalid response format from API');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = `API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`;
                if (response.status === 503 && attempt < retries - 1) {
                    console.warn(`Retrying after 503 error... Attempt ${attempt + 1}/${retries}`);
                    await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
                } else {
                    throw new Error(errorMessage);
                }
            }
        }

        throw new Error('API request failed after multiple retries');
    }

    showMessage(text, sender, isError = false) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${sender}-container`;
        const avatar = sender === 'user' ? '👤' : '🤖';
        const avatarClass = sender === 'user' ? 'user-avatar' : 'bot-avatar';
        const formattedText = this.formatMessage(text);
        messageContainer.innerHTML = `
            <div class="message-content">
                <div class="avatar ${avatarClass}">${avatar}</div>
                <div class="message-text ${isError ? 'error-message' : ''}">${formattedText}</div>
            </div>
        `;
        this.chatBox.appendChild(messageContainer);
        this.scrollToBottom();
    }

    formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    showTypingIndicator() {
        const typingContainer = document.createElement('div');
        typingContainer.className = 'typing-indicator';
        typingContainer.id = 'typing-indicator';
        typingContainer.innerHTML = `
            <div class="typing-content">
                <div class="avatar bot-avatar">🤖</div>
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        this.chatBox.appendChild(typingContainer);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    toggleSendButton(enabled) {
        this.sendBtn.disabled = !enabled;
        const icon = this.sendBtn.querySelector('i');
        if (enabled) {
            icon.className = 'fas fa-paper-plane';
            icon.classList.remove('loading');
        } else {
            icon.className = 'fas fa-spinner loading';
        }
    }

    scrollToBottom() {
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});

// Keyboard shortcut to focus input
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('user-input').focus();
    }
});
