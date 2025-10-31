# 🌐 WAVELENGTH MULTI-SITE REPLICATION ARCHITECTURE

**Project Goal:** Replicate Wavelength Lore site architecture for multiple independent LoreMasters  
**Target Velocity:** 2 sites per day  
**Assessment Date:** October 31, 2025  

---

## 📋 EXECUTIVE SUMMARY

This document outlines a comprehensive architecture for replicating the Wavelength Lore platform across multiple independent sites with:

- **Site Template System** - Customizable branding, themes, and content
- **Data Separation** - Isolated AWS, Firebase, Stripe, and Printify accounts
- **Feature Customization** - Configurable components (Forum, Merch, AI, Games, Quests, Badges)
- **Automated Onboarding** - Guided setup for LoreMasters
- **Cost Management** - Credit-based AI generation system
- **Maintenance Tools** - Self-service content and configuration management

---

## 🎯 CORE REQUIREMENTS ANALYSIS

### 1. Site Template System
**Current State:** ✅ Strong foundation exists
- Game themes system (`config/game-themes.js`)
- Product templates (`config/productTemplates.js`)
- Middleware template locals (`config/middleware.js`)
- CTA system customization (`static/js/wavelength-cta-system.js`)

### 2. Account/Data Separation
**Current State:** ⚠️ Partial - needs multi-tenancy
- Environment variable system exists
- Firebase admin utils support multiple projects
- AWS config helpers with environment support
- Stripe service ready for multiple accounts

### 3. Feature Customization
**Current State:** ✅ Good foundation
- Games: Theme switching system
- Forum: Category management
- Merch: Product template system
- AI: Modular services architecture
- Badges/Quests: NPC quest engine exists

### 4. Content Terminology
**Current State:** ⚠️ Hard-coded terms need abstraction
- Season/Episode → Album/Song mapping needed
- Character → Singer mapping needed
- Lore Object → Musical Equipment mapping needed

---

## 🏗️ IMPLEMENTATION ARCHITECTURE

### Phase 1: Site Template Foundation (Week 1-2)

#### 1.1 Site Configuration System
```javascript
// config/site-template.js
module.exports = {
  siteId: 'wavelength-music',
  branding: {
    siteName: 'Wavelength Music Lore',
    tagline: 'Where Music Tells Stories',
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    logoUrl: '/assets/branding/logo.png',
    faviconUrl: '/assets/branding/favicon.ico',
    fontFamily: 'Inter, sans-serif'
  },
  terminology: {
    season: 'album',
    episode: 'song', 
    character: 'artist',
    loreObject: 'instrument'
  },
  features: {
    forum: { enabled: true, categories: ['general', 'music', 'theory'] },
    merchandise: { enabled: true, products: ['apparel', 'home'] },
    chatbot: { enabled: true, freeCredits: 100 },
    games: { enabled: true, themes: ['music', 'rhythm'] },
    quests: { enabled: false },
    badges: { enabled: false }
  },
  pages: {
    about: {
      title: 'About Our Music Universe',
      content: 'Welcome to a world where every note tells a story...'
    },
    contact: {
      email: 'support@wavelengthmusic.com',
      social: {
        twitter: '@wavelengthmusic',
        instagram: '@wavelength_music'
      }
    }
  }
};
```

#### 1.2 Multi-Tenant Environment System
```javascript
// config/tenant-config.js
class TenantConfigManager {
  constructor(tenantId) {
    this.tenantId = tenantId;
    this.loadTenantConfig();
  }

  loadTenantConfig() {
    // Load tenant-specific environment variables
    const tenantEnvPath = `.env.${this.tenantId}`;
    
    this.config = {
      firebase: {
        projectId: process.env[`${this.tenantId.toUpperCase()}_FIREBASE_PROJECT_ID`],
        apiKey: process.env[`${this.tenantId.toUpperCase()}_FIREBASE_API_KEY`],
        // ... all Firebase configs
      },
      aws: {
        accessKeyId: process.env[`${this.tenantId.toUpperCase()}_AWS_ACCESS_KEY_ID`],
        secretAccessKey: process.env[`${this.tenantId.toUpperCase()}_AWS_SECRET_ACCESS_KEY`],
        region: process.env[`${this.tenantId.toUpperCase()}_AWS_REGION`] || 'us-east-1',
        s3Bucket: process.env[`${this.tenantId.toUpperCase()}_S3_BUCKET`]
      },
      stripe: {
        publishableKey: process.env[`${this.tenantId.toUpperCase()}_STRIPE_PUBLISHABLE_KEY`],
        secretKey: process.env[`${this.tenantId.toUpperCase()}_STRIPE_SECRET_KEY`]
      },
      printify: {
        apiKey: process.env[`${this.tenantId.toUpperCase()}_PRINTIFY_API_KEY`],
        shopId: process.env[`${this.tenantId.toUpperCase()}_PRINTIFY_SHOP_ID`]
      }
    };
  }

  getServiceConfig(service) {
    return this.config[service];
  }
}
```

### Phase 2: Data Isolation Architecture (Week 2-3)

#### 2.1 Service Factory Pattern
```javascript
// services/tenant-service-factory.js
class TenantServiceFactory {
  constructor(tenantId) {
    this.tenantId = tenantId;
    this.tenantConfig = new TenantConfigManager(tenantId);
    this.services = {};
  }

  getFirebaseService() {
    if (!this.services.firebase) {
      const config = this.tenantConfig.getServiceConfig('firebase');
      this.services.firebase = new TenantFirebaseService(config);
    }
    return this.services.firebase;
  }

  getStripeService() {
    if (!this.services.stripe) {
      const config = this.tenantConfig.getServiceConfig('stripe');
      this.services.stripe = new TenantStripeService(config);
    }
    return this.services.stripe;
  }

  getPrintifyService() {
    if (!this.services.printify) {
      const config = this.tenantConfig.getServiceConfig('printify');
      this.services.printify = new TenantPrintifyService(config);
    }
    return this.services.printify;
  }

  getS3Service() {
    if (!this.services.s3) {
      const config = this.tenantConfig.getServiceConfig('aws');
      this.services.s3 = new TenantS3Service(config);
    }
    return this.services.s3;
  }
}
```

#### 2.2 Tenant Middleware
```javascript
// middleware/tenant-middleware.js
function tenantMiddleware(req, res, next) {
  // Extract tenant from subdomain or domain
  const host = req.get('host');
  const tenantId = extractTenantId(host);
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Invalid tenant' });
  }

  // Initialize tenant services
  req.tenantId = tenantId;
  req.tenantServices = new TenantServiceFactory(tenantId);
  req.siteConfig = loadSiteTemplate(tenantId);

  // Add tenant-specific template locals
  res.locals.siteConfig = req.siteConfig;
  res.locals.tenantId = tenantId;
  res.locals.terminology = req.siteConfig.terminology;

  next();
}

function extractTenantId(host) {
  // Support multiple patterns:
  // musiclore.wavelengthplatform.com -> musiclore
  // wavelengthmusic.com -> wavelengthmusic
  // localhost:3001 -> development (for testing)
  
  if (host.includes('localhost')) return 'development';
  
  const parts = host.split('.');
  if (parts.length >= 3 && parts[1] === 'wavelengthplatform') {
    return parts[0]; // subdomain pattern
  }
  
  return parts[0]; // custom domain pattern
}
```

### Phase 3: Feature Toggle System (Week 3-4)

#### 3.1 Feature Manager
```javascript
// utils/feature-manager.js
class FeatureManager {
  constructor(siteConfig) {
    this.features = siteConfig.features;
  }

  isEnabled(feature) {
    return this.features[feature]?.enabled || false;
  }

  getFeatureConfig(feature) {
    return this.features[feature] || { enabled: false };
  }

  // Middleware to conditionally load routes
  requireFeature(featureName) {
    return (req, res, next) => {
      if (!this.isEnabled(featureName)) {
        return res.status(404).json({ 
          error: `Feature '${featureName}' not available on this site` 
        });
      }
      next();
    };
  }
}

// Usage in routes
// router.use('/forum', featureManager.requireFeature('forum'));
// router.use('/merchandise', featureManager.requireFeature('merchandise'));
```

#### 3.2 Conditional Route Loading
```javascript
// app.js - Dynamic route loading
function loadRoutes(app, siteConfig) {
  const featureManager = new FeatureManager(siteConfig);

  // Core routes (always loaded)
  app.use('/', require('./routes/index'));
  app.use('/auth', require('./routes/auth'));

  // Conditional routes based on site configuration
  if (featureManager.isEnabled('forum')) {
    app.use('/forum', require('./routes/forum'));
  }

  if (featureManager.isEnabled('merchandise')) {
    app.use('/merchandise', require('./routes/merchandise'));
  }

  if (featureManager.isEnabled('games')) {
    app.use('/games', require('./routes/games'));
  }

  if (featureManager.isEnabled('chatbot')) {
    app.use('/chatbot', require('./routes/chatbot'));
  }
}
```

### Phase 4: Content Management System (Week 4-5)

#### 4.1 LoreMaster Dashboard
```javascript
// routes/loremaster-dashboard.js
router.get('/dashboard', requireLoreMaster, (req, res) => {
  const siteConfig = req.siteConfig;
  const stats = {
    totalUsers: 0, // from tenant Firebase
    totalContent: 0, // from tenant database
    monthlyRevenue: 0, // from tenant Stripe
    aiCreditsRemaining: 0 // from credit system
  };

  res.render('loremaster/dashboard', {
    siteConfig,
    stats,
    features: siteConfig.features
  });
});

router.post('/update-config', requireLoreMaster, async (req, res) => {
  const { branding, features, terminology, pages } = req.body;
  
  // Validate and update site configuration
  const updatedConfig = {
    ...req.siteConfig,
    branding: { ...req.siteConfig.branding, ...branding },
    features: { ...req.siteConfig.features, ...features },
    terminology: { ...req.siteConfig.terminology, ...terminology },
    pages: { ...req.siteConfig.pages, ...pages }
  };

  await saveSiteConfig(req.tenantId, updatedConfig);
  res.json({ success: true });
});
```

#### 4.2 Content Editor
```javascript
// Content management for terminology and pages
router.post('/update-content', requireLoreMaster, async (req, res) => {
  const { pageId, content } = req.body;
  
  // Update page content in tenant database
  await req.tenantServices.getFirebaseService()
    .updatePageContent(pageId, content);
  
  res.json({ success: true });
});

router.post('/upload-assets', requireLoreMaster, upload.array('assets'), async (req, res) => {
  const s3Service = req.tenantServices.getS3Service();
  const uploadPromises = req.files.map(file => 
    s3Service.uploadAsset(file, req.tenantId)
  );
  
  const results = await Promise.all(uploadPromises);
  res.json({ success: true, assets: results });
});
```

### Phase 5: AI Credit System (Week 5-6)

#### 5.1 Credit Manager
```javascript
// services/credit-manager.js
class CreditManager {
  constructor(tenantFirebaseService) {
    this.firebase = tenantFirebaseService;
  }

  async getUserCredits(userId) {
    const userDoc = await this.firebase.getUser(userId);
    return userDoc?.credits || 0;
  }

  async deductCredits(userId, amount, operation) {
    const currentCredits = await this.getUserCredits(userId);
    
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }

    await this.firebase.updateUser(userId, {
      credits: currentCredits - amount,
      creditHistory: firebase.firestore.FieldValue.arrayUnion({
        operation,
        amount: -amount,
        timestamp: new Date(),
        balance: currentCredits - amount
      })
    });
  }

  async addCredits(userId, amount, reason) {
    const currentCredits = await this.getUserCredits(userId);
    
    await this.firebase.updateUser(userId, {
      credits: currentCredits + amount,
      creditHistory: firebase.firestore.FieldValue.arrayUnion({
        operation: reason,
        amount: amount,
        timestamp: new Date(),
        balance: currentCredits + amount
      })
    });
  }
}
```

#### 5.2 AI Service Wrapper
```javascript
// services/ai-service-wrapper.js
class AIServiceWrapper {
  constructor(tenantServices, creditManager) {
    this.services = tenantServices;
    this.creditManager = creditManager;
    this.costs = {
      imageGeneration: 10, // credits per image
      videoGeneration: 50, // credits per video
      audioGeneration: 25  // credits per audio
    };
  }

  async generateImage(userId, prompt, options = {}) {
    await this.creditManager.deductCredits(userId, this.costs.imageGeneration, 'Image Generation');
    
    try {
      const result = await this.services.getAIService().generateImage(prompt, options);
      return { success: true, ...result };
    } catch (error) {
      // Refund credits on failure
      await this.creditManager.addCredits(userId, this.costs.imageGeneration, 'Image Generation Refund');
      throw error;
    }
  }

  async generateVideo(userId, prompt, options = {}) {
    await this.creditManager.deductCredits(userId, this.costs.videoGeneration, 'Video Generation');
    
    try {
      const result = await this.services.getAIService().generateVideo(prompt, options);
      return { success: true, ...result };
    } catch (error) {
      await this.creditManager.addCredits(userId, this.costs.videoGeneration, 'Video Generation Refund');
      throw error;
    }
  }
}
```

---

## 🚀 DEPLOYMENT AUTOMATION

### Site Provisioning Pipeline
```javascript
// scripts/provision-new-site.js
class SiteProvisioner {
  async createNewSite(config) {
    const { 
      tenantId, 
      loreMaster, 
      branding, 
      features, 
      terminology,
      externalAccounts 
    } = config;

    console.log(`🌟 Provisioning new site: ${tenantId}`);

    // 1. Create tenant configuration
    await this.createTenantConfig(tenantId, config);

    // 2. Set up external service accounts
    await this.setupExternalServices(tenantId, externalAccounts);

    // 3. Initialize database structure
    await this.initializeTenantDatabase(tenantId);

    // 4. Deploy site assets
    await this.deploySiteAssets(tenantId, branding);

    // 5. Configure DNS (if custom domain)
    if (config.customDomain) {
      await this.configureDNS(tenantId, config.customDomain);
    }

    // 6. Send welcome package to LoreMaster
    await this.sendWelcomePackage(loreMaster, tenantId);

    return {
      tenantId,
      url: config.customDomain || `${tenantId}.wavelengthplatform.com`,
      adminUrl: `${tenantId}.wavelengthplatform.com/loremaster/dashboard`,
      credentials: {
        masterEmail: loreMaster.email,
        temporaryPassword: generateSecurePassword()
      }
    };
  }
}
```

---

## 🧪 TESTING STRATEGY

### 1. Multi-Tenant Testing Framework
```javascript
// tests/multi-tenant/tenant-isolation.test.js
describe('Tenant Isolation', () => {
  test('Tenant A cannot access Tenant B data', async () => {
    const tenantA = createTestTenant('music-site');
    const tenantB = createTestTenant('art-site');
    
    // Create data in Tenant A
    await tenantA.firebase.createPost({ title: 'Music Post' });
    
    // Attempt to access from Tenant B
    const posts = await tenantB.firebase.getPosts();
    expect(posts).not.toContainEqual(
      expect.objectContaining({ title: 'Music Post' })
    );
  });
});
```

### 2. Feature Toggle Testing
```javascript
// tests/features/feature-toggles.test.js
describe('Feature Toggles', () => {
  test('Disabled features return 404', async () => {
    const config = { features: { forum: { enabled: false } } };
    const app = createTestApp(config);
    
    const response = await request(app).get('/forum');
    expect(response.status).toBe(404);
  });
});
```

### 3. Performance Testing
```javascript
// tests/performance/multi-tenant-load.test.js
describe('Multi-Tenant Performance', () => {
  test('10 tenants concurrent access', async () => {
    const tenants = Array.from({length: 10}, (_, i) => 
      createTestTenant(`tenant-${i}`)
    );
    
    const startTime = Date.now();
    
    const requests = tenants.map(tenant => 
      request(tenant.app).get('/dashboard')
    );
    
    await Promise.all(requests);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5 second limit
  });
});
```

---

## ⚠️ RISKS & MITIGATION

### High Priority Risks

#### 1. **Data Leakage Between Tenants**
- **Risk:** Tenant A accessing Tenant B's data
- **Mitigation:** 
  - Comprehensive integration tests
  - Database-level isolation validation
  - Regular security audits
- **Testing:** Create test data across tenants and verify isolation

#### 2. **Service Account Limits**
- **Risk:** API rate limits across multiple tenants
- **Mitigation:**
  - Implement request queuing
  - Monitor usage across tenants
  - Graceful degradation strategies
- **Testing:** Load test with multiple tenants hitting API limits

#### 3. **Configuration Drift**
- **Risk:** Sites becoming inconsistent over time
- **Mitigation:**
  - Version controlled configuration templates
  - Automated configuration validation
  - Regular compliance checks
- **Testing:** Compare configurations against master template

#### 4. **Deployment Failures**
- **Risk:** Failed site provisioning breaking existing sites
- **Mitigation:**
  - Isolated provisioning environments
  - Rollback procedures
  - Health checks after deployment
- **Testing:** Simulate provisioning failures and recovery

### Medium Priority Risks

#### 5. **AI Credit System Abuse**
- **Risk:** Users exploiting credit system
- **Mitigation:**
  - Rate limiting per user
  - Usage monitoring and alerts
  - Credit purchase verification
- **Testing:** Automated abuse scenario testing

#### 6. **Performance Degradation**
- **Risk:** Site performance declining with tenant count
- **Mitigation:**
  - Horizontal scaling architecture
  - Database sharding strategies
  - CDN optimization
- **Testing:** Stress testing with increasing tenant count

---

## 📋 IMPLEMENTATION ROADMAP

### Week 1-2: Foundation
- [ ] **Site Template System**
  - Create `SiteConfigManager` class
  - Build template inheritance system
  - Implement branding customization
- [ ] **Multi-Tenant Architecture**
  - Design tenant middleware
  - Create service factory pattern
  - Implement tenant routing

**Testing Checkpoints:**
- [ ] Single tenant can customize branding
- [ ] Multiple tenants have isolated configurations
- [ ] Middleware correctly routes tenant requests

### Week 3-4: Data Isolation
- [ ] **Service Isolation**
  - Implement `TenantServiceFactory`
  - Create isolated Firebase connections
  - Build AWS S3 tenant separation
- [ ] **Feature Toggle System**
  - Create `FeatureManager` class
  - Implement conditional route loading
  - Build feature configuration UI

**Testing Checkpoints:**
- [ ] Tenant A cannot access Tenant B's Firebase data
- [ ] Feature toggles correctly enable/disable functionality
- [ ] Service credentials are properly isolated

### Week 5-6: Management Tools
- [ ] **LoreMaster Dashboard**
  - Build configuration management UI
  - Create content editing interface
  - Implement asset upload system
- [ ] **AI Credit System**
  - Create `CreditManager` service
  - Build credit purchase flow
  - Implement usage tracking

**Testing Checkpoints:**
- [ ] LoreMasters can update site configurations
- [ ] Credit system correctly deducts for AI operations
- [ ] Content changes reflect immediately

### Week 7-8: Automation & Testing
- [ ] **Site Provisioning**
  - Create automated provisioning script
  - Build DNS configuration automation
  - Implement welcome email system
- [ ] **Comprehensive Testing**
  - Multi-tenant isolation tests
  - Performance benchmarking
  - Security validation

**Testing Checkpoints:**
- [ ] New site can be provisioned in under 10 minutes
- [ ] 2 sites per day target is achievable
- [ ] All security requirements are met

### Week 9-10: Production Deployment
- [ ] **Production Infrastructure**
  - Set up staging environment
  - Configure monitoring and logging
  - Implement backup strategies
- [ ] **Documentation & Training**
  - Create LoreMaster onboarding guide
  - Build troubleshooting documentation
  - Record training videos

**Final Validation:**
- [ ] Provision 5 test sites in one day
- [ ] Complete feature matrix testing
- [ ] Performance meets requirements

---

## 💰 COST MANAGEMENT ARCHITECTURE

### Credit System Design
```javascript
// Credit pricing structure
const CREDIT_COSTS = {
  imageGeneration: {
    standard: 10,    // 512x512 image
    hd: 15,          // 1024x1024 image  
    xl: 25           // 2048x2048 image
  },
  videoGeneration: {
    short: 50,       // 10 second video
    medium: 100,     // 30 second video
    long: 200        // 60 second video
  },
  audioGeneration: {
    short: 25,       // 30 second audio
    song: 100        // Full song generation
  }
};

// Base subscription includes
const SUBSCRIPTION_INCLUDES = {
  chatbot: 'unlimited',    // Free for all subscribers
  imageGeneration: 20,     // 20 credits/month included
  videoGeneration: 0,      // Pay per use
  audioGeneration: 0       // Pay per use
};
```

---

## 🔧 MAINTENANCE & SUPPORT SYSTEM

### Self-Service Tools
1. **Configuration Manager** - Update branding, features, terminology
2. **Content Editor** - Manage pages, upload assets, edit text
3. **User Management** - Moderate users, manage permissions
4. **Analytics Dashboard** - Usage statistics, revenue tracking
5. **Credit Management** - Purchase credits, view usage history

### Automated Monitoring
- Site health checks (uptime, performance)
- Credit usage alerts (approaching limits)
- Error monitoring and alerting
- Security scanning and compliance checks

### Support Escalation
- Tier 1: Self-service documentation and tools
- Tier 2: Community forum for LoreMasters
- Tier 3: Direct support for complex issues

---

## 📊 SUCCESS METRICS

### Deployment Velocity
- **Target:** 2 sites per day
- **Measurement:** Time from request to live site
- **Success Criteria:** <4 hours average provisioning time

### System Reliability
- **Target:** 99.9% uptime per tenant
- **Measurement:** Uptime monitoring across all sites
- **Success Criteria:** <1 hour total downtime per month per site

### LoreMaster Satisfaction
- **Target:** 4.5/5 satisfaction rating
- **Measurement:** Monthly surveys and support ticket resolution
- **Success Criteria:** <24 hour support response time

### Revenue per Site
- **Target:** $500/month average per site
- **Measurement:** Stripe revenue tracking per tenant
- **Success Criteria:** 70% of sites profitable within 6 months

---

## 🔮 FUTURE EXTENSIONS

### Advanced Features (Phase 2)
1. **Multi-Language Support** - Internationalization system
2. **Mobile Apps** - React Native app template per tenant
3. **Advanced Analytics** - Custom reporting and insights
4. **API Marketplace** - Third-party integrations
5. **White-Label Licensing** - Complete brand removal option

### Scaling Considerations
- **Database Sharding** - Automatic tenant distribution
- **Geographic Distribution** - Multi-region deployments
- **Auto-Scaling** - Dynamic resource allocation
- **Edge Computing** - CDN optimization per tenant

---

**Next Steps:**
1. Review and approve architecture design
2. Set up development environment for multi-tenant testing
3. Begin Phase 1 implementation with site template system
4. Create first prototype with 2-3 test tenants

This architecture provides a solid foundation for your ambitious goal of 2 sites per day while maintaining security, performance, and LoreMaster satisfaction.