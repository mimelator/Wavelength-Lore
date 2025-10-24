/**
 * Test User Validator
 * 
 * Validates users and prevents production data pollution during testing
 */

class TestUserValidator {
  constructor() {
    this.testUserIds = new Set([
      'test-super-admin-001',
      'test-admin-001', 
      'test-moderator-001',
      'test-trusted-user-001',
      'test-verified-user-001',
      'test-user-001',
      'vendor-preview', // System user for vendor previews
      'system-test',    // System test user
      'regression-test' // Regression test user
    ]);
    
    this.testEmailDomains = new Set([
      'wavelength.test',
      'test.local',
      'example.com'
    ]);
  }

  /**
   * Check if a user ID is a test user
   */
  isTestUser(userId) {
    if (!userId || typeof userId !== 'string') {
      return false;
    }
    
    return this.testUserIds.has(userId) || 
           userId.startsWith('test-') ||
           userId.includes('test') ||
           userId === 'vendor-preview';
  }

  /**
   * Check if an email is a test email
   */
  isTestEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const domain = email.split('@')[1];
    return this.testEmailDomains.has(domain) || email.includes('test');
  }

  /**
   * Validate user for product creation
   */
  async validateUserForProductCreation(userId, options = {}) {
    const validation = {
      valid: false,
      isTestUser: false,
      shouldUseTestDatabase: false,
      errors: [],
      warnings: []
    };

    // Check if user ID is provided
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      validation.errors.push('Invalid userId: must be a non-empty string');
      return validation;
    }

    // Check if it's a test user
    validation.isTestUser = this.isTestUser(userId);
    
    // In test mode, only allow test users
    if (options.testMode && !validation.isTestUser) {
      validation.errors.push(`Non-test user ${userId} not allowed in test mode`);
      return validation;
    }

    // In production mode, validate real users more strictly
    if (!options.testMode && !validation.isTestUser) {
      // Real users must have valid format (Firebase UID format)
      if (!this.isValidFirebaseUID(userId)) {
        validation.errors.push(`Invalid user ID format: ${userId}. Must be a valid Firebase UID or test user.`);
        return validation;
      }
      
      // Check if user exists in Firebase Auth (optional but recommended)
      if (options.validateUserExists) {
        try {
          const admin = require('firebase-admin');
          await admin.auth().getUser(userId);
          validation.warnings.push('User exists in Firebase Auth');
        } catch (error) {
          validation.errors.push(`User ${userId} not found in Firebase Auth`);
          return validation;
        }
      }
    }

    // In production mode, warn about test users
    if (!options.testMode && validation.isTestUser) {
      validation.warnings.push(`Test user ${userId} creating products in production mode`);
      validation.shouldUseTestDatabase = true;
    }

    validation.valid = validation.errors.length === 0;
    return validation;
  }

  /**
   * Check if a user ID has valid Firebase UID format
   */
  isValidFirebaseUID(userId) {
    // Firebase UIDs are typically 28 characters long and alphanumeric
    // But can vary, so we'll use a more lenient check
    if (userId.length < 10 || userId.length > 128) {
      return false;
    }
    
    // Should not contain spaces or special characters except hyphens and underscores
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(userId);
  }

  /**
   * Get test database prefix for isolation
   */
  getTestDatabasePrefix(userId) {
    if (this.isTestUser(userId)) {
      return 'test_';
    }
    return '';
  }

  /**
   * Create a test user ID for regression tests
   */
  createRegressionTestUserId() {
    return `regression-test-${Date.now()}`;
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(merchandiseDB) {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Get all vendor previews
      const previews = await merchandiseDB.getAllVendorPreviews();
      
      let cleaned = 0;
      for (const preview of previews) {
        if (preview.createdBy && this.isTestUser(preview.createdBy)) {
          await merchandiseDB.deleteVendorPreview(preview.cacheKey);
          cleaned++;
        }
      }
      
      console.log(`✅ Cleaned up ${cleaned} test vendor previews`);
      return { success: true, cleaned };
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TestUserValidator();