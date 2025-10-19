# Website Resource Checkers

This directory contains three companion scripts for checking different types of resources and links on the Wavelength Lore website.

## 🖼️ Image Checker (`check_broken_images.js`)

Checks all images (img tags, background images, etc.) across the website.

### Usage:
```bash
# Check local development images
node check_broken_images.js

# Check production images  
node check_broken_images.js --prod

# Show help
node check_broken_images.js --help
```

### What it checks:
- ✅ `<img>` tags and their src attributes
- ✅ CSS background-image properties
- ✅ Image categorization (navigation, carousel, banner, hero, etc.)
- ✅ HTTP status codes and error handling
- ✅ Comprehensive reporting by category

## 📁 Static Resource Checker (`check_static_resources.js`)

Checks all static resources (CSS, JS, fonts, icons, etc.) across the website.

### Usage:
```bash
# Check local development static resources
node check_static_resources.js

# Check production static resources
node check_static_resources.js --prod

# Show help
node check_static_resources.js --help
```

### What it checks:
- ✅ CSS files (.css) - both external and CDN links
- ✅ JavaScript files (.js) - external scripts and modules
- ✅ SVG icons (.svg) - favicon and icon resources  
- ✅ Font files (.woff, .woff2, .ttf, .eot) - custom fonts
- ✅ Favicon and icon links
- ✅ Inline CSS and JavaScript block counting
- ✅ External CDN resource validation
- ✅ HTTP status codes, content types, and file sizes

## � Route Link Checker (`check_route_links.js`)

Scans all EJS views and partials for internal route links and validates they exist.

### Usage:
```bash
# Check local development route links
node check_route_links.js

# Check production route links
node check_route_links.js --prod

# Show help
node check_route_links.js --help
```

### What it checks:
- ✅ Internal links in EJS views and partials (`href` attributes)
- ✅ Form action targets (`action` attributes)
- ✅ JavaScript location redirects (`window.location`, `location.href`)
- ✅ Dynamic route parameters (character/{id}, lore/{id}, season/{s}/episode/{e})
- ✅ Forum navigation links and categories
- ✅ Static page links (about, contact, map, etc.)
- ✅ Database validation for dynamic IDs (characters, lore, episodes)
- ✅ Template variable filtering (ignores EJS `<%= %>` expressions)

## 🔧 Common Features

All three scripts share these features:

### Environment Support:
- **Local Development**: `http://localhost:3001`
- **Production**: `https://wavelengthlore.com`

### Admin Authentication & Rate Limit Bypass:
- **Automatic Admin Auth**: Scripts automatically use `ADMIN_SECRET_KEY` environment variable for production
- **Rate Limit Bypass**: Admin authentication bypasses all rate limiting for testing
- **No Delays Needed**: Fast, efficient testing without artificial delays

### Smart Timeout Handling:
- Local: 5-10 second timeouts
- Production: 15-30 second timeouts for better reliability

### Comprehensive Reporting:
- Page-by-page analysis
- Category-based resource breakdown  
- Success/failure statistics
- Detailed error information
- Final summary reports

### Route Discovery:
Scripts automatically discover routes by querying the Firebase database for:
- All character pages (`/character/{id}`)
- All lore pages (`/lore/{id}`)
- All episode pages (`/season/{s}/episode/{e}`)
- Static pages (gallery, map, forum, etc.)

## 🎯 Use Cases

### Development Workflow:
```bash
# Before committing changes - check everything
node check_broken_images.js
node check_static_resources.js
node check_route_links.js

# Verify production deployment
node check_broken_images.js --prod
node check_static_resources.js --prod
node check_route_links.js --prod
```

### Debugging Issues:
```bash
# Check if CDN resources are loading correctly
node check_static_resources.js --prod

# Find broken internal links in templates
node check_route_links.js

# Verify image loading across all pages
node check_broken_images.js --prod
```

### CI/CD Integration:
```bash
# In your deployment pipeline
npm test && \
node scripts/check_static_resources.js --prod && \
node scripts/check_route_links.js --prod && \
echo "All checks passed!"
```

## 📊 Output Examples

### Route Link Checker Success:
```
🎉 CONGRATULATIONS! All route links are working correctly!
📊 Overall: 35/35 routes working
   Success rate: 100%
```

### Route Link Issues Found:
```
🚨 BROKEN ROUTES FOUND:
❌ /forum/guidelines
   HTTP Status: 500
   Found in:
     - views/forum/home-page.ejs
     - views/forum/layout.ejs

❌ /forum/search  
   HTTP Status: 500
   Found in:
     - views/forum/home-page.ejs
```

### Static Resource Success:
```
🎉 CONGRATULATIONS! All static resources are working correctly!
📊 Overall: 45/45 static resources working
   Success rate: 100%
```

## 🚀 Getting Started

1. Ensure your environment is configured (`.env` file loaded)
2. Make sure Firebase credentials are available
3. For local testing, ensure your development server is running on port 3001
4. Run the scripts with the desired environment flag

The scripts will automatically:
- Load environment variables
- Connect to Firebase to discover routes (for applicable scripts)
- Check all resources/links across all pages
- Generate detailed reports

Perfect for CI/CD integration, development workflow validation, and production monitoring!