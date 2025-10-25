# Wavelength Chatbot - Public Setup Guide

## 🚀 Quick Start

### 1. Installation
```bash
npm install @wavelength/chatbot-widget
```

### 2. Basic Usage
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <!-- Your content -->
    
    <!-- Wavelength Chatbot Widget -->
    <script src="path/to/chat-widget.js"></script>
    <script>
        // Initialize chatbot
        WavelengthChat.init({
            apiUrl: 'YOUR_FIREBASE_FUNCTION_URL',
            apiKey: 'YOUR_PUBLIC_API_KEY',
            theme: 'light'
        });
    </script>
</body>
</html>
```

### 3. Configuration

Configure your chatbot by replacing placeholder values:

- `YOUR_FIREBASE_FUNCTION_URL`: Your Firebase Functions endpoint
- `YOUR_PUBLIC_API_KEY`: Your public API key for authentication

## 🔒 Security

- Never commit API keys to version control
- Use environment variables for configuration
- Implement proper CORS settings
- Follow authentication best practices

## 📚 More Information

- [API Documentation](API.md)
- [Examples](EXAMPLES.md)
- [Security Guide](SECURITY.md)
