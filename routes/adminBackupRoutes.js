/**
 * Backup Management API Routes
 * Secure API endpoints for backup operations
 */

const express = require('express');
const router = express.Router();

/**
 * Get backup system status
 * GET /api/admin/backup/status
 */
router.get('/status', (req, res) => {
  try {
    const backupSystem = req.app.locals.backupSystem;
    
    if (!backupSystem) {
      return res.status(503).json({
        success: false,
        error: 'Backup system not initialized'
      });
    }
    
    const status = backupSystem.getStatus();
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create manual backup
 * POST /api/admin/backup/create
 */
router.post('/create', async (req, res) => {
  try {
    const backupSystem = req.app.locals.backupSystem;
    
    if (!backupSystem) {
      return res.status(503).json({
        success: false,
        error: 'Backup system not initialized'
      });
    }
    
    const { type = 'manual' } = req.body;
    
    console.log(`🚀 Manual backup requested: ${type}`);
    
    const result = await backupSystem.performBackup(type);
    
    res.json({
      success: true,
      result: {
        type: result.backupInfo.type,
        duration: result.duration,
        size: result.size,
        location: result.backupInfo.s3Key,
        timestamp: result.backupInfo.timestamp
      },
      message: 'Backup completed successfully'
    });
    
  } catch (error) {
    console.error('Manual backup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List available backups
 * GET /api/admin/backup/list
 */
router.get('/list', async (req, res) => {
  try {
    const backupSystem = req.app.locals.backupSystem;
    
    if (!backupSystem) {
      return res.status(503).json({
        success: false,
        error: 'Backup system not initialized'
      });
    }
    
    const { type, limit = 50 } = req.query;
    
    const backups = await backupSystem.listBackups(type, parseInt(limit));
    
    res.json({
      success: true,
      backups: backups.map(backup => ({
        key: backup.key,
        size: backup.size,
        lastModified: backup.lastModified,
        storageClass: backup.storageClass,
        sizeReadable: `${(backup.size / 1024 / 1024).toFixed(2)} MB`
      })),
      count: backups.length,
      filter: type || 'all'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Download backup
 * GET /api/admin/backup/download/:key
 */
router.get('/download/:key', async (req, res) => {
  try {
    const backupSystem = req.app.locals.backupSystem;
    
    if (!backupSystem) {
      return res.status(503).json({
        success: false,
        error: 'Backup system not initialized'
      });
    }
    
    const backupKey = req.params.key;
    
    console.log(`📥 Backup download requested: ${backupKey}`);
    
    const data = await backupSystem.restoreFromBackup(backupKey);
    
    // Set headers for file download
    const filename = backupKey.split('/').pop();
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    
    res.json(data);
    
  } catch (error) {
    console.error('Backup download failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Backup system health check
 * GET /api/admin/backup/health
 */
router.get('/health', async (req, res) => {
  try {
    const backupSystem = req.app.locals.backupSystem;
    
    if (!backupSystem) {
      return res.status(503).json({
        success: false,
        service: 'Backup System',
        status: 'unavailable',
        message: 'Backup system not initialized'
      });
    }
    
    const status = backupSystem.getStatus();
    
    res.json({
      success: true,
      service: 'Backup System',
      status: status.initialized ? 'operational' : 'initializing',
      timestamp: new Date().toISOString(),
      details: {
        backupRunning: status.backupRunning,
        bucketName: status.config.bucketName,
        region: status.config.region,
        encryptionEnabled: status.config.encryptionEnabled
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'Backup System',
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;