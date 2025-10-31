# 🎨 SITE TEMPLATES & CONFIGURATION EXAMPLES

**Document:** Template Definitions & Example Configurations  
**Project:** Wavelength Multi-Site Replication System  
**Purpose:** Reference examples for different site types and customization patterns

---

## 🎵 MUSIC SITE TEMPLATE

### Template Definition
```javascript
// config/tenant-templates/music-site.js
module.exports = {
  templateId: 'music-site',
  templateName: 'Music & Lore Site',
  description: 'Perfect for musicians, bands, and music storytellers',
  
  branding: {
    siteName: 'Music Lore Universe',
    tagline: 'Where Every Note Tells a Story',
    primaryColor: '#E91E63', // Pink
    secondaryColor: '#9C27B0', // Purple
    accentColor: '#FF9800',   // Orange
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    logoUrl: '/assets/branding/music-logo.png',
    faviconUrl: '/assets/branding/music-favicon.ico',
    backgroundPattern: 'musical-notes'
  },
  
  terminology: {
    season: 'album',
    episode: 'song',
    character: 'artist', 
    loreObject: 'instrument',
    // Plurals
    seasons: 'albums',
    episodes: 'songs',
    characters: 'artists',
    loreObjects: 'instruments'
  },
  
  features: {
    forum: { 
      enabled: true,
      categories: [
        'general',      // General Discussion
        'music',        // Song Analysis  
        'theory',       // Music Theory
        'artists',      // Artist Spotlights
        'instruments',  // Instrument Discussions
        'covers'        // Fan Covers & Remixes
      ]
    },
    merchandise: { 
      enabled: true,
      products: ['apparel', 'home', 'accessories'],
      musicSpecific: ['vinyl', 'posters', 'sheet-music']
    },
    chatbot: { 
      enabled: true,
      personality: 'music-knowledgeable',
      specialties: ['music-theory', 'artist-lore', 'song-analysis']
    },
    games: { 
      enabled: true,
      themes: ['music', 'rhythm', 'trivia'],
      musicGames: ['rhythm-match', 'lyric-puzzle', 'chord-progression']
    },
    quests: { 
      enabled: true,
      questTypes: ['listening', 'theory', 'creation', 'discovery']
    },
    badges: { 
      enabled: true,
      categories: ['listener', 'theorist', 'creator', 'collector']
    },
    audioPlayer: {
      enabled: true,
      features: ['playlist', 'repeat', 'shuffle', 'visualization']
    }
  },
  
  pages: {
    home: {
      title: 'Welcome to {{siteName}}',
      hero: {
        title: 'Discover the Stories Behind the Music',
        subtitle: 'Explore albums, meet artists, and uncover the lore that makes each song unique',
        ctaText: 'Start Listening',
        ctaLink: '/albums'
      },
      sections: ['featured-albums', 'latest-songs', 'artist-spotlight', 'community-highlights']
    },
    about: {
      title: 'About Our Musical Universe',
      content: `Welcome to a world where music and storytelling converge. Here, every 
               {{episode}} is more than just a track – it's a chapter in an epic tale. 
               Meet the {{characters}} who bring these stories to life, discover the 
               {{loreObjects}} that shape their sound, and join a community passionate 
               about the deeper meaning behind the music.`
    },
    contact: {
      title: 'Get in Touch',
      email: 'hello@{{siteId}}.com',
      social: {
        spotify: '@{{siteId}}',
        youtube: '@{{siteId}}',
        instagram: '@{{siteId}}_music',
        twitter: '@{{siteId}}'
      }
    }
  },
  
  navigation: {
    primary: [
      { label: 'Home', href: '/' },
      { label: 'Albums', href: '/albums' },
      { label: 'Artists', href: '/artists' },
      { label: 'Instruments', href: '/instruments' },
      { label: 'Community', href: '/forum' },
      { label: 'Store', href: '/merchandise' }
    ],
    footer: [
      { label: 'Music Theory', href: '/theory' },
      { label: 'Listening Guides', href: '/guides' },
      { label: 'Artist Interviews', href: '/interviews' },
      { label: 'Fan Creations', href: '/fan-creations' }
    ]
  },

  seo: {
    metaTitle: 'Music Lore & Storytelling Community',
    metaDescription: 'Discover the stories behind the music. Explore albums, meet artists, and join a community passionate about musical storytelling.',
    keywords: ['music', 'lore', 'storytelling', 'albums', 'artists', 'community'],
    ogImage: '/assets/branding/music-og-image.jpg'
  }
};
```

---

## 🎨 ART SITE TEMPLATE

### Template Definition
```javascript
// config/tenant-templates/art-site.js
module.exports = {
  templateId: 'art-site',
  templateName: 'Visual Art & Lore Site',
  description: 'Perfect for artists, galleries, and visual storytellers',
  
  branding: {
    siteName: 'Visual Lore Gallery',
    tagline: 'Where Art Speaks Stories',
    primaryColor: '#F44336', // Red
    secondaryColor: '#FF9800', // Orange
    accentColor: '#4CAF50',   // Green
    fontFamily: 'Playfair Display, Georgia, serif',
    logoUrl: '/assets/branding/art-logo.png',
    faviconUrl: '/assets/branding/art-favicon.ico',
    backgroundPattern: 'paint-strokes'
  },
  
  terminology: {
    season: 'collection',
    episode: 'artwork',
    character: 'artist',
    loreObject: 'medium',
    // Plurals
    seasons: 'collections',
    episodes: 'artworks', 
    characters: 'artists',
    loreObjects: 'mediums'
  },
  
  features: {
    forum: {
      enabled: true,
      categories: [
        'general',      // General Discussion
        'techniques',   // Art Techniques
        'critique',     // Artwork Critique
        'artists',      // Artist Features
        'mediums',      // Medium Discussions
        'exhibitions'   // Virtual Exhibitions
      ]
    },
    merchandise: {
      enabled: true,
      products: ['prints', 'home', 'accessories'],
      artSpecific: ['canvases', 'art-books', 'limited-editions']
    },
    chatbot: {
      enabled: true,
      personality: 'art-knowledgeable',
      specialties: ['art-history', 'techniques', 'artist-biographies']
    },
    games: {
      enabled: true,
      themes: ['visual', 'creative', 'puzzle'],
      artGames: ['color-match', 'style-quiz', 'composition-challenge']
    },
    quests: {
      enabled: true,
      questTypes: ['viewing', 'creating', 'learning', 'collecting']
    },
    badges: {
      enabled: true,
      categories: ['observer', 'creator', 'critic', 'collector']
    },
    gallery: {
      enabled: true,
      features: ['lightbox', 'zoom', 'slideshow', 'filters']
    }
  },
  
  pages: {
    home: {
      title: 'Welcome to {{siteName}}',
      hero: {
        title: 'Discover Art That Tells Stories',
        subtitle: 'Explore collections, meet artists, and uncover the stories behind every brushstroke',
        ctaText: 'View Gallery',
        ctaLink: '/collections'
      },
      sections: ['featured-collections', 'latest-artworks', 'artist-spotlight', 'virtual-exhibitions']
    },
    about: {
      title: 'About Our Artistic Universe',
      content: `Welcome to a gallery where visual art and storytelling merge. Each 
               {{episode}} in our {{seasons}} tells a unique story through color, 
               form, and emotion. Meet the {{characters}} who create these visual 
               narratives and explore the {{loreObjects}} that bring their visions 
               to life.`
    },
    contact: {
      title: 'Connect With Us',
      email: 'gallery@{{siteId}}.com',
      social: {
        instagram: '@{{siteId}}_gallery',
        pinterest: '@{{siteId}}',
        facebook: '@{{siteId}}.gallery',
        twitter: '@{{siteId}}_art'
      }
    }
  },
  
  navigation: {
    primary: [
      { label: 'Home', href: '/' },
      { label: 'Collections', href: '/collections' },
      { label: 'Artists', href: '/artists' },
      { label: 'Mediums', href: '/mediums' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Store', href: '/merchandise' }
    ],
    footer: [
      { label: 'Art History', href: '/history' },
      { label: 'Techniques', href: '/techniques' },
      { label: 'Exhibitions', href: '/exhibitions' },
      { label: 'Artist Profiles', href: '/profiles' }
    ]
  },

  seo: {
    metaTitle: 'Visual Art Gallery & Storytelling Community',
    metaDescription: 'Discover art that tells stories. Explore collections, meet artists, and join a community passionate about visual narratives.',
    keywords: ['art', 'gallery', 'visual-storytelling', 'collections', 'artists', 'exhibitions'],
    ogImage: '/assets/branding/art-og-image.jpg'
  }
};
```

---

## 📚 LITERATURE SITE TEMPLATE

### Template Definition
```javascript
// config/tenant-templates/literature-site.js
module.exports = {
  templateId: 'literature-site',
  templateName: 'Literature & Lore Site',
  description: 'Perfect for authors, readers, and literary communities',
  
  branding: {
    siteName: 'Literary Lore Library',
    tagline: 'Where Words Weave Worlds',
    primaryColor: '#3F51B5', // Indigo
    secondaryColor: '#9C27B0', // Purple
    accentColor: '#FF5722',   // Deep Orange
    fontFamily: 'Crimson Text, Georgia, serif',
    logoUrl: '/assets/branding/literature-logo.png',
    faviconUrl: '/assets/branding/literature-favicon.ico',
    backgroundPattern: 'book-pages'
  },
  
  terminology: {
    season: 'series',
    episode: 'chapter',
    character: 'character',
    loreObject: 'artifact',
    // Plurals
    seasons: 'series',
    episodes: 'chapters',
    characters: 'characters',
    loreObjects: 'artifacts'
  },
  
  features: {
    forum: {
      enabled: true,
      categories: [
        'general',        // General Discussion
        'analysis',       // Literary Analysis
        'theories',       // Plot Theories
        'characters',     // Character Discussion
        'worldbuilding',  // World Building
        'fanfiction'      // Fan Fiction
      ]
    },
    merchandise: {
      enabled: true,
      products: ['apparel', 'home', 'accessories'],
      literatureSpecific: ['books', 'bookmarks', 'journals', 'maps']
    },
    chatbot: {
      enabled: true,
      personality: 'scholarly',
      specialties: ['literary-analysis', 'character-development', 'plot-structure']
    },
    games: {
      enabled: true,
      themes: ['literary', 'puzzle', 'trivia'],
      literatureGames: ['word-puzzle', 'character-quiz', 'plot-prediction']
    },
    quests: {
      enabled: true,
      questTypes: ['reading', 'analysis', 'writing', 'discovery']
    },
    badges: {
      enabled: true,
      categories: ['reader', 'analyst', 'theorist', 'scholar']
    },
    readingTracker: {
      enabled: true,
      features: ['progress', 'notes', 'quotes', 'reviews']
    }
  },
  
  pages: {
    home: {
      title: 'Welcome to {{siteName}}',
      hero: {
        title: 'Immerse Yourself in Literary Worlds',
        subtitle: 'Explore series, analyze characters, and dive deep into the lore that makes great literature unforgettable',
        ctaText: 'Start Reading',
        ctaLink: '/series'
      },
      sections: ['featured-series', 'latest-chapters', 'character-spotlight', 'analysis-highlights']
    },
    about: {
      title: 'About Our Literary Universe',
      content: `Welcome to a library where stories come alive through analysis and 
               discussion. Each {{episode}} in our {{seasons}} opens new worlds 
               of possibility. Explore complex {{characters}} and discover the 
               {{loreObjects}} that shape their journeys through masterfully 
               crafted narratives.`
    },
    contact: {
      title: 'Join Our Literary Community',
      email: 'library@{{siteId}}.com',
      social: {
        goodreads: '@{{siteId}}',
        twitter: '@{{siteId}}_lit',
        facebook: '@{{siteId}}.books',
        instagram: '@{{siteId}}_library'
      }
    }
  },
  
  navigation: {
    primary: [
      { label: 'Home', href: '/' },
      { label: 'Series', href: '/series' },
      { label: 'Characters', href: '/characters' },
      { label: 'Artifacts', href: '/artifacts' },
      { label: 'Library', href: '/forum' },
      { label: 'Store', href: '/merchandise' }
    ],
    footer: [
      { label: 'Reading Guides', href: '/guides' },
      { label: 'Author Interviews', href: '/interviews' },
      { label: 'Literary Analysis', href: '/analysis' },
      { label: 'Book Club', href: '/book-club' }
    ]
  },

  seo: {
    metaTitle: 'Literary Analysis & Reader Community',
    metaDescription: 'Dive deep into literary worlds. Analyze characters, explore themes, and join passionate readers in meaningful discussions.',
    keywords: ['literature', 'books', 'analysis', 'characters', 'reading', 'community'],
    ogImage: '/assets/branding/literature-og-image.jpg'
  }
};
```

---

## 🎮 GAMING SITE TEMPLATE

### Template Definition
```javascript
// config/tenant-templates/gaming-site.js
module.exports = {
  templateId: 'gaming-site',
  templateName: 'Gaming Lore Community',
  description: 'Perfect for game developers, streamers, and gaming communities',
  
  branding: {
    siteName: 'Gaming Lore Hub',
    tagline: 'Where Games Tell Epic Stories',
    primaryColor: '#00BCD4', // Cyan
    secondaryColor: '#4CAF50', // Green
    accentColor: '#FF9800',   // Orange
    fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
    logoUrl: '/assets/branding/gaming-logo.png',
    faviconUrl: '/assets/branding/gaming-favicon.ico',
    backgroundPattern: 'pixel-art'
  },
  
  terminology: {
    season: 'saga',
    episode: 'level',
    character: 'hero',
    loreObject: 'item',
    // Plurals
    seasons: 'sagas',
    episodes: 'levels',
    characters: 'heroes',
    loreObjects: 'items'
  },
  
  features: {
    forum: {
      enabled: true,
      categories: [
        'general',      // General Discussion
        'strategies',   // Game Strategies
        'lore',         // Game Lore
        'heroes',       // Character Builds
        'items',        // Item Discussion
        'tournaments'   // Competitive Play
      ]
    },
    merchandise: {
      enabled: true,
      products: ['apparel', 'accessories', 'collectibles'],
      gamingSpecific: ['peripherals', 'figurines', 'art-prints', 'guides']
    },
    chatbot: {
      enabled: true,
      personality: 'gaming-expert',
      specialties: ['game-mechanics', 'strategy', 'lore-knowledge']
    },
    games: {
      enabled: true,
      themes: ['strategy', 'puzzle', 'arcade'],
      gamingSpecific: ['mini-games', 'challenges', 'leaderboards']
    },
    quests: {
      enabled: true,
      questTypes: ['achievement', 'exploration', 'mastery', 'community']
    },
    badges: {
      enabled: true,
      categories: ['player', 'strategist', 'explorer', 'champion']
    },
    leaderboards: {
      enabled: true,
      features: ['rankings', 'achievements', 'progress-tracking']
    },
    streaming: {
      enabled: true,
      features: ['twitch-integration', 'highlights', 'community-streams']
    }
  },
  
  pages: {
    home: {
      title: 'Welcome to {{siteName}}',
      hero: {
        title: 'Master Epic Gaming Adventures',
        subtitle: 'Explore sagas, master heroes, and discover legendary items in immersive gaming worlds',
        ctaText: 'Start Playing',
        ctaLink: '/sagas'
      },
      sections: ['featured-sagas', 'latest-levels', 'hero-spotlight', 'tournament-highlights']
    },
    about: {
      title: 'About Our Gaming Universe',
      content: `Welcome to the ultimate gaming community where every {{episode}} 
               is an adventure waiting to be conquered. Choose your {{characters}}, 
               master powerful {{loreObjects}}, and join fellow gamers on epic 
               {{seasons}} that will test your skills and expand your gaming lore.`
    },
    contact: {
      title: 'Join the Gaming Community',
      email: 'gamers@{{siteId}}.com',
      social: {
        twitch: '@{{siteId}}_live',
        discord: '{{siteId}}-community',
        youtube: '@{{siteId}}_gaming',
        twitter: '@{{siteId}}_hub'
      }
    }
  },
  
  navigation: {
    primary: [
      { label: 'Home', href: '/' },
      { label: 'Sagas', href: '/sagas' },
      { label: 'Heroes', href: '/heroes' },
      { label: 'Items', href: '/items' },
      { label: 'Community', href: '/forum' },
      { label: 'Store', href: '/merchandise' }
    ],
    footer: [
      { label: 'Strategy Guides', href: '/guides' },
      { label: 'Tournaments', href: '/tournaments' },
      { label: 'Leaderboards', href: '/leaderboards' },
      { label: 'Streaming', href: '/streams' }
    ]
  },

  seo: {
    metaTitle: 'Gaming Community & Strategy Hub',
    metaDescription: 'Master epic gaming adventures. Explore sagas, develop heroes, and join a community of passionate gamers.',
    keywords: ['gaming', 'strategy', 'community', 'heroes', 'adventure', 'tournaments'],
    ogImage: '/assets/branding/gaming-og-image.jpg'
  }
};
```

---

## 🔧 CONFIGURATION EXAMPLES

### Example: Music Site Configuration
```javascript
// config/tenant-configs/harmonic-tales.js
module.exports = {
  tenantId: 'harmonic-tales',
  template: 'music-site',
  
  // Custom branding overrides
  branding: {
    siteName: 'Harmonic Tales',
    tagline: 'Progressive Rock Stories',
    primaryColor: '#6A1B9A', // Deep Purple
    secondaryColor: '#D32F2F', // Dark Red
    logoUrl: '/assets/tenants/harmonic-tales/logo.png'
  },
  
  // Feature customizations
  features: {
    forum: {
      enabled: true,
      categories: ['general', 'music', 'theory', 'prog-rock', 'concept-albums']
    },
    audioPlayer: {
      enabled: true,
      features: ['playlist', 'repeat', 'shuffle', 'visualization', 'lyrics-sync']
    }
  },
  
  // Custom pages
  pages: {
    about: {
      title: 'About Harmonic Tales',
      content: `Harmonic Tales is dedicated to progressive rock storytelling. 
               Each album is a journey through complex musical landscapes where 
               every song builds upon an epic narrative. Join us as we explore 
               the intersection of technical musicianship and storytelling mastery.`
    }
  },
  
  // Custom navigation
  navigation: {
    primary: [
      { label: 'Home', href: '/' },
      { label: 'Concept Albums', href: '/albums' },
      { label: 'Musicians', href: '/artists' },
      { label: 'Instruments', href: '/instruments' },
      { label: 'Prog Community', href: '/forum' },
      { label: 'Merch', href: '/merchandise' }
    ]
  },
  
  // LoreMaster info
  loreMaster: {
    name: 'Alex Thompson',
    email: 'alex@harmonictales.com',
    userId: null // Set during provisioning
  },
  
  // Custom domain
  customDomain: 'harmonictales.com',
  
  // Metadata
  createdAt: '2025-01-15T10:30:00.000Z',
  version: '1.0.0'
};
```

### Example: Art Gallery Configuration
```javascript
// config/tenant-configs/mystic-canvas.js
module.exports = {
  tenantId: 'mystic-canvas',
  template: 'art-site',
  
  branding: {
    siteName: 'Mystic Canvas Gallery',
    tagline: 'Digital Art Meets Ancient Lore',
    primaryColor: '#8E24AA', // Purple
    secondaryColor: '#00ACC1', // Cyan
    logoUrl: '/assets/tenants/mystic-canvas/logo.svg'
  },
  
  features: {
    forum: {
      enabled: true,
      categories: ['general', 'digital-art', 'fantasy-art', 'tutorials', 'commissions']
    },
    gallery: {
      enabled: true,
      features: ['lightbox', 'zoom', 'slideshow', 'filters', 'nft-integration']
    },
    merchandise: {
      enabled: true,
      products: ['prints', 'home'],
      artSpecific: ['nft-collections', 'digital-downloads', 'commissioned-work']
    }
  },
  
  loreMaster: {
    name: 'Maya Chen',
    email: 'maya@mysticcanvas.art',
    userId: null
  },
  
  customDomain: 'mysticcanvas.art'
};
```

---

## 🔄 TEMPLATE INHERITANCE & CUSTOMIZATION

### Template Merging Logic
```javascript
// Example of how templates are merged with tenant configs
function mergeTemplateWithTenant(template, tenantConfig) {
  return {
    // Base template properties
    ...template,
    
    // Tenant overrides (shallow merge for simple properties)
    ...tenantConfig,
    
    // Deep merge for complex objects
    branding: deepMerge(template.branding, tenantConfig.branding || {}),
    features: deepMerge(template.features, tenantConfig.features || {}),
    pages: deepMerge(template.pages, tenantConfig.pages || {}),
    navigation: deepMerge(template.navigation, tenantConfig.navigation || {}),
    
    // Template variables replacement
    processedContent: processTemplateVariables(template, tenantConfig)
  };
}

function processTemplateVariables(template, tenantConfig) {
  const variables = {
    siteName: tenantConfig.branding?.siteName || template.branding.siteName,
    siteId: tenantConfig.tenantId,
    ...tenantConfig.terminology
  };
  
  // Replace {{variable}} patterns in strings
  return replaceVariables(template, variables);
}
```

### Custom Template Creation
```javascript
// config/tenant-templates/custom-template.js
module.exports = {
  templateId: 'custom-template',
  templateName: 'Custom Site Template',
  description: 'Fully customized site template',
  
  // Inherit from existing template
  extends: 'music-site',
  
  // Override specific sections
  overrides: {
    branding: {
      // Custom color scheme
      primaryColor: '#Custom',
      // Keep other branding from parent
    },
    
    features: {
      // Add custom features
      customFeature: {
        enabled: true,
        config: { /* custom config */ }
      }
    }
  },
  
  // Add completely new sections
  customSections: {
    apiIntegrations: {
      spotify: { enabled: false },
      youtube: { enabled: false },
      soundcloud: { enabled: false }
    }
  }
};
```

This comprehensive template system allows for:
- **Rapid deployment** with pre-configured site types
- **Easy customization** through inheritance and overrides  
- **Consistent branding** while maintaining uniqueness
- **Feature flexibility** to enable/disable components
- **Scalable architecture** for adding new template types

The templates provide a solid foundation while allowing complete customization for each LoreMaster's unique vision.