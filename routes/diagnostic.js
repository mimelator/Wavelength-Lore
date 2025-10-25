/**
 * Production Environment Checker
 * 
 * Quick check for production deployment status
 * Usage: Run this in production environment to check Firebase setup
 */

const express = require('express');
const app = express();

// Load environment
require('dotenv').config();

// Simple diagnostic endpoint
app.get('/diagnostic/firebase', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  // Check environment variables
  results.checks.envVars = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    FIREBASE_SERVICE_ACCOUNT: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    PROJECT_ID: !!process.env.PROJECT_ID,
    STORAGE_BUCKET: !!process.env.STORAGE_BUCKET
  };

  // Test Firebase Admin
  try {
    const { fetchDataAsAdmin } = require('../helpers/firebase-admin-utils');
    
    // Test videos data
    const videosData = await fetchDataAsAdmin('videos');
    results.checks.adminSDK = {
      initialized: true,
      videosAccess: !!videosData,
      videoCount: videosData ? Object.keys(videosData).length : 0
    };
    
    // Test characters data
    const charactersData = await fetchDataAsAdmin('characters');
    results.checks.adminSDK.charactersAccess = !!charactersData;
    results.checks.adminSDK.characterCount = charactersData ? Object.keys(charactersData).length : 0;
    
  } catch (error) {
    results.checks.adminSDK = {
      initialized: false,
      error: error.message
    };
  }

  // Test Firebase Client
  try {
    const firebaseUtils = require('../helpers/firebase-utils');
    results.checks.clientSDK = {
      ready: firebaseUtils.isFirebaseReady()
    };
  } catch (error) {
    results.checks.clientSDK = {
      ready: false,
      error: error.message
    };
  }

  res.json(results);
});

// Health check endpoint
app.get('/diagnostic/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    node_version: process.version
  });
});

module.exports = app;