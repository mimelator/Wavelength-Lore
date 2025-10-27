const https = require('https');

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'your-token-here';
const REPO_OWNER = 'mimelator';
const REPO_NAME = 'Wavelength-Lore';

const issues = [
  // PHASE 1: HIGH IMPACT, LOW EFFORT (DO FIRST)
  {
    title: "[IMPL-PLAN] Homepage CTA Enhancement - Immediate Engagement Boost",
    body: `## 🚀 PHASE 1: HIGH IMPACT, LOW EFFORT

**Priority**: DO FIRST  
**Effort**: 15 minutes  
**Impact**: Maximum immediate visitor engagement  
**Source**: Issue #51

### Task Description
Replace generic homepage CTA with emotionally engaging version.

### Current State
\`"Explore the Wavelength Lore"\`

### Target State  
\`"Enter a world where mystery meets music. Start your journey into the unknown."\`

### Implementation Steps
1. Locate homepage template file
2. Replace CTA text string
3. Test rendering on staging
4. Deploy to production
5. Monitor engagement metrics

### Success Criteria
- [ ] CTA text updated and deployed
- [ ] 25% increase in homepage click-through rate within 30 days
- [ ] A/B testing setup for future CTA optimization

### Files to Modify
- Homepage template (likely in views/ or public/)
- Monitor with analytics

**Estimated Time**: 15 minutes  
**Dependencies**: None  
**Risk Level**: Low`,
    labels: ['impl-plan', 'phase-1', 'high-impact', 'low-effort', 'cta-improvement']
  },

  {
    title: "[IMPL-PLAN] Character Description Stakes Enhancement",
    body: `## 🚀 PHASE 1: HIGH IMPACT, LOW EFFORT

**Priority**: DO FIRST  
**Effort**: 2 hours  
**Impact**: Character connection increase  
**Source**: Issues #52-53

### Task Description
Enhance existing character descriptions with emotional stakes and personal investment hooks.

### Implementation Strategy
Add stakes elements to existing character description fields without schema changes.

### Character Enhancement Examples
- **Marcus**: "haunted by unsolved cases, racing against time to prevent the next tragedy"
- **Elena**: "protecting ancient secrets while modern dangers close in around her"
- **Dr. Sarah Chen**: "her scientific discoveries threaten everything she thought she knew"
- **Jake Morrison**: "the story he's chasing might be the last one he ever tells"

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

### Files to Modify
- \`content/characters/*.yaml\`
- Character display templates

**Estimated Time**: 2 hours  
**Dependencies**: None  
**Risk Level**: Low`,
    labels: ['impl-plan', 'phase-1', 'high-impact', 'low-effort', 'characters']
  },

  {
    title: "[IMPL-PLAN] Episode Summary Cliffhanger Hooks",
    body: `## 🚀 PHASE 1: HIGH IMPACT, LOW EFFORT

**Priority**: DO FIRST  
**Effort**: 3 hours  
**Impact**: Episode completion rate boost  
**Source**: Issue #54

### Task Description
Add cliffhanger elements to existing episode summaries to create continuation incentive.

### Enhancement Template
\`"[Existing summary] But when [character] discovers [revelation], everything changes."\`

### Implementation Examples
- Episode 1: "...But when Marcus realizes the radio signals aren't random, he uncovers a conspiracy that threatens everything he believes."
- Episode 2: "...Elena's ancient knowledge becomes their only hope, but trusting her might be their biggest mistake."

### Implementation Steps
1. Review all episode YAML files in content/videos/
2. Enhance summaries with cliffhanger elements
3. Maintain existing episode schema
4. Add "next episode" teases where appropriate
5. Test episode page rendering
6. Monitor completion rates

### Success Criteria
- [ ] All episodes have enhanced summaries with hooks
- [ ] 20% improvement in episode completion rate
- [ ] 40% increase in next episode click-through rate

### Files to Modify
- \`content/videos/**/*.yaml\`
- Episode display templates

**Estimated Time**: 3 hours  
**Dependencies**: None  
**Risk Level**: Low`,
    labels: ['impl-plan', 'phase-1', 'high-impact', 'low-effort', 'episodes']
  },

  {
    title: "[IMPL-PLAN] Basic Forum Discussion Prompts - Community Kickstart",
    body: `## 🚀 PHASE 1: HIGH IMPACT, LOW EFFORT

**Priority**: DO FIRST  
**Effort**: 1 hour  
**Impact**: Community activity kickstart  
**Source**: Issues #57-58

### Task Description
Create initial discussion topics to stimulate forum engagement and community building.

### Discussion Topic Examples
1. **Character Loyalty**: "Team Marcus or Team Elena? Who do you trust and why?"
2. **Radio Mysteries**: "What's the strangest thing you've heard on Wavelength Radio?"
3. **Theory Sharing**: "Share your theory about the radio signals - what do you think is really happening?"
4. **Character Analysis**: "Which character would you want as your partner in investigating the mysteries?"
5. **Episode Discussion**: "What moment from the series gave you chills?"

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
- [ ] Weekly discussion prompt system established

### Implementation Details
- Use character-driven engagement strategies
- Frame discussions from character perspectives
- Create polls and voting mechanisms where possible
- Encourage theory sharing and speculation

**Estimated Time**: 1 hour  
**Dependencies**: Forum access  
**Risk Level**: Low`,
    labels: ['impl-plan', 'phase-1', 'high-impact', 'low-effort', 'community']
  },

  // PHASE 2: HIGH IMPACT, HIGH EFFORT (PLAN CAREFULLY)
  {
    title: "[IMPL-PLAN] Firebase Schema Enhancement for CTA Features",
    body: `## 🎯 PHASE 2: HIGH IMPACT, HIGH EFFORT

**Priority**: PLAN CAREFULLY  
**Effort**: 20 hours  
**Impact**: Foundation for all advanced features  
**Source**: Multiple issues (#52-55)

### Task Description
Enhance Firebase schema to support advanced CTA features including character taglines, episode hooks, lore intrigue, and analytics tracking.

### Schema Enhancements Required

#### Character Schema Updates
\`\`\`json
"characters": {
  "$characterId": {
    "tagline": { ".validate": "newData.isString() && newData.val().length <= 100" },
    "stakes": { ".validate": "newData.isString() && newData.val().length <= 200" },
    "cta_text": { ".validate": "newData.isString() && newData.val().length <= 150" }
  }
}
\`\`\`

#### Episode Schema Updates
\`\`\`json
"videos": {
  "$seasonId": {
    "episodes": {
      "$episodeId": {
        "cliffhanger": { ".validate": "newData.isString()" },
        "next_episode_tease": { ".validate": "newData.isString()" },
        "discussion_prompt": { ".validate": "newData.isString()" }
      }
    }
  }
}
\`\`\`

#### Lore Schema Updates
\`\`\`json
"lore": {
  "$loreId": {
    "intrigue_hook": { ".validate": "newData.isString() && newData.val().length <= 200" },
    "mystery_level": { ".validate": "newData.isString()" },
    "investigation_cta": { ".validate": "newData.isString()" }
  }
}
\`\`\`

#### Analytics Schema
\`\`\`json
"analytics": {
  "cta_engagement": {
    "$cta_id": {
      "impressions": { ".validate": "newData.isNumber()" },
      "clicks": { ".validate": "newData.isNumber()" },
      "conversions": { ".validate": "newData.isNumber()" }
    }
  }
}
\`\`\`

### Implementation Plan
1. **Week 1**: Update Firebase security rules
2. **Week 2**: Create schema migration scripts  
3. **Week 3**: Test with staging data
4. **Week 4**: Deploy to production with rollback plan

### Success Criteria
- [ ] All new schema fields validated and tested
- [ ] Migration scripts successfully move existing data
- [ ] Zero data loss during migration
- [ ] New fields accessible via API
- [ ] Analytics tracking operational

**Estimated Time**: 20 hours  
**Dependencies**: Firebase admin access  
**Risk Level**: Medium (data migration)**`,
    labels: ['impl-plan', 'phase-2', 'high-impact', 'high-effort', 'firebase', 'schema']
  },

  {
    title: "[IMPL-PLAN] Interactive Map Context CTAs System",
    body: `## 🎯 PHASE 2: HIGH IMPACT, HIGH EFFORT

**Priority**: PLAN CAREFULLY  
**Effort**: 25 hours  
**Impact**: Map engagement transformation  
**Source**: Issue #56

### Task Description
Transform static map exploration into dynamic, context-aware discovery experience with location-specific CTAs.

### Current Problem
Generic "Click to explore" prompts don't create intrigue or emotional investment.

### Target Solution
Location-specific discovery prompts that tie into the main storyline and character arcs.

### Context CTA Examples
- **Radio Station**: "Strange energy readings detected here. What secrets lie beneath the transmission tower?"
- **University Lab**: "Dr. Chen's research notes were found scattered here. What was she investigating?"
- **Downtown District**: "Marcus was last seen investigating this area. Follow his trail."
- **Forest Preserve**: "Ancient symbols carved into trees here. Elena knows what they mean."

### Implementation Requirements
1. **Location Data Enhancement**
   - Add mystery_level field to each location
   - Create story_connection references
   - Add character_involvement tracking

2. **Context-Aware CTA Generation**
   - Dynamic prompt system based on user progress
   - Story progression tracking
   - Character arc integration

3. **Progress Tracking Integration**
   - User discovery history
   - Unlocked location tracking
   - Achievement system integration

4. **Mobile-Responsive Design**
   - Touch-friendly map interface
   - Context modal system
   - Progressive disclosure of information

### Technical Implementation
- Enhance map location data structure
- Create CTA generation engine
- Implement progress tracking API
- Update map UI components
- Add analytics tracking

### Success Criteria
- [ ] All map locations have context-specific CTAs
- [ ] 75% increase in map exploration rate
- [ ] 50% improvement in location discovery completion
- [ ] Story progression tracking functional
- [ ] Mobile experience optimized

**Estimated Time**: 25 hours  
**Dependencies**: Firebase schema updates, map UI access  
**Risk Level**: Medium**`,
    labels: ['impl-plan', 'phase-2', 'high-impact', 'high-effort', 'map', 'interactive']
  },

  {
    title: "[IMPL-PLAN] Games-Story Integration System",
    body: `## 🎯 PHASE 2: HIGH IMPACT, HIGH EFFORT

**Priority**: PLAN CAREFULLY  
**Effort**: 30 hours  
**Impact**: Gamification of entire experience  
**Source**: Issue #61

### Task Description
Create integrated system where game outcomes affect story progression and community participation.

### Current Problem
Games exist in isolation from main storyline, reducing engagement and narrative investment.

### Target Solution
Story-driven game integration where player actions unlock story content and community challenges.

### Integration Examples
- **Radio Signal Decoder**: Help Marcus decode messages to unlock episode content
- **Symbol Translation**: Work with Elena to translate ancient symbols found on the map
- **Evidence Analysis**: Process clues from episodes to unlock character backstories  
- **Community Puzzles**: Collaborative challenges that require multiple players

### System Requirements

#### 1. Game Completion Tracking
- Track individual player progress
- Record puzzle solutions and timing
- Store community contribution data

#### 2. Story Revelation System  
- Content unlocks based on game completion
- Character backstory reveals
- Episode bonus content access
- Lore item discovery triggers

#### 3. Achievement and Unlock System
- Progress-based content access
- Community milestone rewards
- Character interaction unlocks
- Special forum access privileges

#### 4. Community Challenge Framework
- Multi-player collaborative puzzles
- Seasonal community events
- Leaderboards and recognition
- Story outcome voting systems

### Technical Implementation
1. **Game Progress API**
   - Track completion states
   - Store player achievements
   - Manage unlock conditions

2. **Content Unlock Engine**
   - Conditional content display
   - Progressive story revelation
   - Dynamic CTA generation

3. **Community Integration**
   - Collaborative puzzle mechanics
   - Progress sharing systems
   - Achievement broadcasting

### Success Criteria
- [ ] Game completion tracking operational
- [ ] Story unlock system functional
- [ ] 100% increase in game participation
- [ ] Community challenges launched
- [ ] Achievement system active

**Estimated Time**: 30 hours  
**Dependencies**: Games access, Firebase schema updates  
**Risk Level**: High (complex integration)**`,
    labels: ['impl-plan', 'phase-2', 'high-impact', 'high-effort', 'games', 'integration']
  },

  {
    title: "[IMPL-PLAN] Advanced Analytics Dashboard for CTA Optimization",
    body: `## 🎯 PHASE 2: HIGH IMPACT, HIGH EFFORT

**Priority**: PLAN CAREFULLY  
**Effort**: 35 hours  
**Impact**: Data-driven optimization capability  
**Source**: All CTA issues (measurement system)

### Task Description
Build comprehensive analytics system to measure CTA performance and enable data-driven optimization.

### Analytics Requirements

#### 1. CTA Performance Tracking
- Impression tracking for all CTAs
- Click-through rate monitoring
- Conversion funnel analysis
- A/B testing capability

#### 2. User Journey Mapping
- Page flow analysis
- Engagement path tracking
- Drop-off point identification
- Content affinity mapping

#### 3. Real-time Monitoring
- Live engagement metrics
- Performance alert system
- Anomaly detection
- Community activity monitoring

#### 4. Optimization Framework
- A/B testing infrastructure
- Performance comparison tools
- Recommendation engine
- Automated optimization suggestions

### Dashboard Features
- **Overview**: Key engagement metrics at a glance
- **CTA Performance**: Detailed analysis of all call-to-action elements
- **User Journeys**: Visual flow analysis and optimization opportunities
- **Community Health**: Forum, map, and game engagement metrics
- **Content Performance**: Episode, character, and lore engagement data
- **Optimization**: A/B testing results and recommendations

### Technical Implementation

#### Analytics Event System
\`\`\`javascript
// CTA engagement tracking
trackCTAEngagement({
  cta_id: 'homepage-main',
  action: 'impression|click|conversion',
  context: 'homepage',
  user_session: session_id,
  timestamp: Date.now()
});
\`\`\`

#### Dashboard UI Development
- React/Vue.js based dashboard
- Real-time data visualization
- Interactive filtering and analysis
- Export and reporting capabilities

#### A/B Testing Infrastructure
- CTA variation management
- Traffic splitting algorithms
- Statistical significance calculation
- Automated winner selection

### Success Criteria
- [ ] All CTA interactions tracked
- [ ] Dashboard operational with real-time data
- [ ] A/B testing system functional
- [ ] Performance alerts configured
- [ ] Optimization recommendations generated

**Estimated Time**: 35 hours  
**Dependencies**: Firebase analytics schema, UI framework  
**Risk Level**: Medium**`,
    labels: ['impl-plan', 'phase-2', 'high-impact', 'high-effort', 'analytics', 'dashboard']
  }
];

async function createGitHubIssue(issue) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      title: issue.title,
      body: issue.body,
      labels: issue.labels
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Wavelength-Issue-Creator',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 201) {
          const result = JSON.parse(responseData);
          console.log(`✅ Created issue #${result.number}: ${issue.title}`);
          resolve(result);
        } else {
          console.error(`❌ Failed to create issue: ${issue.title}`);
          console.error(`Status: ${res.statusCode}`);
          console.error(`Response: ${responseData}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error creating issue: ${issue.title}`, error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function createAllIssues() {
  console.log('🌊 WAVELENGTH: Creating implementation plan GitHub issues...\n');
  
  if (GITHUB_TOKEN === 'your-token-here' || !GITHUB_TOKEN) {
    console.log('⚠️  GitHub token not provided. Showing what would be created:\n');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.title}`);
      console.log(`   Labels: ${issue.labels.join(', ')}`);
      console.log('');
    });
    return;
  }

  try {
    for (let i = 0; i < issues.length; i++) {
      console.log(`Creating issue ${i + 1}/${issues.length}...`);
      await createGitHubIssue(issues[i]);
      // Add delay to avoid rate limiting
      if (i < issues.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    console.log('\n🎉 All implementation plan issues created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review created issues on GitHub');
    console.log('2. Assign team members to Phase 1 tasks');
    console.log('3. Begin immediate implementation of high-impact, low-effort items');
  } catch (error) {
    console.error('❌ Error in batch creation:', error);
  }
}

createAllIssues();