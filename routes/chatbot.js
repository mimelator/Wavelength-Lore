const express = require('express');
const router = express.Router();
const { requireGroup } = require('../middleware/groupAuth');
const { vipChatbotAccess, validateChatbotToken, getChatbotAccess, refreshChatbotToken } = require('../middleware/chatbot-auth');

const VIP_GROUPS = ['vip', 'content_manager', 'moderator', 'admin', 'super_admin'];

router.get('/access', 
  requireGroup(VIP_GROUPS), 
  vipChatbotAccess, 
  getChatbotAccess
);

router.post('/refresh-token',
  requireGroup(VIP_GROUPS),
  refreshChatbotToken
);

router.get('/widget', 
  requireGroup(VIP_GROUPS), 
  vipChatbotAccess, 
  (req, res) => {
    try {
      const chatbotConfig = {
        token: req.chatbotToken,
        membershipLevel: req.chatbotAccess.membershipLevel,
        accessLevel: req.chatbotAccess.accessLevel,
        user: {
          username: req.user.displayName || req.user.email?.split('@')[0] || 'VIP Member',
          email: req.user.email
        },
        apiEndpoint: process.env.CHATBOT_API_URL || 'https://ai-wavelengthlore.web.app',
        theme: 'vip-wavelength',
        features: req.chatbotAccess.accessLevel.features
      };

      res.render('chatbot/vip-widget', {
        title: 'VIP AI Assistant - Wavelength Lore',
        chatbotConfig: JSON.stringify(chatbotConfig),
        user: req.user,
        membershipLevel: req.chatbotAccess.membershipLevel,
        currentPage: 'chatbot',
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Games', url: '/games' },
          { name: 'VIP AI Assistant', url: '/chatbot/widget' }
        ],
        cdnUrl: process.env.CDN_URL
      });
    } catch (error) {
      console.error('Chatbot widget error:', error);
      res.status(500).render('error', {
        title: 'Chatbot Error',
        message: 'Unable to load VIP chatbot. Please try again later.',
        error: { status: 500 }
      });
    }
  }
);

router.get('/status', (req, res) => {
  res.json({
    service: 'Wavelength VIP Chatbot',
    status: 'operational',
    vipRequired: true,
    membershipLevels: ['VIP', 'Content Manager', 'Moderator', 'Administrator', 'Super Admin']
  });
});

module.exports = router;