#!/usr/bin/env node

/**
 * WAVELENGTH Merchandise Card Fix Code Validator
 * 
 * This validator checks that all three UX fixes are properly implemented in the code:
 * 1. Button overflow prevention (CSS max-width constraint)
 * 2. Card compactness (reduced padding and sizing)
 * 3. Provider text improvements (user-friendly labels)
 */

const fs = require('fs');
const path = require('path');

function validateMerchandiseCardFixesInCode() {
  console.log('🌊 WAVELENGTH: Validating merchandise card fixes in source code...\n');
  
  const results = {
    buttonOverflowFix: false,
    cardCompactnessFix: false,
    providerTextFix: false,
    details: []
  };
  
  try {
    // 1. Check CSS for button overflow fix
    console.log('🔲 Checking button overflow fix in CSS...');
    const cssPath = path.join(__dirname, '..', 'static', 'css', 'merchandise-store.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    const buttonSelectCssMatch = cssContent.match(/\.product-select-btn\s*\{[^}]*max-width:\s*140px[^}]*\}/s);
    if (buttonSelectCssMatch) {
      results.buttonOverflowFix = true;
      results.details.push('✅ Button overflow fix: .product-select-btn has max-width: 140px');
      console.log('   ✅ Found .product-select-btn with max-width: 140px');
    } else {
      results.details.push('❌ Button overflow fix: .product-select-btn max-width not found');
      console.log('   ❌ .product-select-btn max-width constraint not found');
    }
    
    // 2. Check CSS for card compactness fix
    console.log('\n📏 Checking card compactness fix in CSS...');
    const productItemMatch = cssContent.match(/\.product-item\s*\{[^}]*padding:\s*15px[^}]*max-width:\s*450px[^}]*\}/s);
    if (productItemMatch) {
      results.cardCompactnessFix = true;
      results.details.push('✅ Card compactness fix: .product-item has padding: 15px and max-width: 450px');
      console.log('   ✅ Found .product-item with compact dimensions');
    } else {
      // Check for individual pieces
      const paddingMatch = cssContent.includes('padding: 15px');
      const maxWidthMatch = cssContent.includes('max-width: 450px');
      
      if (paddingMatch && maxWidthMatch) {
        results.cardCompactnessFix = true;
        results.details.push('✅ Card compactness fix: Found padding and max-width settings');
        console.log('   ✅ Found compact padding and max-width settings');
      } else {
        results.details.push(`❌ Card compactness fix: Missing padding (${paddingMatch}) or max-width (${maxWidthMatch})`);
        console.log(`   ❌ Missing compact settings - padding: ${paddingMatch}, max-width: ${maxWidthMatch}`);
      }
    }
    
    // 3. Check JavaScript for provider text fix
    console.log('\n🏷️ Checking provider text fix in JavaScript...');
    const jsPath = path.join(__dirname, '..', 'static', 'js', 'components', 'merchandise-store.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    const providerFunctionMatch = jsContent.includes('getUserFriendlyProvider') && 
                                 jsContent.includes('MWW On Demand') &&
                                 jsContent.includes('Print-on-Demand');
    
    if (providerFunctionMatch) {
      results.providerTextFix = true;
      results.details.push('✅ Provider text fix: getUserFriendlyProvider function converts "MWW On Demand" to "Print-on-Demand"');
      console.log('   ✅ Found getUserFriendlyProvider function with proper mappings');
    } else {
      results.details.push('❌ Provider text fix: getUserFriendlyProvider function not found or incomplete');
      console.log('   ❌ getUserFriendlyProvider function missing or incomplete');
    }
    
    // Additional validation: Check if the function is actually used
    const functionUsageMatch = jsContent.includes('this.getUserFriendlyProvider(product.provider)');
    if (functionUsageMatch) {
      results.details.push('✅ Provider text fix: Function is properly integrated in product rendering');
      console.log('   ✅ Function is properly integrated in product rendering');
    } else {
      results.details.push('⚠️ Provider text fix: Function may not be properly integrated');
      console.log('   ⚠️ Function usage in product rendering not found');
    }
    
  } catch (error) {
    console.error('❌ Error reading source files:', error.message);
    results.details.push(`❌ Error reading source files: ${error.message}`);
  }
  
  // Print comprehensive results
  console.log('\n📊 MERCHANDISE CARD FIX CODE VALIDATION RESULTS:');
  console.log('════════════════════════════════════════════════════');
  
  const fixesImplemented = Object.values(results).slice(0, 3).filter(Boolean).length;
  console.log(`\n🎯 Overall Implementation Status: ${fixesImplemented}/3 fixes implemented`);
  
  console.log('\n📋 Detailed Results:');
  results.details.forEach(detail => console.log(`   ${detail}`));
  
  console.log('\n🔍 Fix Status Summary:');
  console.log(`   🔲 Button Overflow Prevention: ${results.buttonOverflowFix ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
  console.log(`   📏 Card Compactness: ${results.cardCompactnessFix ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
  console.log(`   🏷️ Provider Text Improvements: ${results.providerTextFix ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
  
  if (fixesImplemented === 3) {
    console.log('\n🎉 SUCCESS: All merchandise card UX fixes are properly implemented in the code!');
    console.log('\n🚀 Ready for production - the fixes should resolve:');
    console.log('   • "Select this Product button drifts over the side of the card"');
    console.log('   • "Cards are too large we could compact them a bit"');
    console.log('   • "MWW on Demand text I don\'t understand as an end user"');
  } else {
    console.log('\n⚠️ Some fixes are missing - please review the implementation');
  }
  
  return results;
}

// Run the validation
if (require.main === module) {
  validateMerchandiseCardFixesInCode();
}

module.exports = { validateMerchandiseCardFixesInCode };