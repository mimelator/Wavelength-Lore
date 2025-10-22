# Wavelength Gems - Season 1 Progression System

## Overview

Season 1 consists of 11 levels, each tied to an episode from the Wavelength Lore series. The game progressively increases in difficulty, introducing new mechanics and building to an epic boss battle finale.

## Progression Design

### Difficulty Curve

```
Level 1-2:   Easy        (Tutorial/Introduction)
Level 3-4:   Easy-Medium (Building Skills)
Level 5-6:   Medium      (Mastery)
Level 7-9:   Hard        (Challenge)
Level 10:    Very Hard   (Pre-Boss)
Level 11:    BOSS        (Season Finale)
```

### Core Progression Metrics

| Level | Episode | Difficulty | Score Target | Moves | Cascades | Gem Types |
|-------|---------|-----------|--------------|-------|----------|-----------|
| 1 | My Lucky Charm | Easy | 2,500 | 30 | 3 | 4 |
| 2 | Jump Right In! | Easy | 3,000 | 25 | 4 | 5 |
| 3 | Dream With Me | Easy | 3,500 | 25 | 5 | 5 |
| 4 | Daphne | Medium | 4,000 | 22 | 6 | 5 |
| 5 | Falling | Medium | 4,500 | 20 | 7 | 6 |
| 6 | Once More | Medium | 5,000 | 18 | 8 | 6 |
| 7 | History Lessons | Hard | 5,500 | 18 | 9 | 6 |
| 8 | Life In The Shire | Hard | 6,000 | 16 | 10 | 7 |
| 9 | Feed The Crows | Hard | 6,500 | 15 | 11 | 7 |
| 10 | Keep On | Very Hard | 7,000 | 14 | 12 | 8 |
| 11 | Back To The Shire | **BOSS** | 8,000 | 35 | 15 | 8 |

## Progression Mechanics

### 1. Score Escalation
- **Increment**: +500 points per level (average)
- **Total Range**: 2,500 → 8,000 points
- **Boss Jump**: +1,000 points for final challenge

### 2. Move Reduction
- **Early Game (1-3)**: 25-30 moves (learning)
- **Mid Game (4-6)**: 18-22 moves (efficiency)
- **Late Game (7-9)**: 15-18 moves (mastery)
- **Pre-Boss (10)**: 14 moves (perfection)
- **Boss (11)**: 35 moves (epic battle, multiple phases)

### 3. Cascade Requirements
- **Linear Growth**: +1 cascade per level (mostly)
- **Boss Level**: +3 cascade jump (15 total)
- **Purpose**: Rewards planning and combo mastery

### 4. Gem Type Expansion
- **4 Gems (Level 1)**: Simple matching
- **5 Gems (Levels 2-4)**: Increased complexity
- **6 Gems (Levels 5-7)**: Strategic thinking required
- **7 Gems (Levels 8-9)**: Advanced pattern recognition
- **8 Gems (Levels 10-11)**: Maximum board complexity

## Level-by-Level Breakdown

### Early Game: Introduction (Levels 1-3)

**Level 1: My Lucky Charm** 🍀
- **Theme**: Irish luck, positivity
- **Gems**: Clover, Horseshoe, Music, Rainbow
- **Learning**: Basic matching, cascade introduction
- **Tone**: Welcoming, cheerful

**Level 2: Jump Right In!** 🧭
- **Theme**: Adventure, taking chances
- **Gems**: Compass, Horseshoe, Lightning, Rainbow, Clover
- **Learning**: 5-gem matching, decision-making
- **Tone**: Encouraging, exciting

**Level 3: Dream With Me** 🌙
- **Theme**: Dreams, imagination
- **Gems**: Moon, Star, Music, Thought, Sparkles
- **Learning**: Pattern recognition, visual flow
- **Tone**: Mystical, creative

### Skill Building (Levels 4-6)

**Level 4: Daphne** 🗡️
- **Theme**: Courage, bravery
- **Gems**: Sword, Shield, Gem, Fire, Lightning
- **Challenge**: Reduced moves (22), higher score (4,000)
- **Tone**: Heroic, determined

**Level 5: Falling** 🪶
- **Theme**: Resilience, learning from failure
- **Gems**: Feather, Wave, Leaves, Wind, Cloud, Spiral (6 types!)
- **Challenge**: First 6-gem level, 20 moves
- **Tone**: Reflective, encouraging

**Level 6: Once More** 🔄
- **Theme**: Persistence, trying again
- **Gems**: Retry, Muscle, Target, Fire, Lightning, Star
- **Challenge**: 5,000 points, only 18 moves
- **Tone**: Motivational, powerful

### Advanced Challenge (Levels 7-9)

**Level 7: History Lessons** 📜
- **Theme**: Learning from the past
- **Gems**: Scroll, Temple, Hourglass, Key, Books, Crystal Ball
- **Challenge**: 5,500 points, maintaining 18 moves
- **Tone**: Wise, educational

**Level 8: Life In The Shire** 🏡
- **Theme**: Community, harmony
- **Gems**: House, Sunflower, Music, Bread, Wheat, Bee, Tree (7 types!)
- **Challenge**: 6,000 points, 16 moves, 10 cascades
- **Tone**: Peaceful, joyful

**Level 9: Feed The Crows** 🦅
- **Theme**: Dark omens, preparation
- **Gems**: Eagle, Feather, Moon, Swords, Bell, Storm, Eye
- **Challenge**: 6,500 points, 15 moves, 11 cascades
- **Tone**: Ominous, tense

### Endgame (Levels 10-11)

**Level 10: Keep On** 💪
- **Theme**: Determination, never giving up
- **Gems**: Muscle, Runner, Music, Fire, Lightning, Star, Dizzy, Mountain (8 types!)
- **Challenge**: 7,000 points, only 14 moves, 12 cascades
- **Tone**: Intense, demanding

**Level 11: Back To The Shire** 👑
- **Type**: 🎯 **BOSS LEVEL**
- **Theme**: Epic battle, defending home
- **Gems**: Sword, Shield, Music, Rainbow, Lightning, Fire, Crown, Gem
- **Challenge**: 
  - 8,000 points (highest requirement)
  - 35 moves (marathon battle)
  - 15 cascades (combo mastery)
  - 10 special gems (advanced technique)
- **Special Mechanics**: 
  - Boss mode enabled
  - Boss health bar: 100 HP
  - Multiple objectives (primary + 2 secondary)
  - Season completion unlock
- **Tone**: Epic, climactic, triumphant

## Boss Level Features

Level 11 introduces **boss mechanics** not present in other levels:

### New YAML Fields
```yaml
constraints:
  bossMode: true
  bossHealth: 100

progression:
  bossLevel: true
  seasonComplete: true
  unlocksNextSeason: true
```

### Boss Gameplay
- **Health Bar**: Gems matched deal damage to boss
- **Multiple Phases**: Boss behavior changes at health thresholds
- **Extended Battle**: More moves to allow for epic showdown
- **Multiple Objectives**: 3 objectives instead of 2
- **Higher Rewards**: 2 stars for cascades (vs 1 star normally)

## Unlocking System

Each level requires completing the previous level:

```javascript
Level 1: Always unlocked (entry point)
Level 2: Requires Level 1 completion
Level 3: Requires Level 2 completion
...
Level 11: Requires Level 10 completion
```

## Supported Features

The game engine currently supports:

✅ **Implemented**
- Level unlocking based on previous completion
- Score targets
- Move limits
- Cascade tracking
- Gem type variation (4-8 types)
- Special gem objectives (`special_gems` type)
- Theme customization (colors, images, particle effects)
- Narrative integration (briefing, characters, locations)

⚠️ **Partially Implemented** (YAML defined, may need UI/logic work)
- Boss mode (`bossMode: true`)
- Boss health bar (`bossHealth: 100`)
- Season completion tracking (`seasonComplete: true`)
- Multiple secondary objectives (YAML supports, engine needs testing)

❌ **Future Enhancements** (mentioned in YAML but not yet coded)
- Boss phases (health-based behavior changes)
- Visual boss character on screen
- Boss attack patterns
- Power-ups and boosters
- Special gem combinations (bombs, row/column clears)

## Difficulty Definitions

Updated difficulty values in `levels.js`:

```javascript
tutorial:   { moveLimit: 50, targetScore: 500,  gemTypeCount: 3, cascadeBonus: 1.0 }
easy:       { moveLimit: 30, targetScore: 1500, gemTypeCount: 4, cascadeBonus: 1.2 }
medium:     { moveLimit: 25, targetScore: 2500, gemTypeCount: 5, cascadeBonus: 1.5 }
hard:       { moveLimit: 20, targetScore: 4000, gemTypeCount: 6, cascadeBonus: 2.0 }
very_hard:  { moveLimit: 15, targetScore: 6000, gemTypeCount: 7, cascadeBonus: 2.5 }
boss:       { moveLimit: 35, targetScore: 8000, gemTypeCount: 8, cascadeBonus: 3.0 }
```

## Balancing Philosophy

### Early Game (1-3)
- **Focus**: Learning mechanics, building confidence
- **Difficulty**: Forgiving, generous move limits
- **Rewards**: Frequent positive feedback

### Mid Game (4-6)
- **Focus**: Skill development, strategic thinking
- **Difficulty**: Moderate challenge, efficiency required
- **Rewards**: Sense of mastery

### Late Game (7-9)
- **Focus**: Mastery, advanced tactics
- **Difficulty**: High challenge, planning required
- **Rewards**: Pride in overcoming obstacles

### Endgame (10-11)
- **Focus**: Ultimate test, climactic showdown
- **Difficulty**: Maximum challenge, epic scale
- **Rewards**: Season completion, story payoff

## Player Psychology

The progression is designed to create a satisfying gameplay arc:

1. **Levels 1-2**: "I can do this!" (confidence building)
2. **Levels 3-4**: "I'm getting better!" (skill growth)
3. **Levels 5-6**: "This is challenging!" (engagement)
4. **Levels 7-8**: "I need to focus!" (flow state)
5. **Level 9**: "Things are getting serious..." (tension)
6. **Level 10**: "This is tough but I'm close!" (anticipation)
7. **Level 11**: "Epic boss battle! I can win!" (climax & triumph)

## Fine-Tuning Notes

Each level is currently configured with episode-themed gems and basic progression. Future refinements:

1. **Gem Selection**: Match specific episode imagery and themes
2. **Special Mechanics**: Add episode-specific rules (e.g., "Lucky Charm" gives random bonus)
3. **Boss AI**: Implement Goblin King attack patterns
4. **Visual Polish**: Add particle effects, animations for each theme
5. **Sound Design**: Episode music integration, sound effects per gem type

## Testing Recommendations

When playtesting, verify:

- [ ] Level 1 is always accessible
- [ ] Each level unlocks after previous completion
- [ ] Score targets feel achievable but challenging
- [ ] Move limits create interesting pressure
- [ ] Cascade requirements reward combo play
- [ ] 8-gem boards (Levels 10-11) don't feel overwhelming
- [ ] Boss level feels epic and climactic
- [ ] Progression feels smooth and rewarding

## Next Steps

1. **Playtest** Levels 1-11 for balance
2. **Implement** boss mode visual indicators
3. **Add** special gem mechanics (if not already present)
4. **Create** Season 2 levels (Episodes 12-18)
5. **Design** power-up system for advanced play
6. **Consider** difficulty toggles (Easy/Normal/Hard modes)

---

**Version**: 1.1.0 - Season 1 Complete  
**Last Updated**: October 22, 2025  
**Status**: Ready for playtesting
