#!/usr/bin/env node

/**
 * Get Production URL
 * Helper script to automatically detect the current App Runner production URL
 */

require('dotenv').config();
const { execSync } = require('child_process');

async function getProductionUrl() {
  try {
    // Try to get from environment first
    if (process.env.PRODUCTION_URL) {
      return process.env.PRODUCTION_URL;
    }
    
    // Get from App Runner service
    const serviceArn = process.env.APPRUNNER_SERVICE_ARN;
    if (!serviceArn) {
      throw new Error('APPRUNNER_SERVICE_ARN not configured');
    }
    
    const command = `aws apprunner describe-service --service-arn "${serviceArn}" --region us-east-1 --query 'Service.ServiceUrl' --output text`;
    const serviceUrl = execSync(command, { encoding: 'utf8' }).trim();
    
    return `https://${serviceUrl}`;
  } catch (error) {
    console.error('Error getting production URL:', error.message);
    // Fallback to current known URL
    return 'https://vh9x3gevev.us-east-1.awsapprunner.com';
  }
}

if (require.main === module) {
  getProductionUrl().then(url => {
    console.log(url);
  }).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = { getProductionUrl };