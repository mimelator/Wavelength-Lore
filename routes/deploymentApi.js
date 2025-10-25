const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * Deployment Status API
 * Returns detailed information about the current deployment
 */
router.get('/api/deployment/status', (req, res) => {
  try {
    // Read version info
    const versionPath = path.join(__dirname, '../version.json');
    let versionInfo = {};
    
    if (fs.existsSync(versionPath)) {
      versionInfo = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    }

    // Add runtime information
    const deploymentStatus = {
      ...versionInfo,
      
      // Runtime info
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
      
      // Memory usage
      memoryUsage: process.memoryUsage(),
      
      // Environment
      nodeEnv: process.env.NODE_ENV || 'development',
      
      // Links
      githubCommit: `https://github.com/mimelator/Wavelength-Lore/commit/${versionInfo.commitHash}`,
      githubCompare: versionInfo.previousCommit ? 
        `https://github.com/mimelator/Wavelength-Lore/compare/${versionInfo.previousCommit}...${versionInfo.commitHash}` : 
        null,
      
      // Deployment tracking
      deployedAt: versionInfo.buildDate,
      deploymentAge: versionInfo.buildDate ? 
        Math.floor((Date.now() - new Date(versionInfo.buildDate)) / 1000) : 
        null,
      deploymentAgeFormatted: versionInfo.buildDate ? 
        formatAge(Date.now() - new Date(versionInfo.buildDate)) : 
        null
    };

    res.json({
      success: true,
      deployment: deploymentStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve deployment status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * Format age in human readable format
 */
function formatAge(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
}

module.exports = router;