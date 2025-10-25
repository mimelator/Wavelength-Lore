#!/bin/bash

# AI Enhancement Dependencies Installation Script
# Run this script to install required packages for AI upscaling functionality

echo "🚀 Installing AI Enhancement Dependencies..."

# Install Sharp for image processing (if not already installed)
echo "📦 Installing Sharp for image processing..."
npm install sharp

# Install AWS SDK v3 for enhanced S3 operations (if not already installed)
echo "☁️ Installing AWS SDK v3..."
npm install @aws-sdk/client-s3

# Install Axios for API calls (if not already installed)
echo "🌐 Installing Axios for API calls..."
npm install axios

# Install Form Data for multipart uploads (if not already installed)
echo "📋 Installing Form Data..."
npm install form-data

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Set up your .env file with the required API keys (see docs/AI_ENHANCEMENT_SETUP.md)"
echo "2. Configure OpenAI API key for artwork enhancement"
echo "3. Configure Replicate API token for photo enhancement"
echo "4. Test the enhancement system at /enhanced-merchandise"
echo ""
echo "🎯 No additional S3 setup needed - uses your existing gallery bucket!"
echo "📁 Enhanced images will be stored in: gallery-bucket/upscaled/userId/"
echo ""
echo "📖 For detailed setup instructions, see: docs/AI_ENHANCEMENT_SETUP.md"
echo ""