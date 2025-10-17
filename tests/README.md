# Wavelength Lore Test Suite

This directory contains all test files for the Wavelength Lore application, organized by functionality and purpose.

## 🧪 Test Categories

### 🔒 Security Tests
- **`test-firebase-security.js`** - Firebase security rules validation
- **`test-rate-limiting.js`** - Rate limiting functionality testing
- **`test-input-sanitization.js`** - Input sanitization and XSS protection

### 🎮 Feature Tests
- **`test-character-system.js`** - Character reference system testing
- **`test-character-keywords.js`** - Character keyword linking validation
- **`test-episode-linking.js`** - Episode linking functionality
- **`test-episode-keywords.js`** - Episode keyword system testing
- **`test-lore-system.js`** - Lore management system validation

### 🔗 Integration Tests
- **`test-api-simple.js`** - Simple API endpoint testing
- **`final-test.js`** - Comprehensive system integration tests
- **`real-test.js`** - Real-world scenario testing

### 🔥 Firebase Tests
- **`test-firebase-lore.js`** - Firebase lore data validation
- **`test-firebase-videos.js`** - Firebase video data testing

### ⚡ Quick Tests
- **`quick-episode-test.js`** - Fast episode functionality verification
- **`quick-rate-limit-test.js`** - Quick rate limiting validation

## 🚀 Running Tests

### Using the Test Runner (Recommended)

```bash
# Run all tests
node tests/test-runner.js

# Run specific category
node tests/test-runner.js security
node tests/test-runner.js features
node tests/test-runner.js integration

# Run specific test file
node tests/test-runner.js test-input-sanitization.js

# Show help and available tests
node tests/test-runner.js --help
```

### Running Individual Tests

```bash
# Navigate to tests directory
cd tests

# Run any individual test
node test-input-sanitization.js
node test-rate-limiting.js
node test-character-system.js
```

## 📋 Test Requirements

### Environment Setup
All tests have been configured to work from the `tests/` directory with proper path references:
- **Config files**: `.env` loaded from parent directory
- **Helper modules**: Imported from `../helpers/`
- **Service accounts**: Firebase keys loaded from parent directory

### Prerequisites
1. **Server Running**: Some tests require the application server to be running on `localhost:3001`
2. **Firebase Access**: Firebase tests require valid credentials and database access
3. **AWS Configuration**: Backup tests require AWS S3 credentials (optional)

### Test Dependencies
- All tests use relative paths to project files
- Environment variables loaded from `../.env`
- Firebase service account key from `../firebaseServiceAccountKey.json`
- Helper modules from `../helpers/` directory

## 📊 Test Output

### Success Indicators
- ✅ **PASS** - Test completed successfully
- 📈 **Success Rate** - Percentage of passing tests
- 🎉 **All tests passed** - Complete success message

### Failure Indicators
- ❌ **FAIL** - Test failed with error details
- 💥 **Error Details** - Specific failure reasons
- 🔧 **Troubleshooting** - Suggestions for fixing issues

## 🔧 Troubleshooting

### Common Issues

1. **Server Not Running**
   ```bash
   # Start the application server
   node index.js
   # Then run tests that require server
   ```

2. **Missing Environment Variables**
   ```bash
   # Ensure .env file exists in project root
   cp .env.example .env
   # Configure required variables
   ```

3. **Firebase Access Issues**
   ```bash
   # Verify firebaseServiceAccountKey.json exists
   # Check Firebase project permissions
   # Validate environment variables
   ```

4. **Path Issues**
   ```bash
   # Always run tests from the tests/ directory
   cd tests
   node test-runner.js
   ```

### Test-Specific Troubleshooting

- **Security Tests**: Require valid Firebase credentials and deployed security rules
- **API Tests**: Need running server with all middleware configured
- **Integration Tests**: May need database seeding or specific test data

## 📈 Adding New Tests

### File Naming Convention
- Use descriptive names: `test-feature-name.js`
- Follow existing patterns for consistency
- Include category prefix when appropriate

### Template Structure
```javascript
/**
 * Test Description
 * Purpose and scope of the test
 */

// Load dependencies with correct paths
require('dotenv').config({ path: '../.env' });
const helper = require('../helpers/helper-name');

// Test implementation
async function testFeature() {
  console.log('🧪 Testing feature...');
  // Test logic here
}

// Export for test runner
if (require.main === module) {
  testFeature().catch(console.error);
}

module.exports = testFeature;
```

### Path Guidelines
- **Config files**: `require('dotenv').config({ path: '../.env' })`
- **Helper modules**: `require('../helpers/module-name')`
- **Service accounts**: `require('../firebaseServiceAccountKey.json')`
- **Local modules**: `require('./other-test-file')` (same directory)

## 🏆 Best Practices

1. **Isolation**: Each test should be independent and not depend on others
2. **Cleanup**: Clean up any test data or state changes
3. **Error Handling**: Include comprehensive error handling and reporting
4. **Documentation**: Document test purpose and expected behavior
5. **Performance**: Keep tests efficient and avoid unnecessary delays

## 📚 Related Documentation

- [Security Enhancement Guide](../docs/SECURITY_ENHANCEMENT_GUIDE.md)
- [Backup Configuration](../docs/BACKUP_CONFIGURATION.md)
- [Rate Limiting Documentation](../docs/RATE_LIMITING_DOCUMENTATION.md)

---

*Run `node test-runner.js --help` for complete usage information.*