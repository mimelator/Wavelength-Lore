/**
 * VIP Chatbot Access Middleware
 * Generates JWT tokens for VIP+ members
 */

const chatbotTokenService = require('../services/chatbot-token-service');

/**
 * Middleware to check VIP status and generate chatbot token
 */
const vipChatbotAccess = async (req, res, next) => {
  try {
    // User should be authenticated by this point
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required for chatbot access',
        hasAccess: false 
      });
    }

    // Get user groups from request (set by groupAuth middleware)
    const userGroups = req.userGroups || [];
    
    // Check if user has VIP+ access
    const hasVipAccess = chatbotTokenService.hasVipAccess(userGroups);
    
    if (!hasVipAccess) {
      return res.status(403).json({
        error: 'VIP+ membership required for chatbot access',
        hasAccess: false,
        membershipLevel: chatbotTokenService.getHighestMembershipLevel(userGroups),
        upgradeRequired: true
      });
    }

    // Generate chatbot token for VIP+ user
    const chatbotToken = await chatbotTokenService.generateChatbotToken(
      req.user, 
      userGroups,
      {
        sessionId: req.sessionID,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    if (!chatbotToken) {
      return res.status(500).json({
        error: 'Failed to generate chatbot access token',
        hasAccess: false
      });
    }

    // Add chatbot info to request
    req.chatbotToken = chatbotToken;
    req.chatbotAccess = {
      hasAccess: true,
      membershipLevel: chatbotTokenService.getHighestMembershipLevel(userGroups),
      accessLevel: chatbotTokenService.getChatbotAccessLevel(chatbotTokenService.getHighestMembershipLevel(userGroups))
    };

    next();
  } catch (error) {
    console.error('VIP chatbot access middleware error:', error);
    res.status(500).json({
      error: 'Internal server error checking chatbot access',
      hasAccess: false
    });
  }
};

/**
 * Middleware to validate existing chatbot token
 */
const validateChatbotToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.query.token || 
                  req.body.token;

    if (!token) {
      return res.status(401).json({
        error: 'Chatbot access token required',
        authenticated: false
      });
    }

    // Validate token
    const decoded = chatbotTokenService.validateChatbotToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid or expired chatbot token',
        authenticated: false
      });
    }

    // Add decoded token info to request
    req.chatbotUser = decoded;
    req.chatbotAccess = {
      hasAccess: true,
      membershipLevel: decoded.membershipLevel,
      accessLevel: chatbotTokenService.getChatbotAccessLevel(decoded.membershipLevel)
    };

    next();
  } catch (error) {
    console.error('Chatbot token validation error:', error);
    res.status(500).json({
      error: 'Error validating chatbot token',
      authenticated: false
    });
  }
};

/**
 * Route handler to get chatbot access info
 */
const getChatbotAccess = async (req, res) => {
  try {
    const response = {
      hasAccess: req.chatbotAccess?.hasAccess || false,
      membershipLevel: req.chatbotAccess?.membershipLevel || 'guest',
      membershipDisplay: chatbotTokenService.getMembershipDisplayName(req.chatbotAccess?.membershipLevel || 'guest'),
      accessLevel: req.chatbotAccess?.accessLevel || null,
      token: req.chatbotToken || null,
      user: {
        username: req.user?.displayName || req.user?.email?.split('@')[0] || 'VIP Member',
        email: req.user?.email
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get chatbot access error:', error);
    res.status(500).json({
      error: 'Error retrieving chatbot access info',
      hasAccess: false
    });
  }
};

/**
 * Route handler to refresh chatbot token
 */
const refreshChatbotToken = async (req, res) => {
  try {
    if (!req.user || !req.userGroups) {
      return res.status(401).json({
        error: 'Authentication required',
        success: false
      });
    }

    const currentToken = req.headers.authorization?.replace('Bearer ', '') || req.body.currentToken;
    
    // Try to refresh token
    const newToken = await chatbotTokenService.refreshTokenIfNeeded(
      currentToken,
      req.user,
      req.userGroups
    );

    if (newToken) {
      res.json({
        success: true,
        newToken: newToken,
        message: 'Token refreshed successfully'
      });
    } else {
      res.json({
        success: true,
        message: 'Token refresh not needed'
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Error refreshing token',
      success: false
    });
  }
};

module.exports = {
  vipChatbotAccess,
  validateChatbotToken,
  getChatbotAccess,
  refreshChatbotToken
};