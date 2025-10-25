# Wavelength Gems - Level Creation Guide

## 🎯 Overview

This guide explains how to create new levels for **Wavelength Gems** using the YAML configuration system. Each level is designed to integrate seamlessly with **Wavelength Lore episodes**, creating an immersive narrative gaming experience.

## 📁 Configuration Structure

### Main Configuration File
**Location:** `/content/games/wavelength-gems-levels.yaml`

This YAML file contains all level definitions, organized by seasons and episodes from the Wavelength Lore series.

### Level Loading System
Levels are loaded server-side via the API endpoint:
```javascript
GET /api/games/wavelength-gems/levels
```

The `levels.js` file handles:
- Loading levels from server
- Applying default values
- Episode integration
- Progressive unlocking

## 🏗️ Level Structure

### Basic Level Template
```yaml
- level: 1                              # Unique level number
  season: 1                             # Wavelength Lore season
  episode: 1                            # Episode within season
  episodeKey: season1/episode1          # Reference key for episode data
  title: My Lucky Charm                 # Display name
  description: Match gems to spread joy # Brief description
  difficulty: easy                      # Difficulty category
  
  theme:                                # Visual theming
    primaryColor: "#FFD700"
    secondaryColor: "#10B981"
    # ... theme properties
    
  gemThemes:                            # Episode-specific gem appearances
    daphne: 🍀
    jasper: 🧲
    # ... character gem mappings
    
  objectives:                           # Win conditions
    primary:
      type: score
      target: 2500
    # ... objective definitions
    
  constraints:                          # Game limitations
    moveLimit: 30
    gemTypes: [daphne, jasper, miles, ivy]
    # ... constraint properties
    
  narrative:                            # Story integration
    briefing: "Lucky appears with a grin..."
    # ... narrative elements
    
  progression:                          # Unlock requirements
    unlockRequirements:
      previousLevel: null
    # ... progression settings
```

## 🎨 Theme Configuration

### Visual Theming System
Each level can have a completely unique visual theme tied to its episode:

```yaml
theme:
  primaryColor: "#FFD700"               # Main UI accent color
  secondaryColor: "#10B981"             # Secondary UI elements
  accentColor: "#FFA500"                # Highlight color
  
  # Background images
  backgroundImage: /static/images/characters/wavelength/MyLuckyCharm-02.webp
  backgroundOpacity: 0.12               # Background transparency
  heroImage: /static/images/characters/wavelength/lucky_closeup.webp
  
  # Image carousel for dynamic backgrounds
  carouselImages:
    - /static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-01.webp
    - /static/images/characters/wavelength/MyLuckyCharm-02.webp
    - /static/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-03.webp
  
  # Visual effects
  particleEffect: lucky_sparkles        # Special particle system
  borderGlowColor: "#FFD700"            # Border glow effect
  borderGlowIntensity: 0.6              # Glow strength (0.0-1.0)
```

### Character Gem Theming
Customize gem appearances to match episode themes:

```yaml
gemThemes:
  daphne: 🍀    # Four-leaf clover (lucky theme)
  jasper: 🧲    # Horseshoe (luck & protection)
  miles: 🎵     # Music note (Wavelength theme)
  ivy: 🌈       # Rainbow (pot of gold)
  echo: ⭐      # Star (magical theme)
  atlas: 🎭     # Theater mask (performance theme)
```

**Available Gem Characters:**
- **Daphne** - Purple gems, wisdom & magic
- **Jasper** - Blue gems, loyalty & strength  
- **Miles** - Green gems, music & harmony
- **Ivy** - Pink gems, nature & growth
- **Echo** - Yellow gems, light & energy
- **Atlas** - Cyan gems, adventure & discovery

## 🎯 Objectives System

### Primary Objectives
Every level must have one primary objective:

```yaml
objectives:
  primary:
    type: score                         # Objective type
    target: 2500                        # Target value
    description: Reach 2500 points      # Display text
```

**Supported Primary Types:**
- `score` - Reach target score
- `moves` - Complete within move limit  
- `time` - Finish within time limit
- `cascades` - Trigger minimum cascades

### Secondary Objectives (Optional)
Add bonus challenges for extra rewards:

```yaml
objectives:
  secondary:
    - type: cascades
      target: 3
      description: Trigger 3 cascade combos
      reward:
        points: 300
        stars: 1
        coins: 50
```

**Secondary Objective Types:**
- `cascades` - Chain reaction matches
- `combos` - Consecutive matches
- `efficiency` - Complete with moves remaining
- `speed` - Complete quickly
- `gems` - Clear specific gem types

## ⚙️ Constraints Configuration

### Move Limits
```yaml
constraints:
  moveLimit: 30                         # Maximum moves allowed
  timeLimit: null                       # Time limit (null = unlimited)
```

### Board Configuration  
```yaml
constraints:
  boardSize:
    rows: 8                             # Board height
    cols: 8                             # Board width
  
  gemTypes:                             # Available gem types
    - daphne
    - jasper  
    - miles
    - ivy
  
  gemTypeCount: 4                       # Number of different gems on board
```

### Advanced Constraints
```yaml
constraints:
  cascadeLimit: 10                      # Maximum cascade depth
  specialGems: false                    # Enable power-up gems
  lockedGems: []                        # Immovable gems
  obstacles: []                         # Board obstacles
```

## 📖 Narrative Integration

### Story Elements
```yaml
narrative:
  briefing: "Lucky the Leprechaun appears with a mischievous grin, offering to bless the Shire with good fortune. Match gems to harness the magic!"
  
  storySegments:                        # Mid-level story beats
    - trigger: score_halfway
      text: "The magic grows stronger!"
    - trigger: moves_remaining_5
      text: "Quick! The blessing is almost complete!"
  
  loreReference: season1/episode1       # Episode content reference
  
  characters:                           # Featured characters
    - Lucky
    - Shire Folk
  
  locations:                            # Story locations
    - The Shire
```

### Episode Integration
```yaml
episodeKey: season1/episode1            # Links to episode content
```

This key connects the level to:
- Episode artwork and images
- Character data and themes
- Story context and references
- Hero badge displays

## 🔄 Progression System

### Unlock Requirements
```yaml
progression:
  unlockRequirements:
    previousLevel: null                 # Required previous level (null for first level)
    minimumScore: null                  # Minimum score on previous level
    playtime: null                      # Minimum total playtime
    achievements: []                    # Required achievements
    vipLevel: null                      # Required VIP tier
```

### Rewards
```yaml
progression:
  rewards:
    points: 500                         # XP/points awarded
    coins: 25                           # In-game currency
    experience: 100                     # Experience points
    stars: 1                            # Star rating
    unlocks: []                         # Items/features unlocked
```

### Statistics Tracking
```yaml
progression:
  recordStats: true                     # Enable stat tracking
  trackingFields:                       # Recorded metrics
    - score
    - moves_used
    - combo_streak
    - time_taken
    - cascades_triggered
    - gems_matched
```

## 📏 Difficulty Guidelines

### Difficulty Categories
Each difficulty has recommended parameters:

```yaml
# Tutorial levels
difficulty: tutorial
# Recommended: moveLimit: 50, targetScore: 500, gemTypeCount: 3

# Easy levels  
difficulty: easy
# Recommended: moveLimit: 30, targetScore: 1500, gemTypeCount: 4

# Medium levels
difficulty: medium  
# Recommended: moveLimit: 25, targetScore: 2500, gemTypeCount: 5

# Hard levels
difficulty: hard
# Recommended: moveLimit: 20, targetScore: 4000, gemTypeCount: 6

# Very Hard levels
difficulty: very_hard
# Recommended: moveLimit: 15, targetScore: 6000, gemTypeCount: 7

# Expert levels
difficulty: expert
# Recommended: moveLimit: 15, targetScore: 5500, gemTypeCount: 6

# Legend levels
difficulty: legend
# Recommended: moveLimit: 10, targetScore: 7500, gemTypeCount: 6

# Boss levels (season finales)
difficulty: boss
# Recommended: moveLimit: 35, targetScore: 8000, gemTypeCount: 8
```

### Difficulty Progression
- **Seasons 1-2:** Introduce mechanics gradually
- **Season 3:** Advanced strategies required
- **Season 4:** Expert-level challenges
- **Boss Levels:** Epic season finale challenges

## 🏗️ Creating New Levels

### Step 1: Plan the Episode Integration
1. **Choose Episode** - Select a Wavelength Lore episode
2. **Identify Themes** - Extract visual and narrative themes
3. **Character Focus** - Determine which characters to feature
4. **Story Beat** - Plan the narrative briefing

### Step 2: Design Game Mechanics
1. **Difficulty Assessment** - Choose appropriate difficulty level
2. **Objective Design** - Create compelling win conditions
3. **Move Balance** - Set challenging but fair move limits
4. **Scoring Targets** - Calculate achievable but challenging scores

### Step 3: Visual Theme Creation
1. **Color Palette** - Extract colors from episode artwork
2. **Image Assets** - Prepare hero images and backgrounds
3. **Gem Themes** - Design episode-appropriate gem appearances
4. **Effects** - Plan particle effects and visual feedback

### Step 4: Configuration Implementation
1. **YAML Entry** - Add level to configuration file
2. **Asset Preparation** - Ensure all image assets are available
3. **Testing Setup** - Use admin panel for rapid iteration
4. **Balance Testing** - Playtest for appropriate difficulty

### Step 5: Quality Assurance
1. **Narrative Flow** - Ensure story briefing flows well
2. **Visual Consistency** - Check theme cohesion
3. **Difficulty Balance** - Confirm appropriate challenge level
4. **Technical Testing** - Verify all assets load correctly

## 🛠️ Development Tools

### Admin Panel Testing
Use the admin panel (Ctrl+Shift+D) to:
- Jump directly to new levels
- Adjust game parameters in real-time
- Test different objective configurations
- Validate theme implementation

### Level Validation
```javascript
// Access level data in browser console
getLevel(levelNumber).then(level => console.log(level));

// Validate level configuration
validateLevel(levelData);

// Test level loading
loadLevelsFromServer().then(levels => console.log(levels));
```

### Asset Management
Ensure all referenced assets exist:
```bash
# Check image paths
ls /static/images/seasons/season1/episodes/episode1/images/
ls /static/images/characters/wavelength/

# Verify asset accessibility
curl -I https://yoursite.com/static/images/your-asset.webp
```

## 📊 Analytics Integration

### Performance Metrics
Track level performance with:
```yaml
progression:
  analytics:
    trackCompletion: true               # Level completion rates
    trackAttempts: true                 # Number of attempts
    trackAbandon: true                  # Where players quit
    trackScore: true                    # Score distributions
    trackTime: true                     # Completion times
```

### A/B Testing Support
```yaml
variants:
  - name: default
    config: # ... standard config
  - name: easier
    config: # ... modified config with easier parameters
  - name: harder  
    config: # ... modified config with harder parameters
```

## 🚀 Advanced Features

### Dynamic Level Generation
```yaml
generation:
  template: base_template               # Base configuration
  variables:                            # Dynamic parameters
    score_multiplier: 1.2
    move_bonus: 5
  conditions:                           # Conditional modifications
    - if: player_skill > 0.8
      then: { moveLimit: -5 }
```

### Seasonal Events
```yaml
events:
  - name: holiday_bonus
    active: 2024-12-01 to 2024-12-31
    modifications:
      rewards.points: "*1.5"
      theme.particleEffect: "snow"
```

### Localization Support
```yaml
localization:
  title:
    en: "My Lucky Charm"
    es: "Mi Amuleto de la Suerte"
    fr: "Mon Porte-Bonheur"
  description:
    en: "Match gems to spread joy..."
    es: "Combina gemas para esparcir alegría..."
    fr: "Assortissez les gemmes pour répandre la joie..."
```

## 📋 Best Practices

### Level Design Philosophy
1. **Story First** - Always start with the episode narrative
2. **Progressive Difficulty** - Gradual skill building across levels
3. **Visual Cohesion** - Maintain consistent episode theming
4. **Balanced Challenge** - Difficult but achievable objectives
5. **Player Agency** - Multiple strategies should be viable

### Technical Considerations
1. **Asset Optimization** - Compress images for fast loading
2. **Mobile Testing** - Verify levels work on small screens
3. **Performance Impact** - Limit complex particle effects
4. **Loading Times** - Keep asset sizes reasonable
5. **Accessibility** - Ensure color-blind friendly themes

### Content Guidelines
1. **Episode Accuracy** - Stay true to Wavelength Lore content
2. **Age Appropriate** - Maintain family-friendly themes
3. **Cultural Sensitivity** - Be mindful of diverse audiences
4. **Inclusive Design** - Welcome players of all skill levels

---

## 🎉 Ready to Create!

You now have all the tools needed to create engaging **Wavelength Gems** levels! Remember that each level is an opportunity to tell part of the Wavelength story while providing satisfying puzzle gameplay.

Start with a clear episode vision, design balanced mechanics, and create beautiful themed experiences that bring the Wavelength universe to life through interactive gameplay.

**Happy level creating!** ✨🎮