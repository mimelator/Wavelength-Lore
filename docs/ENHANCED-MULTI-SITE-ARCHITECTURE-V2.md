# 🔄 ENHANCED MULTI-SITE ARCHITECTURE v2.0

**Updated:** October 31, 2025  
**Project:** Wavelength Multi-Site Replication System  
**Key Changes:** Unified Shop + Clean Codebase Strategy  

---

## 🏪 UNIFIED SHOP ARCHITECTURE

### Centralized Marketplace Model

Instead of replicating individual Printify/Stripe integrations per site, we create **one powerful marketplace** where all LoreMasters sell together, with proper attribution and revenue sharing.

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED WAVELENGTH SHOP                 │
│                  shop.wavelengthplatform.com               │
├─────────────────────────────────────────────────────────────┤
│  🎵 Music Section     │  🎨 Art Section     │  📚 Lit Section  │
│  ├─ HarmonicTales     │  ├─ MysticCanvas    │  ├─ EpicLore     │
│  ├─ ProgRockStories   │  ├─ DigitalDreams   │  ├─ FantasyRealm │
│  └─ SynthWaves        │  └─ AbstractVisions │  └─ SciFiWorlds  │
├─────────────────────────────────────────────────────────────┤
│            Shared: Printify + Stripe + Fulfillment         │
└─────────────────────────────────────────────────────────────┘
```

### Shop Architecture Benefits
- **Single Printify Integration** - One shop, all products
- **Unified Payment Processing** - One Stripe account with revenue splitting
- **Cross-Promotion** - Users discover other LoreMasters naturally  
- **Shared Shipping** - Better rates, combined orders
- **Centralized Customer Service** - One support system
- **Marketing Synergy** - Wavelength brand amplification

---

## 🏗️ CODEBASE STRATEGY: CLEAN SLATE APPROACH

### Recommendation: **NEW CODEBASE** with Reference Architecture

**Why Start Fresh:**
1. **Design for Multi-Tenancy from Day 1** - Clean separation of concerns
2. **Modern Stack** - Latest Node.js, database patterns, security practices  
3. **Performance Optimized** - Built for scale from the ground up
4. **Maintainable Architecture** - Clear patterns, documentation, testing
5. **Feature Parity Faster** - Extract and improve rather than retrofit

### Migration Strategy
```
Phase 1: Core Platform (Weeks 1-4)
├─ Multi-tenant foundation
├─ Authentication system  
├─ Site template engine
└─ Unified shop integration

Phase 2: Feature Parity (Weeks 5-8)  
├─ Forum system (improved)
├─ Content management (enhanced)
├─ AI services (credit system)
└─ Games framework (modular)

Phase 3: Advanced Features (Weeks 9-12)
├─ LoreMaster dashboard
├─ Analytics & reporting
├─ Advanced customization
└─ Mobile optimization
```

---

## 🛍️ UNIFIED SHOP TECHNICAL IMPLEMENTATION

### Shop Database Schema
```javascript
// Unified Shop Database Structure
{
  // Shared Collections
  products: {
    productId: "uuid",
    loreMaster: "tenant-id",
    siteId: "tenant-id", 
    title: "Epic Album Art Tee",
    description: "...",
    images: ["url1", "url2"],
    category: "apparel",
    tags: ["music", "progressive-rock", "harmonic-tales"],
    printifyProductId: "12345",
    basePrice: 24.99,
    loreMasterShare: 0.7, // 70% to LoreMaster
    platformShare: 0.3,   // 30% to Wavelength Platform
    isActive: true,
    createdAt: timestamp,
    siteConfig: {
      siteName: "Harmonic Tales",
      branding: { primaryColor: "#6A1B9A" }
    }
  },
  
  orders: {
    orderId: "uuid",
    customerEmail: "customer@email.com", 
    items: [
      {
        productId: "uuid",
        loreMaster: "harmonic-tales",
        quantity: 2,
        price: 24.99,
        loreMasterEarnings: 17.49,
        platformEarnings: 7.50
      }
    ],
    totalAmount: 49.98,
    paymentStatus: "completed",
    fulfillmentStatus: "processing",
    printifyOrderId: "67890"
  },
  
  loreMasterEarnings: {
    loreMasterId: "harmonic-tales",
    period: "2025-10",
    totalSales: 1250.00,
    platformFee: 375.00,
    netEarnings: 875.00,
    paidOut: false,
    transactions: ["order-1", "order-2", "..."]
  }
}
```

### Shop API Design
```javascript
// services/unified-shop-service.js
class UnifiedShopService {
  // Product Management
  async createProduct(loreMasterId, productData) {
    // 1. Create in unified database with LoreMaster attribution
    // 2. Create in shared Printify shop
    // 3. Generate shop URL: shop.wavelengthplatform.com/harmonic-tales
  }
  
  // Revenue Management  
  async processOrder(orderData) {
    // 1. Process payment via unified Stripe
    // 2. Split revenue by LoreMaster percentages
    // 3. Create Printify fulfillment order
    // 4. Send notifications to all LoreMasters involved
  }
  
  // LoreMaster Shop Views
  async getLoreMasterProducts(loreMasterId) {
    // Return products filtered by LoreMaster
    // Used for: mysite.com/shop -> redirects to shop.wavelengthplatform.com/mysite
  }
  
  // Cross-Promotion
  async getRelatedProducts(productId, limit = 6) {
    // Show products from other LoreMasters in same category
    // Drives discovery across the platform
  }
}
```

### Site Integration Pattern
```javascript
// Individual sites redirect to unified shop with context
// mysite.com/shop -> shop.wavelengthplatform.com/mysite

// Or embed shop sections:
// <iframe src="shop.wavelengthplatform.com/embed/mysite" />

// Revenue tracking per site:
class SiteShopIntegration {
  generateShopUrl(tenantId, productId = null) {
    const baseUrl = 'https://shop.wavelengthplatform.com';
    if (productId) {
      return `${baseUrl}/product/${productId}?source=${tenantId}`;
    }
    return `${baseUrl}/loremaster/${tenantId}`;
  }
  
  async getEarningsReport(tenantId, period) {
    // Get revenue report for LoreMaster dashboard
    return await this.unifiedShop.getEarningsReport(tenantId, period);
  }
}
```

---

## 🏛️ NEW CODEBASE ARCHITECTURE

### Project Structure
```
wavelength-platform/                 # NEW: Clean multi-tenant codebase
├─ packages/
│   ├─ core/                        # Shared libraries
│   │   ├─ auth/                    # Authentication system
│   │   ├─ database/                # Database utilities  
│   │   ├─ templates/               # Site template engine
│   │   └─ shop/                    # Unified shop services
│   ├─ platform-api/                # Main platform API
│   ├─ shop-api/                    # Unified shop API  
│   ├─ site-generator/              # Site provisioning tools
│   └─ admin-dashboard/             # Platform management UI
├─ templates/
│   ├─ music-site/                  # Site templates
│   ├─ art-site/
│   ├─ literature-site/
│   └─ gaming-site/
├─ infrastructure/
│   ├─ docker/                      # Containerization
│   ├─ terraform/                   # Infrastructure as code
│   └─ monitoring/                  # Observability tools
└─ migration-tools/                 # Wavelength Lore extraction tools
    ├─ content-extractor.js         # Extract posts, users, content
    ├─ asset-migrator.js            # Move images, files
    └─ feature-analyzer.js          # Analyze what to rebuild vs reuse
```

### Technology Stack (Modern)
```javascript
// Core Platform
{
  runtime: "Node.js 20+",
  framework: "Express.js + TypeScript", 
  database: "PostgreSQL + Redis",       // Better multi-tenancy than Firebase
  orm: "Prisma",                        // Type-safe database access
  auth: "Auth0 + Custom JWT",           // Enterprise authentication
  queue: "Bull/BullMQ",                 // Background jobs
  search: "Elasticsearch",              // Advanced search capabilities
  monitoring: "Datadog + Sentry",      // Production observability
  cdn: "CloudFlare",                    // Global performance
  deployment: "Docker + Kubernetes"     // Container orchestration
}

// Frontend (Site Templates)
{
  framework: "Next.js 14",             // SSR + SSG for performance
  styling: "Tailwind CSS",             // Utility-first CSS
  components: "Shadcn/ui",             // Modern component library
  state: "Zustand",                    // Lightweight state management
  forms: "React Hook Form + Zod",      // Type-safe form handling
  animations: "Framer Motion"          // Smooth interactions
}

// Unified Shop
{
  framework: "Next.js Commerce",       // E-commerce optimized
  payments: "Stripe Connect",          # Multi-party payments
  fulfillment: "Printify API",        # Print-on-demand
  analytics: "Vercel Analytics",      # Performance insights
  cms: "Sanity.io"                    # Content management
}
```

### Multi-Tenancy from Ground Up
```typescript
// core/database/tenant-context.ts
export class TenantContext {
  constructor(private tenantId: string) {}
  
  // All database queries automatically scoped to tenant
  getConnection(): TenantConnection {
    return new TenantConnection(this.tenantId);
  }
  
  // Row-level security in PostgreSQL
  async query<T>(sql: string, params: any[]): Promise<T[]> {
    return this.connection.query(
      `SELECT * FROM (${sql}) WHERE tenant_id = $1`,
      [this.tenantId, ...params]
    );
  }
}

// Middleware automatically sets tenant context
app.use(async (req, res, next) => {
  const tenantId = extractTenantFromDomain(req.hostname);
  req.tenant = new TenantContext(tenantId);
  next();
});
```

---

## 📊 MIGRATION PLAN: WAVELENGTH LORE → NEW PLATFORM

### Phase 1: Analysis & Extraction (Week 1)
```javascript
// migration-tools/feature-analyzer.js
class FeatureAnalyzer {
  async analyzeCurrentSite() {
    return {
      // Content to migrate
      content: {
        users: await this.countUsers(),
        posts: await this.countPosts(), 
        characters: await this.countCharacters(),
        episodes: await this.countEpisodes(),
        assets: await this.countAssets()
      },
      
      // Features to rebuild (improved)
      features: {
        forum: { complexity: 'medium', rewrite: true },
        games: { complexity: 'high', modularize: true },
        merch: { complexity: 'low', unified_shop: true },
        ai_services: { complexity: 'medium', credit_system: true },
        auth: { complexity: 'low', upgrade_to_auth0: true }
      },
      
      // Technical debt to eliminate
      debt: {
        firebase_limitations: 'Replace with PostgreSQL',
        monolithic_structure: 'Break into microservices',
        manual_deployment: 'Automate with CI/CD',
        limited_monitoring: 'Add comprehensive observability'
      }
    };
  }
}
```

### Phase 2: Content Migration (Week 2)
```javascript
// migration-tools/content-extractor.js
class ContentMigrator {
  async migrateFromWavelengthLore() {
    // 1. Export all Firebase data
    const firebaseData = await this.exportFirebase();
    
    // 2. Transform to new schema
    const transformedData = await this.transformSchema(firebaseData);
    
    // 3. Import to PostgreSQL with tenant scoping
    await this.importToPostgreSQL(transformedData, 'wavelength-lore'); // Original becomes first tenant
    
    // 4. Migrate assets to new S3 structure
    await this.migrateAssets();
    
    // 5. Update URLs and references
    await this.updateReferences();
  }
}
```

### Phase 3: Feature Parity (Weeks 3-6)
Focus on rebuilding core features with improvements:

1. **Enhanced Forum System**
   - Better moderation tools
   - Improved search and filtering
   - Mobile-first responsive design
   - Real-time notifications

2. **Modular Games Framework**  
   - Plugin architecture for easy game additions
   - Shared leaderboards across sites
   - Achievement system integration

3. **Unified Shop Integration**
   - Seamless product creation flow
   - Revenue analytics dashboard
   - Cross-promotion algorithms

4. **AI Services with Credits**
   - Usage tracking and billing
   - Rate limiting and fair use policies
   - Quality controls and content moderation

---

## 🎯 IMPLEMENTATION PRIORITIES

### Immediate (Weeks 1-4): Foundation
1. **Set up new codebase** with multi-tenant architecture
2. **Implement unified shop** as standalone service
3. **Create site template system** with 2-3 templates
4. **Build LoreMaster onboarding** flow

### Short Term (Weeks 5-8): Core Features  
1. **Migrate Wavelength Lore** as first tenant
2. **Complete forum system** with moderation
3. **Integrate AI services** with credit system
4. **Launch beta** with 5 test LoreMasters

### Medium Term (Weeks 9-12): Scale
1. **Add games framework** and badge system
2. **Build analytics dashboard** for LoreMasters  
3. **Implement mobile apps** (React Native)
4. **Launch marketing** for LoreMaster acquisition

---

## 💰 REVENUE MODEL ENHANCEMENT

### Unified Shop Revenue Sharing
```javascript
const REVENUE_SPLITS = {
  // Product sales
  loreMaster: 0.65,     // 65% to content creator
  platform: 0.20,      // 20% to Wavelength Platform  
  printify: 0.15,      // 15% to fulfillment (Printify's cut)
  
  // AI Credits (separate revenue stream)
  creditSales: {
    platform: 1.00     // 100% to platform (LoreMasters buy credits)
  },
  
  // Subscription tiers (future)
  subscriptions: {
    platform: 0.70,    // 70% to platform
    loreMaster: 0.30   // 30% to LoreMaster for premium features
  }
};
```

### LoreMaster Dashboard Analytics
- **Sales Performance** - Revenue, best-selling products, trends
- **Audience Insights** - Site visitors, engagement metrics  
- **Credit Usage** - AI generation costs and ROI
- **Community Health** - Forum activity, user growth
- **Cross-Promotion** - Traffic from unified shop

---

## 🔧 DEVELOPMENT WORKFLOW

### Repository Structure
```bash
# New clean repositories
wavelength-platform/           # Main platform (new)
├─ .github/workflows/         # CI/CD automation
├─ packages/*/                # Monorepo packages  
└─ docker-compose.yml         # Local development

wavelength-shop/              # Unified shop (new)  
├─ storefront/               # Next.js Commerce frontend
├─ api/                     # Shop API backend
└─ admin/                   # Shop management dashboard

wavelength-lore-legacy/       # Original codebase (reference)
├─ extraction-scripts/       # Migration tools
└─ feature-documentation/    # What to rebuild vs migrate
```

### Development Standards
- **TypeScript everywhere** - Type safety and better developer experience
- **Comprehensive testing** - Unit, integration, and E2E tests
- **API-first design** - Clean separation between frontend and backend
- **Documentation-driven** - Every feature documented before implementation
- **Performance budgets** - Sub-2-second page loads, 95+ Lighthouse scores

This enhanced architecture addresses your key insights while maintaining the ambitious goal of rapid site deployment. The unified shop eliminates the complexity of per-site commerce while the clean codebase ensures long-term maintainability and scalability.

**Ready to build the next-generation content creator platform?** 🚀