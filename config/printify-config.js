/**
 * Printify API Configuration and Constants
 * 
 * Configuration for integrating with Printify's Print-on-Demand API
 * to enable custom merchandise creation from user gallery images.
 * 
 * API Documentation: https://developers.printify.com/
 */

const PrintifyConfig = {
  // API Configuration
  api: {
    // Base URL for Printify API
    baseUrl: process.env.PRINTIFY_API_URL || 'https://api.printify.com',
    
    // API Version
    version: 'v1',
    
    // API Token (store in environment variables)
    token: process.env.PRINTIFY_API_TOKEN,
    
    // Shop ID (your Printify shop)
    shopId: process.env.PRINTIFY_SHOP_ID,
    
    // Rate limiting (requests per minute)
    rateLimit: 120
  },
  
  // Product Configuration
  products: {
    // Initial product to offer - Premium T-Shirt
    initial: {
      // Blueprint ID for premium t-shirts
      blueprintId: 5, // Premium T-Shirt blueprint
      
      // Print Provider ID (recommended providers)
      printProviderId: 3, // OTTO Print Solutions (high quality)
      
      // Available sizes and variants
      variants: [
        { id: 17887, title: 'S / Black', size: 'S', color: 'Black' },
        { id: 17888, title: 'M / Black', size: 'M', color: 'Black' },
        { id: 17889, title: 'L / Black', size: 'L', color: 'Black' },
        { id: 17890, title: 'XL / Black', size: 'XL', color: 'Black' },
        { id: 17891, title: 'XXL / Black', size: 'XXL', color: 'XXL' },
        { id: 17892, title: 'S / White', size: 'S', color: 'White' },
        { id: 17893, title: 'M / White', size: 'M', color: 'White' },
        { id: 17894, title: 'L / White', size: 'L', color: 'White' },
        { id: 17895, title: 'XL / White', size: 'XL', color: 'White' },
        { id: 17896, title: 'XXL / White', size: 'XXL', color: 'White' }
      ],
      
      // Default pricing (in cents)
      pricing: {
        base: 1299, // $12.99 base cost
        markup: 800, // $8.00 markup
        total: 2099  // $20.99 final price
      }
    }
  },
  
  // Image Processing
  imageProcessing: {
    // Minimum image dimensions for print quality
    minWidth: 1200,
    minHeight: 1200,
    
    // Maximum file size (in bytes)
    maxFileSize: 50 * 1024 * 1024, // 50MB
    
    // Supported formats
    supportedFormats: ['PNG', 'JPG', 'JPEG', 'WEBP'],
    
    // DPI requirements
    minDpi: 150,
    recommendedDpi: 300,
    
    // Print area dimensions (in pixels at 300 DPI)
    printArea: {
      width: 3000,  // 10 inches at 300 DPI
      height: 3600  // 12 inches at 300 DPI
    }
  },
  
  // Order Management
  orders: {
    // Webhook endpoint for order updates
    webhookUrl: process.env.PRINTIFY_WEBHOOK_URL || `${process.env.BASE_URL}/api/printify/webhook`,
    
    // Order statuses to track
    statusFlow: [
      'draft',
      'pending',
      'processing', 
      'shipped',
      'delivered',
      'cancelled'
    ],
    
    // Auto-publish orders (set to false for manual review)
    autoPublish: process.env.NODE_ENV === 'production',
    
    // Order timeout (in hours)
    timeoutHours: 24
  },
  
  // Shipping Configuration
  shipping: {
    // Default shipping method
    defaultMethod: 'standard',
    
    // Available shipping methods
    methods: {
      standard: {
        name: 'Standard Shipping',
        description: '5-7 business days',
        price: 499 // $4.99
      },
      express: {
        name: 'Express Shipping', 
        description: '2-3 business days',
        price: 999 // $9.99
      }
    }
  },
  
  // Store Integration
  store: {
    // Store name
    name: 'Wavelength Merchandise',
    
    // Store description
    description: 'Custom merchandise featuring your favorite Wavelength Lore moments',
    
    // Currency
    currency: 'USD',
    
    // Tax configuration (varies by location)
    taxRate: 0.08, // 8% default tax rate
    
    // Return policy
    returnPolicy: {
      enabled: true,
      days: 30,
      description: '30-day return policy for defective items'
    }
  },
  
  // Payment Processing
  payment: {
    // Payment processor (integrate with existing system)
    processor: 'stripe', // or 'paypal'
    
    // Currency
    currency: 'USD',
    
    // Processing fee (in cents)
    processingFee: 30, // $0.30 + 2.9%
    processingRate: 0.029,
    
    // Payout schedule
    payoutSchedule: 'weekly'
  },
  
  // User Experience
  userExperience: {
    // Product customization options
    customization: {
      // Allow text overlay
      allowText: true,
      
      // Allow image positioning
      allowPositioning: true,
      
      // Allow image scaling
      allowScaling: true,
      
      // Preview generation
      generatePreviews: true
    },
    
    // Cart functionality
    cart: {
      // Cart timeout (in minutes)
      timeout: 30,
      
      // Maximum items per cart
      maxItems: 10,
      
      // Save cart across sessions
      persistent: true
    }
  },
  
  // Error Handling
  errors: {
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    
    // Common error messages
    messages: {
      imageQuality: 'Image resolution too low for high-quality printing. Please use an image with at least 1200x1200 pixels.',
      fileSize: 'Image file too large. Please use an image smaller than 50MB.',
      format: 'Unsupported image format. Please use PNG, JPG, or WEBP.',
      apiError: 'Unable to connect to printing service. Please try again later.',
      stockError: 'This item is temporarily out of stock. Please try a different size or color.',
      shippingError: 'Unable to calculate shipping for your location. Please contact support.'
    }
  },
  
  // Development Settings
  development: {
    // Use sandbox mode
    useSandbox: process.env.NODE_ENV !== 'production',
    
    // Mock API responses
    mockResponses: process.env.PRINTIFY_MOCK_MODE === 'true',
    
    // Test order prefix
    testOrderPrefix: 'TEST_',
    
    // Debug logging
    enableDebugLog: process.env.NODE_ENV === 'development'
  }
};

// Environment validation
function validatePrintifyConfig() {
  const errors = [];
  
  if (!PrintifyConfig.api.token) {
    errors.push('PRINTIFY_API_TOKEN environment variable is required');
  }
  
  if (!PrintifyConfig.api.shopId) {
    errors.push('PRINTIFY_SHOP_ID environment variable is required');
  }
  
  if (errors.length > 0) {
    console.error('Printify Configuration Errors:', errors);
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid Printify configuration: ' + errors.join(', '));
    } else {
      console.warn('⚠️  Printify configuration incomplete - some features may not work');
    }
  }
  
  return errors.length === 0;
}

// Validate configuration on module load
const isValid = validatePrintifyConfig();

module.exports = {
  PrintifyConfig,
  isValid
};

/**
 * Environment Variables Setup:
 * 
 * Add these to your .env file:
 * 
 * # Printify API Configuration
 * PRINTIFY_API_TOKEN=your_api_token_here
 * PRINTIFY_SHOP_ID=your_shop_id_here
 * PRINTIFY_WEBHOOK_URL=https://yourdomain.com/api/printify/webhook
 * PRINTIFY_MOCK_MODE=true  # Set to false for production
 * 
 * # Base URL for webhook callbacks
 * BASE_URL=https://yourdomain.com
 * 
 * How to get Printify credentials:
 * 1. Sign up at https://printify.com/
 * 2. Go to My Account > API
 * 3. Generate API token
 * 4. Create a shop or use existing shop ID
 * 5. Set up webhook endpoint for order notifications
 */