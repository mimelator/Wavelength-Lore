# Wavelength Lore - Documentation Hub

Complete documentation for the Wavelength Lore platform, content systems, and games.

## Directory Structure

```
docs/
├── README.md (this file) - Documentation hub
├── game-systems/ - Game documentation
│   ├── WAVELENGTH_GEMS_GETTING_STARTED.md    - Game developer onboarding
│   ├── GAME_LEVEL_SYSTEM_SUMMARY.md          - Project overview
│   ├── LEVEL_SYSTEM_GUIDE.md                 - Comprehensive reference
│   └── LEVEL_SYSTEM_README.md                - Quick reference
├── scripts/ - Utility scripts documentation
└── [Other system documentation files...]
```

## Documentation Sections

### 🎮 [Wavelength Gems - Match-3 Game](game-systems/)

**Getting Started**: Start here if you're new to game development
- **File**: [`game-systems/WAVELENGTH_GEMS_GETTING_STARTED.md`](game-systems/WAVELENGTH_GEMS_GETTING_STARTED.md)
- **Contents**: Overview, quick start, file organization, common tasks
- **Audience**: Developers, designers, new team members

**Project Summary**: Executive overview of the level system
- **File**: [`game-systems/GAME_LEVEL_SYSTEM_SUMMARY.md`](game-systems/GAME_LEVEL_SYSTEM_SUMMARY.md)
- **Contents**: Implementation status, architecture, benefits, roadmap
- **Audience**: Project managers, decision makers, developers

**Comprehensive Guide**: Complete reference documentation
- **File**: [`game-systems/LEVEL_SYSTEM_GUIDE.md`](game-systems/LEVEL_SYSTEM_GUIDE.md)
- **Contents**: Full schema, usage examples, best practices, troubleshooting
- **Audience**: Developers implementing features

**Quick Reference**: Code examples and API reference
- **File**: [`game-systems/LEVEL_SYSTEM_README.md`](game-systems/LEVEL_SYSTEM_README.md)
- **Contents**: API usage, level structure, testing examples
- **Audience**: Developers writing code

## Quick Navigation

### I want to learn about...

**Wavelength Gems Game**
→ Start with [`game-systems/WAVELENGTH_GEMS_GETTING_STARTED.md`](game-systems/WAVELENGTH_GEMS_GETTING_STARTED.md)

**Game Level System Architecture**
→ Read [`game-systems/LEVEL_SYSTEM_GUIDE.md`](game-systems/LEVEL_SYSTEM_GUIDE.md)

**Game Project Status & Overview**
→ Read [`game-systems/GAME_LEVEL_SYSTEM_SUMMARY.md`](game-systems/GAME_LEVEL_SYSTEM_SUMMARY.md)

**Game API & Code Examples**
→ Read [`game-systems/LEVEL_SYSTEM_README.md`](game-systems/LEVEL_SYSTEM_README.md)

**Implementing Phase 2 (Visual Theming)**
→ See Phase 2 checklist in [`game-systems/LEVEL_SYSTEM_GUIDE.md`](game-systems/LEVEL_SYSTEM_GUIDE.md)

**All Platform Documentation**
→ Browse the docs directory - documentation exists for all major systems

## Game Systems Documentation Overview

| Document | Purpose | Location | Audience |
|----------|---------|----------|----------|
| WAVELENGTH_GEMS_GETTING_STARTED.md | Onboarding guide | game-systems/ | New developers, designers |
| GAME_LEVEL_SYSTEM_SUMMARY.md | Project overview | game-systems/ | Managers, team leads |
| LEVEL_SYSTEM_GUIDE.md | Complete reference | game-systems/ | Developers, implementers |
| LEVEL_SYSTEM_README.md | Quick reference | game-systems/ | Code developers |

## Implementation Status

### ✅ Phase 1: Level Schema & Configuration (COMPLETE)
- Level schema documentation
- 11 level configurations
- Engine integration
- Complete documentation

### 📋 Phase 2: Visual Theming (READY)
Estimated: 4-6 hours

### 🔄 Phases 3-5 (READY)
See documentation for details

## Key Concepts

### Levels
Game configurations tied to episodes. Each level has:
- Episode reference (episodeKey)
- Difficulty (tutorial → legend)
- Objectives (primary + secondary)
- Visual theme (colors, images, particles)
- Narrative context (briefings, lore)

### Episodes
Content from the Wavelength Lore series stored in Firebase. Levels automatically inherit episode metadata.

### Difficulty Progression
6 levels: Tutorial (easy) → Legend (expert) with scaling moves, scores, gem types

## Code Location

### Schema & Configuration
- `level-schema.js` - Level schema documentation
- `levels.js` - 11 level definitions

**Location**: `static/js/games/wavelength-gems/`

### Game Engine
- `engine.js` - Game logic with level support
  - `loadLevel(levelNumber)` - Load level configuration
  - `initGame(levelNumber)` - Initialize with level

**Location**: `static/js/games/wavelength-gems/`

## Resources

### Official Files
- **Schema Documentation**: `static/js/games/wavelength-gems/level-schema.js`
- **Level Definitions**: `static/js/games/wavelength-gems/levels.js`
- **Game Engine**: `static/js/games/wavelength-gems/engine.js`

### Documentation
- **Complete Guide**: `docs/game-systems/LEVEL_SYSTEM_GUIDE.md`
- **Quick Reference**: `docs/game-systems/LEVEL_SYSTEM_README.md`
- **Getting Started**: `docs/game-systems/WAVELENGTH_GEMS_GETTING_STARTED.md`
- **Project Summary**: `docs/game-systems/GAME_LEVEL_SYSTEM_SUMMARY.md`

## Next Steps

### For Developers
1. Read `docs/game-systems/WAVELENGTH_GEMS_GETTING_STARTED.md`
2. Review `docs/game-systems/LEVEL_SYSTEM_GUIDE.md`
3. Start Phase 2 (Visual Theming)

### For Designers
1. Review level definitions in `levels.js`
2. Understand difficulty progression in documentation
3. Create custom levels following the examples

### For Project Managers
1. Read `docs/game-systems/GAME_LEVEL_SYSTEM_SUMMARY.md` for overview
2. Check implementation checklist for timeline
3. Review phases 2-5 for dependencies and sequencing

## Questions?

### About the Level System
See: `docs/game-systems/LEVEL_SYSTEM_README.md`

### How to Implement Features
See: `docs/game-systems/LEVEL_SYSTEM_GUIDE.md`

### Getting Started with Development
See: `docs/game-systems/WAVELENGTH_GEMS_GETTING_STARTED.md`

### Project Overview & Status
See: `docs/game-systems/GAME_LEVEL_SYSTEM_SUMMARY.md`

---

**Last Updated**: October 22, 2024
**Status**: Phase 1 Complete | Phases 2-5 Ready
**Total Documentation**: 1,680+ lines across 4 comprehensive guides
