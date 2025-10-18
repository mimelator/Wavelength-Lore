# UI Component Hierarchy & Flow Diagram

## 🏗️ **Component Architecture Overview**

```
Wavelength Lore Application
│
├── 📄 Core Page Templates
│   ├── index.ejs (Home Page)
│   ├── episode.ejs (Episode Details)
│   ├── character.ejs (Character Details)
│   ├── lore.ejs (Lore Details)
│   ├── character-gallery.ejs (Hero Gallery)
│   └── lore-gallery.ejs (Lore Gallery)
│
├── 🧩 Shared Components (partials/)
│   ├── head.ejs (Meta tags, CSS imports)
│   ├── header.ejs (Navigation bar)
│   └── footer.ejs (Footer navigation)
│
├── 🗣️ Forum System (forum/)
│   ├── layout.ejs (Forum base layout)
│   ├── home-page.ejs (Forum home)
│   ├── create-post-page.ejs (Post creation)
│   ├── post-page.ejs (Post details)
│   ├── user-profile.ejs (User management)
│   ├── category-page.ejs (Category views)
│   ├── recent.ejs (Recent posts)
│   └── popular.ejs (Popular content)
│
└── 🎨 Styling Architecture
    ├── styles.css (Global styles)
    ├── lore_styles.css (Lore theming)
    ├── character_styles.css (Character theming)
    ├── gallery_styles.css (Gallery layouts)
    ├── carousel.css (Carousel components)
    ├── modal_styles.css (Modal overlays)
    └── forum.css (Forum styling)
```

## 🔄 **Navigation Flow**

```
🏠 Home Page (index.ejs)
│
├── 📺 Season Carousels
│   └── 🎬 Episode Page (episode.ejs)
│       └── 💬 Forum Create Post
│
├── 🗣️ Hero Gallery (character-gallery.ejs)
│   └── 👤 Character Page (character.ejs)
│       └── 💬 Forum Create Post
│
├── 🌟 Lore Gallery (lore-gallery.ejs)
│   └── 📚 Lore Page (lore.ejs)
│       └── 💬 Forum Create Post
│
└── 🗣️ Forum System
    ├── 🏠 Forum Home
    ├── 📝 Create Post
    ├── 📋 Categories
    ├── 👤 User Profiles
    └── 🔍 Search
```

## 📱 **Responsive Design Hierarchy**

```
📱 Mobile Layout (≤768px)
├── 📏 Compact Navigation
├── 🎠 2-slide Carousels
├── 📝 Stacked Content
└── 👆 Touch-Optimized Buttons

💻 Desktop Layout (>768px)
├── 📏 Full Navigation
├── 🎠 3-5 slide Carousels
├── 📝 Multi-column Layouts
└── 🖱️ Hover Interactions
```

## 🎨 **Visual Design System**

```
🎨 Color Scheme
├── Episode Pages: Purple (#4a47a3)
├── Character Pages: Purple (#6a4c93)
├── Lore Pages: Type-based
│   ├── Places: Green (#2e7b32)
│   ├── Things: Orange (#f57c00)
│   ├── Concepts: Purple (#7b1fa2)
│   ├── Ideas: Blue (#1976d2)
│   └── Other: Gray (#5a5a5a)
└── Forum: Consistent with main theme

🖼️ Layout Patterns
├── Hero Banners: Full-width background images
├── Card Grids: Responsive gallery layouts
├── Carousels: Interactive image sliders
└── Modals: Full-screen image overlays

🔗 Interactive Elements
├── Forum Buttons: Context-aware creation
├── Smart Links: Auto-detected connections
├── Navigation: Previous/next with thumbnails
└── Media: Audio players and video links
```

## 🔧 **Technical Stack Integration**

```
🛠️ Frontend Technologies
├── EJS Templates: Server-side rendering
├── CSS3: Modern styling with Grid/Flexbox
├── JavaScript: Interactive functionality
├── jQuery: DOM manipulation
├── Slick Carousel: Image galleries
└── Responsive Design: Mobile-first approach

🔥 Backend Integration
├── Firebase: Real-time database
├── Authentication: User management
├── Smart Linking: Content connections
├── CDN: Asset delivery
└── Express.js: Server routing

📊 Data Flow
├── Firebase → EJS Templates
├── User Interactions → Forum System
├── Content Links → Smart Navigation
└── Media Assets → CDN Delivery
```

## 🎯 **User Experience Flow**

```
👤 User Journey
│
├── 🏠 Landing (Home Page)
│   ├── 📖 Browse Seasons/Episodes
│   ├── 👥 Discover Characters
│   └── 🌟 Explore Lore
│
├── 📖 Content Consumption
│   ├── 🎬 Episode Details
│   ├── 👤 Character Profiles
│   └── 📚 Lore Information
│
├── 🔗 Content Discovery
│   ├── 🔍 Smart Links
│   ├── 🎠 Related Carousels
│   └── 📋 Connection Networks
│
└── 💬 Community Engagement
    ├── 📝 Create Posts
    ├── 💭 Discussions
    └── 👥 User Profiles
```

## 🚀 **Performance Architecture**

```
⚡ Optimization Strategy
├── 🖼️ Image Optimization
│   ├── CDN Delivery
│   ├── Lazy Loading
│   └── Responsive Images
├── 📦 Asset Management
│   ├── CSS Minification
│   ├── JavaScript Bundling
│   └── Cache Headers
├── 🔄 Data Caching
│   ├── Firebase Caching
│   ├── Browser Cache
│   └── CDN Cache
└── 📱 Mobile Performance
    ├── Touch Optimization
    ├── Reduced Payload
    └── Progressive Loading
```

This architecture provides a scalable, maintainable, and user-friendly foundation for the Wavelength Lore application, with clear separation of concerns and consistent design patterns throughout.