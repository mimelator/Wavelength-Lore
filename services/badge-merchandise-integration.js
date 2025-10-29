/**
 * WAVELENGTH BADGE-TO-MERCHANDISE INTEGRATION SERVICE
 * 
 * 🏆 THE ULTIMATE PAYOFF: Converting NPC Quest badges into exclusive merchandise
 * 🎯 REVOLUTIONARY FEATURE: Badge-locked exclusive designs in the merch store
 * 
 * This service bridges the gap between our NPC Quest System and the Liberation Vault
 * merchandise store, proving the tangible value of completing character quests.
 */

const admin = require('firebase-admin');

class BadgeMerchandiseIntegrationService {
  constructor() {
    this.db = admin.database();
  }

  /**
   * Get user's earned badges from NPC Quest system
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of earned badge objects
   */
  async getUserBadges(userId) {
    try {
      console.log(`🏆 Fetching badges for user: ${userId}`);
      
      // Get badges from NPC Quest Engine localStorage simulation in Firebase
      const badgesRef = this.db.ref(`npcQuestEngine/playerStates/${userId}/earnedBadges`);
      const snapshot = await badgesRef.once('value');
      const earnedBadgeIds = snapshot.val() || {};
      
      console.log(`   Found ${Object.keys(earnedBadgeIds).length} earned badges`);
      
      // Convert badge IDs to full badge objects with merchandise unlock data
      const badges = [];
      for (const badgeId of Object.keys(earnedBadgeIds)) {
        const badgeDetails = await this.getBadgeDetails(badgeId);
        if (badgeDetails) {
          badges.push({
            id: badgeId,
            earnedAt: earnedBadgeIds[badgeId].earnedAt || new Date().toISOString(),
            ...badgeDetails
          });
        }
      }
      
      console.log(`   Processed ${badges.length} complete badge objects`);
      return badges;
      
    } catch (error) {
      console.error('❌ Error fetching user badges:', error);
      return [];
    }
  }

  /**
   * Get detailed badge information including merchandise unlock capabilities
   * @param {string} badgeId - Badge identifier
   * @returns {Promise<Object|null>} Badge details with merch unlock data
   */
  async getBadgeDetails(badgeId) {
    try {
      // Badge registry with merchandise unlock specifications
      const badgeRegistry = {
        'alexandria-harmony-student': {
          name: "Alexandria's Harmony Student",
          description: 'Completed Alexandria\'s Harmony Challenge and mastered the secrets of musical harmony',
          image: '/images/badges/alexandria-harmony-student.webp',
          character: 'Alexandria',
          difficulty: 'beginner',
          
          // 🎯 MERCHANDISE UNLOCK SPECIFICATION
          merchUnlock: {
            type: 'exclusive_design',
            category: 'npc_quest_badges',
            
            // Available products that can feature this badge design
            products: [
              { type: 't-shirt', basePrice: 19.99 },
              { type: 'hoodie', basePrice: 39.99 },
              { type: 'coffee-mug', basePrice: 14.99 },
              { type: 'tote-bag', basePrice: 16.99 },
              { type: 'sticker', basePrice: 3.99 },
              { type: 'phone-case', basePrice: 24.99 }
            ],
            
            // Design specifications
            design: {
              id: 'alexandria-harmony-badge-design',
              name: 'Alexandria\'s Harmony Student Badge',
              description: 'Exclusive design featuring Alexandria with musical harmony symbols and the prestigious Harmony Student badge',
              
              // Design assets
              primaryImage: '/images/designs/alexandria-harmony-student-primary.webp',
              badgeOverlay: '/images/badges/alexandria-harmony-student.webp',
              characterImage: '/images/characters/alexandria/alexandria-harmony-teacher.webp',
              
              // Design variations for different products
              variations: {
                'apparel': {
                  placement: 'center-chest',
                  size: 'large',
                  style: 'badge-with-character'
                },
                'drinkware': {
                  placement: 'wrap-around',
                  size: 'medium', 
                  style: 'badge-focused'
                },
                'accessories': {
                  placement: 'center',
                  size: 'full',
                  style: 'minimalist-badge'
                }
              }
            },
            
            // Exclusive features
            exclusivity: {
              onlyForBadgeHolders: true,
              limitedTime: false,
              specialPricing: {
                discount: 15, // 15% off for badge holders
                reason: 'Quest Achievement Reward'
              }
            }
          },
          
          // Quest completion metadata
          questInfo: {
            questId: 'alexandria-harmony-quest',
            completedSteps: ['listen', 'quiz', 'practice'],
            totalSteps: 3,
            character: 'Alexandria'
          }
        },
        
        // Future badge examples for expansion
        'eloquence-wordsmith': {
          name: "Eloquence's Wordsmith",
          description: 'Mastered the art of eloquent expression with Alexandria\'s brother',
          image: '/images/badges/eloquence-wordsmith.webp',
          character: 'Eloquence',
          difficulty: 'intermediate',
          merchUnlock: {
            type: 'exclusive_design',
            category: 'npc_quest_badges',
            products: [
              { type: 'notebook', basePrice: 18.99 },
              { type: 't-shirt', basePrice: 19.99 },
              { type: 'tote-bag', basePrice: 16.99 }
            ],
            design: {
              id: 'eloquence-wordsmith-design',
              name: 'Eloquence\'s Wordsmith Badge',
              description: 'Elegant design celebrating mastery of words and eloquent expression'
            }
          }
        },
        
        'freedom-explorer': {
          name: "Freedom's Explorer",  
          description: 'Embarked on adventures across the Great and Mighty mountains with Freedom',
          image: '/images/badges/freedom-explorer.webp',
          character: 'Freedom',
          difficulty: 'advanced',
          merchUnlock: {
            type: 'exclusive_design',
            category: 'npc_quest_badges',
            products: [
              { type: 'backpack', basePrice: 49.99 },
              { type: 'travel-mug', basePrice: 22.99 },
              { type: 'hoodie', basePrice: 39.99 }
            ],
            design: {
              id: 'freedom-explorer-design',
              name: 'Freedom\'s Explorer Badge',
              description: 'Rugged design featuring mountain landscapes and exploration themes'
            }
          }
        }
      };
      
      return badgeRegistry[badgeId] || null;
      
    } catch (error) {
      console.error(`❌ Error getting badge details for ${badgeId}:`, error);
      return null;
    }
  }

  /**
   * Check if user has access to badge-exclusive merchandise
   * @param {string} userId - User ID
   * @param {string} designId - Design ID to check access for
   * @returns {Promise<Object>} Access result with badge info
   */
  async checkBadgeAccess(userId, designId) {
    try {
      console.log(`🔑 Checking badge access for user ${userId}, design ${designId}`);
      
      const userBadges = await this.getUserBadges(userId);
      
      // Check if any earned badge unlocks this design
      for (const badge of userBadges) {
        if (badge.merchUnlock && badge.merchUnlock.design.id === designId) {
          console.log(`   ✅ Access granted via badge: ${badge.name}`);
          return {
            hasAccess: true,
            badge: badge,
            discount: badge.merchUnlock.exclusivity.specialPricing?.discount || 0,
            reason: `Badge: ${badge.name}`
          };
        }
      }
      
      console.log(`   ❌ No badge access found for design ${designId}`);
      return {
        hasAccess: false,
        badge: null,
        discount: 0,
        reason: 'Badge required'
      };
      
    } catch (error) {
      console.error('❌ Error checking badge access:', error);
      return { hasAccess: false, badge: null, discount: 0, reason: 'Error checking access' };
    }
  }

  /**
   * Get all badge-exclusive merchandise designs available to user
   * @param {string} userId - User ID  
   * @returns {Promise<Array>} Array of available exclusive designs
   */
  async getBadgeExclusiveMerchandise(userId) {
    try {
      console.log(`🛍️ Getting badge-exclusive merchandise for user: ${userId}`);
      
      const userBadges = await this.getUserBadges(userId);
      const exclusiveDesigns = [];
      
      for (const badge of userBadges) {
        if (badge.merchUnlock && badge.merchUnlock.type === 'exclusive_design') {
          
          // Create merchandise entries for each product type
          for (const product of badge.merchUnlock.products) {
            exclusiveDesigns.push({
              id: `${badge.merchUnlock.design.id}-${product.type}`,
              designId: badge.merchUnlock.design.id,
              badgeId: badge.id,
              
              // Product details
              productType: product.type,
              name: `${badge.merchUnlock.design.name} - ${this.formatProductName(product.type)}`,
              description: badge.merchUnlock.design.description,
              
              // Pricing with badge discount
              basePrice: product.basePrice,
              discountPercent: badge.merchUnlock.exclusivity.specialPricing?.discount || 0,
              finalPrice: this.calculateDiscountedPrice(
                product.basePrice, 
                badge.merchUnlock.exclusivity.specialPricing?.discount || 0
              ),
              
              // Design assets
              images: {
                primary: badge.merchUnlock.design.primaryImage,
                badge: badge.merchUnlock.design.badgeOverlay,
                character: badge.merchUnlock.design.characterImage
              },
              
              // Exclusivity info
              exclusiveInfo: {
                badgeName: badge.name,
                earnedAt: badge.earnedAt,
                character: badge.character,
                onlyForBadgeHolders: badge.merchUnlock.exclusivity.onlyForBadgeHolders
              },
              
              // Category for store organization
              category: 'badge_exclusive',
              subcategory: badge.merchUnlock.category
            });
          }
        }
      }
      
      console.log(`   Found ${exclusiveDesigns.length} exclusive merchandise items`);
      return exclusiveDesigns;
      
    } catch (error) {
      console.error('❌ Error getting badge-exclusive merchandise:', error);
      return [];
    }
  }

  /**
   * Simulate awarding a badge to user (for testing)
   * @param {string} userId - User ID
   * @param {string} badgeId - Badge to award
   * @returns {Promise<Object>} Award result
   */
  async awardBadge(userId, badgeId) {
    try {
      console.log(`🏆 Awarding badge ${badgeId} to user ${userId}`);
      
      const badgeDetails = await this.getBadgeDetails(badgeId);
      if (!badgeDetails) {
        throw new Error(`Badge ${badgeId} not found in registry`);
      }
      
      // Store in Firebase (simulating NPC Quest Engine state)
      const badgeRef = this.db.ref(`npcQuestEngine/playerStates/${userId}/earnedBadges/${badgeId}`);
      await badgeRef.set({
        earnedAt: new Date().toISOString(),
        questId: badgeDetails.questInfo?.questId || 'manual-award',
        awardedBy: 'badge-merchandise-integration'
      });
      
      console.log(`   ✅ Badge ${badgeId} awarded successfully`);
      
      return {
        success: true,
        badge: badgeDetails,
        merchUnlocked: badgeDetails.merchUnlock ? badgeDetails.merchUnlock.products.length : 0,
        message: `Congratulations! You've earned the "${badgeDetails.name}" badge and unlocked exclusive merchandise!`
      };
      
    } catch (error) {
      console.error('❌ Error awarding badge:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get badge collection dashboard data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Dashboard data
   */
  async getBadgeCollectionDashboard(userId) {
    try {
      console.log(`📊 Generating badge dashboard for user: ${userId}`);
      
      const userBadges = await this.getUserBadges(userId);
      const exclusiveMerch = await this.getBadgeExclusiveMerchandise(userId);
      
      // Calculate statistics
      const stats = {
        totalBadgesEarned: userBadges.length,
        charactersMet:  [...new Set(userBadges.map(b => b.character))].length,
        exclusiveDesignsUnlocked: [...new Set(exclusiveMerch.map(m => m.designId))].length,
        totalMerchandiseItems: exclusiveMerch.length,
        totalSavingsAvailable: exclusiveMerch.reduce((sum, item) => 
          sum + (item.basePrice - item.finalPrice), 0
        )
      };
      
      // Group merchandise by character
      const merchByCharacter = {};
      exclusiveMerch.forEach(item => {
        const character = item.exclusiveInfo.character;
        if (!merchByCharacter[character]) {
          merchByCharacter[character] = [];
        }
        merchByCharacter[character].push(item);
      });
      
      console.log(`   Dashboard stats: ${stats.totalBadgesEarned} badges, ${stats.exclusiveDesignsUnlocked} exclusive designs`);
      
      return {
        success: true,
        stats: stats,
        badges: userBadges,
        exclusiveMerchandise: exclusiveMerch,
        merchByCharacter: merchByCharacter,
        
        // Call-to-action data for store integration
        ctaData: {
          hasExclusives: exclusiveMerch.length > 0,
          nextBadgeOpportunities: await this.getAvailableQuests(userId),
          totalSavings: `$${stats.totalSavingsAvailable.toFixed(2)}`
        }
      };
      
    } catch (error) {
      console.error('❌ Error generating badge dashboard:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available quests that can earn more badges
   * @param {string} userId - User ID  
   * @returns {Promise<Array>} Available quest opportunities
   */
  async getAvailableQuests(userId) {
    // This would integrate with the NPC Quest Engine to find available quests
    // For now, return static data showing what's possible
    return [
      {
        characterId: 'eloquence',
        questId: 'eloquence-wordsmith-quest', 
        badgeId: 'eloquence-wordsmith',
        title: 'Master the Art of Words with Eloquence',
        difficulty: 'intermediate',
        estimatedTime: '10-15 minutes',
        merchRewards: 3
      },
      {
        characterId: 'freedom',
        questId: 'freedom-explorer-quest',
        badgeId: 'freedom-explorer', 
        title: 'Explore the Great Mountains with Freedom',
        difficulty: 'advanced',
        estimatedTime: '15-20 minutes',
        merchRewards: 3
      }
    ];
  }

  // Helper methods

  formatProductName(productType) {
    const names = {
      't-shirt': 'T-Shirt',
      'hoodie': 'Hoodie',
      'coffee-mug': 'Coffee Mug',
      'tote-bag': 'Tote Bag',
      'sticker': 'Sticker Pack',
      'phone-case': 'Phone Case',
      'notebook': 'Journal',
      'backpack': 'Adventure Backpack',
      'travel-mug': 'Travel Mug'
    };
    return names[productType] || productType;
  }

  calculateDiscountedPrice(basePrice, discountPercent) {
    if (!discountPercent) return basePrice;
    const discount = basePrice * (discountPercent / 100);
    return Math.round((basePrice - discount) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Validate badge-merchandise integration configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateIntegration() {
    try {
      console.log('🔍 Validating badge-merchandise integration...');
      
      const validation = {
        success: true,
        checks: [],
        errors: [],
        warnings: []
      };
      
      // Check Firebase connection
      try {
        await this.db.ref('.info/connected').once('value');
        validation.checks.push('✅ Firebase connection active');
      } catch (error) {
        validation.errors.push('❌ Firebase connection failed');
        validation.success = false;
      }
      
      // Check badge registry
      const testBadge = await this.getBadgeDetails('alexandria-harmony-student');
      if (testBadge && testBadge.merchUnlock) {
        validation.checks.push('✅ Badge registry accessible with merchandise data');
      } else {
        validation.warnings.push('⚠️ Badge registry missing merchandise unlock data');
      }
      
      console.log(`   Validation ${validation.success ? 'passed' : 'failed'}`);
      return validation;
      
    } catch (error) {
      console.error('❌ Integration validation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = BadgeMerchandiseIntegrationService;