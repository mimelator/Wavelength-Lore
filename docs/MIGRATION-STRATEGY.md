# 🔄 WAVELENGTH LORE MIGRATION STRATEGY

**Document:** Legacy to Modern Platform Migration Plan  
**Project:** Clean Codebase + Unified Shop Implementation  
**Date:** October 31, 2025  

---

## 🎯 MIGRATION PHILOSOPHY: EXTRACT, ENHANCE, SCALE

Instead of retrofitting the existing Wavelength Lore codebase, we'll **extract the valuable patterns and content** while building a modern, multi-tenant platform from scratch. This approach gives us:

✅ **Clean Architecture** - Designed for multi-tenancy from Day 1  
✅ **Modern Technology** - Latest tools and best practices  
✅ **Scalable Foundation** - Built to handle hundreds of sites  
✅ **Maintainable Code** - Clear patterns and comprehensive documentation  
✅ **Performance Optimized** - Fast, responsive, mobile-first  

---

## 📊 CURRENT WAVELENGTH LORE ANALYSIS

### Content Audit (What to Migrate)
```javascript
// migration-tools/content-audit.js
class WavelengthLoreAudit {
  async auditContent() {
    return {
      // High-value content to preserve
      users: {
        count: await this.countUsers(),
        retention: 'Migrate all active users',
        method: 'Firebase export → PostgreSQL import'
      },
      
      forumPosts: {
        count: await this.countForumPosts(),
        retention: 'Migrate all posts and replies',
        method: 'Preserve threading and timestamps'
      },
      
      characters: {
        count: await this.countCharacters(),
        retention: 'Migrate all character data',
        method: 'Transform to new lore object schema'
      },
      
      episodes: {
        count: await this.countEpisodes(),
        retention: 'Migrate all episodes',
        method: 'Update to new content structure'
      },
      
      images: {
        count: await this.countImages(),
        retention: 'Migrate all user-generated images',
        method: 'S3 to S3 with new tenant structure'
      },
      
      gameProgress: {
        count: await this.countGameSaves(),
        retention: 'Optional - user choice',
        method: 'Transform to new game framework'
      }
    };
  }

  async auditFeatures() {
    return {
      // Features to rebuild (with improvements)
      forum: {
        status: 'Rebuild',
        improvements: [
          'Better moderation tools',
          'Real-time notifications', 
          'Advanced search',
          'Mobile optimization',
          'Spam protection'
        ]
      },
      
      merchandise: {
        status: 'Replace with Unified Shop',
        improvements: [
          'Shared Printify integration',
          'Cross-promotion between LoreMasters',
          'Better analytics and reporting',
          'Simplified product creation',
          'Revenue sharing automation'
        ]
      },
      
      games: {
        status: 'Rebuild as Modular Framework',
        improvements: [
          'Plugin architecture',
          'Shared leaderboards',
          'Achievement integration',
          'Mobile compatibility',
          'Real-time multiplayer support'
        ]
      },
      
      aiServices: {
        status: 'Enhance with Credit System',
        improvements: [
          'Usage tracking and billing',
          'Quality controls',
          'Rate limiting',
          'Cost optimization',
          'Multiple AI provider support'
        ]
      },
      
      authentication: {
        status: 'Upgrade to Enterprise',
        improvements: [
          'Auth0 integration',
          'Social login options',
          'Multi-factor authentication',
          'Role-based permissions',
          'SSO for enterprise customers'
        ]
      }
    };
  }
}
```

### Technical Debt Assessment
```javascript
// Current Wavelength Lore limitations to resolve:
const TECHNICAL_DEBT = {
  database: {
    current: 'Firebase Firestore',
    limitations: [
      'Limited multi-tenancy support',
      'Complex queries are expensive',
      'No true ACID transactions',
      'Vendor lock-in concerns',
      'Limited reporting capabilities'
    ],
    solution: 'PostgreSQL with proper multi-tenant design'
  },
  
  architecture: {
    current: 'Monolithic Express app',
    limitations: [
      'Single point of failure',
      'Difficult to scale components independently',
      'Mixed concerns in single codebase',
      'Hard to test in isolation',
      'Deployment complexity'
    ],
    solution: 'Microservices with clear boundaries'
  },
  
  frontend: {
    current: 'Server-rendered EJS templates',
    limitations: [
      'Limited interactivity',
      'Poor mobile experience',
      'Difficult to maintain complex UI',
      'No component reusability',
      'SEO challenges for dynamic content'
    ],
    solution: 'Next.js with modern component architecture'
  },
  
  deployment: {
    current: 'Manual deployment processes',
    limitations: [
      'Error-prone manual steps',
      'No rollback capabilities',
      'Environment inconsistencies',
      'Limited monitoring',
      'Slow iteration cycles'
    ],
    solution: 'Automated CI/CD with Docker and Kubernetes'
  }
};
```

---

## 🏗️ NEW PLATFORM ARCHITECTURE

### Technology Stack Comparison
```javascript
// OLD vs NEW Technology Choices
const TECHNOLOGY_EVOLUTION = {
  database: {
    old: 'Firebase Firestore',
    new: 'PostgreSQL + Redis',
    benefits: [
      'Native multi-tenancy with row-level security',
      'Complex queries with proper indexing',
      'ACID compliance for consistency',
      'Better cost predictability',
      'Rich ecosystem and tooling'
    ]
  },
  
  backend: {
    old: 'Express.js + JavaScript',
    new: 'Express.js + TypeScript + Prisma',
    benefits: [
      'Type safety prevents runtime errors',
      'Better developer experience',
      'Automated database migrations',
      'Generated type definitions',
      'Improved code maintainability'
    ]
  },
  
  frontend: {
    old: 'EJS server-side templates',
    new: 'Next.js + React + TypeScript',
    benefits: [
      'Modern component architecture',
      'Server-side rendering for SEO',
      'Static generation for performance',
      'Rich ecosystem of components',
      'Mobile-first responsive design'
    ]
  },
  
  auth: {
    old: 'Firebase Auth',
    new: 'Auth0 + Custom JWT',
    benefits: [
      'Enterprise-grade security',
      'Multi-provider authentication',
      'Advanced user management',
      'Compliance and audit trails',
      'Scalable pricing model'
    ]
  },
  
  shop: {
    old: 'Individual Printify integrations per site',
    new: 'Unified Shop with revenue sharing',
    benefits: [
      'Single integration to maintain',
      'Cross-promotion opportunities',
      'Better shipping rates',
      'Centralized customer service',
      'Shared marketing efforts'
    ]
  }
};
```

### Database Schema Evolution
```sql
-- NEW: Multi-tenant PostgreSQL Schema
-- Row-level security ensures tenant isolation

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  template VARCHAR(50) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users with tenant scoping
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member',
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Forum posts with tenant isolation
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  category VARCHAR(100),
  title VARCHAR(500),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content (episodes, characters, lore objects)
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  type VARCHAR(50) NOT NULL, -- 'episode', 'character', 'lore_object'
  title VARCHAR(500),
  slug VARCHAR(100),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, type, slug)
);

-- Unified shop products (shared across all tenants)
CREATE TABLE shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  loremaster_id UUID REFERENCES users(id),
  title VARCHAR(500),
  description TEXT,
  images TEXT[],
  category VARCHAR(100),
  printify_product_id VARCHAR(100),
  base_price DECIMAL(10,2),
  loremaster_share DECIMAL(3,2) DEFAULT 0.65,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row-level security policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own tenant's data
CREATE POLICY tenant_isolation_users ON users
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

---

## 🚀 MIGRATION EXECUTION PLAN

### Phase 1: Platform Foundation (Weeks 1-2)
```bash
# Week 1: Project Setup
mkdir wavelength-platform
cd wavelength-platform

# Initialize monorepo with modern tooling
npx create-turbo@latest .
npm install

# Set up core packages
mkdir -p packages/core packages/platform-api packages/shop-api packages/site-generator

# Week 2: Core Services
# 1. Database setup with Prisma
# 2. Authentication with Auth0
# 3. Multi-tenant middleware
# 4. Basic API structure
```

### Phase 2: Unified Shop (Weeks 3-4)
```javascript
// packages/shop-api/src/services/unified-shop.service.ts
export class UnifiedShopService {
  // Create product across all LoreMasters
  async createProduct(data: CreateProductDTO): Promise<Product> {
    // 1. Validate LoreMaster permissions
    await this.validateLoreMaster(data.loreMasterId);
    
    // 2. Create in our database
    const product = await this.db.product.create({
      data: {
        ...data,
        tenantId: data.tenantId,
        loreMasterId: data.loreMasterId,
        platformShare: 0.20,
        loreMasterShare: 0.65,
        fulfillmentShare: 0.15
      }
    });
    
    // 3. Create in shared Printify shop
    const printifyProduct = await this.printify.createProduct(product);
    
    // 4. Update with Printify ID
    return this.db.product.update({
      where: { id: product.id },
      data: { printifyProductId: printifyProduct.id }
    });
  }
  
  // Process order with revenue splitting
  async processOrder(orderData: OrderDTO): Promise<Order> {
    // 1. Create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: orderData.totalAmount * 100,
      currency: 'usd',
      metadata: {
        orderItems: JSON.stringify(orderData.items)
      }
    });
    
    // 2. Calculate revenue splits
    const revenueBreakdown = this.calculateRevenueSplits(orderData.items);
    
    // 3. Create order record
    const order = await this.db.order.create({
      data: {
        ...orderData,
        revenueBreakdown,
        paymentIntentId: paymentIntent.id
      }
    });
    
    return order;
  }
}
```

### Phase 3: Content Migration (Week 5)
```javascript
// migration-tools/content-migrator.ts
export class ContentMigrator {
  async migrateWavelengthLore(): Promise<MigrationReport> {
    console.log('🔄 Starting Wavelength Lore migration...');
    
    // 1. Export Firebase data
    const firebaseData = await this.exportFirebaseCollections([
      'users', 'forum-posts', 'characters', 'episodes', 'lore-objects'
    ]);
    
    // 2. Transform data to new schema
    const transformedData = await this.transformToNewSchema(firebaseData);
    
    // 3. Create "Wavelength Lore" as first tenant
    const wavelengthTenant = await this.createTenant({
      slug: 'wavelength-lore',
      name: 'Wavelength Lore',
      domain: 'wavelengthlore.com',
      template: 'music-site',
      config: {
        branding: {
          siteName: 'Wavelength Lore',
          primaryColor: '#8B5CF6',
          tagline: 'Where Music Tells Epic Stories'
        },
        features: {
          forum: true,
          games: true,
          merchandise: true,
          chatbot: true,
          quests: true,
          badges: true
        }
      }
    });
    
    // 4. Import content with tenant scoping
    await this.importContent(transformedData, wavelengthTenant.id);
    
    // 5. Migrate assets to new S3 structure
    await this.migrateAssets(wavelengthTenant.id);
    
    // 6. Set up redirects from old URLs
    await this.setupUrlRedirects();
    
    return {
      success: true,
      migratedUsers: transformedData.users.length,
      migratedPosts: transformedData.posts.length,
      migratedCharacters: transformedData.characters.length,
      migratedEpisodes: transformedData.episodes.length,
      migratedAssets: transformedData.assets.length
    };
  }
  
  private async transformToNewSchema(firebaseData: any) {
    return {
      users: firebaseData.users.map(user => ({
        ...user,
        tenant_id: 'wavelength-lore-tenant-id',
        credits: user.credits || 0
      })),
      
      posts: firebaseData['forum-posts'].map(post => ({
        ...post,
        tenant_id: 'wavelength-lore-tenant-id'
      })),
      
      content: [
        ...firebaseData.characters.map(char => ({
          type: 'character',
          title: char.name,
          slug: this.slugify(char.name),
          data: char,
          tenant_id: 'wavelength-lore-tenant-id'
        })),
        ...firebaseData.episodes.map(episode => ({
          type: 'episode', 
          title: episode.title,
          slug: this.slugify(episode.title),
          data: episode,
          tenant_id: 'wavelength-lore-tenant-id'
        }))
      ]
    };
  }
}
```

### Phase 4: Feature Parity (Weeks 6-8)
```typescript
// Enhanced forum with modern features
// packages/platform-api/src/modules/forum/forum.service.ts
export class ForumService {
  // Real-time notifications
  async createPost(data: CreatePostDTO): Promise<Post> {
    const post = await this.db.forumPost.create({
      data: {
        ...data,
        tenantId: this.tenantContext.id
      }
    });
    
    // Notify subscribers in real-time
    await this.notificationService.notifyNewPost(post);
    
    // AI moderation check
    await this.moderationService.checkContent(post);
    
    return post;
  }
  
  // Advanced search with full-text indexing
  async searchPosts(query: SearchPostsDTO): Promise<SearchResult> {
    return this.db.$queryRaw`
      SELECT *, ts_rank(search_vector, plainto_tsquery(${query.text})) as rank
      FROM forum_posts 
      WHERE tenant_id = ${this.tenantContext.id}
      AND search_vector @@ plainto_tsquery(${query.text})
      ORDER BY rank DESC, created_at DESC
      LIMIT ${query.limit || 20}
    `;
  }
}

// Modular games framework
// packages/platform-api/src/modules/games/games.service.ts
export class GamesService {
  private gamePlugins = new Map<string, GamePlugin>();
  
  async loadGamePlugin(tenantId: string, gameType: string): Promise<Game> {
    const plugin = this.gamePlugins.get(gameType);
    if (!plugin) {
      throw new Error(`Game type ${gameType} not found`);
    }
    
    return plugin.createInstance(tenantId, {
      theme: await this.getThemeConfig(tenantId),
      leaderboard: this.leaderboardService,
      achievements: this.achievementService
    });
  }
}
```

### Phase 5: LoreMaster Tools (Weeks 9-10)
```typescript
// packages/platform-api/src/modules/loremaster/dashboard.service.ts
export class LoreMasterDashboardService {
  async getDashboardData(loreMasterId: string): Promise<DashboardData> {
    const [
      siteStats,
      shopEarnings,
      creditUsage,
      communityHealth
    ] = await Promise.all([
      this.getSiteStatistics(loreMasterId),
      this.getShopEarnings(loreMasterId),
      this.getCreditUsage(loreMasterId),
      this.getCommunityHealth(loreMasterId)
    ]);
    
    return {
      siteStats,
      shopEarnings,
      creditUsage,
      communityHealth,
      recommendations: await this.generateRecommendations(loreMasterId)
    };
  }
  
  async updateSiteConfiguration(
    loreMasterId: string, 
    config: UpdateConfigDTO
  ): Promise<void> {
    // Validate permissions
    await this.validateLoreMasterPermissions(loreMasterId);
    
    // Update tenant configuration
    await this.db.tenant.update({
      where: { loreMasterId },
      data: { config }
    });
    
    // Trigger site rebuild if needed
    await this.siteGeneratorService.rebuildSite(loreMasterId);
  }
}
```

---

## 🔍 MIGRATION VALIDATION & TESTING

### Data Integrity Validation
```typescript
// migration-tools/validation.service.ts
export class MigrationValidator {
  async validateDataIntegrity(): Promise<ValidationReport> {
    const checks = [
      this.validateUserCount(),
      this.validateForumPostIntegrity(),
      this.validateAssetUrls(),
      this.validateTenantIsolation(),
      this.validateShopIntegration()
    ];
    
    const results = await Promise.all(checks);
    
    return {
      passed: results.every(r => r.success),
      checks: results,
      summary: this.generateSummary(results)
    };
  }
  
  private async validateTenantIsolation(): Promise<CheckResult> {
    // Verify no cross-tenant data leakage
    const crossTenantQueries = [
      'SELECT COUNT(*) FROM users WHERE tenant_id != current_setting(\'app.current_tenant\')::UUID',
      'SELECT COUNT(*) FROM forum_posts WHERE tenant_id != current_setting(\'app.current_tenant\')::UUID'
    ];
    
    // These should return 0 when tenant context is set
    for (const query of crossTenantQueries) {
      const result = await this.db.$queryRaw(query);
      if (result[0].count > 0) {
        return { success: false, message: 'Tenant isolation breach detected' };
      }
    }
    
    return { success: true, message: 'Tenant isolation verified' };
  }
}
```

### Performance Benchmarking
```typescript
// Load testing for new platform
export class PerformanceTester {
  async runLoadTests(): Promise<PerformanceReport> {
    const scenarios = [
      { name: 'Homepage Load', concurrent: 100, duration: '1m' },
      { name: 'Forum Browsing', concurrent: 50, duration: '2m' },
      { name: 'Shop Product View', concurrent: 30, duration: '1m' },
      { name: 'LoreMaster Dashboard', concurrent: 10, duration: '30s' }
    ];
    
    const results = [];
    for (const scenario of scenarios) {
      const result = await this.runK6Test(scenario);
      results.push(result);
    }
    
    return {
      scenarios: results,
      passed: results.every(r => r.p95 < 2000), // < 2 second 95th percentile
      recommendations: this.generateOptimizations(results)
    };
  }
}
```

---

## 📈 SUCCESS METRICS & ROLLBACK PLAN

### Migration Success Criteria
```javascript
const SUCCESS_CRITERIA = {
  dataIntegrity: {
    userAccountsPreserved: '100%',
    forumContentPreserved: '100%',
    assetLinksWorking: '>99%',
    noDataLeakage: 'Zero cross-tenant access'
  },
  
  performance: {
    pageLoadTime: '<2 seconds (95th percentile)',
    apiResponseTime: '<500ms (95th percentile)',
    availability: '>99.9%',
    concurrentUsers: '1000+ supported'
  },
  
  functionality: {
    authenticationWorking: '100%',
    forumPostingWorking: '100%',
    shopIntegrationWorking: '100%',
    aiServicesWorking: '100%',
    gamesWorking: '100%'
  },
  
  userExperience: {
    mobileResponsive: 'All pages',
    accessibilityScore: '>90 (Lighthouse)',
    seoScore: '>90 (Lighthouse)',
    userSatisfaction: '>4.5/5'
  }
};
```

### Rollback Strategy
```bash
# If migration fails, we can rollback in stages:

# 1. DNS Rollback (immediate)
# Point domain back to old Wavelength Lore instance
aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch file://rollback-dns.json

# 2. Database Rollback (if needed)
# Restore from pre-migration backup
pg_restore --clean --no-owner --role=postgres -d wavelength_platform backup_pre_migration.sql

# 3. Asset Rollback (if needed)  
# Restore S3 assets from backup
aws s3 sync s3://wavelength-backup/pre-migration/ s3://wavelength-assets/

# 4. User Communication
# Automated email to all users explaining temporary rollback
node scripts/notify-rollback.js
```

### Post-Migration Monitoring
```typescript
// Automated monitoring after migration
export class PostMigrationMonitor {
  async startMonitoring(): Promise<void> {
    // Real-time alerts for critical issues
    this.setupAlerts([
      { metric: 'error_rate', threshold: '1%', action: 'page_oncall' },
      { metric: 'response_time_p95', threshold: '3000ms', action: 'slack_alert' },
      { metric: 'user_login_failures', threshold: '5%', action: 'investigate' },
      { metric: 'cross_tenant_queries', threshold: '1', action: 'emergency_stop' }
    ]);
    
    // Daily health reports
    this.scheduleReports([
      { type: 'user_activity', frequency: 'daily' },
      { type: 'performance_summary', frequency: 'daily' },
      { type: 'revenue_tracking', frequency: 'daily' },
      { type: 'technical_metrics', frequency: 'hourly' }
    ]);
  }
}
```

This migration strategy provides a clear path from the current Wavelength Lore to a scalable, multi-tenant platform with unified shop capabilities. The clean codebase approach ensures long-term maintainability while preserving all valuable content and user relationships.