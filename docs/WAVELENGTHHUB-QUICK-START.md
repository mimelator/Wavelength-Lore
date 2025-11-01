# 🚀 WAVELENGTHHUB: QUICK START GUIDE

**Getting Started with Your New Multi-Tenant Platform**  
**Based on Final Decisions - January 2025**

---

## ✅ CONFIRMED DECISIONS SUMMARY

- **Domain:** `hub.wavelengthlore.com`
- **Codebase:** Clean slate (new repository)
- **Migration:** None - wavelengthlore.com stays separate
- **Budget:** < $5/tenant/month
- **Database:** Firebase only
- **Hosting:** AWS (open to Vercel if case made)
- **Initial Scale:** 2 LoreMasters
- **Pricing:** $19/month + 50 AI credits/month
- **Goal:** Break-even, cost coverage

---

## 🎯 KEY ARCHITECTURE DECISIONS

### 1. Subdomain Approach
- `hub.wavelengthlore.com` - Main platform
- `site1.hub.wavelengthlore.com` - First LoreMaster site
- `site2.hub.wavelengthlore.com` - Second LoreMaster site

### 2. Firebase-Only Database
- Single Firebase project (shared with wavelengthlore.com or separate?)
- Tenant isolation via collection prefixes
- Estimated cost: ~$0.10/tenant/month (very small scale)

### 3. No Migration Strategy
- wavelengthlore.com continues on existing codebase
- Hub is completely separate platform
- Can share authentication if same Firebase project

---

## 💰 COST BREAKDOWN (2 Tenants)

### Revenue
- **Subscriptions:** 2 × $19 = $38/month
- **Shop Revenue:** ~$40/month (conservative estimate, 20% of $200 sales)
- **Total Revenue:** ~$78/month

### Costs (Vercel Option - Recommended)
- **Vercel Free Tier:** $0/month ✅
- **Firebase Firestore:** ~$0.20/month (2 tenants)
- **S3 Storage:** ~$2/month
- **CDN:** ~$1/month
- **Domain/DNS:** ~$0.50/month
- **Total:** ~$3.70/month ✅

### Break-Even Status
- **Revenue:** $78/month
- **Costs:** $3.70/month
- **Profit:** $74.30/month ✅ **BREAK-EVEN ACHIEVED**

---

## 📋 IMMEDIATE NEXT STEPS

### Week 1: Setup & Foundation

1. **Create Repository**
   ```bash
   mkdir wavelength-hub
   cd wavelength-hub
   git init
   npm init -y
   ```

2. **Set Up Domain**
   - Configure DNS: `hub.wavelengthlore.com` → CNAME to hosting
   - Test subdomain routing

3. **Firebase Setup**
   - Decide: Same Firebase project as wavelengthlore.com OR separate?
   - Initialize Firebase Admin SDK
   - Set up Firestore rules for multi-tenancy

4. **Initialize Project**
   ```bash
   npm install express firebase-admin dotenv
   npm install -D nodemon
   ```

5. **Basic Project Structure**
   ```
   wavelength-hub/
   ├─ src/
   │   ├─ api/
   │   ├─ services/
   │   └─ middleware/
   ├─ public/
   ├─ package.json
   └─ .env
   ```

### Week 2: Core Multi-Tenancy

1. **Tenant Middleware**
   - Extract tenant from subdomain
   - Load tenant configuration
   - Set tenant context

2. **Firebase Collections**
   - Design tenant-scoped collections
   - Implement tenant service
   - Test isolation

3. **Provisioning API**
   - Create tenant endpoint
   - Generate site configuration
   - Initialize collections

---

## 🔧 HOSTING DECISION: VERCEL VS AWS

### Why Vercel is Recommended (Initially)

**At 2 Tenants:**
- ✅ Free tier = $0/month (meets budget perfectly)
- ✅ Zero configuration
- ✅ Automatic scaling
- ✅ Built-in CDN
- ✅ Fast deployment

**At 10 Tenants:**
- ✅ Pro plan ~$20/month = $2/tenant
- ✅ Still within budget

**Migration Path:**
- Easy to migrate to AWS later (at 10+ tenants)
- Can run both in parallel during transition

### AWS Option (If Preferred)

**At 2 Tenants:**
- ⚠️ Minimum ~$15-20/month = $10/tenant (over budget)
- ✅ More control
- ✅ Familiar infrastructure

**Recommendation:** Start Vercel, migrate to AWS at 10+ tenants

---

## 🗄️ FIREBASE PROJECT DECISION

### Option 1: Same Firebase Project (RECOMMENDED)
```
Pros:
✅ Shared authentication (users can use same login)
✅ Lower costs (one Firebase project)
✅ Unified user base
✅ Easier cross-platform features

Cons:
⚠️ Need to carefully namespace collections
```

### Option 2: Separate Firebase Project
```
Pros:
✅ Complete isolation
✅ Independent scaling
✅ Separate billing

Cons:
❌ Higher costs (two Firebase projects)
❌ Need SSO for shared users
❌ More complex user management
```

**Recommendation:** Use same Firebase project, namespace carefully

---

## 📁 RECOMMENDED PROJECT STRUCTURE

```javascript
wavelength-hub/
├─ src/
│   ├─ api/
│   │   ├─ middleware/
│   │   │   ├─ tenant.js           // Tenant detection
│   │   │   └─ auth.js             // Firebase Auth
│   │   ├─ routes/
│   │   │   ├─ tenant.js           // Tenant management
│   │   │   ├─ shop.js             // Unified shop
│   │   │   └─ loremaster.js       // Dashboard
│   │   └─ server.js               // Express app
│   │
│   ├─ services/
│   │   ├─ tenant-service.js       // Tenant operations
│   │   ├─ shop-service.js         // Shop logic
│   │   └─ template-service.js     // Template rendering
│   │
│   └─ utils/
│       └─ tenant-detector.js      // Extract tenant from domain
│
├─ templates/                       // Site templates
│   ├─ music-site/
│   └─ default/
│
├─ scripts/
│   └─ provision-site.js           // Site provisioning
│
├─ package.json
├─ firebase.json
└─ vercel.json (or app.yaml)
```

---

## ❓ REMAINING DECISIONS NEEDED

1. **Firebase Project:** Same as wavelengthlore.com or separate?
   - **Recommendation:** Same (see above)

2. **Hosting:** Vercel (recommended) or AWS from start?
   - **Recommendation:** Start Vercel, migrate later

3. **First Template:** Which template to build first?
   - Music, Art, Literature, or Gaming?

4. **Revenue Split:** For wavelengthlore.com specifically?
   - Standard 65% or special rate (since it's your original site)?

---

## 🎯 SUCCESS CRITERIA

### Phase 1 (MVP - 2 Tenants)
- [ ] 2 LoreMasters onboarded successfully
- [ ] Sites live and functional
- [ ] Revenue > Costs (break-even achieved)
- [ ] Zero critical bugs in production
- [ ] Positive feedback from beta LoreMasters

### Phase 2 (Scale - 10 Tenants)
- [ ] 10 active LoreMasters
- [ ] Costs < $25/month (or $2.50/tenant)
- [ ] Revenue > Costs consistently
- [ ] Platform stability validated
- [ ] Ready for further scaling

---

## 📚 RELATED DOCUMENTS

- **Final Plan:** `WAVELENGTHHUB-FINAL-PLAN.md` - Complete implementation plan
- **Decision Matrix:** `WAVELENGTHHUB-DECISION-MATRIX.md` - Decision tracking
- **Analysis:** `WAVELENGTHHUB-PIVOT-ANALYSIS.md` - Initial analysis

---

**Ready to start building!** 🚀

Next step: Make final decisions on Firebase project and hosting, then we can begin Week 1 setup.

