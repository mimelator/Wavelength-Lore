# Wavelength Lore - UI Structure Documentation

## 📋 **Overview**
This document provides a comprehensive breakdown of the user interface structure for all major page types in the Wavelength Lore application.

## 🏗️ **Common Structure Elements**

### Global Page Structure
All pages follow this basic HTML structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Page-specific meta and styles -->
  <%- include('partials/head') %>
  <!-- Additional stylesheets -->
</head>
<body>
  <%- include('partials/header') %>
  
  <!-- Page-specific content -->
  <main>
    <!-- Content sections -->
  </main>
  
  <%- include('partials/footer') %>
  
  <!-- Page-specific scripts -->
</body>
</html>
```

### Header Component (`partials/header.ejs`)
```html
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/characters">Hero Gallery</a></li>
      <li><a href="/lore">Lore Gallery</a></li>
      <li><a href="/forum">Forum</a></li>
    </ul>
  </nav>
</header>
```

### Footer Component (`partials/footer.ejs`)
```html
<footer>
  <div class="footer-content">
    <p>&copy; 2025 Wavelength Lore. All rights reserved.</p>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </div>
</footer>
```

## 📖 **Page-Specific UI Structures**

### 1. **Home Page** (`index.ejs`)

#### Structure
```
Header
├── Welcome Title
├── Introduction Section
│   ├── Project Description
│   └── Season Overview
└── For Each Season:
    ├── Season Title & Description
    ├── "Watch Full Season" Link
    ├── Episode Carousel
    │   └── For Each Episode:
    │       ├── Episode Title (linked)
    │       ├── Episode Image (linked)
    │       ├── Episode Description
    │       └── "Watch on YouTube" Link
    └── Season Separator
Footer
```

#### Key Components
- **Slick Carousel**: 3 slides on desktop, 2 on mobile
- **Responsive Design**: Adapts to screen size
- **Auto-play**: 4-second intervals
- **YouTube Integration**: Direct links to videos

### 2. **Episode Pages** (`episode.ejs`)

#### Structure
```
Header
├── Hero Banner Image (episode image)
├── Episode Navigation (prev/next)
├── Episode Title (H1)
├── 💬 Forum Create Post Button
├── Image Carousel (Slick)
├── Summary Section
│   └── Smart-linked description
├── Audio Player Section
│   └── Episode audio controls
├── Lyrics Section
│   ├── Smart-linked lyrics
│   └── "Watch the Video" link
└── Image Modal (for carousel clicks)
Footer
```

#### Key Features
- **Forum Integration**: Purple button (#4a47a3)
- **Smart Linking**: Auto-links to characters/lore
- **Interactive Carousel**: Clickable images with modal
- **Audio Playback**: Native HTML5 audio controls
- **Navigation**: Previous/next episode links

### 3. **Character Pages** (`character.ejs`)

#### Structure
```
Header
├── Character Navigation (prev/next)
├── Character Title (H1)
├── 🗣️ Forum Create Post Button
├── Character Banner (background image)
├── Character Description
│   └── Triple-linked content (characters/lore/episodes)
├── Hero Connections Section
│   ├── Connection links to other characters
│   └── Filtered character list
├── Character Image Gallery
│   ├── Shuffled image carousel
│   ├── Carousel dots navigation
│   └── Modal-enabled images
└── Image Modal
Footer
```

#### Key Features
- **Forum Integration**: Purple button (#6a4c93)
- **Triple Linking**: Characters, lore, and episodes auto-linked
- **Dynamic Gallery**: Randomized image order
- **Character Network**: Links to related characters

### 4. **Lore Pages** (`lore.ejs`)

#### Structure
```
Header
├── Lore Navigation (prev/next)
├── Lore Title (H1)
├── Lore Type Badge (place/concept/thing/idea)
├── 🌟 Forum Create Post Button (type-based colors)
├── Lore Banner (background image)
├── Lore Description
│   └── Smart-linked content
├── Related Lore Section
│   ├── Type-filtered lore connections
│   └── Color-coded lore links
├── Lore Image Gallery (conditional)
│   ├── Shuffled image carousel
│   ├── Carousel dots navigation
│   └── Modal-enabled images
└── Image Modal
Footer
```

#### Key Features
- **Type-Based Styling**: Different colors per lore type
- **Forum Integration**: Color matches lore type
- **Smart Disambiguation**: Advanced content linking
- **Conditional Gallery**: Only shows if images exist
- **Type Badges**: Visual categorization

### 5. **Gallery Pages**

#### **Character Gallery** (`character-gallery.ejs`)
```
Header
├── Gallery Title: "Hero Gallery"
├── Gallery Subtitle
└── Character Grid
    └── For Each Character:
        ├── Character Image (linked)
        ├── Character Title
        └── "Hero" Type Badge
Footer
```

#### **Lore Gallery** (`lore-gallery.ejs`)
```
Header
├── Gallery Title: "Lore Gallery"
├── Gallery Subtitle
└── Lore Grid
    └── For Each Lore Item:
        ├── Lore Image (linked)
        ├── Lore Title
        └── Type Badge (place/concept/etc.)
Footer
```

#### Key Features
- **Grid Layout**: Responsive card-based design
- **Type Badges**: Visual categorization
- **Hover Effects**: Image scaling and interactions
- **Direct Navigation**: Clickable cards to detail pages

### 6. **Forum Layout** (`forum/layout.ejs`)

#### Structure
```
Header (Forum-specific)
├── Firebase Authentication Setup
├── Session Management (2-week duration)
├── Forum Navigation
└── Forum Content Area
    ├── Category Navigation
    ├── Forum-specific Content
    │   ├── Post Lists
    │   ├── Create Post Forms
    │   ├── User Profiles
    │   └── Search Results
    └── Forum Footer
        ├── Forum Stats
        ├── Return to Main Site Link
        └── Community Guidelines
Footer (Forum-specific)
```

#### Key Features
- **Firebase Integration**: Real-time authentication
- **Extended Sessions**: 2-week local persistence
- **Responsive Design**: Mobile-optimized forum interface
- **Security**: Protected routes and user management

## 🎨 **UI Design Patterns**

### **Navigation Patterns**
1. **Top Navigation**: Previous/Next with thumbnails
2. **Breadcrumb Style**: Visual indicators for position
3. **Circular Navigation**: Wraps around at ends

### **Content Patterns**
1. **Hero Section**: Large background image
2. **Card Layout**: Gallery grid with hover effects
3. **Carousel**: Interactive image sliders
4. **Modal Overlay**: Full-size image viewing

### **Interactive Elements**
1. **Forum Buttons**: Context-aware create post buttons
2. **Smart Linking**: Auto-detected content connections
3. **Media Players**: Audio controls and YouTube integration
4. **Image Galleries**: Click-to-expand functionality

### **Responsive Design**
1. **Breakpoints**: Mobile (≤768px) vs Desktop
2. **Adaptive Carousels**: Different slide counts per device
3. **Flexible Layouts**: CSS Grid and Flexbox
4. **Touch-Friendly**: Mobile-optimized interactions

## 🔧 **Technical Implementation**

### **CSS Organization**
- `styles.css` - Global styles
- `lore_styles.css` - Lore-specific styling
- `character_styles.css` - Character page styling
- `gallery_styles.css` - Gallery layout styles
- `carousel.css` - Carousel component styles
- `modal_styles.css` - Modal overlay styles
- `forum.css` - Forum-specific styling

### **JavaScript Libraries**
- **jQuery** - DOM manipulation and AJAX
- **Slick Carousel** - Image carousels and sliders
- **Firebase SDK** - Authentication and database
- **Custom Scripts** - Modal handling and interactions

### **Template Engine**
- **EJS (Embedded JavaScript)** - Server-side rendering
- **Partials** - Reusable header/footer components
- **Dynamic Content** - Database-driven content rendering
- **Conditional Rendering** - Feature-based content display

## 📱 **Mobile Considerations**

### **Responsive Adaptations**
1. **Carousel Slides**: 2 on mobile, 3-5 on desktop
2. **Navigation**: Touch-friendly button sizes
3. **Image Galleries**: Swipe gestures supported
4. **Font Scaling**: Readable text on small screens
5. **Button Placement**: Above-the-fold positioning

### **Performance Optimizations**
1. **Lazy Loading**: Images load as needed
2. **CDN Integration**: Fast asset delivery
3. **Minified Assets**: Compressed CSS/JS
4. **Caching Strategy**: Browser and CDN caching
5. **Progressive Enhancement**: Core content first

This UI structure provides a consistent, engaging, and responsive experience across all content types while maintaining the unique characteristics of each page type.