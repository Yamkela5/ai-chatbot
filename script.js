// Chatbot JavaScript with Google Gemini API Integration - Full Screen Layout

class ChatBot {
    constructor() {
        this.chatBox = document.getElementById('chat-box');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.apiKey = ''; // Users will need to add their own API key
        // Updated API URL to use the current Gemini model
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

        // Auto-resize textarea
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

        // Check if API key is set
        if (!this.apiKey) {
            this.showMessage('Please add your Google Gemini API key first! Check the instructions above.', 'bot', true);
            return;
        }

        // Show user message
        this.showMessage(message, 'user');
        this.userInput.value = '';
        this.autoResizeTextarea();
        
        // Disable send button and show loading
        this.toggleSendButton(false);
        this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(message);
            this.removeTypingIndicator();
            this.showMessage(response, 'bot');
        } catch (error) {
            this.removeTypingIndicator();
            let errorMessage = 'Sorry, I encountered an error. Please try again later.';
            
            // Provide more specific error messages
            if (error.message.includes('403')) {
                errorMessage = 'API key is invalid or has insufficient permissions. Please check your API key.';
            } else if (error.message.includes('429')) {
                errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
            } else if (error.message.includes('404')) {
                errorMessage = 'API endpoint not found. Please check if your API key is valid.';
            }
            
            this.showMessage(errorMessage, 'bot', true);
            console.error('API Error:', error);
        } finally {
            this.toggleSendButton(true);
        }
    }

    async callGeminiAPI(message) {
        const requestBody = {
            contents: [{
                parts: [{
                    text: message
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
            return "I can't provide a response to that request due to safety guidelines. Please try rephrasing your question.";
        } else {
            throw new Error('Invalid response format from API');
        }
    }

    showMessage(text, sender, isError = false) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${sender}-container`;
        
        const avatar = sender === 'user' ? '👤' : '🤖';
        const avatarClass = sender === 'user' ? 'user-avatar' : 'bot-avatar';
        
        // Format the text for better display
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
        // Basic formatting for better readability
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
            .replace(/\n\n/g, '</p><p>') // Paragraphs
            .replace(/\n/g, '<br>') // Line breaks
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>') // Code blocks
            .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
            .replace(/^/, '<p>') // Start paragraph
            .replace(/$/, '</p>'); // End paragraph
    }

    showTypingIndicator() {
        const typingContainer = document.createElement('div');
        typingContainer.className = 'typing-indicator';
        typingContainer.id = 'typing-indicator';
        typingContainer.innerHTML = `
            <div class="typing-content">
                <div class="avatar bot-avatar">🤖</div>
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
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

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Focus input with Ctrl/Cmd + K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('user-input').focus();
    }
});
