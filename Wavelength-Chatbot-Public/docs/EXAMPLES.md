# Wavelength Chatbot Examples

## Basic Chat Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>Wavelength Chat Demo</title>
    <style>
        .chat-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <h1>Ask about Wavelength Lore!</h1>
        <div id="chat-messages"></div>
        <input type="text" id="chat-input" placeholder="Type your message...">
        <button onclick="sendMessage()">Send</button>
    </div>

    <script src="chat-widget.js"></script>
    <script>
        async function sendMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            try {
                const response = await fetch('YOUR_FIREBASE_FUNCTION_URL/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'YOUR_PUBLIC_API_KEY'
                    },
                    body: JSON.stringify({ message })
                });
                
                const data = await response.json();
                displayMessage('User', message);
                displayMessage('AI', data.response);
                
                input.value = '';
            } catch (error) {
                console.error('Chat error:', error);
                displayMessage('System', 'Sorry, there was an error processing your message.');
            }
        }
        
        function displayMessage(sender, message) {
            const messagesDiv = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    </script>
</body>
</html>
```

## React Integration

```jsx
import React, { useState } from 'react';

function WavelengthChatbot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: 'User', text: input };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await fetch('YOUR_FIREBASE_FUNCTION_URL/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.REACT_APP_CHATBOT_API_KEY
                },
                body: JSON.stringify({ message: input })
            });

            const data = await response.json();
            const aiMessage = { sender: 'AI', text: data.response };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
        }

        setInput('');
    };

    return (
        <div className="chatbot-container">
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index} className="message">
                        <strong>{msg.sender}:</strong> {msg.text}
                    </div>
                ))}
            </div>
            <div className="input-container">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask about Wavelength Lore..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}

export default WavelengthChatbot;
```
