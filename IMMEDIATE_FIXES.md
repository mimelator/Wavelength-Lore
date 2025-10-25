# Immediate Fixes for Tiered Product Integration

## 🚨 Critical Issues Identified

### 1. Progress Dialog Never Appears
**Issue**: Loading modal never shows during upscaling operations
**Root Cause**: Modal display logic not triggering correctly
**Impact**: Users see page hang without feedback

**Fix Required**:
```javascript
// In merchandise-store.js, line ~1089
setLoading(true, 'Analyzing image for print quality...');
// Modal should appear but doesn't - check modal HTML structure
```

### 2. Broken Route: /merchandise-store → 404
**Issue**: Route `/merchandise-store` returns 404 
**Root Cause**: Route not defined in server
**Impact**: Links in templates break

**Fix Required**:
```javascript
// Add to routes/index.js
app.get('/merchandise-store', (req, res) => {
  res.redirect('/merchandise');
});
```

### 3. Test Selectors Don't Match Current UI
**Issue**: Tests look for `.select-product-type-btn` but ProductNavigator uses different selectors
**Root Cause**: UI changed to tiered navigation but tests not updated
**Impact**: All product creation tests fail

**Fix Required**: Update test selectors to match ProductNavigator component

## 🔧 Quick Fixes

### Fix 1: Add Route Redirect
```javascript
// In routes/index.js or main server file
app.get('/merchandise-store', (req, res) => {
  res.redirect(301, '/merchandise');
});
```

### Fix 2: Fix Progress Dialog
Check loading modal HTML structure and ensure `setLoading()` properly shows modal.

### Fix 3: Update Test Selectors
Update tests to use ProductNavigator selectors instead of old button classes.

## 🚀 Deployment Priority

1. **HIGH**: Fix route redirect (breaks navigation)
2. **HIGH**: Fix progress dialog (user experience)  
3. **MEDIUM**: Update test selectors (development workflow)

## ✅ Success Metrics

- [ ] `/merchandise-store` redirects to `/merchandise`
- [ ] Progress dialog appears during upscaling
- [ ] Tests can find product selection elements
- [ ] Production validation passes 95%+