# 🔗 CROSS-PLATFORM INTEGRATION STRATEGY

**Document:** WavelengthHub ↔ WavelengthLore Integration  
**Project:** Seamless Multi-Platform Experience  
**Date:** October 31, 2025  

---

## 🎯 INTEGRATION CHALLENGE

**Current State:**
- **wavelengthlore.com** → Firebase (users, content, auth)
- **Enhanced merch store** → New PostgreSQL database + APIs
- **wavelengthhub.com** → New PostgreSQL (tenants, multi-site data)

**Goal:** Seamless user experience across all platforms with unified commerce

---

## 🏗️ DATABASE ARCHITECTURE STRATEGY

### **Option A: Federated Database Approach (RECOMMENDED)**
```javascript
// Create new commerce API that both platforms can use
const FEDERATED_ARCHITECTURE = {
  wavelengthlore_firebase: {
    purpose: 'User auth, forum, episodes, characters',
    stays_unchanged: true,
    integrates_with: 'Commerce API via user mapping'
  },
  
  wavelengthhub_postgresql: {
    purpose: 'Multi-tenant sites, LoreMasters, site templates',
    new_platform: true,
    integrates_with: 'Commerce API + Wavelength Lore via SSO'
  },
  
  commerce_api_postgresql: {
    purpose: 'Products, orders, payments, revenue splits',
    serves: ['wavelengthlore.com', 'all LoreMaster sites', 'admin dashboard'],
    authentication: 'JWT tokens from both platforms'
  }
};
```

### Commerce Database Schema
```sql
-- NEW: Standalone Commerce Database
-- Serves wavelengthlore.com + all LoreMaster sites
CREATE DATABASE wavelength_commerce;

-- LoreMasters table (includes Wavelength Lore as first entry)
CREATE TABLE lore_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- External platform references
  firebase_uid VARCHAR(128), -- For Wavelength Lore users
  hub_tenant_id UUID, -- For WavelengthHub LoreMasters
  
  -- Commerce settings
  site_slug VARCHAR(100) UNIQUE NOT NULL,
  site_url VARCHAR(255),
  revenue_share DECIMAL(3,2) DEFAULT 0.65,
  stripe_connect_account VARCHAR(100),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products with LoreMaster association
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lore_master_id UUID REFERENCES lore_masters(id) NOT NULL,
  
  -- Product details
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  
  -- External integrations
  printify_product_id VARCHAR(100),
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  cross_promote BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders with revenue splitting
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Customer info (from either platform)
  customer_email VARCHAR(255) NOT NULL,
  customer_firebase_uid VARCHAR(128), -- If from Wavelength Lore
  customer_hub_user_id UUID, -- If from Hub platform
  
  -- Order details
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Payment processing
  stripe_payment_intent VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'pending',
  
  -- Revenue tracking
  revenue_breakdown JSONB NOT NULL DEFAULT '[]',
  
  -- Fulfillment
  fulfillment_status VARCHAR(50) DEFAULT 'pending',
  tracking_number VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Initialize Wavelength Lore as first LoreMaster
INSERT INTO lore_masters (
  name, email, firebase_uid, site_slug, site_url, revenue_share
) VALUES (
  'Wavelength Lore', 
  'admin@wavelengthlore.com', 
  'wavelength-lore-admin-uid',
  'wavelength-lore',
  'https://wavelengthlore.com',
  1.00  -- 100% since it's your original site
);
```

### Commerce API Integration
```javascript
// New Commerce API microservice
// File: /commerce-api/src/services/commerce.service.js

class CommerceService {
  // Create product from any platform
  async createProduct(productData, authentication) {
    // Validate LoreMaster from either Firebase UID or Hub User ID
    const loreMaster = await this.validateLoreMaster(authentication);
    
    const product = await this.db.products.create({
      ...productData,
      lore_master_id: loreMaster.id,
      slug: this.generateSlug(productData.title, loreMaster.site_slug)
    });
    
    // Create in Printify
    const printifyProduct = await this.printify.createProduct({
      ...product,
      title: `${loreMaster.name} - ${product.title}`,
      tags: [loreMaster.site_slug, productData.category]
    });
    
    await this.db.products.update(product.id, {
      printify_product_id: printifyProduct.id
    });
    
    return product;
  }
  
  // Get products for any platform
  async getProductsForSite(siteIdentifier, includeCrossSell = false) {
    let query = this.db.products
      .join('lore_masters', 'lore_masters.id', 'products.lore_master_id')
      .where('lore_masters.site_slug', siteIdentifier)
      .where('products.is_active', true);
    
    if (includeCrossSell) {
      query = query.orWhere(function() {
        this.where('products.cross_promote', true)
            .where('products.is_active', true)
            .whereNot('lore_masters.site_slug', siteIdentifier);
      });
    }
    
    return query.select('products.*', 'lore_masters.name as lore_master_name');
  }
  
  // Process order from any platform
  async processOrder(orderData, authentication) {
    const customer = await this.validateCustomer(authentication);
    
    // Create order with customer mapping
    const order = await this.db.orders.create({
      ...orderData,
      customer_email: customer.email,
      customer_firebase_uid: customer.firebase_uid || null,
      customer_hub_user_id: customer.hub_user_id || null,
      revenue_breakdown: await this.calculateRevenueSplits(orderData.items)
    });
    
    // Process payment
    const payment = await this.stripe.paymentIntents.create({
      amount: order.total * 100,
      currency: 'usd',
      metadata: { order_id: order.id }
    });
    
    await this.db.orders.update(order.id, {
      stripe_payment_intent: payment.id
    });
    
    return { order, payment };
  }
  
  private async validateLoreMaster(authentication) {
    if (authentication.firebase_uid) {
      // From Wavelength Lore
      return this.db.lore_masters.where('firebase_uid', authentication.firebase_uid).first();
    } else if (authentication.hub_user_id) {
      // From WavelengthHub
      return this.db.lore_masters.where('hub_tenant_id', authentication.tenant_id).first();
    }
    throw new Error('Invalid authentication');
  }
}
```

---

## 🔐 SSO STRATEGY: UNIFIED AUTHENTICATION

### **JWT-Based Cross-Platform Authentication**
```javascript
// Shared JWT strategy for seamless navigation
const SSO_ARCHITECTURE = {
  auth_flow: [
    'User logs in on either platform',
    'Platform issues JWT with user identity',
    'JWT includes platform-specific user ID + email',
    'Other platforms validate JWT and map to local user',
    'Seamless navigation without re-authentication'
  ],
  
  jwt_payload: {
    email: 'user@example.com',
    name: 'User Name',
    firebase_uid: 'abc123...', // If from Wavelength Lore
    hub_user_id: 'uuid...', // If from WavelengthHub
    hub_tenant_id: 'uuid...', // If LoreMaster from Hub
    platform: 'wavelength-lore' | 'wavelength-hub',
    exp: 'timestamp'
  }
};
```

### SSO Implementation
```javascript
// Shared JWT service
// File: /shared/auth/jwt.service.js

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET; // Shared secret
    this.issuer = 'wavelength-platform';
  }
  
  // Generate token from Wavelength Lore (Firebase user)
  generateWavelengthLoreToken(firebaseUser) {
    return jwt.sign({
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      firebase_uid: firebaseUser.uid,
      platform: 'wavelength-lore',
      iss: this.issuer,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }, this.secret);
  }
  
  // Generate token from WavelengthHub user
  generateHubToken(hubUser, tenantId = null) {
    return jwt.sign({
      email: hubUser.email,
      name: hubUser.name,
      hub_user_id: hubUser.id,
      hub_tenant_id: tenantId,
      platform: 'wavelength-hub',
      iss: this.issuer,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }, this.secret);
  }
  
  // Validate token from any platform
  validateToken(token) {
    try {
      return jwt.verify(token, this.secret, { issuer: this.issuer });
    } catch (error) {
      throw new Error('Invalid authentication token');
    }
  }
}
```

### Cross-Platform Navigation
```javascript
// Wavelength Lore → Commerce Store navigation
// File: /wavelength-lore/public/js/sso-navigation.js

class SSONavigation {
  async navigateToStore(targetUrl = '/shop') {
    // Get current Firebase user
    const user = firebase.auth().currentUser;
    if (!user) {
      // Redirect to store without authentication
      window.location.href = `https://wavelengthlore.com${targetUrl}`;
      return;
    }
    
    // Generate SSO token
    const idToken = await user.getIdToken();
    
    // Exchange for cross-platform JWT
    const response = await fetch('/api/auth/generate-sso-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    const { ssoToken } = await response.json();
    
    // Navigate with SSO token
    window.location.href = `https://wavelengthlore.com${targetUrl}?sso=${ssoToken}`;
  }
  
  async navigateToHub(targetUrl = '/dashboard') {
    // Similar process for navigating to WavelengthHub
    const user = firebase.auth().currentUser;
    if (!user) {
      window.location.href = `https://wavelengthhub.com${targetUrl}`;
      return;
    }
    
    const idToken = await user.getIdToken();
    
    const response = await fetch('/api/auth/generate-sso-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    const { ssoToken } = await response.json();
    window.location.href = `https://wavelengthhub.com${targetUrl}?sso=${ssoToken}`;
  }
}
```

### SSO Token Exchange Endpoints
```javascript
// Wavelength Lore SSO endpoint
// File: /wavelength-lore/routes/auth.js

app.post('/api/auth/generate-sso-token', async (req, res) => {
  try {
    // Verify Firebase token
    const idToken = req.headers.authorization?.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Generate cross-platform JWT
    const ssoToken = jwtService.generateWavelengthLoreToken({
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name
    });
    
    res.json({ ssoToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication' });
  }
});

// WavelengthHub SSO endpoint
// File: /wavelength-hub/pages/api/auth/generate-sso-token.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify Hub authentication (Auth0 or similar)
    const user = await validateHubUser(req);
    
    // Generate cross-platform JWT
    const ssoToken = jwtService.generateHubToken(user, user.tenantId);
    
    res.json({ ssoToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication' });
  }
}
```

### SSO Token Validation
```javascript
// Commerce API SSO validation middleware
// File: /commerce-api/middleware/sso-auth.js

function ssoAuthMiddleware(req, res, next) {
  try {
    // Check for SSO token in query params or headers
    const ssoToken = req.query.sso || req.headers.authorization?.replace('Bearer ', '');
    
    if (!ssoToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate and decode JWT
    const decoded = jwtService.validateToken(ssoToken);
    
    // Attach user info to request
    req.user = {
      email: decoded.email,
      name: decoded.name,
      firebase_uid: decoded.firebase_uid || null,
      hub_user_id: decoded.hub_user_id || null,
      hub_tenant_id: decoded.hub_tenant_id || null,
      platform: decoded.platform
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}
```

---

## 🔄 USER EXPERIENCE FLOW

### **Seamless Navigation Example**
```javascript
// User journey: Wavelength Lore → Store → LoreMaster Site
const USER_JOURNEY = {
  step1: {
    location: 'wavelengthlore.com/episodes/episode-5',
    action: 'User clicks "Buy Episode 5 Merch"',
    result: 'Auto-redirects to store with SSO token'
  },
  
  step2: {
    location: 'wavelengthlore.com/shop/episode-5-collection?sso=jwt...',
    action: 'Store validates token, shows personalized experience',
    result: 'User sees products, can add to cart'
  },
  
  step3: {
    location: 'wavelengthlore.com/shop/cart',
    action: 'User proceeds to checkout',
    result: 'Order processed with user identity from JWT'
  },
  
  step4: {
    location: 'Any LoreMaster site with same SSO token',
    action: 'User clicks "Visit Another Creator"',
    result: 'Seamless login to other LoreMaster sites'
  }
};
```

### Implementation Timeline
```javascript
const SSO_IMPLEMENTATION = {
  week1: [
    'Set up Commerce API database',
    'Create JWT service with shared secret',
    'Implement basic SSO token generation'
  ],
  
  week2: [
    'Add SSO endpoints to Wavelength Lore',
    'Add SSO validation to Commerce API', 
    'Test token exchange flow'
  ],
  
  week3: [
    'Implement seamless navigation JavaScript',
    'Add SSO support to WavelengthHub',
    'Test cross-platform user experience'
  ],
  
  week4: [
    'Production deployment',
    'User acceptance testing',
    'Documentation and monitoring'
  ]
};
```

This architecture gives you:

✅ **Seamless user experience** - No re-authentication needed  
✅ **Unified commerce** - Single database serves all platforms  
✅ **Minimal changes** - Wavelength Lore keeps Firebase, adds API calls  
✅ **Scalable foundation** - Easy to add more LoreMaster sites  
✅ **Revenue tracking** - Complete visibility across all platforms  

The key insight is that the **Commerce API becomes the bridge** between your existing Firebase-based Wavelength Lore and the new PostgreSQL-based WavelengthHub, while JWT tokens provide seamless authentication across all platforms.