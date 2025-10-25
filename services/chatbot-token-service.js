/**
 * JWT Chatbot Token Service
 * Generates secure JWT tokens for VIP+ chatbot access
 */

const jwt = require('jsonwebtoken');
const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');

class ChatbotTokenService {
  constructor() {
    // Use a secure JWT secret from environment or generate one
    this.jwtSecret = process.env.CHATBOT_JWT_SECRET || 'wavelength-vip-chatbot-secret-2025';
    
    // VIP+ membership levels that get chatbot access
    this.vipLevels = ['vip', 'content_manager', 'moderator', 'admin', 'super_admin'];
    
    console.log('🎵 Chatbot Token Service initialized for VIP+ members');
  }

  /**
   * Check if user has VIP+ access
   * @param {Array} userGroups - User's group memberships
   * @returns {boolean} - Whether user has VIP+ access
   */
  hasVipAccess(userGroups) {
    if (!Array.isArray(userGroups)) return false;
    return userGroups.some(group => this.vipLevels.includes(group));
  }

  /**
   * Get the highest membership level
   * @param {Array} userGroups - User's group memberships
   * @returns {string} - Highest membership level
   */
  getHighestMembershipLevel(userGroups) {
    if (!Array.isArray(userGroups)) return 'guest';
    
    // Order by hierarchy (highest first)
    const hierarchy = ['super_admin', 'admin', 'moderator', 'content_manager', 'vip', 'trusted_user', 'verified_user', 'user'];
    
    for (const level of hierarchy) {
      if (userGroups.includes(level)) {
        return level;
      }
    }
    
    return 'user';
  }

  /**
   * Generate chatbot access token for VIP+ user
   * @param {Object} user - Firebase user object
   * @param {Array} userGroups - User's group memberships
   * @param {Object} additionalData - Additional user data
   * @returns {string|null} - JWT token or null if not VIP+
   */
  async generateChatbotToken(user, userGroups, additionalData = {}) {
    try {
      // Check if user has VIP+ access
      if (!this.hasVipAccess(userGroups)) {
        console.log(`🚫 Chatbot access denied: ${user.email} - Not VIP+`);
        return null;
      }

      const membershipLevel = this.getHighestMembershipLevel(userGroups);
      
      // Create token payload
      const tokenPayload = {
        sub: user.uid,                    // User ID
        username: user.displayName || user.email?.split('@')[0] || 'VIP Member',
        email: user.email,
        membershipLevel: membershipLevel,
        groups: userGroups,
        iss: 'wavelengthlore.com',       // Issuer
        aud: 'wavelength-chatbot',       // Audience
        iat: Math.floor(Date.now() / 1000),  // Issued at
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours expiry
        ...additionalData
      };

      // Generate JWT token
      const token = jwt.sign(tokenPayload, this.jwtSecret, { algorithm: 'HS256' });
      
      console.log(`🎵 Chatbot token generated: ${user.email} (${membershipLevel})`);
      
      return token;
    } catch (error) {
      console.error('JWT token generation error:', error);
      return null;
    }
  }

  /**
   * Validate and decode chatbot token
   * @param {string} token - JWT token to validate
   * @returns {Object|null} - Decoded token payload or null if invalid
   */
  validateChatbotToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'wavelengthlore.com',
        audience: 'wavelength-chatbot',
        algorithms: ['HS256']
      });

      // Check if token is for VIP+ user
      if (!this.hasVipAccess(decoded.groups)) {
        console.warn(`🚫 Token validation failed: User no longer VIP+ - ${decoded.email}`);
        return null;
      }

      return decoded;
    } catch (error) {
      console.warn('JWT token validation failed:', error.message);
      return null;
    }
  }

  /**
   * Refresh token if it's close to expiry
   * @param {string} token - Current JWT token
   * @param {Object} user - Updated user object
   * @param {Array} userGroups - Updated user groups
   * @returns {string|null} - New token or null if refresh not needed/failed
   */
  async refreshTokenIfNeeded(token, user, userGroups) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return null;

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      
      // Refresh if token expires in less than 2 hours
      if (timeUntilExpiry < 2 * 60 * 60) {
        console.log(`🔄 Refreshing chatbot token for ${user.email}`);
        return await this.generateChatbotToken(user, userGroups);
      }

      return null; // No refresh needed
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Get membership level display name
   * @param {string} level - Membership level
   * @returns {string} - Display name
   */
  getMembershipDisplayName(level) {
    const displayNames = {
      'super_admin': 'Super Admin',
      'admin': 'Administrator',
      'moderator': 'Moderator',
      'content_manager': 'Content Manager',
      'vip': 'VIP Member',
      'trusted_user': 'Trusted User',
      'verified_user': 'Verified User',
      'user': 'Member'
    };
    
    return displayNames[level] || 'Member';
  }

  /**
   * Get chatbot access level based on membership
   * @param {string} level - Membership level
   * @returns {Object} - Access configuration
   */
  getChatbotAccessLevel(level) {
    const accessLevels = {
      'super_admin': { 
        requestsPerHour: 1000, 
        features: ['admin_chat', 'priority_support', 'advanced_features', 'system_queries'] 
      },
      'admin': { 
        requestsPerHour: 500, 
        features: ['admin_chat', 'priority_support', 'advanced_features'] 
      },
      'moderator': { 
        requestsPerHour: 300, 
        features: ['mod_chat', 'priority_support', 'advanced_features'] 
      },
      'content_manager': { 
        requestsPerHour: 200, 
        features: ['content_chat', 'priority_support', 'advanced_features'] 
      },
      'vip': { 
        requestsPerHour: 100, 
        features: ['vip_chat', 'priority_support'] 
      }
    };
    
    return accessLevels[level] || accessLevels['vip'];
  }
}

// Export singleton instance
module.exports = new ChatbotTokenService();