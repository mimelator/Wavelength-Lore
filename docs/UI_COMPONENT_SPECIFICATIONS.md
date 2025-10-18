# UI Component Specifications

## 📋 **Component Catalog**

This document provides detailed specifications for all UI components used in the Wavelength Lore application.

## 🧩 **Core Components**

### **1. Header Component**
**File**: `views/partials/header.ejs`

**Purpose**: Global navigation bar for all pages

**Structure**:
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

**Styling**:
- Background: `#333`
- Text Color: `#fff`
- Font Size: `18px`
- Hover Effect: Underline
- Layout: Centered flex navigation

**Responsive Behavior**: Maintains layout on mobile

---

### **2. Footer Component**
**File**: `views/partials/footer.ejs`

**Purpose**: Global footer with copyright and navigation links

**Structure**:
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

**Styling**:
- Background: `#333`
- Text Color: `#fff`
- Padding: `20px 0`
- Alignment: Center
- Gap: `15px` between links

---

### **3. Forum Create Post Button**
**Purpose**: Context-aware forum integration buttons

**Variants**:

#### **Episode Forum Button**
```html
<section class="episode-forum-section">
  <a href="/forum/create?category=episodes&..." 
     class="btn btn-primary episode-forum-btn">
    💬 Create a Post for this Episode
  </a>
  <p>Share your thoughts about "[Episode Title]" with the community</p>
</section>
```
- **Color**: Purple `#4a47a3`
- **Hover**: `#3a3793`

#### **Character Forum Button**
```html
<section class="character-forum-section">
  <a href="/forum/create?category=general&..." 
     class="btn btn-primary character-forum-btn">
    🗣️ Create a Post about this Hero
  </a>
  <p>Share your thoughts about [Character Name] with the community</p>
</section>
```
- **Color**: Purple `#6a4c93`
- **Hover**: `#5a3c83`

#### **Lore Forum Button**
```html
<section class="lore-forum-section">
  <a href="/forum/create?category=lore&..." 
     class="btn btn-primary lore-forum-btn lore-type-[TYPE]">
    🌟 Create a Post about this Lore
  </a>
  <p>Share your thoughts about "[Lore Title]" with the community</p>
</section>
```
- **Colors**: Type-based (place/concept/thing/idea/other)

**Common Styling**:
- Padding: `12px 24px`
- Border: `2px solid #333`
- Border Radius: `8px`
- Font: `'AnimeAce', Arial, sans-serif`
- Font Size: `14px`
- Box Shadow: `0 2px 4px rgba(0, 0, 0, 0.2)`
- Transition: `all 0.3s ease`
- Transform on Hover: `translateY(-2px)`

---

### **4. Navigation Components**

#### **Episode Navigation**
**File**: `views/episode.ejs`

```html
<nav class="episode-navigation">
  <a href="[previous-url]" class="nav-link prev">
    <img src="[prev-image]" alt="[prev-title]" class="nav-image tiny">
    <span class="nav-text">&larr; [Previous Title]</span>
  </a>
  <a href="[next-url]" class="nav-link next">
    <img src="[next-image]" alt="[next-title]" class="nav-image tiny">
    <span class="nav-text">[Next Title] &rarr;</span>
  </a>
</nav>
```

**Features**:
- Previous/Next episode links
- Thumbnail images
- Arrow indicators
- Flex layout with space-between

#### **Character Navigation**
**File**: `views/character.ejs`

```html
<nav class="character-navigation-top">
  <!-- Similar structure to episode navigation -->
</nav>
```

#### **Lore Navigation**
**File**: `views/lore.ejs`

```html
<nav class="lore-navigation-top">
  <!-- Similar structure with lore-specific styling -->
</nav>
```

---

### **5. Carousel Components**

#### **Episode Carousel**
**File**: `views/episode.ejs`

**Purpose**: Interactive image gallery for episodes

```html
<section class="carousel">
  <div class="carousel-container" id="episode-carousel">
    <div><img src="[image]" alt="Carousel Image"></div>
    <!-- Repeated for each image -->
  </div>
</section>
```

**Configuration**:
- Library: Slick Carousel
- Slides to Show: 5 (desktop), 2 (mobile ≤768px)
- Auto-play: 4 seconds
- Infinite scroll: Yes
- Dots: Yes
- Arrows: Yes

#### **Character Gallery Carousel**
**File**: `views/character.ejs`

```html
<section class="character-carousel">
  <div class="carousel">
    <div class="carousel-item" data-index="[index]">
      <img src="[image]" class="gallery-image" data-fullsize="[image]">
    </div>
  </div>
  <div class="carousel-dots">
    <span class="dot" data-index="[index]"></span>
  </div>
</section>
```

**Features**:
- Shuffled image order
- Click-to-expand modal
- Dot navigation
- Custom implementation

#### **Lore Gallery Carousel**
**File**: `views/lore.ejs`

Similar to character carousel with conditional rendering:
```html
<% if (lore.image_gallery && lore.image_gallery.length > 0) { %>
  <!-- Carousel HTML -->
<% } %>
```

---

### **6. Modal Components**

#### **Image Modal**
**Files**: `views/episode.ejs`, `views/character.ejs`, `views/lore.ejs`

**Purpose**: Full-screen image viewing

```html
<div id="imageModal" class="modal">
  <span class="modal-close">&times;</span>
  <img class="modal-content" id="fullSizeImage">
</div>
```

**JavaScript Interaction**:
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('fullSizeImage');
  const closeModal = document.querySelector('.modal-close');

  // Click to open
  document.querySelectorAll('.gallery-image').forEach(image => {
    image.addEventListener('click', () => {
      modal.style.display = 'block';
      modalImg.src = image.dataset.fullsize;
    });
  });

  // Click to close
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Click outside to close
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
});
```

---

### **7. Gallery Components**

#### **Gallery Grid Layout**
**Files**: `views/character-gallery.ejs`, `views/lore-gallery.ejs`

```html
<section class="lore-gallery">
  <div class="gallery">
    <div class="gallery-item lore-item">
      <a href="/[type]/[id]">
        <img src="[image]" alt="[title]">
        <h2>[title]</h2>
        <div class="lore-type-badge">
          <span class="type-[type]">[Type]</span>
        </div>
      </a>
    </div>
  </div>
</section>
```

**Features**:
- Responsive grid layout
- Hover effects
- Type badges
- Direct navigation links

---

### **8. Content Components**

#### **Smart Linking**
**Purpose**: Automatic content connections

**Usage Examples**:
```html
<!-- Triple linking (characters, lore, episodes) -->
<%- linkifyEpisodes(linkifyLore(linkifyCharacters(content))) %>

<!-- Simple smart linking -->
<%- simpleSmartLinking(content) %>
```

**Features**:
- Automatic detection of character names
- Lore item recognition
- Episode references
- Context-aware linking

#### **Type Badges**
**Purpose**: Visual categorization

```html
<div class="lore-type-badge">
  <span class="type-[type]">[Type Name]</span>
</div>
```

**Color Coding**:
- Places: Green gradient
- Things: Orange gradient
- Concepts: Purple gradient
- Ideas: Blue gradient
- Heroes: Band gradient

---

### **9. Media Components**

#### **Audio Player**
**File**: `views/episode.ejs`

```html
<section class="audio-player">
  <h2>Listen to the Song</h2>
  <audio controls>
    <source src="[audioUrl]" type="audio/mpeg">
    Your browser does not support the audio element.
  </audio>
</section>
```

#### **YouTube Integration**
```html
<a href="[youtubeLink]" target="_blank" class="watch-video-link">
  Watch the Video
</a>
```

---

### **10. Banner Components**

#### **Hero Banners**
**Purpose**: Large background image sections

```html
<!-- Episode Banner -->
<section class="banner-image" 
         style="background-image: url('[image]'); 
                background-size: cover; 
                background-position: center; 
                height: 300px;">
</section>

<!-- Character Banner -->
<section class="character-banner" 
         style="background-image: url('[character.image]');">
</section>

<!-- Lore Banner -->
<section class="lore-banner" 
         style="background-image: url('[lore.image]');">
</section>
```

**Common Features**:
- Full-width background images
- Cover sizing
- Center positioning
- Responsive heights

## 📱 **Responsive Design Specifications**

### **Breakpoints**
- **Mobile**: ≤768px
- **Desktop**: >768px

### **Mobile Adaptations**
- Carousel slides: 2 (mobile) vs 3-5 (desktop)
- Navigation: Touch-friendly sizing
- Fonts: Scalable sizing
- Images: Optimized loading
- Buttons: Above-the-fold placement

### **Performance Considerations**
- Lazy image loading
- CSS/JS minification
- CDN asset delivery
- Browser caching
- Progressive enhancement

This component specification provides a complete reference for implementing and maintaining the UI components throughout the Wavelength Lore application.