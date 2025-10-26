#!/bin/bash

echo "🚀 Running Merchandise Test Suite"
echo "=================================="

echo ""
echo "📋 MERCH TESTS"
echo "node tests/merchandise/product-customization-modal.test.js"
node tests/merchandise/product-customization-modal.test.js

echo ""
echo "node tests/merchandise/product-card-actions.test"
node tests/merchandise/product-card-actions.test

echo ""
echo "📋 GALLERY INTEGRATION TESTS"
echo "node tests/gallery/merchandise-gallery-integration.test"
node tests/gallery/merchandise-gallery-integration.test

echo ""
echo "node tests/gallery/user-gallery-functionality.test.js"
node tests/gallery/user-gallery-functionality.test.js

echo ""
echo "📋 PRODUCT TITLE TESTS"
echo "node tests/product-name-prettification.test.js"
node tests/product-name-prettification.test.js

echo ""
echo "node tests/merchandise/product-title-generation.test.js"
node tests/merchandise/product-title-generation.test.js

echo ""
echo "✅ Merchandise test suite complete!"