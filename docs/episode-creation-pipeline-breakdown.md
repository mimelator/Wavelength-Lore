# Episode Creation Pipeline - Development Breakdown

**GitHub Issue:** [#125](https://github.com/mimelator/Wavelength-Lore/issues/125)
**Created:** October 29, 2025
**Status:** Planning Phase

## Executive Summary

The Episode Creation Pipeline is a comprehensive CLI tool that streamlines the entire workflow for publishing new Wavelength episodes - from initial song upload through game level generation to social media announcements. This breaks down into **5 major phases** with **11 development milestones**.

**Total Estimated Timeline:** 11-15 weeks

---

## Table of Contents

1. [Phase 1: Foundation & Content Management](#phase-1-foundation--content-management)
2. [Phase 2: Dynamic Media Integration](#phase-2-dynamic-media-integration)
3. [Phase 3: Asset Processing & Game Integration](#phase-3-asset-processing--game-integration)
4. [Phase 4: Marketing & Promotion](#phase-4-marketing--promotion)
5. [Phase 5: Integration & End-to-End Pipeline](#phase-5-integration--end-to-end-pipeline)
6. [Testing Strategy Summary](#testing-strategy-summary)
7. [Risk Management](#risk-management)
8. [Success Metrics](#success-metrics)

---

## Phase 1: Foundation & Content Management

**Timeline:** 2-3 weeks
**Dependencies:** None

### Milestone 1.1: CLI Framework & Episode State Management

**Duration:** 3-4 days

#### Development Tasks

- Extend `wavelength-content-cli.js` with episode creation framework
- Implement episode state management (hidden/published toggle)
- Create episode metadata schema (title, season, episode number, status, timestamps)
- Build Firebase integration for episode state persistence
- Add episode visibility controls throughout the site

#### Episode Metadata Schema

```javascript
{
  id: "s5e1",
  season: 5,
  episodeNumber: 1,
  title: "Frozen Peace",
  status: "hidden" | "published",
  createdAt: "2025-10-29T10:00:00Z",
  publishedAt: null,
  songId: "song_s5e1_001",
  assets: {
    images: [],
    videos: [],
    gameAssets: []
  },
  lore: {
    characters: [],
    items: [],
    locations: []
  }
}
```

#### Testing Plan

```bash
# Unit tests
npm test -- --grep "Episode State Management"

# Manual tests
npm run cli
> Create new episode "Test Episode" (Season 5, Ep 1)
> Verify episode is hidden from public views
> Toggle episode visibility
> Verify episode appears/disappears from navigation
```

#### Success Criteria

- ✅ Episodes can be created in hidden state
- ✅ Episode metadata persists correctly in Firebase
- ✅ Public pages respect hidden status
- ✅ Admin can toggle visibility without code changes

---

### Milestone 1.2: Song Upload & Processing

**Duration:** 4-5 days

#### Development Tasks

- Create MP3 upload handler with S3 integration
- Implement audio duration extraction using existing audio processing tools
- Build song metadata editor (title, lyrics, artist info)
- Add S3 bucket organization for episodes (`s3://wavelength-assets/songs/season-X/episode-Y/`)
- Create song replacement/update functionality
- Implement song versioning (keep previous versions archived)

#### S3 Storage Structure

```
wavelength-assets/
├── songs/
│   ├── season-1/
│   │   ├── episode-1/
│   │   │   ├── current/
│   │   │   │   └── wavelength-s1e1.mp3
│   │   │   └── archive/
│   │   │       └── wavelength-s1e1-v1.mp3
```

#### Testing Plan

```bash
# Integration tests
npm run test:songs

# Manual workflow
npm run cli
> Upload song: /path/to/song.mp3
> Verify duration auto-detection
> Edit title and lyrics
> Upload replacement version
> Verify old version archived, new version active
```

#### Success Criteria

- ✅ MP3 files upload successfully to S3
- ✅ Duration is accurately detected (using metadata or audio analysis)
- ✅ Metadata can be edited/updated
- ✅ Song replacements work without breaking references
- ✅ Previous versions are archived, not deleted

---

## Phase 2: Dynamic Media Integration

**Timeline:** 2-3 weeks
**Dependencies:** Phase 1 completion

### Milestone 2.1: Dynamic Radio Player

**Duration:** 5-6 days

#### Development Tasks

- Refactor hardcoded song list in radio player to dynamic Firebase queries
- Create song registry in Firebase with proper indexing
- Update radio player components to fetch songs dynamically
- Implement season filtering with dynamic data
- Add real-time updates when new songs are published
- Ensure backwards compatibility with existing mini-player

#### Current vs. New Implementation

```javascript
// Before: static array
const songs = [
  { title: "Song 1", season: 1, url: "..." },
  // ... hardcoded songs
];

// After: dynamic fetch
const songs = await fetchActiveSongs({
  season: selectedSeason || 'all',
  publishedOnly: true
});
```

#### Firebase Song Schema

```javascript
songs/{songId}: {
  title: string,
  artist: string,
  season: number,
  episodeNumber: number,
  duration: number,
  url: string,
  lyrics: string,
  published: boolean,
  publishedAt: timestamp,
  metadata: {
    albumArt: string,
    genre: string
  }
}
```

#### Testing Plan

```bash
# Automated tests
npm run test:radio-player

# Manual verification
1. Create hidden episode with song
2. Verify song NOT in radio player
3. Publish episode
4. Verify song appears in radio player immediately
5. Filter by season
6. Test loop/random modes with new song
7. Verify mini-player continues to work
```

#### Success Criteria

- ✅ Radio player loads songs from Firebase (not hardcoded)
- ✅ Hidden songs are excluded from public view
- ✅ Season filters work dynamically
- ✅ Mini-player continues to function across page navigation
- ✅ No regression in existing playback features (play, pause, skip, etc.)

---

### Milestone 2.2: Media Generation Tools (CLI-exposed)

**Duration:** 6-7 days

#### Development Tasks

- Extract image generation logic from UI into CLI-callable functions
- Create video generation pipeline accessible via CLI
- Implement iterative generation workflow (generate → review → regenerate)
- Add OpenAI/Stable Diffusion integration for AI-generated assets
- Build asset preview system in CLI
- Create asset approval/rejection workflow
- Implement prompt template system for consistent style

#### CLI Workflow

```bash
npm run cli

Episode Media Generation
========================
Episode: S5E1 - Frozen Peace

1. Generate Images
2. Generate Videos
3. Review Assets
4. Regenerate Selected Assets
5. Approve All Assets
6. Exit

> 1

Generating 12 images for episode...
Using prompt template: "wavelength-season-5"
Base prompt: "Ice fortress concert hall, mystical atmosphere..."

Progress: [████████████████████] 100% (12/12)

✓ Generated 12 images
  View: npm run cli:preview --episode s5e1
```

#### Asset Generation Configuration

```javascript
{
  imageGeneration: {
    provider: "openai" | "stable-diffusion",
    model: "dall-e-3",
    count: 12,
    size: "1792x1024",
    quality: "hd",
    style: "vivid",
    promptTemplate: "season-5-template"
  },
  videoGeneration: {
    provider: "runwayml",
    duration: 10,
    fps: 30,
    resolution: "1080p"
  }
}
```

#### Testing Plan

```bash
# CLI workflow test
npm run cli
> Generate episode images (count: 12)
> Preview images in terminal or browser
> Reject images 3, 7, 11
> Regenerate rejected images with prompt adjustments
> Approve all images
> Generate video assets
> Preview and approve videos

# Automation test
npm run test:media-generation
```

#### Success Criteria

- ✅ CLI can trigger image generation via API
- ✅ Generated assets are reviewable (terminal preview or browser)
- ✅ Iterative regeneration works without losing approved assets
- ✅ Assets are properly organized in S3
- ✅ Generation parameters are customizable per episode
- ✅ Cost tracking and limits are enforced

---

## Phase 3: Asset Processing & Game Integration

**Timeline:** 3-4 weeks
**Dependencies:** Phase 2 completion

### Milestone 3.1: Asset Extraction Pipeline

**Duration:** 5-6 days

#### Development Tasks

- Build automated asset extractor for navigation icons
- Create badge generator from episode artwork
- Implement game asset extractor (sprites, backgrounds, UI elements)
- Add asset variant generator (different sizes, formats)
- Create asset manifest system
- Leverage existing `wavelength-tools/character-extractor/cli.js` patterns
- Implement smart cropping and resizing algorithms

#### Asset Types & Specifications

```javascript
{
  navigationIcons: [
    { size: "64x64", format: "png", usage: "menu" },
    { size: "128x128", format: "png", usage: "header" },
    { size: "256x256", format: "png", usage: "feature" }
  ],
  badges: [
    { size: "512x512", format: "png", usage: "achievement" },
    { size: "128x128", format: "webp", usage: "profile" }
  ],
  gameAssets: [
    { type: "sprite", size: "256x256", format: "png" },
    { type: "background", size: "1920x1080", format: "jpg" },
    { type: "ui-element", size: "variable", format: "svg" }
  ]
}
```

#### Extraction Workflow

```bash
npm run cli

Asset Extraction
================
Source: 12 approved episode images

Extracting navigation icons...
  ✓ Extracted icon-64x64.png from image-5.png
  ✓ Extracted icon-128x128.png from image-5.png
  ✓ Extracted icon-256x256.png from image-5.png

Extracting badges...
  ✓ Generated achievement-badge.png
  ✓ Generated profile-badge.webp

Extracting game assets...
  ✓ Extracted 15 sprites
  ✓ Extracted 3 backgrounds
  ✓ Generated 8 UI elements

Asset Manifest: s3://wavelength-assets/episodes/s5e1/manifest.json
```

#### Testing Plan

```bash
# Use existing extraction tools as reference
npm run wavelength:extract-character-help
npm run wavelength:extract-icons-help

# New episode asset extraction
npm run cli
> Extract assets for Episode S5E1
> Verify navigation icons generated (64x64, 128x128, 256x256)
> Verify badges created with correct transparency
> Verify game assets in correct directories
> Check asset manifest completeness
> Test asset loading in actual pages
```

#### Success Criteria

- ✅ Assets extracted automatically from approved media
- ✅ Multiple size variants generated correctly
- ✅ Assets organized by type and usage
- ✅ Manifest tracks all extracted assets with metadata
- ✅ Extracted assets meet quality standards (no distortion, proper aspect ratios)

---

### Milestone 3.2: Lore & Character Registration

**Duration:** 4-5 days

#### Development Tasks

- Create lore item registration CLI
- Build character profile creation workflow
- Implement lore → Firebase ingestion
- Add lore visibility controls (hidden until episode published)
- Create lore relationship mapping (character ↔ location ↔ item)
- Integrate with existing `scripts/lore-tools.cjs`
- Add lore validation and consistency checks

#### Lore Schema

```javascript
{
  characters: {
    [characterId]: {
      name: string,
      description: string,
      episodeIntroduced: "s5e1",
      published: boolean,
      relationships: {
        allies: [characterId],
        enemies: [characterId],
        locations: [locationId]
      },
      assets: {
        portrait: url,
        sprite: url,
        icon: url
      }
    }
  },
  locations: { /* similar structure */ },
  items: { /* similar structure */ }
}
```

#### CLI Workflow

```bash
npm run cli

Lore Registration
=================
Episode: S5E1 - Frozen Peace

1. Register Character
2. Register Location
3. Register Item
4. View Lore Summary
5. Sync to Chatbot

> 1

Character Registration
----------------------
Name: Frost Guardian
Type: NPC
Description: Ancient protector of the Ice Fortress concert hall
Episode: S5E1 (will be hidden until published)

Relationships:
  Allies: [Daphne, Ice Conductor]
  Location: Ice Fortress Concert Hall

Assets:
  Portrait: auto-selected from episode images

✓ Character registered and will be visible when S5E1 is published
```

#### Integration with Chatbot

```bash
# After lore is registered
node scripts/lore-tools.cjs

Lore Tools Manager
==================
1. Sync Google Docs
2. Sync Lore Content
3. Ingest to Vector DB
4. Full Sync
5. System Status

> 4

Running full synchronization...
✓ Lore content synced
✓ Google Docs synced
✓ Ingesting to Pinecone...
  - Found 1 new character: Frost Guardian (hidden)
  - Found 2 new locations

✓ Full synchronization completed
```

#### Testing Plan

```bash
# Lore registration workflow
npm run cli
> Register new character: "Frost Guardian"
> Add lore: "Ancient protector of Ice Fortress"
> Link to episode S5E1
> Verify character is hidden in database
> Publish episode
> Verify character appears in lore pages

# Integration with chatbot
node scripts/lore-tools.cjs
> Run full-sync
> Verify new lore ingested to Pinecone
> Test chatbot query: "Who is the Frost Guardian?"
> Verify response includes episode context
```

#### Success Criteria

- ✅ New lore can be registered via CLI
- ✅ Lore respects episode visibility status
- ✅ Chatbot can access new lore after ingestion
- ✅ Lore relationships are maintained correctly
- ✅ Lore assets are properly linked
- ✅ No orphaned lore (all references valid)

---

### Milestone 3.3: Game Level Generation

**Duration:** 8-10 days

#### Development Tasks

- Create level generator for each Wavelength game
- Build level asset compiler
- Implement level difficulty progression
- Add level metadata (objectives, rewards, unlocks)
- Create level testing framework
- Generate level-specific text and dialogue
- Implement level validation (playability, balance)

#### Games to Support

1. **Screen Saver Mode** - Collectible items and mystical objects
2. **Any other Wavelength games** discovered in codebase

#### Level Generation Schema

```javascript
{
  levelId: "s5e1-screensaver-1",
  game: "screensaver",
  episode: "s5e1",
  difficulty: "medium",
  objectives: [
    {
      type: "collect",
      target: "frost-crystals",
      count: 10,
      reward: 100
    }
  ],
  assets: {
    background: "s3://wavelength-assets/episodes/s5e1/game/bg-1.jpg",
    collectibles: [
      {
        id: "frost-crystal",
        sprite: "s3://wavelength-assets/episodes/s5e1/game/crystal.png",
        spawnRate: 0.05
      }
    ],
    obstacles: [],
    effects: ["snow", "aurora"]
  },
  dialogue: [
    {
      trigger: "level-start",
      text: "The Ice Fortress awaits. Collect the frost crystals to unlock the concert hall."
    }
  ],
  unlocks: {
    nextLevel: "s5e1-screensaver-2",
    badge: "frost-collector",
    lorePage: "ice-fortress-concert-hall"
  }
}
```

#### CLI Workflow

```bash
npm run cli

Game Level Generation
=====================
Episode: S5E1 - Frozen Peace

Generating levels for:
  - Screen Saver Mode (3 levels)

Level 1: Easy
  Objective: Collect 10 frost crystals
  Assets: ✓ Background, ✓ Collectibles, ✓ Effects
  Dialogue: ✓ Generated

Level 2: Medium
  Objective: Collect 20 crystals while avoiding ice shards
  Assets: ✓ Background, ✓ Collectibles, ✓ Obstacles, ✓ Effects
  Dialogue: ✓ Generated

Level 3: Hard
  Objective: Collect 30 crystals in 60 seconds
  Assets: ✓ Background, ✓ Collectibles, ✓ Timer UI, ✓ Effects
  Dialogue: ✓ Generated

✓ 3 levels generated for Screen Saver Mode

Test levels: npm run cli:test-levels --episode s5e1
```

#### Testing Plan

```bash
# Level generation
npm run cli
> Generate levels for episode S5E1
> Specify difficulty progression (easy → medium → hard)
> Review generated level assets
> Test level playability in test mode
> Adjust parameters (spawn rates, difficulty) and regenerate
> Approve final levels

# Game integration test
npm start
> Navigate to Screen Saver Mode
> Verify new levels appear (if episode published)
> Play through all 3 levels
> Verify assets load correctly
> Test rewards and unlocks
> Verify difficulty progression feels right
```

#### Success Criteria

- ✅ Levels generated for all active games
- ✅ Assets properly linked and functional
- ✅ Difficulty progression makes sense (not too easy/hard)
- ✅ Levels are playable without bugs
- ✅ Hidden until episode is published
- ✅ Unlocks and rewards work correctly

---

## Phase 4: Marketing & Promotion

**Timeline:** 2 weeks
**Dependencies:** Phase 1-3 completion

### Milestone 4.1: CTA Integration

**Duration:** 5-6 days

#### Development Tasks

- Integrate existing CTA scripts into episode pipeline
- Create episode-specific CTA templates
- Build CTA preview system
- Implement CTA scheduling
- Add multi-platform CTA support (email, in-app, social)
- Leverage existing `scripts/cta-*.js` tools
- Add A/B testing capability for CTA variants

#### Existing CTA Scripts

```bash
npm run cta:env-check      # Validate CTA environment
npm run cta:auth-test      # Test authentication
npm run cta:debug          # Debug CTA issues
npm run cta:validate       # Validate CTA configuration
```

#### Episode CTA Templates

```javascript
{
  email: {
    subject: "New Episode Alert: {episodeTitle}",
    template: "email-new-episode",
    variables: {
      episodeTitle: "Frozen Peace",
      season: 5,
      episodeNumber: 1,
      songTitle: "Frozen Peace",
      thumbnailUrl: "...",
      ctaUrl: "https://wavelength.com/episodes/s5e1"
    }
  },
  inApp: {
    title: "New Episode Available!",
    message: "Season 5, Episode 1: Frozen Peace is now live!",
    action: "Listen Now",
    icon: "notification-music",
    deepLink: "/radio?episode=s5e1"
  },
  push: {
    title: "Wavelength - New Episode",
    body: "Frozen Peace is here! Tune in now.",
    data: {
      episode: "s5e1",
      type: "new-episode"
    }
  }
}
```

#### CLI Workflow

```bash
npm run cli

CTA Management
==============
Episode: S5E1 - Frozen Peace

1. Generate CTAs
2. Preview CTAs
3. Schedule CTAs
4. Send Test CTAs
5. View CTA Analytics

> 1

Generating CTAs for episode S5E1...

✓ Email CTA generated
  Subject: "New Episode Alert: Frozen Peace"
  Template: email-new-episode

✓ In-App CTA generated
  Title: "New Episode Available!"

✓ Push Notification generated
  Title: "Wavelength - New Episode"

> 2 (Preview)

Email Preview:
┌─────────────────────────────────────┐
│ From: Wavelength <noreply@...>      │
│ Subject: New Episode Alert: Frozen  │
│          Peace                      │
├─────────────────────────────────────┤
│                                     │
│ [Episode Thumbnail]                 │
│                                     │
│ Season 5, Episode 1                 │
│ FROZEN PEACE                        │
│                                     │
│ The Ice Fortress concert hall       │
│ awaits. Experience the mystical...  │
│                                     │
│ [ ▶ Listen Now ]                    │
│                                     │
└─────────────────────────────────────┘

> 3 (Schedule)

Schedule CTAs:
  Email: Send when episode published
  In-App: Send 1 hour after publish
  Push: Send to opted-in users immediately

✓ CTAs scheduled
```

#### Testing Plan

```bash
# CTA validation
npm run cta:env-check
npm run cta:validate

# Episode CTA generation
npm run cli
> Generate CTAs for episode S5E1
> Preview email CTA (HTML and text versions)
> Preview in-app notification
> Send test CTA to test@wavelength.com
> Schedule CTA delivery for publish time
> Publish episode
> Verify CTAs sent correctly

# Debug if needed
npm run cta:debug
```

#### Success Criteria

- ✅ CTAs generated from episode data automatically
- ✅ Templates are customizable per episode
- ✅ CTAs can be previewed before sending (email, in-app, push)
- ✅ Scheduling works correctly (tied to publish event)
- ✅ Multi-platform delivery functions (email, in-app, push)
- ✅ Test CTAs can be sent to specific users
- ✅ Analytics tracking is in place

---

### Milestone 4.2: Social Media Announcement Generator

**Duration:** 4-5 days

#### Development Tasks

- Create announcement text generator using AI (OpenAI)
- Build platform-specific formatting (Twitter/X, Instagram, Facebook)
- Implement hashtag generation (trending + brand hashtags)
- Add image/video attachment handling
- Create announcement preview and editing
- Build scheduling and auto-posting (optional, via Buffer/Hootsuite API)
- Generate multiple variations for A/B testing

#### Platform Specifications

```javascript
{
  twitter: {
    maxLength: 280,
    hashtagLimit: 3,
    mediaSupport: ["image", "video", "gif"],
    threadSupport: true
  },
  instagram: {
    maxLength: 2200,
    hashtagLimit: 30,
    mediaRequired: true,
    mediaSupport: ["image", "video", "carousel"]
  },
  facebook: {
    maxLength: 63206,
    hashtagRecommended: 3,
    mediaSupport: ["image", "video", "link"]
  }
}
```

#### AI Prompt Template

```
Generate a social media announcement for a new Wavelength episode:

Episode Title: {episodeTitle}
Season: {season}
Episode Number: {episodeNumber}
Theme: {theme}
Mood: {mood}
Key Characters: {characters}

Platform: {platform}
Tone: Mystical, engaging, community-focused
Length: {maxLength} characters
Include: Call-to-action, episode highlights, relevant hashtags

Previous successful posts:
- "The Ice Fortress awaits... 🎵❄️ Episode 5 drops tomorrow!"
- "New mysteries unfold in Season 4. Are you ready?"
```

#### CLI Workflow

```bash
npm run cli

Social Media Announcements
==========================
Episode: S5E1 - Frozen Peace

1. Generate Announcements
2. Preview Announcements
3. Edit Announcements
4. Schedule Posts
5. Copy to Clipboard

> 1

Generating announcements for all platforms...

✓ Twitter/X (3 variations generated)
✓ Instagram (3 variations generated)
✓ Facebook (3 variations generated)

> 2 (Preview)

Twitter/X - Variation 1 (267/280 chars):
─────────────────────────────────────────
The Ice Fortress concert hall opens its
frozen doors... ❄️🎵

Season 5, Episode 1: FROZEN PEACE is here!

Experience mystical melodies in a world
of eternal winter.

🎧 Listen now: wavelength.com/s5e1

#Wavelength #FrozenPeace #NewMusic
─────────────────────────────────────────
Media: frost-crystal-thumbnail.jpg (attached)


Instagram - Variation 1 (156 chars + 12 hashtags):
─────────────────────────────────────────
The Ice Fortress awaits 🏰❄️

Season 5, Episode 1 is LIVE! Immerse
yourself in the mystical sounds of
Frozen Peace.

Swipe for exclusive behind-the-scenes! ➡️

#Wavelength #FrozenPeace #NewEpisode
#MysticalMusic #IceFortress #Season5
#EpisodeRelease #MusicStory #Fantasy
#IndieMusic #NewMusic #ListenNow
─────────────────────────────────────────
Media: carousel (4 images)

> 3 (Edit)

Select announcement to edit:
1. Twitter/X - Variation 1
2. Twitter/X - Variation 2
...

> 1

[Opens editor for manual tweaks]

> 5 (Copy to Clipboard)

Twitter announcement copied!
Paste into Twitter/Buffer/Hootsuite when ready.
```

#### Testing Plan

```bash
# Announcement generation
npm run cli
> Generate announcements for episode S5E1
> Review Twitter announcement (check 280 char limit)
> Review Instagram announcement (with hashtags)
> Review Facebook announcement
> Edit and customize variation 2
> Preview with attached media
> Generate 3 variations for each platform
> Select best variation based on brand voice
> Schedule posts OR copy for manual posting

# A/B testing workflow
> Generate 3 variations
> Post all 3 at different times
> Track engagement
> Use winning style for next episode
```

#### Success Criteria

- ✅ Announcements generated for each platform automatically
- ✅ Character limits respected for each platform
- ✅ Media attachments included and formatted correctly
- ✅ Tone matches brand voice (mystical, engaging)
- ✅ Hashtags are relevant and trending
- ✅ Easy to customize before posting
- ✅ Multiple variations available for A/B testing
- ✅ Copy-to-clipboard function works

---

## Phase 5: Integration & End-to-End Pipeline

**Timeline:** 2-3 weeks
**Dependencies:** All previous phases

### Milestone 5.1: Unified CLI Workflow

**Duration:** 6-7 days

#### Development Tasks

- Create master episode creation workflow
- Implement step-by-step wizard mode
- Add progress tracking and resume functionality
- Build validation at each step
- Create rollback/undo capabilities
- Add batch operations for multiple episodes
- Implement dry-run mode for testing

#### Complete CLI Structure

```bash
npm run cli

╔════════════════════════════════════════╗
║   WAVELENGTH EPISODE CREATOR v1.0      ║
║   Episode Creation Pipeline            ║
╚════════════════════════════════════════╝

Main Menu
─────────
1. 📝 Create New Episode
2. 🔄 Continue Existing Episode
3. 🚀 Publish Episode
4. 📦 Batch Operations
5. 🔍 View Episode Status
6. ❌ Exit

> 1

╔════════════════════════════════════════╗
║   NEW EPISODE WIZARD                   ║
╚════════════════════════════════════════╝

Step 1 of 10: Episode Metadata
───────────────────────────────
Season Number: 5
Episode Number: 1
Episode Title: Frozen Peace
Theme/Mood: Mystical, Winter, Melancholic

✓ Metadata saved (episode: s5e1)

Step 2 of 10: Song Upload
──────────────────────────
Upload MP3 file:
  [Drag and drop or enter path]

📁 /Users/you/Music/frozen-peace.mp3

Processing...
  ✓ File validated (MP3, 320kbps)
  ✓ Duration detected: 3:45
  ✓ Uploaded to S3: s3://wavelength-assets/songs/season-5/episode-1/

Song Title: Frozen Peace
Lyrics: [Enter or import from file]

✓ Song uploaded and configured

Step 3 of 10: Image Generation
───────────────────────────────
Generate images: 12
Style template: season-5-mystical-winter

Prompt: Ice fortress concert hall, frozen architecture,
aurora borealis, mystical atmosphere, crystalline
structures, ethereal lighting...

Generating...
  [████████████████████] 12/12

✓ 12 images generated

Preview images? (Y/n): y
[Opens browser preview]

Satisfied with images? (Y/n): n
Regenerate which images? (e.g., 3,7,11): 3,7

[Regenerates images 3 and 7]

✓ All images approved

Step 4 of 10: Video Generation
───────────────────────────────
Generate videos: 2
Duration: 10 seconds each
Style: Ambient, slow-motion ice crystals

[Generates videos...]

✓ 2 videos generated and approved

Step 5 of 10: Radio Player Integration
───────────────────────────────────────
✓ Song registered in Firebase
✓ Metadata configured (hidden until publish)
✓ Season 5 filter updated

Step 6 of 10: Asset Extraction
───────────────────────────────
Extracting assets from approved media...

✓ Navigation icons (64x64, 128x128, 256x256)
✓ Badges (achievement, profile)
✓ Game assets (15 sprites, 3 backgrounds)

Asset manifest: s3://wavelength-assets/episodes/s5e1/manifest.json

Step 7 of 10: Lore Registration
────────────────────────────────
Register new lore:

1. Character: Frost Guardian
   Description: Ancient protector...
   Relationships: [Daphne], [Ice Fortress]

2. Location: Ice Fortress Concert Hall
   Description: A massive frozen structure...

✓ 2 lore items registered (hidden until publish)

Step 8 of 10: Game Level Generation
────────────────────────────────────
Generating levels for Screen Saver Mode...

Level 1 (Easy): Collect 10 frost crystals
Level 2 (Medium): Collect 20 crystals, avoid shards
Level 3 (Hard): Collect 30 crystals in 60 seconds

✓ 3 game levels generated

Test levels in browser? (Y/n): y
[Opens test environment]

Approve levels? (Y/n): y

✓ Game levels approved

Step 9 of 10: Marketing - CTAs
───────────────────────────────
Generating CTAs...

✓ Email CTA
✓ In-app notification
✓ Push notification

Preview and schedule? (Y/n): y
[Shows preview]

Schedule: When episode is published
✓ CTAs scheduled

Step 10 of 10: Marketing - Social Media
────────────────────────────────────────
Generating social media announcements...

✓ Twitter/X (3 variations)
✓ Instagram (3 variations)
✓ Facebook (3 variations)

Preview? (Y/n): y
[Shows previews]

Copy to clipboard for posting? (Y/n): y
✓ Twitter announcement copied

╔════════════════════════════════════════╗
║   EPISODE CREATION COMPLETE!           ║
╚════════════════════════════════════════╝

Episode: S5E1 - Frozen Peace
Status: HIDDEN (ready to publish)

Next steps:
  1. Review all assets
  2. Test game levels
  3. When ready: npm run cli → Publish Episode

Summary:
  ✓ Song uploaded and configured
  ✓ 12 images generated
  ✓ 2 videos generated
  ✓ Radio player updated
  ✓ Assets extracted
  ✓ Lore registered (2 items)
  ✓ Game levels created (3 levels)
  ✓ CTAs scheduled
  ✓ Social media announcements ready

Save progress: ✓ Saved to episodes/s5e1/progress.json
```

#### Resume Functionality

```bash
npm run cli

Main Menu
─────────
2. 🔄 Continue Existing Episode

> 2

In-Progress Episodes
────────────────────
1. S5E1 - Frozen Peace
   Progress: Step 6/10 (Asset Extraction)
   Last updated: 2 hours ago

2. S5E2 - Crystal Echoes
   Progress: Step 3/10 (Image Generation)
   Last updated: 2 days ago

Select episode: 1

Resuming S5E1 - Frozen Peace...
Continuing from Step 6: Asset Extraction
```

#### Batch Operations

```bash
npm run cli

Main Menu
─────────
4. 📦 Batch Operations

Batch Operations
────────────────
1. Publish Multiple Episodes
2. Generate CTAs for Multiple Episodes
3. Sync All Hidden Episodes to Chatbot
4. Export Episode Data

> 1

Select episodes to publish:
☑ S5E1 - Frozen Peace
☑ S5E2 - Crystal Echoes
☐ S5E3 - Northern Lights (incomplete)

Publish 2 episodes? (Y/n): y

Publishing...
  ✓ S5E1 published
  ✓ S5E2 published
  ✓ CTAs sent
  ✓ Chatbot lore synced

✓ 2 episodes published successfully
```

#### Testing Plan

```bash
# Full pipeline test (automated)
npm run test:episode-pipeline

# Manual end-to-end test
npm run cli
> Create episode from scratch (all 10 steps)
> Verify each step's output
> Interrupt at step 5 (Ctrl+C)
> Resume and continue
> Complete remaining steps
> Test rollback of step 7
> Re-do step 7 with different data
> Complete pipeline
> Publish episode
> Verify all public-facing changes:
  - Radio player shows song
  - Navigation shows new icons
  - Lore pages show characters
  - Game has new levels
  - CTAs sent successfully

# Batch operations test
npm run cli
> Create 3 episodes (S5E1, S5E2, S5E3)
> Complete all 3
> Batch publish 2 episodes
> Verify both published correctly
```

#### Success Criteria

- ✅ All 10 steps can be completed in sequence
- ✅ Progress is saved at each step
- ✅ Interruptions can be resumed from exact step
- ✅ Failed steps can be retried or rolled back
- ✅ Published episodes appear correctly everywhere
- ✅ Batch operations work for multiple episodes
- ✅ Dry-run mode allows testing without making changes
- ✅ Clear error messages and recovery guidance

---

### Milestone 5.2: Comprehensive Testing & Documentation

**Duration:** 5-6 days

#### Development Tasks

- Write integration tests for entire pipeline
- Create test fixtures for each step
- Build automated smoke tests
- Write CLI documentation (user guide)
- Create troubleshooting guide
- Record video walkthrough
- Write developer documentation (architecture, APIs)
- Create runbook for common issues

#### Testing Suite Structure

```
tests/
├── unit/
│   ├── episode-state-management.test.js
│   ├── song-upload.test.js
│   ├── media-generation.test.js
│   ├── asset-extraction.test.js
│   ├── lore-registration.test.js
│   ├── game-level-generation.test.js
│   ├── cta-generation.test.js
│   └── social-media.test.js
├── integration/
│   ├── episode-creation-flow.test.js
│   ├── publish-workflow.test.js
│   ├── resume-functionality.test.js
│   └── batch-operations.test.js
├── e2e/
│   └── full-pipeline.test.js
├── fixtures/
│   ├── test-song.mp3
│   ├── test-images/
│   ├── test-episode-metadata.json
│   └── test-lore-data.json
└── helpers/
    ├── mock-firebase.js
    ├── mock-s3.js
    └── test-utils.js
```

#### Test Commands

```bash
# Unit tests (fast, isolated)
npm run test:episode-pipeline:unit

# Integration tests (medium speed, real dependencies)
npm run test:episode-pipeline:integration

# End-to-end tests (slow, full pipeline)
npm run test:episode-pipeline:e2e

# Smoke tests (quick sanity check)
npm run test:episode-pipeline:smoke

# All tests
npm run test:episode-pipeline

# Watch mode for development
npm run test:episode-pipeline:watch

# Coverage report
npm run test:episode-pipeline:coverage
```

#### Manual QA Checklist

```markdown
## Episode Creation QA Checklist

### Pre-Creation
- [ ] CLI launches without errors
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Firebase connection working
- [ ] S3 bucket accessible
- [ ] OpenAI API key valid

### Step 1: Episode Metadata
- [ ] Can create new episode
- [ ] Season/episode numbers validate correctly
- [ ] Title saves properly
- [ ] Episode is hidden by default
- [ ] Metadata persists in Firebase

### Step 2: Song Upload
- [ ] MP3 file uploads to S3
- [ ] Duration auto-detected correctly
- [ ] Lyrics can be entered/edited
- [ ] Song replacement works
- [ ] Previous versions archived

### Step 3: Image Generation
- [ ] Images generate successfully
- [ ] Preview system works
- [ ] Can regenerate specific images
- [ ] All images saved to S3
- [ ] Approval process functions

### Step 4: Video Generation
- [ ] Videos generate successfully
- [ ] Preview system works
- [ ] Videos saved to S3

### Step 5: Radio Player Integration
- [ ] Song registered in Firebase
- [ ] Song is hidden from public
- [ ] Metadata correct

### Step 6: Asset Extraction
- [ ] Navigation icons extracted (all sizes)
- [ ] Badges generated correctly
- [ ] Game assets extracted
- [ ] Asset manifest created

### Step 7: Lore Registration
- [ ] Characters can be registered
- [ ] Locations can be registered
- [ ] Relationships tracked
- [ ] Lore is hidden until publish

### Step 8: Game Level Generation
- [ ] Levels generated for all games
- [ ] Assets properly linked
- [ ] Difficulty progression correct
- [ ] Levels are playable
- [ ] Test mode works

### Step 9: CTA Generation
- [ ] Email CTA generated
- [ ] In-app notification generated
- [ ] Push notification generated
- [ ] Preview system works
- [ ] Scheduling works

### Step 10: Social Media
- [ ] Announcements generated for all platforms
- [ ] Character limits respected
- [ ] Hashtags appropriate
- [ ] Copy-to-clipboard works

### Publishing
- [ ] Episode can be published
- [ ] Song appears in radio player
- [ ] Navigation icons appear
- [ ] Lore pages updated
- [ ] Game levels accessible
- [ ] CTAs sent successfully

### Post-Publish Verification
- [ ] Radio player shows new song
- [ ] Season filter includes new episode
- [ ] Navigation displays new icons
- [ ] Badges appear in profiles
- [ ] Game levels playable
- [ ] Lore pages show characters
- [ ] Chatbot knows about new lore
- [ ] CTAs delivered to users
- [ ] Analytics tracking working

### Error Handling
- [ ] Can resume after interruption
- [ ] Failed steps can be retried
- [ ] Rollback works correctly
- [ ] Error messages are clear
- [ ] Recovery guidance provided

### Batch Operations
- [ ] Can publish multiple episodes
- [ ] Batch CTAs work
- [ ] Batch lore sync works

### Performance
- [ ] CLI responsive (not laggy)
- [ ] Image generation completes in < 5 min
- [ ] Video generation completes in < 10 min
- [ ] Asset extraction completes in < 2 min
- [ ] Publishing completes in < 1 min
```

#### Documentation Structure

```
docs/
├── user-guide/
│   ├── getting-started.md
│   ├── episode-creation-walkthrough.md
│   ├── step-by-step-guide.md
│   ├── batch-operations.md
│   └── faq.md
├── developer-guide/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── extending-the-pipeline.md
│   ├── testing-guide.md
│   └── contributing.md
├── troubleshooting/
│   ├── common-issues.md
│   ├── error-codes.md
│   └── debugging-tips.md
├── videos/
│   ├── episode-creation-demo.mp4
│   └── advanced-features.mp4
└── changelog.md
```

#### Success Criteria

- ✅ 80%+ code coverage across all tests
- ✅ All integration tests pass consistently
- ✅ E2E test completes full pipeline successfully
- ✅ Documentation is complete and clear
- ✅ Team can successfully create episode without assistance
- ✅ Video walkthrough published
- ✅ No critical bugs in production testing
- ✅ Performance benchmarks met
- ✅ Error handling covers all edge cases

---

## Testing Strategy Summary

### Automated Testing Layers

#### 1. Unit Tests (Each Milestone)

**Purpose:** Test individual functions in isolation
**Speed:** Fast (<5 minutes total)
**Coverage Target:** 80%+

**Example Tests:**
```javascript
// tests/unit/episode-state-management.test.js
describe('Episode State Management', () => {
  test('creates episode with hidden status', async () => {
    const episode = await createEpisode({
      season: 5,
      episodeNumber: 1,
      title: 'Test Episode'
    });

    expect(episode.status).toBe('hidden');
    expect(episode.published).toBe(false);
  });

  test('toggles episode visibility', async () => {
    const episode = await createEpisode({...});
    await publishEpisode(episode.id);

    const updated = await getEpisode(episode.id);
    expect(updated.status).toBe('published');
    expect(updated.publishedAt).toBeDefined();
  });
});
```

**Run Command:**
```bash
npm run test:episode-pipeline:unit
```

---

#### 2. Integration Tests (Phase Completion)

**Purpose:** Test component interactions with real dependencies
**Speed:** Medium (10-15 minutes)
**Coverage Target:** All critical workflows

**Example Tests:**
```javascript
// tests/integration/episode-creation-flow.test.js
describe('Episode Creation Flow', () => {
  test('completes full episode creation', async () => {
    // Step 1: Create episode
    const episode = await createEpisode({
      season: 5,
      episodeNumber: 1,
      title: 'Integration Test Episode'
    });

    // Step 2: Upload song
    const song = await uploadSong(episode.id, './tests/fixtures/test-song.mp3');
    expect(song.duration).toBeGreaterThan(0);

    // Step 3: Generate images (mock AI call)
    const images = await generateImages(episode.id, { count: 12 });
    expect(images).toHaveLength(12);

    // ... continue through all steps

    // Verify final state
    const finalEpisode = await getEpisode(episode.id);
    expect(finalEpisode.steps.every(s => s.completed)).toBe(true);
  });
});
```

**Run Command:**
```bash
npm run test:episode-pipeline:integration
```

---

#### 3. End-to-End Tests (Phase 5)

**Purpose:** Full pipeline simulation in production-like environment
**Speed:** Slow (30-45 minutes)
**Coverage Target:** Complete user workflows

**Example Tests:**
```javascript
// tests/e2e/full-pipeline.test.js
describe('Full Episode Pipeline E2E', () => {
  test('creates, publishes, and verifies episode', async () => {
    // Create episode via CLI
    const cliResult = await runCLI('create-episode', {
      season: 5,
      episodeNumber: 99,
      title: 'E2E Test Episode',
      autoApprove: true  // Skip manual approvals in test
    });

    expect(cliResult.exitCode).toBe(0);

    // Verify hidden state
    const publicSongs = await fetchPublicSongs();
    expect(publicSongs.find(s => s.episodeId === 's5e99')).toBeUndefined();

    // Publish episode
    await runCLI('publish-episode', { episodeId: 's5e99' });

    // Verify public visibility
    const updatedSongs = await fetchPublicSongs();
    expect(updatedSongs.find(s => s.episodeId === 's5e99')).toBeDefined();

    // Verify radio player integration
    const radioPlaylist = await getRadioPlaylist({ season: 5 });
    expect(radioPlaylist.find(s => s.episodeId === 's5e99')).toBeDefined();

    // Verify game levels
    const gameLevels = await getGameLevels({ episodeId: 's5e99' });
    expect(gameLevels.length).toBeGreaterThan(0);

    // Verify lore ingestion
    const loreItems = await queryLore({ episodeId: 's5e99' });
    expect(loreItems.length).toBeGreaterThan(0);

    // Cleanup
    await deleteEpisode('s5e99');
  });
});
```

**Run Command:**
```bash
npm run test:episode-pipeline:e2e
```

---

### Manual Testing Checkpoints

#### After Each Milestone

1. **Feature Walkthrough** (Developer)
   - Developer demonstrates new feature
   - Captures screenshots/recordings
   - Documents any quirks or gotchas

2. **Peer Code Review**
   - Another developer reviews code
   - Checks for security issues
   - Verifies test coverage
   - Suggests improvements

3. **QA Testing** (Tester/Product Owner)
   - Follows test plan manually
   - Reports bugs in GitHub
   - Verifies acceptance criteria met

---

#### After Each Phase

1. **Product Owner Demo**
   - Demo completed features
   - Get feedback and approval
   - Adjust priorities if needed

2. **User Acceptance Testing**
   - Content creator tests workflow
   - Reports UX issues
   - Suggests improvements

3. **Performance Testing**
   - Measure response times
   - Check S3 upload speeds
   - Monitor API costs (OpenAI, etc.)

4. **Security Review**
   - Check authentication/authorization
   - Verify input validation
   - Review S3 bucket permissions
   - Audit API key storage

---

#### Before Production

1. **Full Regression Testing**
   - Run all automated tests
   - Manual QA checklist (above)
   - Test on different environments (dev, staging)

2. **Load Testing**
   - Test with multiple simultaneous episodes
   - Test batch operations with 10+ episodes
   - Monitor Firebase/S3 performance

3. **Beta Testing**
   - Select 2-3 content creators
   - Create real episodes (hidden)
   - Gather feedback
   - Fix critical issues

4. **Rollback Plan**
   - Document rollback procedure
   - Test rollback on staging
   - Prepare communication plan

---

## Risk Management

### High-Risk Areas

#### 1. S3 Storage Costs

**Risk:** Unlimited uploads could inflate AWS costs
**Probability:** Medium
**Impact:** High

**Mitigation Strategies:**
- Implement upload quotas per episode (e.g., max 50 images)
- Add S3 lifecycle policies to archive old assets to Glacier after 90 days
- Monitor S3 costs with CloudWatch alerts
- Compress images before upload (lossy compression for non-critical assets)
- Implement approval flow before expensive operations

**Implementation:**
```javascript
// config/upload-limits.js
module.exports = {
  images: {
    maxCount: 50,
    maxSizePerImage: 10 * 1024 * 1024, // 10MB
    maxTotalSize: 100 * 1024 * 1024    // 100MB
  },
  videos: {
    maxCount: 10,
    maxSizePerVideo: 50 * 1024 * 1024, // 50MB
    maxTotalSize: 200 * 1024 * 1024    // 200MB
  }
};
```

**Monitoring:**
```bash
# Daily cost alert
aws cloudwatch put-metric-alarm \
  --alarm-name "S3-Daily-Cost-Alert" \
  --alarm-description "Alert if S3 costs exceed $50/day" \
  --metric-name EstimatedCharges \
  --threshold 50
```

---

#### 2. AI Generation Costs

**Risk:** Multiple regenerations could be expensive (OpenAI, Stable Diffusion)
**Probability:** High
**Impact:** Medium-High

**Mitigation Strategies:**
- Set hard limits on regenerations (e.g., max 3 regenerations per image)
- Implement cost tracking and budgets per episode
- Use cheaper models for previews, expensive models for finals
- Cache successful prompts for reuse
- Require approval before bulk operations

**Implementation:**
```javascript
// config/ai-limits.js
module.exports = {
  imageGeneration: {
    maxGenerationsPerEpisode: 50,
    maxRegenerationsPerAsset: 3,
    costPerImage: 0.04,  // DALL-E 3 HD
    monthlyBudget: 500
  },
  videoGeneration: {
    maxGenerationsPerEpisode: 10,
    costPerVideo: 5.00,  // Runway ML estimate
    monthlyBudget: 200
  }
};

// Track costs in real-time
class CostTracker {
  async checkBudget(operation, cost) {
    const monthlyTotal = await this.getMonthlyTotal();
    const limit = config[operation].monthlyBudget;

    if (monthlyTotal + cost > limit) {
      throw new Error(`Budget exceeded: $${monthlyTotal}/$${limit}`);
    }
  }
}
```

**Cost Alerts:**
```bash
npm run cli

⚠️  WARNING: AI Generation Costs
────────────────────────────────
Monthly budget: $500
Current usage: $437 (87%)
Remaining: $63

This operation will cost approximately: $48
Proceed? (Y/n):
```

---

#### 3. Data Consistency

**Risk:** Episode partially published if process fails midway
**Probability:** Medium
**Impact:** High (broken user experience)

**Mitigation Strategies:**
- Use database transactions where possible
- Implement atomic operations (all-or-nothing)
- Add rollback capability for each step
- Keep detailed logs of all operations
- Implement health checks before and after publish

**Implementation:**
```javascript
// Atomic publish operation
async function publishEpisode(episodeId) {
  const transaction = db.transaction();

  try {
    // Step 1: Update episode status
    await transaction.update(`episodes/${episodeId}`, {
      status: 'published',
      publishedAt: new Date()
    });

    // Step 2: Update song visibility
    await transaction.update(`songs/${episodeId}`, {
      published: true
    });

    // Step 3: Update lore visibility
    await transaction.update(`lore/episodes/${episodeId}`, {
      published: true
    });

    // Step 4: Update game levels
    await transaction.update(`games/levels/${episodeId}`, {
      published: true
    });

    // Commit all changes atomically
    await transaction.commit();

    // Post-commit: Send CTAs (async, not critical)
    await sendCTAs(episodeId).catch(err => {
      logger.error('CTA send failed, but episode published', err);
    });

  } catch (error) {
    // Rollback all changes
    await transaction.rollback();
    logger.error('Publish failed, rolled back', error);
    throw error;
  }
}
```

**Rollback Function:**
```javascript
async function rollbackPublish(episodeId) {
  console.log('Rolling back publish for episode:', episodeId);

  await db.update(`episodes/${episodeId}`, {
    status: 'hidden',
    publishedAt: null
  });

  await db.update(`songs/${episodeId}`, { published: false });
  await db.update(`lore/episodes/${episodeId}`, { published: false });
  await db.update(`games/levels/${episodeId}`, { published: false });

  console.log('✓ Rollback complete');
}
```

---

#### 4. Performance

**Risk:** Large asset processing slows CLI, poor UX
**Probability:** High
**Impact:** Medium

**Mitigation Strategies:**
- Background processing for slow operations
- Real-time progress indicators
- Parallel processing where possible
- Asset optimization (compression, resizing)
- Caching of frequently used data

**Implementation:**
```javascript
// Progress indicators
const { default: ora } = require('ora');

async function generateImages(episodeId, count) {
  const spinner = ora('Generating images...').start();

  const results = [];
  for (let i = 0; i < count; i++) {
    spinner.text = `Generating image ${i + 1}/${count}...`;
    const image = await generateImage(episodeId, i);
    results.push(image);
  }

  spinner.succeed(`Generated ${count} images`);
  return results;
}

// Parallel processing
async function extractAssets(images) {
  const spinner = ora('Extracting assets...').start();

  // Process in parallel (5 at a time)
  const results = await pMap(images, async (image, index) => {
    spinner.text = `Extracting from image ${index + 1}/${images.length}...`;
    return await extractFromImage(image);
  }, { concurrency: 5 });

  spinner.succeed('Asset extraction complete');
  return results;
}
```

---

### Monitoring & Alerts

#### Error Tracking

```javascript
// Use Sentry or similar for error tracking
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Capture errors with context
try {
  await publishEpisode(episodeId);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      operation: 'publish-episode',
      episodeId: episodeId
    },
    extra: {
      episodeData: await getEpisode(episodeId)
    }
  });
  throw error;
}
```

#### Cost Monitoring

```javascript
// Track costs in Firebase
const costTracking = {
  date: new Date().toISOString().split('T')[0],
  operations: {
    imageGeneration: {
      count: 12,
      cost: 0.48  // $0.04 per image
    },
    videoGeneration: {
      count: 2,
      cost: 10.00  // $5.00 per video
    }
  },
  total: 10.48,
  episodeId: 's5e1'
};

await db.collection('costs').add(costTracking);
```

**AWS Cost Explorer Alerts:**
```bash
# Set up billing alert for S3
aws cloudwatch put-metric-alarm \
  --alarm-name "S3-Monthly-Cost-Alert" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold
```

#### Performance Metrics

```javascript
// Track operation duration
const performanceMetrics = {
  timestamp: new Date(),
  episodeId: 's5e1',
  operations: {
    songUpload: 12.3,      // seconds
    imageGeneration: 145.7,
    videoGeneration: 312.4,
    assetExtraction: 23.1,
    publish: 4.5
  },
  totalDuration: 498.0  // ~8.3 minutes
};

await db.collection('performance').add(performanceMetrics);
```

#### User Feedback Collection

```javascript
// After episode creation
async function collectFeedback(episodeId) {
  const feedback = await askQuestion(`
How was your experience creating this episode?
1. Excellent
2. Good
3. Okay
4. Poor
5. Very Poor

Rating (1-5): `);

  if (parseInt(feedback) <= 3) {
    const details = await askQuestion('What could be improved? ');
    await db.collection('feedback').add({
      episodeId,
      rating: parseInt(feedback),
      details,
      timestamp: new Date()
    });
  }
}
```

---

## Success Metrics

### Developer Efficiency

**Metric 1: Time to Create Episode**
- **Target:** <2 hours (vs. manual: ~8 hours)
- **Measurement:** Track total CLI session duration
- **Success:** 75% time reduction

```javascript
// Tracking
const sessionStart = Date.now();
// ... episode creation ...
const sessionEnd = Date.now();
const duration = (sessionEnd - sessionStart) / 1000 / 60; // minutes

await db.collection('metrics').add({
  metric: 'episode-creation-time',
  duration,
  episodeId,
  target: 120  // 2 hours
});
```

**Metric 2: Reduction in Errors**
- **Target:** 80% fewer errors
- **Measurement:** Compare error count (manual vs. CLI)
- **Success:** <2 errors per episode (vs. ~10 manual)

**Metric 3: Reduction in Steps**
- **Target:** 50% fewer manual steps
- **Measurement:** Count user actions required
- **Success:** ~20 steps (vs. ~40 manual)

---

### Content Quality

**Metric 1: Consistency Score**
- **Target:** 95%+ consistency across episodes
- **Measurement:** Automated checks for required fields, asset formats, naming conventions
- **Success:** 95%+ episodes pass all checks

```javascript
async function calculateConsistencyScore(episodeId) {
  const checks = [
    { name: 'All metadata fields filled', weight: 0.2 },
    { name: 'All assets in correct format', weight: 0.2 },
    { name: 'Naming conventions followed', weight: 0.15 },
    { name: 'All lore items have descriptions', weight: 0.15 },
    { name: 'Game levels playable', weight: 0.15 },
    { name: 'CTAs generated', weight: 0.15 }
  ];

  let score = 0;
  for (const check of checks) {
    if (await performCheck(episodeId, check.name)) {
      score += check.weight;
    }
  }

  return score; // 0.0 to 1.0
}
```

**Metric 2: Asset Quality Ratings**
- **Target:** 4.5/5+ average rating
- **Measurement:** User ratings on generated assets
- **Success:** 90%+ assets rated 4+

**Metric 3: Zero Publish Errors**
- **Target:** 0 errors after QA
- **Measurement:** Count of rollbacks or hotfixes needed
- **Success:** 100% clean publishes

---

### User Impact

**Metric 1: Faster Episode Releases**
- **Target:** 2x release frequency
- **Measurement:** Episodes per month
- **Success:** 8 episodes/month (vs. 4 manual)

**Metric 2: Higher Production Quality**
- **Target:** Improved user engagement
- **Measurement:** Listen-through rate, user ratings
- **Success:** 10%+ improvement in engagement

**Metric 3: Better Cross-Platform Consistency**
- **Target:** Unified experience across web, mobile, games
- **Measurement:** Asset format compliance, UX consistency scores
- **Success:** 100% cross-platform compatibility

---

## Appendix: File References

### Existing Files Referenced

- [wavelength-content-cli.js](wavelength-content-cli.js) - Main CLI entry point
- [scripts/lore-tools.cjs](scripts/lore-tools.cjs) - Lore management tools
- [wavelength-tools/character-extractor/cli.js](wavelength-tools/character-extractor/cli.js) - Character extraction patterns
- [scripts/cta-*.js](scripts/) - CTA management scripts
- [package.json](package.json) - Project dependencies and scripts

### New Files to Create

```
cli/
├── episode-creator.js           # Main episode creation CLI
├── commands/
│   ├── create-episode.js
│   ├── publish-episode.js
│   ├── batch-operations.js
│   └── resume-episode.js
├── steps/
│   ├── 01-metadata.js
│   ├── 02-song-upload.js
│   ├── 03-image-generation.js
│   ├── 04-video-generation.js
│   ├── 05-radio-integration.js
│   ├── 06-asset-extraction.js
│   ├── 07-lore-registration.js
│   ├── 08-game-levels.js
│   ├── 09-cta-generation.js
│   └── 10-social-media.js
├── utils/
│   ├── progress-tracker.js
│   ├── cost-tracker.js
│   ├── validation.js
│   └── rollback.js
└── config/
    ├── upload-limits.js
    ├── ai-limits.js
    └── episode-schema.js

tests/
├── unit/
├── integration/
├── e2e/
└── fixtures/

docs/
├── user-guide/
├── developer-guide/
└── troubleshooting/
```

---

## Next Steps

1. **Review & Approve** this breakdown with stakeholders
2. **Create GitHub Issues** for each milestone (11 issues)
3. **Set up project board** with phases and milestones
4. **Assign developers** to Phase 1 milestones
5. **Begin development** on Milestone 1.1

---

**Document Version:** 1.0
**Last Updated:** October 29, 2025
**Author:** Claude (Anthropic)
**Review Status:** Pending stakeholder approval
