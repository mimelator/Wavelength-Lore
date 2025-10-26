# Wavelength Lore - Documentation Hub

Complete documentation for the Wavelength Lore platform, systems, games, and **production deployment system**.

## 🚀 DevOps & Deployment (NEW)

### Production-Ready Deployment System
- **[deployment-guide.md](deployment-guide.md)** - Complete deployment system overview
- **[ENVIRONMENT_CONFIGURATION.md](ENVIRONMENT_CONFIGURATION.md)** - Safe environment management 
- **[devops-quick-reference.md](devops-quick-reference.md)** - Command reference & troubleshooting

### Quick DevOps Commands
```bash
npm run gh:dashboard      # Complete deployment overview
npm run gh:watch         # Live deployment monitoring
npm run logs:service     # App Runner deployment logs
npm run logs:errors      # Automated error detection
npm run env:prod-preview # Preview production config changes
```

**System Highlights**: ✅ No timeout failures ✅ Perfect version sync ✅ Real-time monitoring ✅ Safe dev/prod separation

## 🏗️ System Architecture & Design

### Architecture Documentation
- **[WAVELENGTH_SYSTEM_ARCHITECTURE.md](WAVELENGTH_SYSTEM_ARCHITECTURE.md)** - Complete system architecture including external chatbot integration
- **[Chatbot Integration](../tests/chatbot/CHATBOT_TESTING_SUMMARY.md)** - Firebase Functions chatbot architecture and validation

## 🚀 AI Automation & MCP Tools

### Model Context Protocol Integration
- **[MCP_TOOLS_DOCUMENTATION.md](MCP_TOOLS_DOCUMENTATION.md)** - Complete MCP tools documentation with technical specs
- **[MCP_QUICK_REFERENCE.md](MCP_QUICK_REFERENCE.md)** - Essential commands and usage examples
- **[AI_COPILOT_QUICKSTART.txt](../AI_COPILOT_QUICKSTART.txt)** - AI assistant onboarding with MCP integration

### Lore Management Tools
- **Enhanced MCP Server**: `/mcp/enhanced-wavelength-server.js` (8 operational tools)
- **Command-Line Interface**: `./lore-tools` (unified access to all features)
- **Interactive Management**: `node scripts/lore-tools.js` (guided workflows)

## Directory Structure

```
docs/
├── README.md (this file) - Main documentation hub
├── WAVELENGTH_SYSTEM_ARCHITECTURE.md - Complete system architecture 
├── game-systems/  - Wavelength Gems game documentation
│   ├── WAVELENGTH_GEMS_GETTING_STARTED.md    (420 lines - Developer onboarding)
│   ├── GAME_LEVEL_SYSTEM_SUMMARY.md          (510 lines - Project overview)
│   ├── LEVEL_SYSTEM_GUIDE.md                 (450 lines - Complete reference)
│   └── LEVEL_SYSTEM_README.md                (300 lines - Quick reference)
├── scripts/  - Utility scripts and automation
└── [50+ other platform documentation files]  - Systems, features, guides, etc.
```

## Documentation Categories

### 🎮 Game Systems
Located in `/game-systems/` directory

- **[Wavelength Gems - Match-3 Game](game-systems/)**
  - Getting started guide
  - Level system architecture
  - Implementation roadmap
  - Code reference

### 🛠️ Platform Systems
Located in root docs directory

- **Content & Lore Systems** - Episode, character, location management
- **Security & Admin** - Authorization, access controls, administration
- **Database & Backups** - Firebase, backup strategies, recovery
- **Deployment & Infrastructure** - Deployment pipeline, hosting, monitoring
- **UI & Components** - Component structure, specifications, documentation
- **Authentication & Sessions** - Login, session management, OAuth
- **Forum & Community** - Discussion system, moderation, features
- **Tools & Scripts** - Automation, debugging, utilities

## Finding Documentation

### By Topic

| Topic | Files | Location |
|-------|-------|----------|
| Wavelength Gems Game | 4 guides (1,680 lines) | `/game-systems/` |
| Content & Lore | Lore system, character references | Root docs |
| Security | Admin access, incident response, analysis | Root docs |
| Database | Firebase setup, backups, recovery | Root docs |
| Deployment | Pipeline, infrastructure, troubleshooting | Root docs |
| UI/UX | Components, specifications, structure | Root docs |
| Authentication | Login, sessions, Firebase auth | Root docs |
| Forum System | Categories, delete, functionality | Root docs |

### By Role

| Role | Start Here |
|------|-----------|
| **Game Developer** | [`game-systems/WAVELENGTH_GEMS_GETTING_STARTED.md`](game-systems/WAVELENGTH_GEMS_GETTING_STARTED.md) |
| **Game Designer** | [`game-systems/LEVEL_SYSTEM_GUIDE.md`](game-systems/LEVEL_SYSTEM_GUIDE.md) |
| **Game Manager** | [`game-systems/GAME_LEVEL_SYSTEM_SUMMARY.md`](game-systems/GAME_LEVEL_SYSTEM_SUMMARY.md) |
| **Backend Developer** | Look for API, database, and system docs in root |
| **Frontend Developer** | Look for UI component and feature docs in root |
| **DevOps/Infrastructure** | Look for deployment and infrastructure docs in root |
| **Content Manager** | Look for content creation and visibility docs in root |
| **Admin/Security** | Look for admin, security, and access docs in root |

## Featured Documentation

### 📚 Newest: Wavelength Gems Game System (October 22, 2024)

**Status**: Phase 1 Complete, Phases 2-5 Ready

**Contents**: Complete game level system with episode integration

**Location**: [`game-systems/`](game-systems/)

**Quick Links**:
- [Getting Started](game-systems/WAVELENGTH_GEMS_GETTING_STARTED.md) - New developers
- [Complete Guide](game-systems/LEVEL_SYSTEM_GUIDE.md) - Implementers
- [Project Summary](game-systems/GAME_LEVEL_SYSTEM_SUMMARY.md) - Managers
- [Quick Reference](game-systems/LEVEL_SYSTEM_README.md) - Developers

### 📖 Other Documentation

Browse the docs directory for 50+ other guides covering all platform systems.

## How This Documentation Is Organized

1. **Root Directory** - Platform-wide documentation
   - 50+ guides covering all major systems
   - Organized by topic (security, auth, deployment, etc.)
   - Updated regularly

2. **game-systems/** - Game-specific documentation
   - Wavelength Gems match-3 game
   - Level system architecture
   - Implementation guides
   - Code examples

3. **scripts/** - Automation and utilities
   - Script documentation
   - Usage guides
   - Helper tools

## Quick Links

| Need | Find |
|------|------|
| Game development help | `docs/game-systems/` |
| Security/Admin access | Search root docs for ADMIN, SECURITY |
| Database/Firebase | Search root docs for DATABASE, FIREBASE, BACKUP |
| Deployment help | Search root docs for DEPLOYMENT |
| UI/Component info | Search root docs for UI |
| Authentication | Search root docs for AUTH, LOGIN, SESSION |
| Content/Lore system | Search root docs for CONTENT, LORE, EPISODE |

---

**Last Updated**: October 22, 2024
**Documentation**: 50+ comprehensive guides + 1,680 lines of new game documentation
**Status**: Actively maintained, regularly updated
