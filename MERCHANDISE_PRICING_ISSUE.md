# Merchandise Pricing Issue - To Be Fixed

## Problem Summary
Nearly all merchandise shows **$19.95** because the system uses hardcoded price estimates instead of real Printify pricing data.

## Root Cause Analysis
1. **Frontend**: Uses hardcoded `basePrices` mapping in `static/js/components/merchandise-store.js`
   - Default fallback: `$19.95` (lines 366, 373, 401, 409)
   - Category estimates: t-shirt $18.95, hoodie $34.95, etc.
   
2. **Backend**: Uses hardcoded `price: 2099` ($20.99) in services
   - Found in: `services/printify-service.js`, `services/enhanced-printify-service.js`
   
3. **No Real API Integration**: System doesn't call Printify's actual pricing API

## Current Behavior
- Most products fall back to $19.95 default
- Some categories use hardcoded estimates (hoodie $34.95, blanket $49.95, etc.)
- Backend creates products with $20.99 price regardless of actual Printify cost

## Solution Needed
1. **Integrate Printify Pricing API**: Call real Printify blueprint/variant pricing endpoints
2. **Cache Real Prices**: Store actual prices to avoid API rate limits
3. **Update Price Logic**: Replace hardcoded estimates with real data
4. **Fallback Strategy**: Keep estimates as fallback when API unavailable

## Files to Modify
- `static/js/components/merchandise-store.js` (lines 366-409)
- `services/printify-service.js` (pricing logic)
- `services/enhanced-printify-service.js` (basePrice values)
- `services/auto-enhanced-printify-service.js` (basePrice values)

## Priority
**Medium** - Affects user experience but not blocking functionality

## Date Identified
October 27, 2025

## Status
**Open** - Deferred for later implementation