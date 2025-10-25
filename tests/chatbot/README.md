# 🔐 SSO Chatbot Test Suite

Automated testing suite for validating chatbot functionality in production SSO environment.

## 🚀 Quick Start

```bash
# Run with visible browser (recommended for first run)
node tests/chatbot/sso-chatbot-test.js --visible

# Run in headless mode (automated CI/CD)
node tests/chatbot/sso-chatbot-test.js

# Run against specific URL
node tests/chatbot/sso-chatbot-test.js --url https://wavelengthlore.com --visible

# Run with custom timeout
node tests/chatbot/sso-chatbot-test.js --timeout 45000 --visible
```

## 🔧 Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `--visible` | Run browser in visible mode (not headless) | `false` |
| `--url <url>` | Target URL for testing | `https://wavelengthlore.com` |
| `--timeout <ms>` | Timeout for page operations | `30000` |

## 🧪 What This Tests

### 1. **SSO Authentication Flow**
- ✅ Automatic login detection and handling
- ✅ SSO redirect management 
- ✅ Session authentication verification
- ✅ Manual authentication support (visible mode)

### 2. **Chatbot Interface Detection**
- ✅ Multiple chat interface patterns
- ✅ Chat widget discovery
- ✅ Input field identification
- ✅ Send button functionality

### 3. **Chat Functionality**
- ✅ Message sending capability
- ✅ Response reception and parsing
- ✅ Response quality validation
- ✅ Keyword relevance checking

### 4. **Response Quality Metrics**
- **Length Validation** (substantial responses)
- **Keyword Matching** (context-relevant content)
- **Error Detection** (no error indicators)
- **Helpful Content** (Wavelength-specific information)

## 📊 Test Scenarios

The suite runs 5 comprehensive test scenarios:

1. **General Universe Question**: "Hello! Can you tell me about the Wavelength universe?"
2. **Character Inquiry**: "Who are the main characters in Wavelength?"
3. **Season Information**: "What happened in Season 1?"
4. **Lore Request**: "Tell me about the lore of this universe."
5. **Help Request**: "Can you help me understand the story?"

## 🎯 Success Criteria

Each test is scored on a 100-point scale:
- **Response Length** (20 points): Substantial, helpful responses
- **Keyword Relevance** (40 points): Context-appropriate content
- **Error-Free** (20 points): No error indicators in response
- **Helpful Content** (20 points): Wavelength-specific information

**Passing Score**: 40+ points with no critical issues

## 🔍 Authentication Handling

### Automatic Detection:
- Looks for existing authentication sessions
- Detects login buttons and forms
- Handles SSO redirects automatically

### Manual Authentication Support:
When using `--visible` mode:
1. Browser opens visibly
2. If login required, script pauses
3. Complete authentication manually
4. Press Enter to continue testing

### Session Management:
- Maintains authentication state throughout test
- Handles cookie persistence
- Validates session before each test

## 📈 Report Generation

After test completion, generates:
- **Console Summary**: Pass/fail overview with scores
- **JSON Report**: Detailed results saved to file
- **Test Metrics**: Success rates and performance data
- **Issue Identification**: Specific problems and recommendations

## 🛠️ Troubleshooting

### Common Issues:

**Authentication Problems:**
```bash
# Run in visible mode to debug login
node tests/chatbot/sso-chatbot-test.js --visible
```

**Timeout Issues:**
```bash
# Increase timeout for slow networks
node tests/chatbot/sso-chatbot-test.js --timeout 60000
```

**Chat Interface Not Found:**
- Check if chatbot widget is properly loaded
- Verify authentication is working
- Look for JavaScript errors in browser console

### Debug Mode:
The script provides detailed logging:
- 🔍 Network requests to chat APIs
- 🖥️ Browser console messages
- 📍 Navigation and element detection
- 💬 Chat message exchanges

## 🎁 Example Output

```
🚀 Starting SSO Chatbot Test Suite
════════════════════════════════════
🔧 Initializing SSO Chatbot Test Suite...
✅ Browser initialized successfully

🔐 Starting SSO Authentication Flow...
  📍 Navigating to wavelengthlore.com...
  ✅ Already authenticated - skipping login

💬 Testing Chatbot Functionality...
  📍 Navigating to chatbot interface...
  ✅ Found chat interface: .chat-widget

  🧪 Running Chat Response Tests...

  Test 1: "Hello! Can you tell me about the Wavelength universe?"
    💬 Sent: "Hello! Can you tell me about the Wavelength universe?"
    🤖 Response: "Welcome to Wavelength! The Wavelength universe is a rich sci-fi world..."

✅ TEST REPORT SUMMARY
═══════════════════════════════════
📊 Total Tests: 5
✅ Passed: 4
❌ Failed: 1
📈 Success Rate: 80%

🎉 Chatbot is working correctly with minor issues!
```

## 🔒 Security & Privacy

- No credentials stored in code
- Session data cleared after tests
- Browser data isolated per test run
- Network requests logged for debugging only

---

**Ready to validate your production chatbot with complex SSO authentication!** 🚀