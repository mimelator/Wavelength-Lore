# Wavelength Content Creator CLI - Full CRUD Operations Plan

## 📋 **Implementation Plan for GitHub Issue #152**
### Milestone 2.1.2: CLI CRUD Activities for Episodes, Songs, Characters, and Lore

---

## 🎯 **OBJECTIVE**
Implement comprehensive Create, Read, Update, Delete (CRUD) operations in the Content Creator CLI for all four core content types:
- **Episodes** 📺
- **Songs** 🎵  
- **Characters** 👥
- **Lore** 📚

---

## 🏗️ **CURRENT STATE ANALYSIS**

### ✅ **Already Implemented**
- ✅ **Read Operations**: `view`, `view --detailed` for all content types
- ✅ **Basic Edit Operations**: Interactive field editing for lore and characters  
- ✅ **Create Operations**: Content creation wizard for lore, characters, episodes
- ✅ **Songs Service**: Firebase Songs Service with basic CRUD operations
- ✅ **Navigation**: File-system-like navigation through content types
- ✅ **Search & Discovery**: Search, find, recent commands

### ❌ **Missing Critical Operations**
- ❌ **Delete Operations**: No delete functionality for any content type
- ❌ **Clone Operations**: Partial implementation, needs Firebase persistence
- ❌ **Episode CRUD**: Limited episode management beyond viewing
- ❌ **Song CRUD Integration**: Songs service exists but not fully integrated into CLI
- ❌ **Firebase Persistence**: Most edit operations are not saved to Firebase
- ❌ **Batch Operations**: No bulk CRUD operations
- ❌ **Content Validation**: No validation before CRUD operations

---

## 🛠️ **IMPLEMENTATION PHASES**

## **Phase 1: Core CRUD Infrastructure** 🏗️

### **1.1 Service Layer Enhancement**
```javascript
// Create unified service managers for each content type
- FirebaseEpisodeService (NEW)
- FirebaseCharacterService (NEW) 
- FirebaseLoreService (NEW)
- FirebaseSongsService (EXISTS - enhance)
```

### **1.2 CRUD Command Structure**
```bash
# Standardized CRUD commands for all content types
wavelength> episodes create "New Episode Title" --season=1 --episode=12
wavelength> episodes edit s1e12 --interactive
wavelength> episodes delete s1e12 --confirm
wavelength> episodes clone s1e11 "Copy of Episode 11"

wavelength> songs create "New Song" --episode=s1e12
wavelength> songs edit s1e12-song --duration="3:45"
wavelength> songs delete s1e12-song --confirm
wavelength> songs publish s1e12-song

wavelength> characters create "New Character" --role=protagonist
wavelength> characters edit character-id --cta-fields
wavelength> characters delete character-id --confirm
wavelength> characters clone lucky "Lucky Variant"

wavelength> lore create "New Lore Item" --type=place
wavelength> lore edit lore-id --ai-enhance
wavelength> lore delete lore-id --confirm
wavelength> lore clone existing-item "New Version"
```

---

## **Phase 2: Episodes CRUD** 📺

### **2.1 Firebase Episode Service**
```javascript
class FirebaseEpisodeService {
    async createEpisode(episodeData)      // Create new episode
    async updateEpisode(id, updates)     // Update existing episode  
    async deleteEpisode(id)              // Delete episode (soft delete)
    async getEpisodeById(id)             // Get single episode
    async getAllEpisodes(filters)        // Get episodes with filtering
    async cloneEpisode(sourceId, newData) // Clone episode with new data
    async publishEpisode(id, status)     // Publish/unpublish episode
    async validateEpisode(episodeData)   // Validate episode data
}
```

### **2.2 Episode CLI Commands**
```bash
# Episode Management
episodes create "New Episode Title" --season=4 --episode=9
episodes edit s4e9 --field=description --value="New description"
episodes edit s4e9 --interactive  # Launch interactive editor
episodes delete s4e9 --soft        # Soft delete (hide)
episodes delete s4e9 --hard --confirm  # Permanent delete
episodes clone s4e8 "Episode 8 Variant" --season=4 --episode=9b
episodes publish s4e9 --status=published
episodes validate s4e9             # Check data integrity
episodes list --season=4 --unpublished  # List episodes with filters
episodes search "battle" --field=title,description,keywords
```

### **2.3 Episode Data Model**
```javascript
// Firebase: /videos/season{N}/episodes/episode{N}
{
  id: "s4e9",                    // Generated: s{season}e{episode}
  title: "Episode Title",
  description: "Episode description",
  season: 4,
  episodeNumber: 9,
  youtubeLink: "https://...",
  image: "/images/seasons/season4/episodes/episode9/cover.webp",
  carouselImages: [              // Gallery images for screensaver
    "/images/seasons/season4/episodes/episode9/images/gallery1.webp",
    "/images/seasons/season4/episodes/episode9/images/gallery2.webp"
  ],
  keywords: ["battle", "shire", "goblins"],
  characters: ["lucky", "daphne"],  // Referenced character IDs
  loreItems: ["the-shire", "goblin-army"],  // Referenced lore IDs
  published: true,
  publishedAt: "2025-01-01T00:00:00Z",
  createdAt: "2025-01-01T00:00:00Z", 
  updatedAt: "2025-01-01T00:00:00Z",
  metadata: {
    duration: "4:22",
    genre: "Fantasy Adventure",
    mood: "epic",
    contentWarnings: []
  }
}
```

---

## **Phase 3: Songs CRUD** 🎵

### **3.1 Enhanced Songs Service Integration** 
```javascript
// Extend existing FirebaseSongsService
class EnhancedFirebaseSongsService extends FirebaseSongsService {
    async cloneSong(sourceId, newData)   // Clone song with modifications
    async bulkUpdateSongs(filter, updates) // Bulk operations
    async validateSongAudio(url)         // Validate audio file
    async syncWithEpisode(episodeId)     // Auto-sync with episode data
    async generateLyrics(songId)         // AI lyrics generation
    async optimizeAudio(songId)          // Audio optimization
}
```

### **3.2 Songs CLI Commands**
```bash
# Song Management  
songs create "New Song Title" --episode=s4e9 --duration="3:45"
songs edit s4e9 --field=lyrics --multiline  # Multi-line lyrics editor
songs edit s4e9 --interactive --ai-enhance  # Interactive with AI
songs delete s4e9 --confirm
songs clone s4e8 "Song Variant" --episode=s4e9b
songs publish s4e9 --status=published
songs validate s4e9 --check-audio     # Validate audio file exists
songs list --season=4 --published=false
songs search "battle" --field=title,lyrics
songs sync s4e9 --with-episode        # Sync metadata with episode
songs generate-lyrics s4e9 --ai-prompt="Epic battle song"
```

### **3.3 Enhanced Song Data Model**
```javascript
// Firebase: /songs/{songId}
{
  id: "s4e9",                    // Episode-based ID
  title: "Battle of the Shire",
  artist: "Wavelength",
  season: 4,
  episodeNumber: 9,
  duration: 262,                 // Seconds
  durationFormatted: "4:22",
  url: "/audio/seasons/season4/episodes/episode9/battle-of-the-shire.mp3",
  lyrics: "Multi-line lyrics...",
  published: true,
  publishedAt: "2025-01-01T00:00:00Z",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  metadata: {
    albumArt: "/images/seasons/season4/episodes/episode9/cover.webp",
    genre: "Fantasy Rock", 
    episodeId: "s4e9",
    keywords: ["battle", "epic", "climax"],
    mood: "intense",
    bpm: 140,
    key: "Dm",
    instruments: ["guitar", "drums", "orchestra"],
    aiGenerated: false,
    contentRating: "all-ages"
  },
  episodeRef: {                  // Reference to episode data
    title: "Battle of the Shire",
    image: "/images/...",
    characters: ["lucky", "daphne"],
    loreItems: ["the-shire"]
  }
}
```

---

## **Phase 4: Characters CRUD** 👥

### **4.1 Firebase Character Service**
```javascript
class FirebaseCharacterService {
    async createCharacter(characterData)  // Create new character
    async updateCharacter(id, updates)    // Update character
    async deleteCharacter(id)             // Delete character (soft)
    async getCharacterById(id)            // Get single character
    async getAllCharacters(filters)       // Get filtered characters
    async cloneCharacter(sourceId, newData) // Clone character
    async publishCharacter(id, status)    // Publish/unpublish
    async validateCharacter(data)         // Validate character data
    async generateAvatar(id, prompt)      // AI avatar generation
    async enhanceWithAI(id, prompt)       // AI content enhancement
}
```

### **4.2 Character CLI Commands**
```bash
# Character Management
characters create "New Character" --role=protagonist --season=4
characters edit lucky --field=tagline --value="Your lucky charm!"
characters edit lucky --interactive --cta-fields  # Focus on CTA fields
characters delete side-character --soft
characters clone lucky "Lucky Twin" --role=secondary
characters publish new-character --status=published  
characters validate lucky --check-images
characters list --role=protagonist --unpublished
characters search "sword" --field=description,traits,backstory
characters generate-avatar lucky --prompt="Lucky with magical sword"
characters enhance lucky --ai-prompt="Make more dramatic and engaging"
```

### **4.3 Enhanced Character Data Model**
```javascript
// Firebase: /characters/{characterId}
{
  id: "lucky",
  name: "Lucky",
  title: "The Chosen One",
  role: "protagonist",           // protagonist, antagonist, supporting, minor
  
  // Core Character Data
  description: "A brave young hero...",
  backstory: "Born in the Shire...", 
  traits: ["brave", "optimistic", "determined"],
  
  // CTA Enhancement Fields (Issue #80 requirement)
  tagline: "Your lucky charm in dark times!",       // Character motto
  stakes: "The fate of the Shire rests on Lucky's shoulders", // What's at risk
  cta_text: "Follow Lucky's Journey",               // Button text
  cta_hook: "Will Lucky save the Shire in time?",  // Engagement hook
  power_statement: "The hero the Shire needs",     // Strong statement
  
  // Visual Assets
  image: "/images/characters/lucky/portrait.webp",
  avatarGallery: [
    "/images/characters/lucky/avatar1.webp", 
    "/images/characters/lucky/avatar2.webp"
  ],
  
  // Relationships & References
  episodes: ["s1e1", "s1e2", "s1e3"],     // Episodes where character appears
  relationships: {                          // Character relationships
    "daphne": "ally",
    "goblin-king": "enemy"
  },
  loreConnections: ["the-shire", "lucky-charm"], // Connected lore items
  
  // Publishing & Metadata
  published: true,
  publishedAt: "2025-01-01T00:00:00Z", 
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  
  metadata: {
    characterType: "main",       // main, supporting, villain, npc
    species: "human",
    age: "young adult", 
    location: "the-shire",
    weapons: ["sword", "shield"],
    abilities: ["courage", "luck"],
    aiEnhanced: true,           // Tracks if AI has enhanced content
    contentRating: "all-ages"
  }
}
```

---

## **Phase 5: Lore CRUD** 📚

### **5.1 Firebase Lore Service** 
```javascript
class FirebaseLoreService {
    async createLore(loreData)           // Create new lore item
    async updateLore(id, updates)        // Update lore item
    async deleteLore(id)                 // Delete lore (soft delete)
    async getLoreById(id)                // Get single lore item
    async getAllLore(filters)            // Get filtered lore
    async cloneLore(sourceId, newData)   // Clone lore item
    async publishLore(id, status)        // Publish/unpublish
    async validateLore(data)             // Validate lore data
    async enhanceWithAI(id, prompt)      // AI enhancement
    async generateImages(id, prompt)     // AI image generation
}
```

### **5.2 Lore CLI Commands**
```bash
# Lore Management
lore create "New Location" --type=place --description="A mystical place..."
lore edit the-shire --field=description --ai-enhance
lore edit the-shire --interactive --cta-fields  # CTA enhancement mode
lore delete unused-lore --soft
lore clone the-shire "Shire Variant" --type=place
lore publish new-lore --status=published
lore validate the-shire --check-images --check-references
lore list --type=place --enhanced=true
lore search "magical" --field=title,description,enhanced_content
lore generate-images the-shire --prompt="Mystical village landscape" 
lore enhance the-shire --ai-prompt="Make more dramatic and engaging"
```

### **5.3 Enhanced Lore Data Model**
```javascript
// Firebase: /lore/{loreId}
{
  id: "the-shire",
  title: "The Shire", 
  type: "place",                 // place, thing, person, concept, event
  
  // Core Lore Data
  description: "A peaceful village...",
  
  // AI Enhancement Fields (Issue #80 requirement) 
  enhanced_title: "The Shire: Last Bastion of Peace",
  enhanced_description: "Enhanced dramatic description...",
  tagline: "Where peace meets peril",
  power_statement: "The heart of all that is good in the world",
  cta_hook: "Discover the secrets of the Shire",
  call_to_action: "Explore the Shire",
  
  // Visual Assets
  image: "/images/lore/the-shire/main.webp",
  image_gallery: [
    "/images/lore/the-shire/view1.webp",
    "/images/lore/the-shire/view2.webp"
  ],
  
  // Content Relationships
  keywords: ["peace", "village", "home"],
  relatedCharacters: ["lucky", "daphne"],   // Characters connected to this lore
  relatedEpisodes: ["s1e1", "s1e8", "s1e11"], // Episodes featuring this lore
  relatedLore: ["goblin-army", "the-battle"], // Other connected lore
  
  // Publishing & Metadata
  published: true,
  publishedAt: "2025-01-01T00:00:00Z",
  createdAt: "2025-01-01T00:00:00Z", 
  updatedAt: "2025-01-01T00:00:00Z",
  
  metadata: {
    importance: "critical",      // critical, major, minor
    timeframe: "present",        // past, present, future, timeless
    geography: "central",        // Location importance
    mood: "peaceful",            // Emotional tone
    themes: ["home", "safety", "community"],
    aiEnhanced: true,           // Tracks AI enhancement
    contentRating: "all-ages"
  }
}
```

---

## **Phase 6: Advanced CRUD Features** 🚀

### **6.1 Batch Operations**
```bash
# Bulk operations across content types
batch delete --type=episodes --season=1 --unpublished --dry-run
batch publish --type=songs --season=4 --confirm  
batch enhance --type=characters --ai-prompt="Add more drama" --role=supporting
batch clone --source=s1e* --target-season=5 --prefix="remake-"
batch validate --type=all --check=images,references,metadata
batch search "battle" --type=episodes,songs --export=csv
```

### **6.2 Content Relationships**
```bash
# Manage relationships between content types
relationships add lucky --appears-in s4e9
relationships add the-shire --featured-in s1e1,s1e8,s1e11  
relationships add battle-theme-song --episode s4e9
relationships list lucky --show=episodes,lore,songs
relationships validate --check-broken-links
relationships export --format=graph --output=content-map.json
```

### **6.3 Content Validation & Health**
```bash
# Content health and validation
validate all --deep                    # Deep validation all content
validate broken-links --fix            # Find and fix broken references
validate images --check-cdn            # Validate all image URLs
validate audio --check-files           # Validate all audio files  
validate metadata --enforce-schema     # Check data structure
validate ai-content --quality-check    # Validate AI-generated content
health report --export=html            # Generate health report
health fix --auto --backup             # Auto-fix issues with backup
```

### **6.4 Content Templates & Wizards**
```bash
# Smart content creation templates
template episode --season=4 --type=battle-episode    # Battle episode template
template character --role=villain --season=4         # Villain character template  
template lore --type=weapon --connected-to=lucky     # Weapon lore template
template song --episode=s4e9 --mood=epic            # Epic song template

# Guided creation wizards
wizard create-episode --interactive --ai-assisted    # Full episode creation wizard
wizard create-character --personality-quiz          # Character personality wizard
wizard create-song --from-episode s4e9             # Song from episode wizard
wizard clone-season --from=1 --to=5 --variations   # Clone entire season with variants
```

---

## **Phase 7: CLI Architecture Updates** 🏛️

### **7.1 Command Structure Reorganization**
```javascript
// Update CLI command structure for better organization
wavelength-content-cli.js
├── commands/
│   ├── episodes-commands.js     // Episode CRUD commands
│   ├── songs-commands.js        // Song CRUD commands  
│   ├── characters-commands.js   // Character CRUD commands
│   ├── lore-commands.js         // Lore CRUD commands
│   ├── batch-commands.js        // Batch operation commands
│   ├── validation-commands.js   // Validation commands
│   └── relationship-commands.js // Relationship management
├── services/
│   ├── firebase-episode-service.js
│   ├── firebase-character-service.js  
│   ├── firebase-lore-service.js
│   └── enhanced-firebase-songs-service.js
├── validators/
│   ├── episode-validator.js
│   ├── character-validator.js
│   ├── lore-validator.js
│   └── song-validator.js
└── utils/
    ├── crud-helpers.js          // Common CRUD utilities
    ├── relationship-manager.js  // Content relationship management
    └── batch-processor.js       // Batch operation utilities
```

### **7.2 Enhanced Error Handling & Logging**
```javascript
// Comprehensive error handling for all CRUD operations
class CRUDErrorHandler {
    handleValidationErrors(errors)      // User-friendly validation messages
    handleFirebaseErrors(error)         // Firebase-specific error handling  
    handleBatchErrors(results)          // Batch operation error reporting
    logOperations(operation, details)   // Detailed operation logging
    createBackup(contentType, id)       // Automatic backups before operations
    rollbackOperation(operationId)     // Rollback failed operations
}
```

### **7.3 Progress Tracking & User Feedback**
```javascript
// Enhanced user experience for long-running operations
class ProgressTracker {
    startBatchOperation(totalItems)     // Initialize progress tracking
    updateProgress(completed, total)    // Update progress display
    showOperationSummary(results)       // Show completion summary
    estimateTimeRemaining(progress)     // Time estimation for operations
    showDetailedResults(results)        // Detailed operation results
}
```

---

## **Phase 8: Integration & Testing** 🧪

### **8.1 CLI Integration Points**
- ✅ **Firebase Admin Utils**: Integrate with existing Firebase connection
- ✅ **Radio Player**: Auto-sync song changes with radio playlist
- ✅ **Screensaver**: Auto-update episode gallery images
- ✅ **Web Interface**: Sync CLI changes with web content
- ✅ **AI Chat Integration**: Use existing AI chat for content enhancement

### **8.2 Testing Strategy**
```bash
# Comprehensive testing suite for CRUD operations
npm test:cli-crud                      # Run all CRUD tests
npm test:cli-episodes                  # Test episode operations
npm test:cli-songs                     # Test song operations  
npm test:cli-characters               # Test character operations
npm test:cli-lore                     # Test lore operations
npm test:cli-batch                    # Test batch operations
npm test:cli-relationships            # Test relationship management
npm test:cli-validation               # Test validation systems
npm test:cli-integration              # Test integration points
```

### **8.3 Data Migration & Safety**
```bash
# Safe migration and backup systems
backup create --type=all --timestamp   # Create full backup
backup restore --from=backup-id        # Restore from backup
migrate validate --dry-run             # Validate migration without changes
migrate execute --with-backup          # Execute migration with backup
rollback operation --id=operation-id   # Rollback specific operation
```

---

## **Phase 9: Documentation & Training** 📖

### **9.1 CLI Help System Enhancement**
```bash
# Enhanced help system for all CRUD operations
help episodes                         # Episode management help
help songs                           # Song management help
help characters                      # Character management help
help lore                           # Lore management help  
help batch                          # Batch operations help
help examples episodes              # Episode management examples
help tutorials                      # Interactive tutorials
help best-practices                 # Content creation best practices
```

### **9.2 Interactive Tutorials**
```bash
# Built-in tutorials for content creators
tutorial crud-basics               # Basic CRUD operations tutorial
tutorial episode-creation         # Episode creation workflow
tutorial character-development     # Character development tutorial
tutorial content-relationships    # Managing content relationships
tutorial ai-enhancement           # AI content enhancement tutorial
tutorial batch-operations         # Batch operations tutorial
```

---

## **📊 IMPLEMENTATION TIMELINE**

### **Week 1-2: Core Infrastructure**
- ✅ Service layer development (Firebase services)
- ✅ Data model finalization
- ✅ Command structure setup

### **Week 3-4: Episodes & Songs CRUD**  
- ✅ Episode CRUD implementation
- ✅ Songs CRUD enhancement
- ✅ Basic validation systems

### **Week 5-6: Characters & Lore CRUD**
- ✅ Character CRUD implementation  
- ✅ Lore CRUD implementation
- ✅ CTA field management

### **Week 7-8: Advanced Features**
- ✅ Batch operations
- ✅ Relationship management
- ✅ Content validation

### **Week 9-10: Polish & Testing**
- ✅ Integration testing
- ✅ Documentation
- ✅ Performance optimization

---

## **🎯 SUCCESS METRICS**

### **Functional Requirements**
- ✅ **Full CRUD**: Create, Read, Update, Delete for all 4 content types
- ✅ **Firebase Persistence**: All operations save to Firebase
- ✅ **Data Integrity**: Validation and relationship management
- ✅ **Batch Operations**: Efficient bulk content management
- ✅ **User Experience**: Intuitive command structure and feedback

### **Technical Requirements** 
- ✅ **Performance**: Operations complete within 5 seconds
- ✅ **Safety**: Automatic backups and rollback capability
- ✅ **Integration**: Seamless integration with existing systems
- ✅ **Scalability**: Support for hundreds of content items
- ✅ **Reliability**: 99%+ operation success rate

### **User Experience Requirements**
- ✅ **Discoverability**: Comprehensive help and autocomplete
- ✅ **Feedback**: Clear progress and result reporting
- ✅ **Error Handling**: User-friendly error messages and recovery
- ✅ **Consistency**: Uniform command patterns across content types
- ✅ **Efficiency**: Streamlined workflows for common tasks

---

## **🚀 POST-IMPLEMENTATION: Milestone 2.2 Readiness**

Once this CRUD foundation is complete, the CLI will be fully prepared for:

### **AI Content Creation (Images & Video)**
- ✅ **Content Pipeline**: Full content creation → AI enhancement → publishing workflow
- ✅ **Asset Management**: CRUD operations for managing AI-generated images and videos  
- ✅ **Metadata Tracking**: Track AI-generated content with proper attribution
- ✅ **Quality Control**: Validation and approval workflows for AI content
- ✅ **Integration Ready**: Seamless integration with AI image/video generation services

### **Advanced Content Management**
- ✅ **Content Templates**: Standardized templates for rapid content creation
- ✅ **Workflow Automation**: Automated content publishing and cross-referencing
- ✅ **Quality Assurance**: Comprehensive content validation and health monitoring
- ✅ **Performance Optimization**: Efficient content operations at scale

This comprehensive CRUD foundation ensures that content creators have complete control over the Wavelength universe content through a powerful, intuitive command-line interface. 🌊⚡

---

**Implementation Priority**: **HIGH** 🔴  
**Complexity**: **MEDIUM** 🟡  
**Impact**: **CRITICAL** 🚀  

*This plan establishes the complete content management foundation required before advancing to AI-powered content creation in Milestone 2.2.*