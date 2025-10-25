/**
 * VIP Chatbot Access Routes - Step by step build
 */

const express = require('express');
const router = express.Router();
const { requireGroup } = require('../middleware/groupAuth');
const { vipChatbotAccess, getChatbotAccess } = require('../middleware/chatbot-auth');

// VIP+ groups that get chatbot access
const VIP_GROUPS = ['vip', 'content_manager', 'moderator', 'admin', 'super_admin'];

// Test the requireGroup middleware first
router.get('/test-auth', requireGroup(VIP_GROUPS), (req, res) => {
  res.json({
    message: 'VIP authentication test successful',
    user: req.user?.email || 'unknown',
    groups: req.userGroups || []
  });
});

// Test requireGroup + vipChatbotAccess middleware
router.get('/test-chatbot', requireGroup(VIP_GROUPS), vipChatbotAccess, (req, res) => {
  res.json({
    message: 'VIP chatbot middleware test successful',
    hasToken: !!req.chatbotToken,
    accessLevel: req.chatbotAccess
  });
});

// Test the exact same pattern as the original failing route
router.get('/access', 
  requireGroup(VIP_GROUPS), 
  vipChatbotAccess, 
  getChatbotAccess
);

// Simple status route
router.get('/status', (req, res) => {
  res.json({
    service: 'Wavelength VIP Chatbot',
    status: 'operational',
    vipRequired: true
  });
});

module.exports = router;