#!/usr/bin/env node

/**
 * Test the corrected enrichVariantsWithImages function
 * Simulates the Printify API response structure with variant_ids array
 */

const PrintifyService = require('./services/printify-service.js');

async function testVariantEnrichment() {
  console.log('🧪 Testing Variant Enrichment Function\n');
  console.log('═════════════════════════════════════════════\n');

  const printifyService = new PrintifyService();

  // Mock Printify API response structure based on actual test logs
  // Images have variant_ids arrays, not options
  const mockVariants = [
    {
      id: 1001,
      title: 'Black / S',
      options: [
        { id: 'color', value: 'Black' },
        { id: 'size', value: 'S' }
      ],
      price: 1999
    },
    {
      id: 1002,
      title: 'Black / M',
      options: [
        { id: 'color', value: 'Black' },
        { id: 'size', value: 'M' }
      ],
      price: 1999
    },
    {
      id: 1003,
      title: 'Red / S',
      options: [
        { id: 'color', value: 'Red' },
        { id: 'size', value: 'S' }
      ],
      price: 2199
    },
    {
      id: 1004,
      title: 'Red / M',
      options: [
        { id: 'color', value: 'Red' },
        { id: 'size', value: 'M' }
      ],
      price: 2199
    }
  ];

  const mockImages = [
    {
      // Image 1 applies to Black S and M variants
      variant_ids: [1001, 1002],
      src: 'https://printify.s3.amazonaws.com/image1-black.jpg',  // src, NOT url
      position: 'front',
      is_default: true
    },
    {
      // Image 2 applies to Red S and M variants
      variant_ids: [1003, 1004],
      src: 'https://printify.s3.amazonaws.com/image2-red.jpg',   // src, NOT url
      position: 'front',
      is_default: false
    }
  ];

  console.log('📊 INPUT DATA:');
  console.log(`   Variants: ${mockVariants.length}`);
  mockVariants.forEach((v, i) => {
    console.log(`     ${i + 1}. ID ${v.id}: "${v.title}"`);
  });

  console.log(`\n   Images: ${mockImages.length}`);
  mockImages.forEach((img, i) => {
    console.log(`     ${i + 1}. Variant IDs: [${img.variant_ids.join(', ')}] → ${img.src}`);
  });

  console.log('\n🔄 RUNNING ENRICHMENT...\n');

  // Call the enrichment function
  const enrichedVariants = printifyService.enrichVariantsWithImages(mockVariants, mockImages);

  console.log('\n📋 ENRICHMENT RESULTS:\n');

  enrichedVariants.forEach((variant, index) => {
    console.log(`Variant ${index + 1}: ${variant.title}`);
    console.log(`  ID: ${variant.id}`);

    if (variant.image) {
      console.log(`  ✅ Image: ${variant.image.url}`);
      console.log(`     Position: ${variant.image.position}`);
    } else {
      console.log(`  ❌ No image attached`);
    }
    console.log();
  });

  // Verify the results
  console.log('✅ VERIFICATION:\n');

  let passCount = 0;
  let failCount = 0;

  // Check variant 1001 has image
  if (enrichedVariants[0].image?.url === 'https://printify.s3.amazonaws.com/image1-black.jpg') {
    console.log('✅ Variant 1001 (Black/S) has correct image');
    passCount++;
  } else {
    console.log('❌ Variant 1001 (Black/S) has wrong or missing image');
    failCount++;
  }

  // Check variant 1002 has image
  if (enrichedVariants[1].image?.url === 'https://printify.s3.amazonaws.com/image1-black.jpg') {
    console.log('✅ Variant 1002 (Black/M) has correct image');
    passCount++;
  } else {
    console.log('❌ Variant 1002 (Black/M) has wrong or missing image');
    failCount++;
  }

  // Check variant 1003 has image
  if (enrichedVariants[2].image?.url === 'https://printify.s3.amazonaws.com/image2-red.jpg') {
    console.log('✅ Variant 1003 (Red/S) has correct image');
    passCount++;
  } else {
    console.log('❌ Variant 1003 (Red/S) has wrong or missing image');
    failCount++;
  }

  // Check variant 1004 has image
  if (enrichedVariants[3].image?.url === 'https://printify.s3.amazonaws.com/image2-red.jpg') {
    console.log('✅ Variant 1004 (Red/M) has correct image');
    passCount++;
  } else {
    console.log('❌ Variant 1004 (Red/M) has wrong or missing image');
    failCount++;
  }

  // Check no undefined values
  let hasUndefinedValues = false;
  enrichedVariants.forEach((v, i) => {
    if (v.image?.url === undefined) {
      console.log(`❌ Variant ${i} has undefined image.url`);
      hasUndefinedValues = true;
      failCount++;
    }
  });

  if (!hasUndefinedValues) {
    console.log('✅ No undefined values in enriched variants');
    passCount++;
  }

  console.log(`\n═════════════════════════════════════════════`);
  console.log(`📊 FINAL RESULT: ${passCount} PASS, ${failCount} FAIL`);

  if (failCount === 0) {
    console.log('🎉 ALL TESTS PASSED! Enrichment function working correctly.\n');
    process.exit(0);
  } else {
    console.log('🚨 SOME TESTS FAILED! Check the enrichment function.\n');
    process.exit(1);
  }
}

testVariantEnrichment().catch(error => {
  console.error('💥 Test error:', error.message);
  process.exit(1);
});
