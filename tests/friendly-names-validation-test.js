/**
 * Test: Friendly Names Implementation Validation
 * 
 * This test validates that blueprint and provider IDs are correctly
 * converted to human-readable friendly names throughout the system.
 */

const { describe, it, beforeEach } = require('mocha');
const { expect } = require('chai');

describe('Friendly Names Implementation', function() {
  let friendlyNames;
  
  beforeEach(function() {
    // Clear module cache to ensure fresh imports
    delete require.cache[require.resolve('../utils/printify-friendly-names')];
    friendlyNames = require('../utils/printify-friendly-names');
  });

  describe('Blueprint Name Mappings', function() {
    it('should return friendly names for known blueprint IDs', function() {
      expect(friendlyNames.getBlueprintName(5)).to.equal('Premium T-Shirt (Unisex Cotton Crew)');
      expect(friendlyNames.getBlueprintName(146)).to.equal('Pullover Hoodie');
      expect(friendlyNames.getBlueprintName(17)).to.equal('Ceramic Mug (11oz)');
    });

    it('should return fallback for unknown blueprint IDs', function() {
      expect(friendlyNames.getBlueprintName(9999)).to.equal('Blueprint 9999');
    });

    it('should handle string blueprint IDs', function() {
      expect(friendlyNames.getBlueprintName('5')).to.equal('Premium T-Shirt (Unisex Cotton Crew)');
    });
  });

  describe('Provider Name Mappings', function() {
    it('should return friendly names for known provider IDs', function() {
      expect(friendlyNames.getProviderName(1)).to.equal('Printful (Global)');
      expect(friendlyNames.getProviderName(3)).to.equal('OTTO Print Solutions (USA)');
      expect(friendlyNames.getProviderName(7)).to.equal('Gooten (USA)');
    });

    it('should return fallback for unknown provider IDs', function() {
      expect(friendlyNames.getProviderName(9999)).to.equal('Provider 9999');
    });

    it('should handle string provider IDs', function() {
      expect(friendlyNames.getProviderName('3')).to.equal('OTTO Print Solutions (USA)');
    });
  });

  describe('Provider Location Mappings', function() {
    it('should return locations for known provider IDs', function() {
      expect(friendlyNames.getProviderLocation(1)).to.equal('Global (USA, EU, etc.)');
      expect(friendlyNames.getProviderLocation(3)).to.equal('North Carolina, USA');
    });

    it('should return unknown location for unknown provider IDs', function() {
      expect(friendlyNames.getProviderLocation(9999)).to.equal('Unknown Location');
    });
  });

  describe('Provider Ratings', function() {
    it('should return ratings for known provider IDs', function() {
      const ratings = friendlyNames.getProviderRatings(3);
      expect(ratings).to.have.property('quality');
      expect(ratings).to.have.property('cost');
      expect(ratings).to.have.property('speed');
      expect(ratings).to.have.property('reliability');
      expect(ratings.quality).to.be.a('number');
    });

    it('should return default ratings for unknown provider IDs', function() {
      const ratings = friendlyNames.getProviderRatings(9999);
      expect(ratings.quality).to.equal(3.5);
      expect(ratings.cost).to.equal(3.5);
    });
  });

  describe('Comprehensive Provider Info', function() {
    it('should return complete provider information', function() {
      const info = friendlyNames.getProviderInfo(3);
      expect(info).to.have.property('id', 3);
      expect(info).to.have.property('name', 'OTTO Print Solutions (USA)');
      expect(info).to.have.property('location', 'North Carolina, USA');
      expect(info).to.have.property('ratings');
      expect(info).to.have.property('overallRating');
      expect(info.overallRating).to.be.a('string');
    });
  });

  describe('Blueprint Categorization', function() {
    it('should correctly categorize blueprint types', function() {
      expect(friendlyNames.categorizeBlueprintById(5)).to.equal('T-Shirts');
      expect(friendlyNames.categorizeBlueprintById(146)).to.equal('Hoodies & Sweatshirts');
      expect(friendlyNames.categorizeBlueprintById(17)).to.equal('Mugs');
      expect(friendlyNames.categorizeBlueprintById(7)).to.equal('Posters');
      expect(friendlyNames.categorizeBlueprintById(9999)).to.equal('Other');
    });
  });

  describe('Formatted Display Information', function() {
    it('should return formatted display info for blueprint and provider', function() {
      const display = friendlyNames.formatProviderBlueprintDisplay(5, 3);
      
      expect(display).to.have.property('blueprint');
      expect(display.blueprint).to.have.property('display', 'Premium T-Shirt (Unisex Cotton Crew)');
      expect(display.blueprint).to.have.property('category', 'T-Shirts');
      expect(display.blueprint).to.have.property('id', 5);
      
      expect(display).to.have.property('provider');
      expect(display.provider).to.have.property('display', 'OTTO Print Solutions (USA)');
      expect(display.provider).to.have.property('location', 'North Carolina, USA');
      expect(display.provider).to.have.property('id', 3);
      
      expect(display).to.have.property('combination');
      expect(display.combination).to.include('Premium T-Shirt');
      expect(display.combination).to.include('OTTO Print Solutions');
    });
  });

  describe('Edge Cases', function() {
    it('should handle null and undefined values gracefully', function() {
      expect(friendlyNames.getBlueprintName(null)).to.equal('Blueprint 0');
      expect(friendlyNames.getProviderName(undefined)).to.equal('Provider 0');
    });

    it('should handle empty strings', function() {
      expect(friendlyNames.getBlueprintName('')).to.equal('Blueprint 0');
      expect(friendlyNames.getProviderName('')).to.equal('Provider 0');
    });
  });
});

module.exports = {
  testName: 'Friendly Names Implementation Validation',
  description: 'Validates that blueprint and provider IDs are correctly converted to friendly names',
  category: 'User Experience',
  priority: 'HIGH',
  runTest: async function() {
    const friendlyNames = require('../utils/printify-friendly-names');
    
    console.log('🔍 TESTING: Friendly Names Implementation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Test common blueprint/provider combinations
    const testCombinations = [
      { blueprintId: 5, providerId: 3, expectedBlueprint: 'Premium T-Shirt', expectedProvider: 'OTTO Print' },
      { blueprintId: 146, providerId: 1, expectedBlueprint: 'Pullover Hoodie', expectedProvider: 'Printful' },
      { blueprintId: 17, providerId: 7, expectedBlueprint: 'Ceramic Mug', expectedProvider: 'Gooten' }
    ];
    
    let allPassed = true;
    
    for (const combo of testCombinations) {
      try {
        const display = friendlyNames.formatProviderBlueprintDisplay(combo.blueprintId, combo.providerId);
        
        console.log(`\n📋 Testing: Blueprint ${combo.blueprintId} + Provider ${combo.providerId}`);
        console.log(`   Blueprint: ${display.blueprint.display}`);
        console.log(`   Provider: ${display.provider.display}`);
        console.log(`   Location: ${display.provider.location}`);
        console.log(`   Rating: ${display.provider.rating}/5.0`);
        
        // Validate friendly names contain expected keywords
        const blueprintMatch = display.blueprint.display.toLowerCase().includes(combo.expectedBlueprint.toLowerCase());
        const providerMatch = display.provider.display.toLowerCase().includes(combo.expectedProvider.toLowerCase());
        
        if (blueprintMatch && providerMatch) {
          console.log(`   ✅ PASS: Friendly names correctly generated`);
        } else {
          console.log(`   ❌ FAIL: Expected keywords not found`);
          allPassed = false;
        }
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        allPassed = false;
      }
    }
    
    // Test fallback behavior
    console.log(`\n🔧 Testing fallback behavior for unknown IDs:`);
    const unknownDisplay = friendlyNames.formatProviderBlueprintDisplay(9999, 8888);
    console.log(`   Unknown Blueprint: ${unknownDisplay.blueprint.display}`);
    console.log(`   Unknown Provider: ${unknownDisplay.provider.display}`);
    
    if (unknownDisplay.blueprint.display.includes('Blueprint 9999') && 
        unknownDisplay.provider.display.includes('Provider 8888')) {
      console.log(`   ✅ PASS: Fallback behavior works correctly`);
    } else {
      console.log(`   ❌ FAIL: Fallback behavior not working`);
      allPassed = false;
    }
    
    console.log(`\n📊 RESULTS:`);
    if (allPassed) {
      console.log(`✅ All friendly name tests passed`);
      console.log(`📈 Blueprint and Provider IDs are now displayed with human-readable names`);
      console.log(`🎯 User experience significantly improved`);
    } else {
      console.log(`❌ Some friendly name tests failed`);
      console.log(`🔧 Review friendly name mappings and implementation`);
    }
    
    return {
      success: allPassed,
      message: allPassed ? 'Friendly names implementation validated successfully' : 'Friendly names implementation needs fixes',
      details: {
        testCombinations: testCombinations.length,
        friendlyNamesActive: true,
        fallbackTested: true
      }
    };
  }
};