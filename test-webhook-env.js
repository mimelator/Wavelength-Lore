#!/usr/bin/env node

/**
 * Quick test to verify STRIPE_WEBHOOK_SECRET is available in production
 */

// Load environment variables
require('dotenv').config();

console.log('🔍 Testing Stripe Webhook Secret Environment Variable');
console.log('='.repeat(50));

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

console.log(`✅ STRIPE_WEBHOOK_SECRET exists: ${!!webhookSecret}`);
console.log(`✅ STRIPE_WEBHOOK_SECRET length: ${webhookSecret ? webhookSecret.length : 0}`);
console.log(`✅ STRIPE_WEBHOOK_SECRET prefix: ${webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'N/A'}`);

// Check if it starts with whsec_
const isValidFormat = webhookSecret && webhookSecret.startsWith('whsec_');
console.log(`✅ Valid format (whsec_*): ${isValidFormat}`);

console.log('='.repeat(50));

if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not found in environment!');
    process.exit(1);
} else if (!isValidFormat) {
    console.error('❌ STRIPE_WEBHOOK_SECRET invalid format (should start with whsec_)!');
    process.exit(1);
} else {
    console.log('✅ STRIPE_WEBHOOK_SECRET appears to be properly configured');
}