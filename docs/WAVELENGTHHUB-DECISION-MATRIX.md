# 🎯 WAVELENGTHHUB DECISION MATRIX

**Quick Reference for Critical Decisions**  
**Use this to track decisions and rationale**

---

## ✅ DECISION TRACKER

### 🔴 CRITICAL (Block Implementation)
| Decision | Options | Recommendation | Status | Notes |
|----------|---------|----------------|--------|-------|
| **Project Name** | CanonNode / WavelengthHub / Other | WavelengthHub | ✅ **CONFIRMED: hub.wavelengthlore.com** | Using subdomain approach |
| **Domain** | wavelengthhub.com / canonnode.com | wavelengthhub.com | ✅ **CONFIRMED: hub.wavelengthlore.com** | Subdomain of existing site |
| **Codebase Strategy** | Enhance Existing / Clean Slate | Clean Slate | ✅ **CONFIRMED: Clean Slate** | Build from scratch |
| **Database Strategy** | Firebase Hybrid / PostgreSQL Only | Firebase Hybrid | ✅ **CONFIRMED: Firebase Only** | PostgreSQL too expensive for budget |
| **Migration Timeline** | Parallel / Sequential | Parallel | ✅ **CONFIRMED: No Migration** | wavelengthlore.com stays separate |

### 🟡 IMPORTANT (Affect Architecture)
| Decision | Options | Recommendation | Status | Notes |
|----------|---------|----------------|--------|-------|
| **Repository Structure** | Monorepo / Multi-repo | Monorepo | ✅ **DECIDED: Simple Repo** | Single codebase for small team |
| **Hosting** | AWS / Vercel / Other | AWS (current) | ✅ **CONFIRMED: AWS** | Open to Vercel if strong case |
| **Frontend Framework** | Next.js / Remix / Other | Next.js 14 | ✅ **NO PREFERENCE** | Will choose based on cost/performance |
| **Shop Architecture** | Unified / Per-site | Unified | ✅ **ASSUMED: Unified** | Matches existing docs |
| **Auth System** | Firebase Auth / Auth0 / Other | Firebase Auth + JWT SSO | ✅ **CONFIRMED: Firebase Auth** | Matches database choice |

### 🟢 DETAILS (Can Iterate)
| Decision | Options | Recommendation | Status | Notes |
|----------|---------|----------------|--------|-------|
| **Beta Program Size** | 5 / 10 / 15 LoreMasters | 5-10 | ✅ **CONFIRMED: 2 LoreMasters** | Starting small |
| **Subscription Pricing** | $19/month / Tiers | $19/month base | ✅ **CONFIRMED: $19/month** | Plus 50 AI credits/month |
| **Revenue Split** | Standard / Custom for Lore | Standard 65/20/15 | ⏳ **FLEXIBLE** | Not sure yet |
| **AI Credits Included** | 50 / 100 / Variable | 50/month | ✅ **CONFIRMED: 50/month** | Included in subscription |

---

## 📊 ARCHITECTURE DECISIONS

### Database Architecture
```
✅ RECOMMENDED: Firebase Hybrid
├─ Firebase Firestore (Primary): $0.50-2.00/tenant/month
│   ├─ User sessions
│   ├─ Real-time content
│   └─ User data
└─ PostgreSQL (Analytics): $0.34/tenant/month (shared)
    ├─ Complex queries
    └─ Cross-tenant analytics

TOTAL: ~$1.50/tenant/month ✅
```

### Repository Structure
```
✅ RECOMMENDED: Monorepo
wavelength-platform/
├─ packages/
│   ├─ platform-api/
│   ├─ shop-api/
│   ├─ site-generator/
│   ├─ admin-dashboard/
│   └─ shared/
├─ templates/
├─ infrastructure/
└─ migration-tools/
```

### Deployment Strategy
```
✅ RECOMMENDED: Parallel Development
Phase 1 (Months 1-6): Build wavelengthhub.com
Phase 2 (Month 6+): Migrate wavelengthlore.com
```

---

## 💰 PRICING & REVENUE

### Subscription Model
- **Base Tier:** $19/month per LoreMaster
- **Includes:** Subdomain, templates, 50 AI credits/month
- **Revenue Share:** 65% LoreMaster / 20% Platform / 15% Fulfillment

### Questions to Resolve:
- ❓ Final pricing confirmed?
- ❓ Early bird pricing strategy?
- ❓ Wavelength Lore pricing (special rate or standard)?
- ❓ AI credits additional pricing?

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Foundation (Weeks 1-4)
- [ ] Repository setup
- [ ] Domain registration
- [ ] Infrastructure setup
- [ ] Core architecture implementation

### Phase 2: Core Features (Weeks 5-8)
- [ ] Multi-tenant middleware
- [ ] Authentication system
- [ ] Site template engine
- [ ] Unified shop integration

### Phase 3: Beta Program (Weeks 9-16)
- [ ] Early adopter recruitment
- [ ] Beta site onboarding
- [ ] Feature refinement
- [ ] Documentation

### Phase 4: Migration (Month 6+)
- [ ] Migration tools
- [ ] Parallel environment
- [ ] Data migration
- [ ] DNS cutover

---

## 📝 DECISION LOG

**Use this section to log decisions as they're made:**

| Date | Decision | Rationale | Approved By |
|------|----------|-----------|-------------|
| 2025-01-XX | Domain: hub.wavelengthlore.com | Subdomain approach, maintains brand | Confirmed |
| 2025-01-XX | Clean slate codebase | Better architecture from day 1 | Confirmed |
| 2025-01-XX | No migration needed | wavelengthlore.com stays separate | Confirmed |
| 2025-01-XX | Budget: < $5/tenant/month | Cost-conscious approach | Confirmed |
| 2025-01-XX | Firebase only database | PostgreSQL too expensive | Confirmed |
| 2025-01-XX | Starting with 2 LoreMasters | Small initial scale | Confirmed |
| 2025-01-XX | Pricing: $19/month + 50 credits | Match promotional materials | Confirmed |
| 2025-01-XX | Goal: Break-even, not profit | Cost coverage focus | Confirmed |

---

## 🔗 RELATED DOCUMENTS

- **Full Analysis:** `WAVELENGTHHUB-PIVOT-ANALYSIS.md`
- **Architecture Specs:** `MULTI-SITE-TECHNICAL-SPECIFICATIONS.md`
- **Migration Plan:** `HYBRID-DEPLOYMENT-STRATEGY.md`
- **Database Strategy:** `COST-OPTIMIZED-DATABASE-STRATEGY.md`

---

**Status Legend:**
- ⏳ PENDING - Decision needed
- ✅ DECIDED - Decision made
- 🔄 REVIEWING - Under consideration
- ❌ REJECTED - Option not chosen

