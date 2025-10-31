# 🔧 MULTI-SITE TECHNICAL SPECIFICATIONS

**Document:** Implementation Details & Code Architecture  
**Project:** Wavelength Multi-Site Replication System  
**Target:** 2 sites per day deployment capability  

---

## 📁 FILE STRUCTURE MODIFICATIONS

### New Directory Structure
```
├── config/
│   ├── tenant-templates/           # NEW: Site template definitions
│   │   ├── music-site.js
│   │   ├── art-site.js
│   │   └── default.js
│   ├── tenant-configs/             # NEW: Individual tenant configurations  
│   │   ├── musiclore.js
│   │   ├── artworld.js
│   │   └── [tenant-id].js
│   └── multi-tenant.js             # NEW: Multi-tenant configuration manager
├── middleware/
│   ├── tenant-middleware.js        # NEW: Tenant detection and setup
│   └── feature-middleware.js       # NEW: Feature toggle middleware  
├── services/
│   ├── tenant-services/            # NEW: Multi-tenant service implementations
│   │   ├── tenant-firebase.js
│   │   ├── tenant-stripe.js
│   │   ├── tenant-printify.js
│   │   └── tenant-s3.js
│   ├── tenant-service-factory.js   # NEW: Service factory for tenants
│   ├── credit-manager.js           # NEW: AI credit system
│   └── ai-service-wrapper.js       # NEW: Credit-aware AI services
├── routes/
│   ├── loremaster/                 # NEW: LoreMaster management routes
│   │   ├── dashboard.js
│   │   ├── configuration.js
│   │   └── content-management.js
│   └── tenant-api.js               # NEW: Tenant-specific API routes
├── utils/
│   ├── tenant-detector.js          # NEW: Tenant identification from domain
│   ├── feature-manager.js          # NEW: Feature toggle management
│   └── site-provisioner.js        # NEW: Automated site provisioning
├── scripts/
│   ├── provision-site.js           # NEW: Site provisioning script
│   ├── migrate-tenant.js           # NEW: Tenant data migration
│   └── validate-isolation.js       # NEW: Security validation script
└── tests/
    ├── multi-tenant/               # NEW: Multi-tenant specific tests
    │   ├── tenant-isolation.test.js
    │   ├── feature-toggles.test.js
    │   └── performance.test.js
    └── integration/
        └── site-provisioning.test.js
```

---

## 🏗️ CORE COMPONENTS IMPLEMENTATION

### 1. Tenant Configuration Manager

```javascript
// config/multi-tenant.js
const fs = require('fs');
const path = require('path');

class MultiTenantConfig {
  constructor() {
    this.configCache = new Map();
    this.templates = this.loadTemplates();
  }

  loadTemplates() {
    const templatesDir = path.join(__dirname, 'tenant-templates');
    const templates = {};
    
    fs.readdirSync(templatesDir).forEach(file => {
      if (file.endsWith('.js')) {
        const templateName = path.basename(file, '.js');
        templates[templateName] = require(path.join(templatesDir, file));
      }
    });
    
    return templates;
  }

  async getTenantConfig(tenantId) {
    if (this.configCache.has(tenantId)) {
      return this.configCache.get(tenantId);
    }

    try {
      const configPath = path.join(__dirname, 'tenant-configs', `${tenantId}.js`);
      
      if (!fs.existsSync(configPath)) {
        throw new Error(`Tenant configuration not found for: ${tenantId}`);
      }

      const tenantConfig = require(configPath);
      
      // Merge with template if specified
      if (tenantConfig.template) {
        const template = this.templates[tenantConfig.template];
        if (!template) {
          throw new Error(`Template not found: ${tenantConfig.template}`);
        }
        
        const mergedConfig = this.mergeConfigs(template, tenantConfig);
        this.configCache.set(tenantId, mergedConfig);
        return mergedConfig;
      }

      this.configCache.set(tenantId, tenantConfig);
      return tenantConfig;
    } catch (error) {
      console.error(`Error loading tenant config for ${tenantId}:`, error);
      throw error;
    }
  }

  mergeConfigs(template, override) {
    return {
      ...template,
      ...override,
      branding: { ...template.branding, ...override.branding },
      features: { ...template.features, ...override.features },
      terminology: { ...template.terminology, ...override.terminology },
      pages: { ...template.pages, ...override.pages }
    };
  }

  async saveTenantConfig(tenantId, config) {
    const configPath = path.join(__dirname, 'tenant-configs', `${tenantId}.js`);
    const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;
    
    fs.writeFileSync(configPath, configContent);
    this.configCache.delete(tenantId); // Invalidate cache
  }
}

module.exports = new MultiTenantConfig();
```

### 2. Tenant Middleware

```javascript
// middleware/tenant-middleware.js
const multiTenantConfig = require('../config/multi-tenant');
const TenantServiceFactory = require('../services/tenant-service-factory');

class TenantMiddleware {
  static async initialize(req, res, next) {
    try {
      // Extract tenant ID from request
      const tenantId = TenantMiddleware.extractTenantId(req);
      
      if (!tenantId) {
        return res.status(400).json({ 
          error: 'Unable to determine tenant from request' 
        });
      }

      // Load tenant configuration
      const tenantConfig = await multiTenantConfig.getTenantConfig(tenantId);
      
      // Initialize tenant services
      const serviceFactory = new TenantServiceFactory(tenantId, tenantConfig);
      
      // Attach to request
      req.tenantId = tenantId;
      req.tenantConfig = tenantConfig;
      req.tenantServices = serviceFactory;
      
      // Add to response locals for templates
      res.locals.tenantId = tenantId;
      res.locals.siteConfig = tenantConfig;
      res.locals.terminology = tenantConfig.terminology;
      res.locals.branding = tenantConfig.branding;
      
      next();
    } catch (error) {
      console.error('Tenant middleware error:', error);
      res.status(500).json({ 
        error: 'Tenant configuration error' 
      });
    }
  }

  static extractTenantId(req) {
    const host = req.get('host');
    
    // Handle localhost development
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      // Use header override for development
      return req.headers['x-tenant-id'] || 'development';
    }

    // Production domain patterns
    const parts = host.split('.');
    
    // Subdomain pattern: musiclore.wavelengthplatform.com
    if (parts.length >= 3 && parts[1] === 'wavelengthplatform') {
      return parts[0];
    }
    
    // Custom domain pattern: wavelengthmusic.com
    if (parts.length === 2) {
      return parts[0]; // Use main domain as tenant ID
    }
    
    return null;
  }
}

module.exports = TenantMiddleware;
```

### 3. Service Factory Implementation

```javascript
// services/tenant-service-factory.js
const TenantFirebaseService = require('./tenant-services/tenant-firebase');
const TenantStripeService = require('./tenant-services/tenant-stripe');
const TenantPrintifyService = require('./tenant-services/tenant-printify');
const TenantS3Service = require('./tenant-services/tenant-s3');
const CreditManager = require('./credit-manager');
const AIServiceWrapper = require('./ai-service-wrapper');

class TenantServiceFactory {
  constructor(tenantId, tenantConfig) {
    this.tenantId = tenantId;
    this.tenantConfig = tenantConfig;
    this.services = {};
  }

  getFirebaseService() {
    if (!this.services.firebase) {
      this.services.firebase = new TenantFirebaseService({
        tenantId: this.tenantId,
        projectId: this.getEnvVar('FIREBASE_PROJECT_ID'),
        privateKey: this.getEnvVar('FIREBASE_PRIVATE_KEY'),
        clientEmail: this.getEnvVar('FIREBASE_CLIENT_EMAIL'),
        databaseURL: this.getEnvVar('FIREBASE_DATABASE_URL')
      });
    }
    return this.services.firebase;
  }

  getStripeService() {
    if (!this.services.stripe) {
      this.services.stripe = new TenantStripeService({
        tenantId: this.tenantId,
        secretKey: this.getEnvVar('STRIPE_SECRET_KEY'),
        publishableKey: this.getEnvVar('STRIPE_PUBLISHABLE_KEY')
      });
    }
    return this.services.stripe;
  }

  getPrintifyService() {
    if (!this.services.printify) {
      this.services.printify = new TenantPrintifyService({
        tenantId: this.tenantId,
        apiKey: this.getEnvVar('PRINTIFY_API_KEY'),
        shopId: this.getEnvVar('PRINTIFY_SHOP_ID')
      });
    }
    return this.services.printify;
  }

  getS3Service() {
    if (!this.services.s3) {
      this.services.s3 = new TenantS3Service({
        tenantId: this.tenantId,
        accessKeyId: this.getEnvVar('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.getEnvVar('AWS_SECRET_ACCESS_KEY'),
        region: this.getEnvVar('AWS_REGION'),
        bucketName: this.getEnvVar('S3_BUCKET')
      });
    }
    return this.services.s3;
  }

  getCreditManager() {
    if (!this.services.creditManager) {
      this.services.creditManager = new CreditManager(
        this.getFirebaseService(),
        this.tenantId
      );
    }
    return this.services.creditManager;
  }

  getAIService() {
    if (!this.services.aiService) {
      this.services.aiService = new AIServiceWrapper(
        this,
        this.getCreditManager(),
        {
          openaiApiKey: this.getEnvVar('OPENAI_API_KEY'),
          geminiApiKey: this.getEnvVar('GEMINI_API_KEY')
        }
      );
    }
    return this.services.aiService;
  }

  getEnvVar(name) {
    // Try tenant-specific variable first, then fall back to global
    const tenantSpecific = `${this.tenantId.toUpperCase()}_${name}`;
    return process.env[tenantSpecific] || process.env[name];
  }
}

module.exports = TenantServiceFactory;
```

### 4. Feature Manager

```javascript
// utils/feature-manager.js
class FeatureManager {
  constructor(tenantConfig) {
    this.features = tenantConfig.features;
  }

  isEnabled(featureName) {
    const feature = this.features[featureName];
    return feature && feature.enabled === true;
  }

  getFeatureConfig(featureName) {
    return this.features[featureName] || { enabled: false };
  }

  // Express middleware to require a feature
  requireFeature(featureName) {
    return (req, res, next) => {
      if (!this.isEnabled(featureName)) {
        return res.status(404).render('errors/feature-disabled', {
          featureName,
          siteName: req.tenantConfig.branding.siteName
        });
      }
      next();
    };
  }

  // Template helper for conditional rendering
  getTemplateHelpers() {
    return {
      hasFeature: (featureName) => this.isEnabled(featureName),
      getFeature: (featureName) => this.getFeatureConfig(featureName),
      terminology: this.features.terminology || {}
    };
  }
}

module.exports = FeatureManager;
```

---

## 🔒 TENANT ISOLATION IMPLEMENTATION

### 1. Tenant-Specific Firebase Service

```javascript
// services/tenant-services/tenant-firebase.js
const admin = require('firebase-admin');

class TenantFirebaseService {
  constructor(config) {
    this.tenantId = config.tenantId;
    this.config = config;
    this.app = null;
    this.db = null;
    this.initialize();
  }

  initialize() {
    // Create tenant-specific Firebase app
    const appName = `tenant-${this.tenantId}`;
    
    try {
      // Check if app already exists
      this.app = admin.app(appName);
    } catch (error) {
      // Create new app if it doesn't exist
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.config.projectId,
          privateKey: this.config.privateKey.replace(/\\n/g, '\n'),
          clientEmail: this.config.clientEmail
        }),
        databaseURL: this.config.databaseURL
      }, appName);
    }

    this.db = this.app.firestore();
  }

  // Collection with tenant prefix
  collection(collectionName) {
    return this.db.collection(`${this.tenantId}_${collectionName}`);
  }

  // User management with tenant isolation
  async createUser(userData) {
    const userRef = this.collection('users').doc();
    const user = {
      ...userData,
      tenantId: this.tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      credits: userData.credits || 0
    };
    
    await userRef.set(user);
    return { id: userRef.id, ...user };
  }

  async getUser(userId) {
    const doc = await this.collection('users').doc(userId).get();
    if (!doc.exists) {
      throw new Error('User not found');
    }
    
    const userData = doc.data();
    
    // Verify tenant isolation
    if (userData.tenantId !== this.tenantId) {
      throw new Error('Access denied: User belongs to different tenant');
    }
    
    return { id: doc.id, ...userData };
  }

  async updateUser(userId, updates) {
    // Ensure tenant isolation
    await this.getUser(userId); // This will throw if user doesn't belong to tenant
    
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await this.collection('users').doc(userId).update(updateData);
  }

  // Content management with tenant isolation
  async createPost(postData) {
    const postRef = this.collection('posts').doc();
    const post = {
      ...postData,
      tenantId: this.tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await postRef.set(post);
    return { id: postRef.id, ...post };
  }

  async getPosts(category = null, limit = 20) {
    let query = this.collection('posts')
      .where('tenantId', '==', this.tenantId)
      .orderBy('createdAt', 'desc')
      .limit(limit);
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = TenantFirebaseService;
```

### 2. Tenant-Specific S3 Service

```javascript
// services/tenant-services/tenant-s3.js
const AWS = require('aws-sdk');
const path = require('path');

class TenantS3Service {
  constructor(config) {
    this.tenantId = config.tenantId;
    this.bucketName = config.bucketName;
    
    this.s3 = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region
    });
  }

  // Get tenant-specific key prefix
  getTenantPrefix(key = '') {
    return `tenants/${this.tenantId}/${key}`.replace(/\/+/g, '/');
  }

  async uploadFile(file, key, options = {}) {
    const tenantKey = this.getTenantPrefix(key);
    
    const params = {
      Bucket: this.bucketName,
      Key: tenantKey,
      Body: file.buffer || file,
      ContentType: file.mimetype || options.contentType,
      ACL: options.acl || 'public-read',
      Metadata: {
        tenantId: this.tenantId,
        uploadedAt: new Date().toISOString(),
        ...options.metadata
      }
    };

    const result = await this.s3.upload(params).promise();
    
    return {
      url: result.Location,
      key: tenantKey,
      bucket: this.bucketName,
      etag: result.ETag
    };
  }

  async deleteFile(key) {
    const tenantKey = this.getTenantPrefix(key);
    
    // Verify file belongs to tenant
    await this.verifyTenantOwnership(tenantKey);
    
    const params = {
      Bucket: this.bucketName,
      Key: tenantKey
    };

    await this.s3.deleteObject(params).promise();
  }

  async listFiles(prefix = '', maxKeys = 1000) {
    const tenantPrefix = this.getTenantPrefix(prefix);
    
    const params = {
      Bucket: this.bucketName,
      Prefix: tenantPrefix,
      MaxKeys: maxKeys
    };

    const result = await this.s3.listObjectsV2(params).promise();
    
    return result.Contents.map(obj => ({
      key: obj.Key.replace(this.getTenantPrefix(), ''),
      size: obj.Size,
      lastModified: obj.LastModified,
      etag: obj.ETag
    }));
  }

  async verifyTenantOwnership(key) {
    // Check if key starts with tenant prefix
    const tenantPrefix = this.getTenantPrefix();
    if (!key.startsWith(tenantPrefix)) {
      throw new Error('Access denied: File does not belong to this tenant');
    }

    // Additional metadata check
    try {
      const params = { Bucket: this.bucketName, Key: key };
      const metadata = await this.s3.headObject(params).promise();
      
      if (metadata.Metadata.tenantId !== this.tenantId) {
        throw new Error('Access denied: File belongs to different tenant');
      }
    } catch (error) {
      if (error.code === 'NotFound') {
        throw new Error('File not found');
      }
      throw error;
    }
  }

  getPublicUrl(key) {
    const tenantKey = this.getTenantPrefix(key);
    return `https://${this.bucketName}.s3.amazonaws.com/${tenantKey}`;
  }
}

module.exports = TenantS3Service;
```

---

## 💳 CREDIT SYSTEM IMPLEMENTATION

### 1. Credit Manager

```javascript
// services/credit-manager.js
const admin = require('firebase-admin');

class CreditManager {
  constructor(firebaseService, tenantId) {
    this.firebase = firebaseService;
    this.tenantId = tenantId;
    
    // Credit costs configuration
    this.costs = {
      imageGeneration: 10,
      videoGeneration: 50,
      audioGeneration: 25,
      chatbotQuery: 0 // Free
    };
  }

  async getUserCredits(userId) {
    try {
      const user = await this.firebase.getUser(userId);
      return user.credits || 0;
    } catch (error) {
      console.error('Error getting user credits:', error);
      return 0;
    }
  }

  async deductCredits(userId, operation, options = {}) {
    const cost = this.calculateCost(operation, options);
    
    if (cost === 0) {
      return { success: true, cost: 0, remaining: await this.getUserCredits(userId) };
    }

    const currentCredits = await this.getUserCredits(userId);
    
    if (currentCredits < cost) {
      throw new Error(`Insufficient credits. Required: ${cost}, Available: ${currentCredits}`);
    }

    const newBalance = currentCredits - cost;
    
    // Update user credits and log transaction
    await this.firebase.updateUser(userId, {
      credits: newBalance,
      creditHistory: admin.firestore.FieldValue.arrayUnion({
        operation,
        cost: -cost,
        timestamp: new Date(),
        balance: newBalance,
        details: options
      })
    });

    // Log transaction for tenant analytics
    await this.logTransaction(userId, operation, cost, options);

    return { success: true, cost, remaining: newBalance };
  }

  async addCredits(userId, amount, reason = 'Purchase') {
    const currentCredits = await this.getUserCredits(userId);
    const newBalance = currentCredits + amount;
    
    await this.firebase.updateUser(userId, {
      credits: newBalance,
      creditHistory: admin.firestore.FieldValue.arrayUnion({
        operation: reason,
        cost: amount,
        timestamp: new Date(),
        balance: newBalance
      })
    });

    await this.logTransaction(userId, reason, -amount, { added: amount });

    return { success: true, added: amount, balance: newBalance };
  }

  calculateCost(operation, options) {
    switch (operation) {
      case 'imageGeneration':
        if (options.quality === 'hd') return this.costs.imageGeneration + 5;
        if (options.quality === 'xl') return this.costs.imageGeneration + 15;
        return this.costs.imageGeneration;
      
      case 'videoGeneration':
        const baseCost = this.costs.videoGeneration;
        const durationMultiplier = Math.ceil((options.duration || 10) / 10);
        return baseCost * durationMultiplier;
      
      case 'audioGeneration':
        const audioCost = this.costs.audioGeneration;
        const audioMultiplier = Math.ceil((options.duration || 30) / 30);
        return audioCost * audioMultiplier;
      
      case 'chatbotQuery':
        return 0; // Free for all users
      
      default:
        return 0;
    }
  }

  async logTransaction(userId, operation, cost, details) {
    await this.firebase.collection('credit_transactions').add({
      tenantId: this.tenantId,
      userId,
      operation,
      cost,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  async getCreditHistory(userId, limit = 50) {
    const user = await this.firebase.getUser(userId);
    const history = user.creditHistory || [];
    
    return history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getTenantUsageStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshot = await this.firebase.collection('credit_transactions')
      .where('tenantId', '==', this.tenantId)
      .where('timestamp', '>=', startDate)
      .get();

    const stats = {
      totalTransactions: snapshot.size,
      totalCreditsUsed: 0,
      operationStats: {},
      dailyUsage: {}
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      const operation = data.operation;
      const cost = Math.abs(data.cost);
      
      stats.totalCreditsUsed += cost;
      
      if (!stats.operationStats[operation]) {
        stats.operationStats[operation] = { count: 0, totalCost: 0 };
      }
      
      stats.operationStats[operation].count++;
      stats.operationStats[operation].totalCost += cost;
    });

    return stats;
  }
}

module.exports = CreditManager;
```

### 2. AI Service Wrapper

```javascript
// services/ai-service-wrapper.js
const OpenAI = require('openai');

class AIServiceWrapper {
  constructor(serviceFactory, creditManager, config) {
    this.serviceFactory = serviceFactory;
    this.creditManager = creditManager;
    this.config = config;
    
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
  }

  async generateImage(userId, prompt, options = {}) {
    // Check and deduct credits
    const deduction = await this.creditManager.deductCredits(userId, 'imageGeneration', options);
    
    try {
      const response = await this.openai.images.generate({
        model: options.model || "dall-e-3",
        prompt: prompt,
        n: options.count || 1,
        size: options.size || "1024x1024",
        quality: options.quality || "standard"
      });

      // Upload to tenant S3
      const s3Service = this.serviceFactory.getS3Service();
      const imageUrls = [];

      for (const image of response.data) {
        // Download image from OpenAI
        const imageResponse = await fetch(image.url);
        const imageBuffer = await imageResponse.buffer();
        
        // Upload to tenant S3
        const key = `ai-generated/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
        const uploadResult = await s3Service.uploadFile(
          { buffer: imageBuffer, mimetype: 'image/png' },
          key,
          { metadata: { prompt, userId, operation: 'imageGeneration' } }
        );
        
        imageUrls.push(uploadResult.url);
      }

      return {
        success: true,
        images: imageUrls,
        creditsUsed: deduction.cost,
        creditsRemaining: deduction.remaining,
        prompt: prompt
      };
      
    } catch (error) {
      // Refund credits on failure
      await this.creditManager.addCredits(userId, deduction.cost, 'Image Generation Refund');
      
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  async generateVideo(userId, prompt, options = {}) {
    const deduction = await this.creditManager.deductCredits(userId, 'videoGeneration', options);
    
    try {
      // Use recovered video generation code from wavelength-video-generator.js
      const videoGenerator = require('../recovered-content-creator-code/wavelength-video-generator');
      
      const generator = new videoGenerator.WavelengthVideoGenerator({
        apiKey: this.config.geminiApiKey
      });

      const result = await generator.generateVideo(prompt, options);
      
      // Upload to tenant S3
      const s3Service = this.serviceFactory.getS3Service();
      const key = `ai-generated/videos/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`;
      
      const uploadResult = await s3Service.uploadFile(
        result.videoBuffer,
        key,
        { 
          contentType: 'video/mp4',
          metadata: { prompt, userId, operation: 'videoGeneration' }
        }
      );

      return {
        success: true,
        videoUrl: uploadResult.url,
        creditsUsed: deduction.cost,
        creditsRemaining: deduction.remaining,
        prompt: prompt,
        duration: options.duration || 10
      };
      
    } catch (error) {
      // Refund credits on failure
      await this.creditManager.addCredits(userId, deduction.cost, 'Video Generation Refund');
      
      throw new Error(`Video generation failed: ${error.message}`);
    }
  }

  async queryChatbot(userId, query, context = {}) {
    // Chatbot is free - no credit deduction
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for ${context.siteName}. 
                     Help users with questions about ${context.terminology?.season}s, 
                     ${context.terminology?.episode}s, ${context.terminology?.character}s, 
                     and ${context.terminology?.loreObject}s.`
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 500
      });

      return {
        success: true,
        response: response.choices[0].message.content,
        creditsUsed: 0,
        model: "gpt-4"
      };
      
    } catch (error) {
      throw new Error(`Chatbot query failed: ${error.message}`);
    }
  }
}

module.exports = AIServiceWrapper;
```

---

## 🚀 SITE PROVISIONING AUTOMATION

### 1. Site Provisioning Script

```javascript
// scripts/provision-site.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const multiTenantConfig = require('../config/multi-tenant');

class SiteProvisioner {
  constructor() {
    this.provisioningLog = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    this.provisioningLog.push(logEntry);
  }

  async provisionNewSite(config) {
    const startTime = Date.now();
    
    try {
      this.log(`🌟 Starting provisioning for site: ${config.tenantId}`);
      
      // 1. Validate configuration
      await this.validateConfig(config);
      this.log('✅ Configuration validated');
      
      // 2. Create tenant configuration file
      await this.createTenantConfig(config);
      this.log('✅ Tenant configuration created');
      
      // 3. Set up environment variables
      await this.setupEnvironmentVariables(config);
      this.log('✅ Environment variables configured');
      
      // 4. Initialize database structure
      await this.initializeTenantDatabase(config);
      this.log('✅ Database structure initialized');
      
      // 5. Set up S3 bucket structure
      await this.setupS3Structure(config);
      this.log('✅ S3 structure created');
      
      // 6. Configure DNS (if custom domain)
      if (config.customDomain) {
        await this.configureDNS(config);
        this.log('✅ DNS configured');
      }
      
      // 7. Create initial admin user
      await this.createAdminUser(config);
      this.log('✅ Admin user created');
      
      // 8. Generate welcome package
      const welcomePackage = await this.generateWelcomePackage(config);
      this.log('✅ Welcome package generated');
      
      // 9. Run health checks
      await this.runHealthChecks(config);
      this.log('✅ Health checks passed');
      
      const duration = Date.now() - startTime;
      this.log(`🎉 Site provisioning completed in ${duration}ms`);
      
      return {
        success: true,
        tenantId: config.tenantId,
        url: config.customDomain || `${config.tenantId}.wavelengthplatform.com`,
        adminUrl: `${config.customDomain || config.tenantId + '.wavelengthplatform.com'}/loremaster/dashboard`,
        credentials: welcomePackage.credentials,
        provisioningTime: duration,
        log: this.provisioningLog
      };
      
    } catch (error) {
      this.log(`❌ Provisioning failed: ${error.message}`);
      
      // Attempt cleanup
      try {
        await this.cleanup(config.tenantId);
        this.log('🧹 Cleanup completed');
      } catch (cleanupError) {
        this.log(`⚠️ Cleanup warning: ${cleanupError.message}`);
      }
      
      throw error;
    }
  }

  async validateConfig(config) {
    const required = ['tenantId', 'loreMaster', 'template', 'externalAccounts'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    // Validate tenant ID format
    if (!/^[a-z0-9-]+$/.test(config.tenantId)) {
      throw new Error('Tenant ID must contain only lowercase letters, numbers, and hyphens');
    }
    
    // Check if tenant already exists
    const configPath = path.join(__dirname, '../config/tenant-configs', `${config.tenantId}.js`);
    if (fs.existsSync(configPath)) {
      throw new Error(`Tenant ${config.tenantId} already exists`);
    }
    
    // Validate external accounts
    const accounts = config.externalAccounts;
    if (!accounts.firebase?.projectId || !accounts.aws?.accessKeyId || 
        !accounts.stripe?.secretKey || !accounts.printify?.apiKey) {
      throw new Error('All external service accounts must be provided');
    }
  }

  async createTenantConfig(config) {
    const template = multiTenantConfig.templates[config.template];
    if (!template) {
      throw new Error(`Template not found: ${config.template}`);
    }
    
    const tenantConfig = {
      ...template,
      tenantId: config.tenantId,
      template: config.template,
      branding: {
        ...template.branding,
        ...config.branding
      },
      loreMaster: config.loreMaster,
      createdAt: new Date().toISOString(),
      customDomain: config.customDomain
    };
    
    await multiTenantConfig.saveTenantConfig(config.tenantId, tenantConfig);
  }

  async setupEnvironmentVariables(config) {
    const envLines = [];
    const accounts = config.externalAccounts;
    const tenantPrefix = config.tenantId.toUpperCase();
    
    // Firebase
    envLines.push(`${tenantPrefix}_FIREBASE_PROJECT_ID=${accounts.firebase.projectId}`);
    envLines.push(`${tenantPrefix}_FIREBASE_API_KEY=${accounts.firebase.apiKey}`);
    envLines.push(`${tenantPrefix}_FIREBASE_CLIENT_EMAIL=${accounts.firebase.clientEmail}`);
    envLines.push(`${tenantPrefix}_FIREBASE_PRIVATE_KEY=${accounts.firebase.privateKey}`);
    envLines.push(`${tenantPrefix}_FIREBASE_DATABASE_URL=${accounts.firebase.databaseURL}`);
    
    // AWS
    envLines.push(`${tenantPrefix}_AWS_ACCESS_KEY_ID=${accounts.aws.accessKeyId}`);
    envLines.push(`${tenantPrefix}_AWS_SECRET_ACCESS_KEY=${accounts.aws.secretAccessKey}`);
    envLines.push(`${tenantPrefix}_AWS_REGION=${accounts.aws.region}`);
    envLines.push(`${tenantPrefix}_S3_BUCKET=${accounts.aws.s3Bucket}`);
    
    // Stripe
    envLines.push(`${tenantPrefix}_STRIPE_SECRET_KEY=${accounts.stripe.secretKey}`);
    envLines.push(`${tenantPrefix}_STRIPE_PUBLISHABLE_KEY=${accounts.stripe.publishableKey}`);
    
    // Printify
    envLines.push(`${tenantPrefix}_PRINTIFY_API_KEY=${accounts.printify.apiKey}`);
    envLines.push(`${tenantPrefix}_PRINTIFY_SHOP_ID=${accounts.printify.shopId}`);
    
    // Append to .env file
    const envPath = path.join(__dirname, '../.env');
    fs.appendFileSync(envPath, '\n' + envLines.join('\n') + '\n');
  }

  async initializeTenantDatabase(config) {
    // Create service factory to initialize database
    const tenantConfig = await multiTenantConfig.getTenantConfig(config.tenantId);
    const TenantServiceFactory = require('../services/tenant-service-factory');
    const serviceFactory = new TenantServiceFactory(config.tenantId, tenantConfig);
    
    const firebase = serviceFactory.getFirebaseService();
    
    // Create initial collections with proper structure
    await firebase.collection('settings').doc('site').set({
      tenantId: config.tenantId,
      initialized: true,
      createdAt: new Date(),
      version: '1.0.0'
    });
    
    // Initialize user roles collection
    await firebase.collection('user_roles').doc('loremaster').set({
      role: 'loremaster',
      permissions: ['admin', 'content_edit', 'user_manage', 'config_edit'],
      userId: null // Will be set when admin user is created
    });
  }

  async setupS3Structure(config) {
    const tenantConfig = await multiTenantConfig.getTenantConfig(config.tenantId);
    const TenantServiceFactory = require('../services/tenant-service-factory');
    const serviceFactory = new TenantServiceFactory(config.tenantId, tenantConfig);
    
    const s3 = serviceFactory.getS3Service();
    
    // Create initial folder structure
    const folders = [
      'assets/branding/',
      'assets/content/',
      'user-uploads/',
      'ai-generated/images/',
      'ai-generated/videos/',
      'merchandise/products/',
      'backups/'
    ];
    
    for (const folder of folders) {
      await s3.uploadFile(
        Buffer.from(''), 
        `${folder}.gitkeep`,
        { contentType: 'text/plain' }
      );
    }
  }

  async createAdminUser(config) {
    const tenantConfig = await multiTenantConfig.getTenantConfig(config.tenantId);
    const TenantServiceFactory = require('../services/tenant-service-factory');
    const serviceFactory = new TenantServiceFactory(config.tenantId, tenantConfig);
    
    const firebase = serviceFactory.getFirebaseService();
    const creditManager = serviceFactory.getCreditManager();
    
    // Create LoreMaster user
    const adminUser = await firebase.createUser({
      email: config.loreMaster.email,
      name: config.loreMaster.name,
      role: 'loremaster',
      credits: 1000, // Initial credit allocation
      createdAt: new Date(),
      isActive: true
    });
    
    // Update user roles
    await firebase.collection('user_roles').doc('loremaster').update({
      userId: adminUser.id
    });
    
    config.loreMaster.userId = adminUser.id;
  }

  async generateWelcomePackage(config) {
    const temporaryPassword = this.generateSecurePassword();
    const loginUrl = config.customDomain 
      ? `https://${config.customDomain}/auth/login`
      : `https://${config.tenantId}.wavelengthplatform.com/auth/login`;
    
    const dashboardUrl = config.customDomain 
      ? `https://${config.customDomain}/loremaster/dashboard`
      : `https://${config.tenantId}.wavelengthplatform.com/loremaster/dashboard`;
    
    return {
      credentials: {
        email: config.loreMaster.email,
        temporaryPassword: temporaryPassword,
        loginUrl: loginUrl,
        dashboardUrl: dashboardUrl
      },
      initialCredits: 1000,
      setupGuide: this.generateSetupGuide(config)
    };
  }

  generateSecurePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async runHealthChecks(config) {
    // Test Firebase connection
    const tenantConfig = await multiTenantConfig.getTenantConfig(config.tenantId);
    const TenantServiceFactory = require('../services/tenant-service-factory');
    const serviceFactory = new TenantServiceFactory(config.tenantId, tenantConfig);
    
    // Test all services
    const firebase = serviceFactory.getFirebaseService();
    await firebase.collection('settings').doc('health-check').set({ 
      timestamp: new Date(),
      status: 'healthy'
    });
    
    const s3 = serviceFactory.getS3Service();
    await s3.uploadFile(
      Buffer.from('health-check'),
      'health-check.txt',
      { contentType: 'text/plain' }
    );
    
    // Clean up test files
    await firebase.collection('settings').doc('health-check').delete();
    await s3.deleteFile('health-check.txt');
  }

  async cleanup(tenantId) {
    // Remove tenant configuration file
    const configPath = path.join(__dirname, '../config/tenant-configs', `${tenantId}.js`);
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    // Remove environment variables (more complex - would need to parse and rewrite .env)
    this.log(`Manual cleanup required: Remove ${tenantId.toUpperCase()}_* variables from .env`);
  }
}

module.exports = SiteProvisioner;

// CLI Usage
if (require.main === module) {
  const config = require(process.argv[2]); // JSON config file path
  const provisioner = new SiteProvisioner();
  
  provisioner.provisionNewSite(config)
    .then(result => {
      console.log('\n🎉 Site provisioning successful!');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('\n❌ Site provisioning failed:', error.message);
      process.exit(1);
    });
}
```

---

## 🧪 COMPREHENSIVE TESTING STRATEGY

### 1. Tenant Isolation Tests

```javascript
// tests/multi-tenant/tenant-isolation.test.js
const request = require('supertest');
const app = require('../../app');

describe('Tenant Isolation', () => {
  let tenantAApp, tenantBApp;
  
  beforeAll(async () => {
    // Create test apps with different tenant configurations
    tenantAApp = createTestApp('tenant-a');
    tenantBApp = createTestApp('tenant-b');
  });

  describe('Data Isolation', () => {
    test('Tenant A cannot access Tenant B Firebase data', async () => {
      // Create data in Tenant A
      await tenantAApp.firebase.createUser({
        email: 'user@tenant-a.com',
        name: 'Tenant A User'
      });
      
      // Try to access from Tenant B
      const users = await tenantBApp.firebase.collection('users').get();
      expect(users.docs).toHaveLength(0);
    });

    test('Tenant A cannot access Tenant B S3 files', async () => {
      // Upload file to Tenant A
      await tenantAApp.s3.uploadFile(
        Buffer.from('secret data'),
        'secret.txt'
      );
      
      // Try to access from Tenant B
      await expect(
        tenantBApp.s3.deleteFile('secret.txt')
      ).rejects.toThrow('Access denied');
    });

    test('API endpoints respect tenant boundaries', async () => {
      // Set tenant A header
      const responseA = await request(app)
        .get('/api/users')
        .set('X-Tenant-ID', 'tenant-a')
        .expect(200);
      
      // Set tenant B header
      const responseB = await request(app)
        .get('/api/users')
        .set('X-Tenant-ID', 'tenant-b')
        .expect(200);
      
      // Responses should be different
      expect(responseA.body).not.toEqual(responseB.body);
    });
  });

  describe('Configuration Isolation', () => {
    test('Tenants have independent configurations', async () => {
      const configA = await multiTenantConfig.getTenantConfig('tenant-a');
      const configB = await multiTenantConfig.getTenantConfig('tenant-b');
      
      expect(configA.tenantId).toBe('tenant-a');
      expect(configB.tenantId).toBe('tenant-b');
      expect(configA.branding).not.toEqual(configB.branding);
    });

    test('Feature toggles work independently', async () => {
      // Enable forum for tenant A only
      await request(app)
        .post('/loremaster/update-config')
        .set('X-Tenant-ID', 'tenant-a')
        .send({ features: { forum: { enabled: true } } })
        .expect(200);
      
      // Forum should be accessible for tenant A
      await request(app)
        .get('/forum')
        .set('X-Tenant-ID', 'tenant-a')
        .expect(200);
      
      // Forum should not be accessible for tenant B
      await request(app)
        .get('/forum')
        .set('X-Tenant-ID', 'tenant-b')
        .expect(404);
    });
  });
});
```

### 2. Performance Tests

```javascript
// tests/performance/multi-tenant-load.test.js
const { performance } = require('perf_hooks');

describe('Multi-Tenant Performance', () => {
  test('Concurrent tenant access', async () => {
    const tenantCount = 20;
    const requestsPerTenant = 10;
    
    const startTime = performance.now();
    
    const tenantPromises = Array.from({ length: tenantCount }, (_, i) => {
      const tenantId = `load-test-${i}`;
      
      return Promise.all(
        Array.from({ length: requestsPerTenant }, () => 
          request(app)
            .get('/dashboard')
            .set('X-Tenant-ID', tenantId)
        )
      );
    });
    
    await Promise.all(tenantPromises);
    
    const duration = performance.now() - startTime;
    
    // Should handle 200 concurrent requests across 20 tenants in <10 seconds
    expect(duration).toBeLessThan(10000);
  });

  test('Memory usage with multiple tenants', async () => {
    const initialMemory = process.memoryUsage();
    
    // Create 50 tenant service factories
    const factories = Array.from({ length: 50 }, (_, i) => 
      new TenantServiceFactory(`test-tenant-${i}`, mockConfig)
    );
    
    // Initialize all services
    factories.forEach(factory => {
      factory.getFirebaseService();
      factory.getStripeService();
      factory.getS3Service();
    });
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 500MB for 50 tenants)
    expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024);
  });
});
```

### 3. Site Provisioning Tests

```javascript
// tests/integration/site-provisioning.test.js
const SiteProvisioner = require('../../scripts/provision-site');

describe('Site Provisioning', () => {
  let provisioner;
  
  beforeEach(() => {
    provisioner = new SiteProvisioner();
  });

  test('Complete site provisioning workflow', async () => {
    const config = {
      tenantId: 'test-music-site',
      template: 'music-site',
      loreMaster: {
        name: 'Test LoreMaster',
        email: 'test@example.com'
      },
      branding: {
        siteName: 'Test Music Lore',
        primaryColor: '#FF6B6B'
      },
      externalAccounts: {
        firebase: { /* test credentials */ },
        aws: { /* test credentials */ },
        stripe: { /* test credentials */ },
        printify: { /* test credentials */ }
      }
    };
    
    const result = await provisioner.provisionNewSite(config);
    
    expect(result.success).toBe(true);
    expect(result.tenantId).toBe('test-music-site');
    expect(result.url).toContain('test-music-site');
    expect(result.provisioningTime).toBeLessThan(300000); // 5 minutes max
    
    // Verify site is accessible
    const response = await request(app)
      .get('/')
      .set('X-Tenant-ID', 'test-music-site');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('Test Music Lore');
  });

  test('Provisioning validation catches errors', async () => {
    const invalidConfig = {
      tenantId: 'Invalid ID!', // Invalid characters
      // Missing required fields
    };
    
    await expect(
      provisioner.provisionNewSite(invalidConfig)
    ).rejects.toThrow('Tenant ID must contain only lowercase letters');
  });

  test('Cleanup works on provisioning failure', async () => {
    const config = {
      tenantId: 'cleanup-test',
      // Intentionally missing required fields to cause failure
    };
    
    await expect(
      provisioner.provisionNewSite(config)
    ).rejects.toThrow();
    
    // Verify cleanup occurred
    const configPath = path.join(__dirname, '../../config/tenant-configs/cleanup-test.js');
    expect(fs.existsSync(configPath)).toBe(false);
  });
});
```

This technical specification provides the detailed implementation framework for your multi-site replication system. The modular architecture ensures proper tenant isolation, scalable performance, and maintainable code while supporting your goal of 2 sites per day deployment velocity.