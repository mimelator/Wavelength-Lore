#!/bin/bash

# 🌊 WAVELENGTH GitHub Issues Creator (No Labels Version)
# This script creates implementation plan issues without labels

echo "🌊 WAVELENGTH: Creating implementation plan issues..."
echo "Note: Add labels manually after creation: impl-plan, phase-1, high-impact, low-effort"
echo ""

# Ensure GITHUB_TOKEN is not set (use keyring auth)
unset GITHUB_TOKEN

# Phase 1 Issue 2
echo "Creating Character Stakes Enhancement issue..."
gh issue create \
  --title "[IMPL-PLAN] Character Description Stakes Enhancement" \
  --body "## 🚀 PHASE 1: HIGH IMPACT, LOW EFFORT

**Priority**: DO FIRST  
**Effort**: 2 hours  
**Impact**: Character connection increase

### Task Description
Enhance existing character descriptions with emotional stakes and personal investment hooks.

### Character Enhancement Examples
- **Marcus**: \"haunted by unsolved cases, racing against time to prevent the next tragedy\"
- **Elena**: \"protecting ancient secrets while modern dangers close in around her\"
- **Dr. Sarah Chen**: \"her scientific discoveries threaten everything she thought she knew\"

### Implementation Steps
1. Review current character YAML files in content/
2. Enhance descriptions with emotional stakes
3. Maintain existing schema structure
4. Test character page rendering
5. Deploy and monitor engagement

### Success Criteria
- [ ] All main characters have enhanced descriptions with stakes
- [ ] 30% increase in character page session duration
- [ ] Character page bounce rate decreases by 20%

**Estimated Time**: 2 hours"

echo ""

# Phase 1 Issue 3
echo "Creating Episode Cliffhanger Hooks issue..."
gh issue create \
  --title "[IMPL-PLAN] Episode Summary Cliffhanger Hooks" \
  --body "## 🚀 PHASE 1: HIGH IMPACT, LOW EFFORT

**Priority**: DO FIRST  
**Effort**: 3 hours  
**Impact**: Episode completion rate boost

### Task Description
Add cliffhanger elements to existing episode summaries to create continuation incentive.

### Enhancement Template
\"[Existing summary] But when [character] discovers [revelation], everything changes.\"

### Implementation Examples
- Episode 1: \"...But when Marcus realizes the radio signals aren't random, he uncovers a conspiracy that threatens everything he believes.\"
- Episode 2: \"...Elena's ancient knowledge becomes their only hope, but trusting her might be their biggest mistake.\"

### Implementation Steps
1. Review all episode YAML files in content/videos/
2. Enhance summaries with cliffhanger elements
3. Maintain existing episode schema
4. Add \"next episode\" teases where appropriate
5. Test episode page rendering
6. Monitor completion rates

### Success Criteria
- [ ] All episodes have enhanced summaries with hooks
- [ ] 20% improvement in episode completion rate
- [ ] 40% increase in next episode click-through rate

**Estimated Time**: 3 hours"

echo ""

# Phase 1 Issue 4
echo "Creating Forum Discussion Prompts issue..."
gh issue create \
  --title "[IMPL-PLAN] Basic Forum Discussion Prompts - Community Kickstart" \
  --body "## 🚀 PHASE 1: HIGH IMPACT, LOW EFFORT

**Priority**: DO FIRST  
**Effort**: 1 hour  
**Impact**: Community activity kickstart

### Task Description
Create initial discussion topics to stimulate forum engagement and community building.

### Discussion Topic Examples
1. **Character Loyalty**: \"Team Marcus or Team Elena? Who do you trust and why?\"
2. **Radio Mysteries**: \"What's the strangest thing you've heard on Wavelength Radio?\"
3. **Theory Sharing**: \"Share your theory about the radio signals - what do you think is really happening?\"
4. **Character Analysis**: \"Which character would you want as your partner in investigating the mysteries?\"
5. **Episode Discussion**: \"What moment from the series gave you chills?\"

### Implementation Steps
1. Access forum administration interface
2. Create 10 engaging discussion topics
3. Pin important community-building topics
4. Set up automatic weekly discussion prompts
5. Monitor engagement and participation

### Success Criteria
- [ ] 10 initial discussion topics posted
- [ ] 50% increase in forum activity within 30 days
- [ ] At least 20 community members participate in discussions

**Estimated Time**: 1 hour"

echo ""
echo "✅ Phase 1 issues created!"
echo "🔗 View all issues: gh issue list"
echo "📝 Don't forget to add labels manually: impl-plan, phase-1, high-impact, low-effort"
echo ""
echo "Want to create Phase 2 issues? Run this script again or create them manually."