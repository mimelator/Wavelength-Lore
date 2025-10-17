/**
 * Admin Authentication Middleware
 * Provides secure authentication for administrative endpoints
 */

const crypto = require('crypto');

class AdminAuthentication {
  constructor() {
    this.adminSecretKey = process.env.ADMIN_SECRET_KEY;
    const allowedIPsEnv = process.env.ADMIN_ALLOWED_IPS;
    
    if (allowedIPsEnv === '*') {
      this.allowedIPs = '*'; // Keep as wildcard string
    } else {
      this.allowedIPs = allowedIPsEnv ? 
        allowedIPsEnv.split(',').map(ip => ip.trim()) : 
        ['127.0.0.1', '::1']; // Default to localhost only
    }
    
    this.securityLog = [];
  }

  /**
   * Main authentication middleware
   */
  authenticate = (req, res, next) => {
    const startTime = Date.now();
    const clientIP = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'Unknown';
    const endpoint = req.originalUrl;

    try {
      // Log access attempt
      this.logAccess('ATTEMPT', {
        ip: clientIP,
        endpoint,
        userAgent,
        method: req.method
      });

      // Check 1: IP Address Validation
      if (!this.isIPAllowed(clientIP)) {
        this.logAccess('BLOCKED_IP', {
          ip: clientIP,
          endpoint,
          reason: 'IP not in allowlist'
        });
        
        return res.status(403).json({
          success: false,
          error: 'Access forbidden: IP address not authorized',
          timestamp: new Date().toISOString()
        });
      }

      // Check 2: Admin Secret Key Validation
      const authKey = req.headers['x-admin-key'] || req.query.adminKey;
      
      if (!authKey) {
        this.logAccess('BLOCKED_NO_KEY', {
          ip: clientIP,
          endpoint,
          reason: 'No admin key provided'
        });
        
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Admin key required',
          hint: 'Include X-Admin-Key header or adminKey query parameter',
          timestamp: new Date().toISOString()
        });
      }

      if (!this.validateAdminKey(authKey)) {
        this.logAccess('BLOCKED_INVALID_KEY', {
          ip: clientIP,
          endpoint,
          reason: 'Invalid admin key',
          keyHash: this.hashKey(authKey)
        });
        
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid admin key',
          timestamp: new Date().toISOString()
        });
      }

      // Success - allow access
      const duration = Date.now() - startTime;
      this.logAccess('ALLOWED', {
        ip: clientIP,
        endpoint,
        duration: `${duration}ms`
      });

      // Add admin context to request
      req.adminAuth = {
        authenticated: true,
        ip: clientIP,
        timestamp: new Date().toISOString()
      };

      next();

    } catch (error) {
      console.error('Admin authentication error:', error);
      
      this.logAccess('ERROR', {
        ip: clientIP,
        endpoint,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: 'Authentication system error',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get client IP address from request
   */
  getClientIP(req) {
    // Get client IP address
    const clientIP = req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                     '127.0.0.1';
  }

  /**
   * Check if IP address is allowed
   */
  isIPAllowed(ip) {
    // Allow all IPs if wildcard is set
    if (this.allowedIPs === '*') {
      return true;
    }

    // Allow localhost variations
    const localhostIPs = ['127.0.0.1', '::1', 'localhost'];
    if (localhostIPs.includes(ip)) {
      return true;
    }

    // Check against allowed IPs (this.allowedIPs is an array here)
    return Array.isArray(this.allowedIPs) && this.allowedIPs.includes(ip);
  }

  /**
   * Validate admin secret key
   */
  validateAdminKey(providedKey) {
    if (!this.adminSecretKey) {
      console.error('⚠️ ADMIN_SECRET_KEY not configured in environment');
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(providedKey),
      Buffer.from(this.adminSecretKey)
    );
  }

  /**
   * Hash key for logging (security)
   */
  hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 8);
  }

  /**
   * Log access attempts for security monitoring
   */
  logAccess(type, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      ...details
    };

    // Keep last 1000 entries in memory
    this.securityLog.push(logEntry);
    if (this.securityLog.length > 1000) {
      this.securityLog.shift();
    }

    // Console logging with appropriate severity
    const logMessage = `🔐 [${type}] ${details.ip} ${details.endpoint || ''} ${details.reason || ''}`;
    
    switch (type) {
      case 'BLOCKED_IP':
      case 'BLOCKED_NO_KEY':
      case 'BLOCKED_INVALID_KEY':
        console.warn(logMessage);
        break;
      case 'ERROR':
        console.error(logMessage);
        break;
      case 'ALLOWED':
        console.log(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  /**
   * Get security log entries
   */
  getSecurityLog(limit = 100) {
    return this.securityLog.slice(-limit);
  }

  /**
   * Optional: More restrictive middleware for critical operations
   */
  authenticateStrict = (req, res, next) => {
    // Add additional checks for critical operations
    const criticalEndpoints = ['/download/', '/create', '/list', '/status'];
    const isCritical = criticalEndpoints.some(endpoint => 
      req.originalUrl.includes(endpoint)
    );

    if (isCritical) {
      // Require additional header for critical operations
      const criticalAuth = req.headers['x-admin-critical'];
      if (!criticalAuth || criticalAuth !== 'confirmed') {
        this.logAccess('BLOCKED_CRITICAL', {
          ip: this.getClientIP(req),
          endpoint: req.originalUrl,
          reason: 'Critical operation requires X-Admin-Critical: confirmed header'
        });

        return res.status(403).json({
          success: false,
          error: 'Critical operation requires additional confirmation',
          hint: 'Include X-Admin-Critical: confirmed header',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Continue with normal authentication
    this.authenticate(req, res, next);
  };

  /**
   * Health check endpoint for the auth system
   */
  healthCheck = (req, res) => {
    const recentLogs = this.getSecurityLog(10);
    const blockedAttempts = recentLogs.filter(log => 
      log.type.startsWith('BLOCKED')
    ).length;

    res.json({
      success: true,
      service: 'Admin Authentication',
      status: 'operational',
      timestamp: new Date().toISOString(),
      stats: {
        recentAttempts: recentLogs.length,
        blockedAttempts,
        allowedIPs: this.allowedIPs.length,
        keyConfigured: !!this.adminSecretKey
      }
    });
  };
}

// Create singleton instance
const adminAuth = new AdminAuthentication();

// Export middleware functions
module.exports = {
  adminAuth: adminAuth.authenticate,
  adminAuthStrict: adminAuth.authenticateStrict,
  adminHealthCheck: adminAuth.healthCheck,
  getSecurityLog: () => adminAuth.getSecurityLog(),
  AdminAuthentication
};