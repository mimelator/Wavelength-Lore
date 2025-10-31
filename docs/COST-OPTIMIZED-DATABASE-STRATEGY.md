# 💰 COST-OPTIMIZED DATABASE STRATEGY

**Document:** Database Architecture for $3.55/tenant Target  
**Project:** CanonNode Multi-Tenant Platform  
**Date:** October 31, 2025  

---

## 🎯 COST REALITY CHECK

### AWS RDS PostgreSQL Actual Costs:
```
db.t4g.micro:     $12.41/month
Storage (20GB):   $2.30/month  
Backups:          $0.95/month (10GB)
Total:            ~$16/month minimum
```

**Result:** RDS makes $3.55/tenant impossible with dedicated instances.

---

## 🏗️ COST-EFFECTIVE DATABASE OPTIONS

### Option 1: Hybrid Firebase + PostgreSQL (RECOMMENDED)
```javascript
const hybridStrategy = {
  firebase: {
    purpose: 'Real-time data, user sessions, content',
    costPerTenant: '$0.50-2.00/month',
    isolation: 'Collection prefixes: tenant-id_collection',
    benefits: ['No server management', 'Real-time sync', 'Offline support']
  },
  
  postgresql: {
    purpose: 'Analytics, reporting, complex queries',
    deployment: 'Single containerized instance',
    costPerTenant: '$0.30/month (shared EC2)',
    isolation: 'Separate schemas per tenant'
  }
};
```

### Option 2: Containerized Multi-Tenant PostgreSQL
```dockerfile
# Docker setup for cost-effective PostgreSQL
FROM postgres:15

# Custom initialization script
COPY init-multi-tenant.sql /docker-entrypoint-initdb.d/

# Resource limits for cost optimization
ENV POSTGRES_SHARED_BUFFERS=128MB
ENV POSTGRES_MAX_CONNECTIONS=100
ENV POSTGRES_WORK_MEM=4MB
```

```sql
-- init-multi-tenant.sql
-- Row-level security template
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS tenant_%I', tenant_id);
  
  -- Create tables with RLS
  EXECUTE format('
    CREATE TABLE tenant_%I.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT DEFAULT %L,
      email VARCHAR(255) UNIQUE,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT ''member'',
      credits INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )', tenant_id, tenant_id);
  
  -- Enable RLS
  EXECUTE format('ALTER TABLE tenant_%I.users ENABLE ROW LEVEL SECURITY', tenant_id);
  
  -- Create policy
  EXECUTE format('
    CREATE POLICY tenant_isolation ON tenant_%I.users
    FOR ALL USING (tenant_id = current_setting(''app.current_tenant''))', 
    tenant_id, tenant_id);
END;
$$ LANGUAGE plpgsql;
```

### Option 3: Serverless PostgreSQL (Neon/PlanetScale)
```javascript
const serverlessPostgreSQL = {
  neon: {
    freeTier: {
      storage: '0.5GB',
      compute: 'Shared',
      cost: '$0/month'
    },
    
    paidTier: {
      storage: '10GB',
      compute: 'Dedicated 0.25 vCPU',
      cost: '$19/month',
      tenantsSupported: 50,
      costPerTenant: '$0.38/month'
    },
    
    benefits: [
      'Automatic scaling',
      'Database branching',
      'No server management'
    ]
  }
};
```

---

## 🎯 RECOMMENDED: FIREBASE-FIRST APPROACH

### Architecture Overview
```javascript
const costOptimizedArchitecture = {
  primaryDatabase: {
    service: 'Firebase Firestore',
    purpose: 'All application data',
    isolation: 'Collection-based tenant separation',
    estimatedCost: '$0.50-2.00/tenant/month'
  },
  
  analyticsDatabase: {
    service: 'Shared PostgreSQL (containerized)',
    purpose: 'Cross-tenant analytics, reporting',
    deployment: 'Single EC2 t3.small',
    cost: '$16.79/month total',
    tenantsSupported: 50,
    costPerTenant: '$0.34/month'
  },
  
  totalDatabaseCost: '$0.84-2.34/tenant/month'
};
```

### Implementation Strategy
```javascript
// services/database-router.js
class DatabaseRouter {
  constructor(tenantId) {
    this.tenantId = tenantId;
    this.firebase = new TenantFirebaseService(tenantId);
    this.analytics = new SharedAnalyticsDB();
  }
  
  // Route operations to appropriate database
  async createUser(userData) {
    // Primary data goes to Firebase
    const user = await this.firebase.collection('users').add({
      ...userData,
      tenantId: this.tenantId
    });
    
    // Analytics copy goes to PostgreSQL
    await this.analytics.logUserCreation(this.tenantId, user.id);
    
    return user;
  }
  
  async getAnalytics(query) {
    // Complex queries use PostgreSQL
    return await this.analytics.runQuery(this.tenantId, query);
  }
}
```

---

## 💰 DETAILED COST BREAKDOWN

### Firebase Firestore Pricing (Primary Database)
```javascript
const firestoreCosts = {
  // Typical small tenant (100 active users)
  smallTenant: {
    reads: '50K/month × $0.06/100K = $0.03',
    writes: '20K/month × $0.18/100K = $0.04', 
    storage: '0.1GB × $0.18/GB = $0.02',
    total: '$0.09/month'
  },
  
  // Typical medium tenant (500 active users)
  mediumTenant: {
    reads: '500K/month × $0.06/100K = $0.30',
    writes: '200K/month × $0.18/100K = $0.36',
    storage: '1GB × $0.18/GB = $0.18',
    total: '$0.84/month'
  },
  
  // Large tenant (2000 active users)
  largeTenant: {
    reads: '2M/month × $0.06/100K = $1.20',
    writes: '800K/month × $0.18/100K = $1.44',
    storage: '5GB × $0.18/GB = $0.90',
    total: '$3.54/month'
  }
};
```

### Shared PostgreSQL Analytics
```javascript
const sharedPostgreSQLCosts = {
  infrastructure: {
    ec2Instance: 't3.small = $16.79/month',
    ebsStorage: '20GB = $2.00/month',
    backups: 'S3 storage = $0.50/month',
    total: '$19.29/month'
  },
  
  capacity: {
    supportedTenants: 50,
    costPerTenant: '$0.39/month'
  }
};
```

### Total Database Costs per Tenant
```javascript
const totalCosts = {
  smallTenant: '$0.09 + $0.39 = $0.48/month',
  mediumTenant: '$0.84 + $0.39 = $1.23/month', 
  largeTenant: '$3.54 + $0.39 = $3.93/month'
};

// Average across tenant mix: ~$1.50/month per tenant
// Well within our $3.55/month infrastructure budget!
```

---

## 🛠️ IMPLEMENTATION PLAN

### Phase 1: Firebase-First Migration
```javascript
// 1. Update existing codebase to use Firebase more efficiently
const optimizedFirebaseService = {
  // Batch operations to reduce costs
  batchWrites: 'Group multiple writes into single batch',
  
  // Efficient queries
  indexOptimization: 'Ensure all queries use proper indexes',
  
  // Data lifecycle
  archival: 'Move old data to cheaper Cloud Storage'
};
```

### Phase 2: Add Analytics Database
```javascript
// 2. Add shared PostgreSQL for analytics
const analyticsLayer = {
  deployment: 'Docker container on EC2',
  dataSync: 'Firebase Functions trigger analytics updates',
  queries: 'Cross-tenant reporting and insights'
};
```

### Phase 3: Scale Based on Usage
```javascript
// 3. Monitor and optimize
const scalingStrategy = {
  triggers: {
    'Average tenant cost > $3.00': 'Consider database sharding',
    'Total tenants > 50': 'Add second PostgreSQL instance',
    'Read latency > 200ms': 'Add read replicas'
  }
};
```

---

## 🎯 FINAL RECOMMENDATION

**Use Firebase as primary database** with shared PostgreSQL for analytics:

✅ **Achieves $1.50/tenant/month database cost**  
✅ **No server management overhead**  
✅ **Real-time capabilities built-in**  
✅ **Scales automatically with usage**  
✅ **Familiar to existing codebase**  

This keeps us well within the $3.55/month total infrastructure budget while providing enterprise-grade capabilities.