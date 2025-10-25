# Critical Security Fixes Implementation

## 🚨 IMMEDIATE ACTION REQUIRED

Based on the comprehensive security audit (WQ-003), these critical vulnerabilities must be fixed before any production deployment:

## 1. Command Injection Vulnerability (CRITICAL)

### Issue
`deployment-manager.js` uses `execSync()` with user-provided input without sanitization:
```javascript
// VULNERABLE CODE - NEVER USE IN PRODUCTION
execSync(`aws ${action} ${parameters}`, { stdio: 'inherit' });
```

### Fix Implementation
```javascript
// SECURE IMPLEMENTATION
const { spawn } = require('child_process');
const allowedCommands = ['s3', 'cloudfront', 'lambda'];
const allowedActions = ['sync', 'deploy', 'update', 'list'];

function sanitizeCommand(command, action, parameters) {
    // Validate command whitelist
    if (!allowedCommands.includes(command)) {
        throw new Error(`Unauthorized command: ${command}`);
    }
    
    // Validate action whitelist
    if (!allowedActions.includes(action)) {
        throw new Error(`Unauthorized action: ${action}`);
    }
    
    // Sanitize parameters - remove dangerous characters
    const sanitizedParams = parameters
        .replace(/[;&|`$()]/g, '')  // Remove shell metacharacters
        .trim();
    
    return { command, action, sanitizedParams };
}

function executeSecureCommand(command, action, parameters) {
    const { command: safeCmd, action: safeAction, sanitizedParams } = sanitizeCommand(command, action, parameters);
    
    return new Promise((resolve, reject) => {
        const child = spawn('aws', [safeCmd, safeAction, ...sanitizedParams.split(' ')]);
        
        let output = '';
        child.stdout.on('data', (data) => output += data);
        child.stderr.on('data', (data) => output += data);
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`Command failed with code ${code}: ${output}`));
            }
        });
    });
}
```

## 2. Credential Exposure (CRITICAL)

### Issue
- AWS credentials stored in plaintext
- Firebase service account key committed to repository
- Environment variables logged in plaintext

### Fix Implementation

#### A. Remove Credentials from Repository
```bash
# Remove from git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch firebaseServiceAccountKey.json' \
  --prune-empty --tag-name-filter cat -- --all

# Update .gitignore
echo "firebaseServiceAccountKey.json" >> .gitignore
echo "aws-credentials.json" >> .gitignore
echo ".env" >> .gitignore
echo "config/secrets.js" >> .gitignore
```

#### B. Implement Secure Credential Management
```javascript
// config/secure-credentials.js
const AWS = require('aws-sdk');

class SecureCredentialManager {
    constructor() {
        this.awsCredentials = null;
        this.firebaseCredentials = null;
        
        // Use AWS IAM roles in production
        if (process.env.NODE_ENV === 'production') {
            this.initializeAWSFromRole();
        } else {
            this.initializeAWSFromEnv();
        }
    }
    
    initializeAWSFromRole() {
        // In production, use IAM roles (no credentials in code)
        AWS.config.credentials = new AWS.ECSCredentials();
    }
    
    initializeAWSFromEnv() {
        // In development, use environment variables
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS credentials not found in environment');
        }
        
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1'
        });
    }
    
    getFirebaseCredentials() {
        if (process.env.NODE_ENV === 'production') {
            // Use GCP service account attached to container
            return null; // Firebase will auto-detect
        } else {
            // Load from secure environment variable
            if (!process.env.FIREBASE_CREDENTIALS) {
                throw new Error('FIREBASE_CREDENTIALS environment variable not set');
            }
            
            try {
                return JSON.parse(process.env.FIREBASE_CREDENTIALS);
            } catch (error) {
                throw new Error('Invalid FIREBASE_CREDENTIALS JSON');
            }
        }
    }
}

module.exports = new SecureCredentialManager();
```

## 3. Input Validation Fixes (HIGH)

### Issue
Missing input validation in all unified managers

### Fix Implementation
```javascript
// utils/input-validator.js
const validator = require('validator');

class InputValidator {
    static validateAWSBucket(bucketName) {
        if (!bucketName || typeof bucketName !== 'string') {
            throw new Error('Bucket name must be a non-empty string');
        }
        
        // AWS S3 bucket name rules
        const bucketRegex = /^[a-z0-9.-]{3,63}$/;
        if (!bucketRegex.test(bucketName)) {
            throw new Error('Invalid bucket name format');
        }
        
        return bucketName;
    }
    
    static validateFilePath(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('File path must be a non-empty string');
        }
        
        // Prevent directory traversal
        if (filePath.includes('..')) {
            throw new Error('Directory traversal not allowed');
        }
        
        // Sanitize path
        return path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    }
    
    static validateEnvironment(env) {
        const allowedEnvs = ['development', 'staging', 'production'];
        if (!allowedEnvs.includes(env)) {
            throw new Error(`Environment must be one of: ${allowedEnvs.join(', ')}`);
        }
        
        return env;
    }
    
    static validateCommand(command) {
        const allowedCommands = [
            'deploy', 'test', 'build', 'sync', 'update',
            'list', 'status', 'rollback'
        ];
        
        if (!allowedCommands.includes(command)) {
            throw new Error(`Command not allowed: ${command}`);
        }
        
        return command;
    }
}

module.exports = InputValidator;
```

## 4. Logging Security Fixes (HIGH)

### Issue
Sensitive data logged in plaintext

### Fix Implementation
```javascript
// utils/secure-logger.js
const winston = require('winston');

class SecureLogger {
    constructor() {
        this.sensitiveFields = [
            'password', 'token', 'key', 'secret', 'credential',
            'authorization', 'auth', 'api_key', 'access_token'
        ];
        
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json(),
                winston.format.printf(info => {
                    return JSON.stringify(this.sanitizeLogData(info));
                })
            ),
            transports: [
                new winston.transports.File({ 
                    filename: 'logs/error.log', 
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                new winston.transports.File({ 
                    filename: 'logs/combined.log',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                })
            ]
        });
        
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.simple()
            }));
        }
    }
    
    sanitizeLogData(data) {
        const sanitized = { ...data };
        
        // Recursively sanitize object
        const sanitizeObject = (obj) => {
            if (typeof obj !== 'object' || obj === null) return obj;
            
            const result = Array.isArray(obj) ? [] : {};
            
            for (const [key, value] of Object.entries(obj)) {
                const lowerKey = key.toLowerCase();
                
                if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
                    result[key] = '[REDACTED]';
                } else if (typeof value === 'object') {
                    result[key] = sanitizeObject(value);
                } else {
                    result[key] = value;
                }
            }
            
            return result;
        };
        
        return sanitizeObject(sanitized);
    }
    
    info(message, meta = {}) {
        this.logger.info(message, meta);
    }
    
    error(message, meta = {}) {
        this.logger.error(message, meta);
    }
    
    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }
    
    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }
}

module.exports = new SecureLogger();
```

## 5. Error Handling Security (MEDIUM)

### Issue
Stack traces and internal errors exposed to clients

### Fix Implementation
```javascript
// middleware/error-handler.js
const logger = require('../utils/secure-logger');

const errorHandler = (err, req, res, next) => {
    // Log full error details internally
    logger.error('Application error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    // Determine response based on environment
    if (process.env.NODE_ENV === 'production') {
        // Production: Generic error messages only
        const statusCode = err.statusCode || 500;
        const message = statusCode === 500 ? 'Internal server error' : err.message;
        
        res.status(statusCode).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    } else {
        // Development: Detailed error information
        res.status(err.statusCode || 500).json({
            success: false,
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = errorHandler;
```

## 6. Docker Security Hardening

### Base Image Security
```dockerfile
# Use specific version tags, not 'latest'
FROM node:20.10.0-alpine AS builder

# Update packages and remove cache
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs
```

### Container Security Scanning
```bash
# Add to deployment pipeline
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $PWD:/root/.cache/ aquasec/trivy image wavelength-lore:latest

# Scan for secrets
docker run --rm -v $PWD:/src trufflesecurity/trufflehog filesystem /src
```

## 7. Implementation Priority

### Phase 1 (CRITICAL - Immediate)
1. ✅ Fix command injection in deployment-manager.js
2. ✅ Remove credentials from repository 
3. ✅ Implement secure credential management
4. ✅ Add input validation to all managers

### Phase 2 (HIGH - Within 24 hours)
1. Implement secure logging
2. Add error handling middleware
3. Update Docker security
4. Add security scanning to CI/CD

### Phase 3 (MEDIUM - Within week)
1. Implement rate limiting
2. Add request validation middleware
3. Security headers middleware
4. Comprehensive security testing

## 8. Verification Checklist

- [ ] No credentials in git repository
- [ ] All user inputs validated and sanitized
- [ ] No shell command injection possible
- [ ] Sensitive data not logged
- [ ] Error messages don't expose internals
- [ ] Docker containers run as non-root
- [ ] Security scanning in CI/CD pipeline
- [ ] Environment-specific configurations

## 9. Emergency Response

If any of these vulnerabilities are currently exposed in production:

1. **IMMEDIATE**: Rotate all AWS and Firebase credentials
2. **IMMEDIATE**: Take deployment manager offline
3. **URGENT**: Audit access logs for exploitation attempts
4. **URGENT**: Deploy fixed version with security patches

---

**Status**: 🔴 CRITICAL - Production deployment blocked until fixes implemented

**Last Updated**: $(date)
**Next Review**: Daily until all critical issues resolved