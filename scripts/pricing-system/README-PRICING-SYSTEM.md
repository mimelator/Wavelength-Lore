# WAVELENGTH PRICING SYSTEM ARCHITECTURE
## Self-Contained Pricing Catalog Management

### 🎯 OVERVIEW
This system creates and maintains "pricing reference products" in Printify to get real costs for our 142 catalog product types. These costs are then used for dynamic product generation with accurate pricing.

---

## 📋 PHASE BREAKDOWN

### **PHASE 1: PRICING CATALOG CREATION**
**Goal**: Create pricing reference products for all catalog items
**Script**: `wavelength-pricing-catalog-creator.js`
**Frequency**: Run once initially, then when new product types are added

### **PHASE 2: PRICING DATA EXTRACTION** 
**Goal**: Extract and cache pricing data from reference products
**Script**: `wavelength-pricing-data-extractor.js` 
**Frequency**: Run monthly or when prices need refreshing

### **PHASE 3: FRONTEND INTEGRATION**
**Goal**: Update merchandise store to use real pricing data
**Script**: Update existing pricing endpoints to use cached data
**Frequency**: One-time integration

### **PHASE 4: MAINTENANCE SYSTEM**
**Goal**: Keep pricing current and detect issues
**Script**: `wavelength-pricing-maintenance.js`
**Frequency**: Run weekly via cron or GitHub Actions

---

## 🔄 DATA FLOW

```
[Product Catalog] → [Reference Products] → [Pricing Cache] → [Customer Store]
   (142 types)        (142 instances)       (JSON file)       (Real prices)
```

---

## 🛠️ MAINTENANCE WORKFLOW (4 months from now)

### **Scenario 1: Refresh All Pricing**
```bash
npm run wavelength:refresh-pricing
# Runs: pricing-data-extractor.js → updates pricing cache
```

### **Scenario 2: Add New Product Types**
```bash
npm run wavelength:add-products
# Runs: pricing-catalog-creator.js → creates missing reference products
```

### **Scenario 3: Check System Health**
```bash
npm run wavelength:pricing-health-check
# Runs: pricing-maintenance.js → reports issues and recommendations
```

---

## 📊 FILE STRUCTURE

```
/
├── scripts/pricing-system/
│   ├── wavelength-pricing-catalog-creator.js     # Phase 1
│   ├── wavelength-pricing-data-extractor.js      # Phase 2  
│   ├── wavelength-pricing-maintenance.js         # Phase 4
│   └── README-PRICING-SYSTEM.md                  # This file
├── config/
│   ├── product-types.js                          # Source catalog
│   └── pricing-cache.json                        # Extracted pricing data
└── api/
    └── pricing-endpoints.js                      # Updated to use cache
```

---

## 🎯 CACHE STRUCTURE

```json
{
  "lastUpdated": "2025-10-28T12:00:00Z",
  "products": {
    "validated-413": {
      "name": "Backpack",
      "blueprintId": 413,
      "printProviderId": 10,
      "referenceProductId": "shop_product_12345",
      "baseCost": 1250,
      "variants": [
        {
          "id": "variant_1",
          "title": "One size",
          "cost": 1250,
          "retailPrice": 2500
        }
      ]
    }
  }
}
```

---

## ⚡ QUICK COMMANDS (Future Reference)

| Command | Purpose | When to Run |
|---------|---------|-------------|
| `npm run wavelength:create-pricing-catalog` | Create all reference products | First time setup |
| `npm run wavelength:refresh-pricing` | Update pricing cache | Monthly |
| `npm run wavelength:pricing-health` | Check system status | Weekly |
| `npm run wavelength:add-missing-products` | Add new product types | When catalog grows |

---

## 🚨 TROUBLESHOOTING (Future You Will Thank Us)

### **"Prices seem outdated"**
```bash
npm run wavelength:refresh-pricing
```

### **"New products show no pricing"** 
```bash
npm run wavelength:add-missing-products
npm run wavelength:refresh-pricing
```

### **"System not working at all"**
```bash
npm run wavelength:pricing-health
# Will diagnose and report issues
```

---

## 📈 MONITORING

The system tracks:
- ✅ Reference products status
- ✅ Pricing cache freshness  
- ✅ API rate limits
- ✅ Missing product types
- ✅ Price change alerts

**Next**: Implement Phase 1 - Pricing Catalog Creator