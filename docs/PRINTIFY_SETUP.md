# Printify Integration Setup Guide

This guide covers setting up the Printify print-on-demand integration for the custom merchandise store feature.

## Prerequisites

1. **Printify Account**: Create a Printify account at [printify.com](https://printify.com)
2. **API Access**: Enable API access in your Printify account settings
3. **Shop Setup**: Set up at least one connected sales channel (can be manual/API orders)

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Printify API Configuration
PRINTIFY_API_TOKEN=your_printify_api_token_here
PRINTIFY_SHOP_ID=your_printify_shop_id_here
PRINTIFY_ENVIRONMENT=sandbox  # or 'production' for live orders

# Optional: Webhook configuration
PRINTIFY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Getting Your Printify Credentials

### 1. API Token
1. Log into your Printify account
2. Go to **My Account** → **Connections** → **API**
3. Click **Generate Token**
4. Copy the token and add it to your `PRINTIFY_API_TOKEN` environment variable

### 2. Shop ID
1. In Printify, go to **My Account** → **Stores**
2. Your Shop ID is displayed next to your store name
3. Add it to your `PRINTIFY_SHOP_ID` environment variable

### 3. Environment Setting
- Use `sandbox` for development and testing
- Use `production` for live orders with real payments

## Product Configuration

The integration is currently configured for custom t-shirts. You can modify the product blueprint in `config/printify-config.js`:

```javascript
PRODUCT_BLUEPRINTS: {
  't-shirt': {
    blueprint_id: 384,  // Unisex Heavy Cotton Tee
    print_provider_id: 1,  // Printify Print Provider
    // ... other configuration
  }
}
```

### Available Blueprints
Common Printify blueprint IDs:
- **384**: Unisex Heavy Cotton Tee
- **6**: Women's T-Shirt
- **5**: Men's T-Shirt
- **69**: Unisex Hoodie
- **380**: Unisex Sweatshirt

To find more blueprint IDs, use the Printify API catalog endpoint or check their documentation.

## Testing the Integration

### 1. Development Mode
```bash
# Set environment to sandbox
export PRINTIFY_ENVIRONMENT=sandbox

# Start the application
npm run dev
```

### 2. Test User Flow
1. Log into the application
2. Upload images to your gallery
3. Navigate to `/merchandise`
4. Select images and create a test product
5. Place a test order

### 3. Verify Integration
Check the debug logs and Printify dashboard to confirm:
- Images are uploaded successfully
- Products are created in your Printify account
- Orders appear in your Printify order management

## Webhook Configuration (Optional)

For real-time order status updates:

1. In Printify, go to **Settings** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/merchandise/webhook`
3. Select events: `order:created`, `order:updated`, `order:shipped`
4. Add the webhook secret to your environment variables

## Production Deployment

### 1. Switch to Production
```env
PRINTIFY_ENVIRONMENT=production
PRINTIFY_API_TOKEN=your_production_api_token
```

### 2. Payment Integration
The current implementation includes mock payment processing. For production:

1. Integrate with Stripe or PayPal
2. Update the payment processing in `/routes/merchandise.js`
3. Configure payment webhooks for order confirmation

### 3. Security Considerations
- Keep API tokens secure and never commit them to version control
- Use HTTPS for all webhook endpoints
- Validate webhook signatures for security
- Implement rate limiting on API endpoints

## Troubleshooting

### Common Issues

1. **Invalid API Token**
   - Verify token is correct and active
   - Check if token has proper permissions

2. **Shop ID Not Found**
   - Ensure you're using the correct Shop ID
   - Verify the shop is active in Printify

3. **Image Upload Failures**
   - Check image format (JPG, PNG supported)
   - Verify image size requirements (min 300 DPI recommended)
   - Ensure image URLs are publicly accessible

4. **Product Creation Errors**
   - Verify blueprint_id is valid
   - Check print_provider_id compatibility
   - Ensure all required fields are provided

### Debug Mode
Enable detailed logging by setting:
```env
DEBUG=printify:*
```

## Support

- **Printify API Documentation**: [developers.printify.com](https://developers.printify.com)
- **Printify Support**: Available through your Printify account dashboard
- **Integration Issues**: Check the application logs and error messages

## Feature Roadmap

Future enhancements planned:
- Multiple product types (hoodies, mugs, posters)
- Bulk product creation
- Advanced customization options
- Integration with more print providers
- Customer design tools