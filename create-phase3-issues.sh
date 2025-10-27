#!/bin/bash

# 🌊 WAVELENGTH Phase 3 GitHub Issues Creator
# Low Impact, Low Effort - Perfect for fill time and polish work

echo "🎨 WAVELENGTH: Creating Phase 3 issues (Low Impact, Low Effort)..."
echo "These are polish and refinement tasks perfect for fill time between major features"
echo ""

# Ensure GITHUB_TOKEN is not set (use keyring auth)
unset GITHUB_TOKEN

# Phase 3 Issue 1: CTA Variations
echo "Creating Additional CTA Variations issue..."
gh issue create \
  --title "[IMPL-PLAN] Additional CTA Variations - Seasonal & Contextual" \
  --body "## 🎨 PHASE 3: LOW IMPACT, LOW EFFORT

**Priority**: FILL TIME  
**Effort**: 10 hours (30 minutes per variation)  
**Impact**: Freshness and variety to prevent CTA fatigue  
**Risk Level**: Very Low

### Task Description
Create seasonal, contextual, and character-focused CTA alternatives to maintain engagement freshness and provide variety across different contexts and user segments.

### CTA Variation Categories

#### Seasonal Themes (4 variations)
- **Halloween/October**: \"Uncover the mysteries that lurk in the shadows this October\"
- **Winter/December**: \"Warm up with chilling mysteries during the cold season\"
- **Spring/March**: \"New secrets bloom as winter fades - discover what awakens in the Wavelength world\"
- **Summer/June**: \"Long nights perfect for deep dives into the Wavelength mysteries\"

#### Time-Based Variations (4 variations)
- **Late Night (10PM-2AM)**: \"Late night listeners discover the most secrets - tune in now\"
- **Weekend**: \"Perfect weekend for a mystery binge - where will you start your investigation?\"
- **Morning (6AM-10AM)**: \"Start your day with intrigue - coffee and conspiracies await\"
- **Evening (6PM-10PM)**: \"Evening is mystery time - tune into the Wavelength frequency\"

#### Character-Focused CTAs (4 variations)
- **Marcus-focused**: \"Join Marcus Sterling in his relentless pursuit of truth - every clue matters\"
- **Elena-focused**: \"Follow Elena's ancient wisdom into modern mysteries - what will she reveal?\"
- **Dr. Chen-focused**: \"Explore Dr. Chen's scientific approach to the unexplained - logic meets mystery\"
- **Jake-focused**: \"Investigate alongside journalist Jake Morrison - uncover the story behind the story\"

#### Episode-Specific Variations (4 variations)
- **After Episode 1**: \"The radio signals are just the beginning - dive deeper into the conspiracy\"
- **After Episode 2**: \"Trust no one, question everything - your investigation continues\"
- **After Episode 3**: \"The conspiracy deepens - are you ready for what comes next?\"
- **Season Finale**: \"All mysteries revealed... or are they? The truth awaits your discovery\"

#### Emotional Hooks (4 variations)
- **Curiosity**: \"Some questions demand answers - start your investigation here\"
- **Mystery**: \"Hidden in plain sight, waiting to be discovered - will you find it?\"
- **Adventure**: \"Your journey into the unknown begins with a single step - take it now\"
- **Community**: \"Join thousands of investigators uncovering the truth together\"

### Implementation Strategy

#### CTA Rotation System
- Database/JSON collection storing all CTA variations with metadata
- Smart rotation algorithm considering user history, time, and context
- A/B testing framework to identify top-performing variations
- Fallback system ensuring no user sees same CTA repeatedly

#### Context-Aware Selection
- Time-based CTA selection (morning, evening, late night)
- Seasonal automatic switching with manual override capability
- Character-focus based on user's most viewed character pages
- Episode-specific CTAs based on user's viewing progress

### Technical Implementation
1. Create CTA variation database with categorization
2. Implement rotation logic with user tracking
3. Design A/B testing framework for variation effectiveness
4. Set up automated seasonal switching
5. Create admin interface for CTA management
6. Monitor performance and engagement metrics

### Success Criteria
- [ ] 20+ CTA variations created, tested, and deployed
- [ ] Rotation system operational with smooth transitions
- [ ] User engagement maintains freshness over extended periods
- [ ] Top-performing variations identified through A/B testing
- [ ] Seasonal switching works automatically
- [ ] No user fatigue from repetitive CTAs

### Files to Modify
- CTA configuration files (JSON or database)
- Homepage and page templates with CTA display logic
- Admin interface for CTA management
- A/B testing integration

**Estimated Time**: 30 minutes per variation creation + 3 hours system setup = 10 hours total  
**Dependencies**: Basic CTA system in place, A/B testing framework"

echo ""

# Phase 3 Issue 2: UI Polish
echo "Creating Minor UI Polish issue..."
gh issue create \
  --title "[IMPL-PLAN] Minor UI Polish - CTA Button Enhancements" \
  --body "## 🎨 PHASE 3: LOW IMPACT, LOW EFFORT

**Priority**: FILL TIME  
**Effort**: 6 hours (1-2 hours per enhancement type)  
**Impact**: Professional polish and improved user experience  
**Risk Level**: Very Low

### Task Description
Apply visual polish and micro-interactions to CTA elements including hover effects, loading states, micro-animations, and professional styling improvements.

### Enhancement Areas

#### Button Hover Effects (1.5 hours)
- Subtle scale transformation on hover (transform: scale(1.05))
- Smooth color gradient transitions with CSS transitions
- Dynamic shadow depth changes for depth perception
- Icon animations within buttons (rotate, bounce, fade)
- Ripple effects for modern material design feel

#### Loading States and Feedback (1.5 hours)
- Spinner animations for CTA actions with branded styling
- Progress indicators for multi-step processes
- Smooth state transitions between normal, loading, and success states
- Loading text variations (\"Entering the mystery...\", \"Tuning frequency...\", \"Decoding signals...\")
- Success confirmation micro-animations

#### Micro-Animations and Transitions (2 hours)
- Fade-in animations for CTAs as they enter viewport
- Pulse effect for urgent or time-sensitive CTAs
- Bounce effect for celebratory moments and achievements
- Smooth page transition animations between content sections
- Parallax scrolling effects for immersive experience

#### Icon and Typography Enhancements (1 hour)
- Custom mystery-themed icons (radio waves, magnifying glass, ancient symbols)
- Animated play buttons for video CTAs with hover states
- Character-specific iconography matching personality
- Interactive icon states (normal, hover, active, disabled)
- Enhanced typography with better font weights and spacing

### Implementation Examples

#### Advanced CSS Enhancements
\`\`\`css
.cta-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.cta-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
}

.cta-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s;
}

.cta-button:hover::before {
  left: 100%;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
}

.cta-urgent {
  animation: pulse 2s infinite;
}
\`\`\`

#### JavaScript Micro-Interactions
\`\`\`javascript
// Smooth scroll-triggered animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const ctaObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, observerOptions);

document.querySelectorAll('.cta-button').forEach(cta => {
  ctaObserver.observe(cta);
});
\`\`\`

### Success Criteria
- [ ] All CTA buttons have polished, smooth hover states
- [ ] Loading animations implemented across all CTAs
- [ ] Micro-animations enhance user experience without being distracting
- [ ] Icons are custom, theme-appropriate, and interactive
- [ ] Typography improvements applied consistently
- [ ] Performance impact is minimal (< 5% increase in page load time)
- [ ] Cross-browser compatibility maintained (Chrome, Firefox, Safari, Edge)

### Files to Modify
- CSS files (static/css/ directory)
- JavaScript files for micro-interactions
- Icon files and font assets
- Button and CTA component templates

**Dependencies**: Access to CSS/styling files, icon creation tools or icon library"

echo ""

# Phase 3 Issue 3: Content Cross-Linking
echo "Creating Content Cross-Linking System issue..."
gh issue create \
  --title "[IMPL-PLAN] Content Cross-Linking System" \
  --body "## 🎨 PHASE 3: LOW IMPACT, LOW EFFORT

**Priority**: FILL TIME  
**Effort**: 3 hours  
**Impact**: Increased content exploration and user journey depth  
**Risk Level**: Very Low

### Task Description
Implement \"Related Content\" suggestions throughout the site to increase content exploration, user session depth, and create natural discovery paths between characters, episodes, lore, and map locations.

### Cross-Linking Opportunities

#### Character Page Connections
- \"Related Characters\" showing story connections and relationships
- \"Episodes Featuring [Character]\" with direct links and context
- \"Lore Items Connected to [Character]\" for deeper story understanding
- \"Map Locations Associated with [Character]\" for geographical context

#### Episode Cross-References
- \"Characters in This Episode\" with links to character pages
- \"Related Episodes\" based on story themes, characters, or timeline
- \"Continue the Story\" suggestions for natural episode progression
- \"Background Lore\" for episodes requiring additional context understanding

#### Lore Item Connections  
- \"Related Mysteries\" for similar lore types and themes
- \"Character Connections\" showing who discovered or is affected by the lore
- \"Episode References\" where lore items are mentioned or discovered
- \"Map Locations\" where lore items were found or are relevant

#### Map Location Links
- \"Characters Associated with This Location\" with story context
- \"Episodes Set Here\" or \"Events That Occurred Here\"
- \"Related Lore Items\" discovered at or connected to the location
- \"Nearby Mysteries\" for adjacent locations and geographical connections

### Implementation Strategy

#### Enhanced Data Structure
\`\`\`yaml
# Example enhanced character file
character:
  id: marcus_sterling
  name: Marcus Sterling
  description: \"Detective haunted by unsolved cases...\"
  # NEW CROSS-LINKING FIELDS
  related_characters: 
    - id: elena_vasquez
      relationship: \"Reluctant ally with ancient knowledge\"
    - id: dr_sarah_chen  
      relationship: \"Scientific consultant and trusted friend\"
  appears_in_episodes: [s1e01, s1e03, s1e05, s1e07]
  connected_lore: 
    - wavelength_radio
    - mystery_signals
    - ancient_symbols
  associated_locations:
    - radio_station
    - downtown_district
    - university_lab
\`\`\`

#### Smart Recommendation Algorithm
1. **Direct Connections**: Explicitly defined relationships in content files
2. **Tag-Based Matching**: Content sharing keywords, themes, or categories
3. **User Behavior Analysis**: Popular content combinations from analytics
4. **Story Progression Logic**: Natural narrative flow and chronological connections

#### Template Integration
- Add \"Related Content\" sections to all content type templates
- Create attractive card layouts for content suggestions
- Implement \"Explore More\" call-to-action sections
- Design responsive layouts for mobile and desktop

### Technical Implementation

#### Phase 1: Data Enhancement (1 hour)
- Review and enhance existing YAML files with cross-reference fields
- Establish consistent relationship naming conventions
- Create validation rules for cross-references

#### Phase 2: Recommendation Engine (1 hour)  
- Build algorithm for generating related content suggestions
- Implement caching for performance optimization
- Create fallback suggestions for content with limited connections

#### Phase 3: UI Integration (1 hour)
- Design and implement \"Related\" sections in templates
- Create responsive card components for suggestions
- Add loading states and error handling

### Success Criteria
- [ ] All major content types have related content suggestions
- [ ] Cross-linking increases pages per session by 25%
- [ ] User exploration depth improves (average 3+ content pieces per session)
- [ ] Related content click-through rate exceeds 15%
- [ ] No broken or circular reference links
- [ ] Mobile experience is smooth and engaging

### Files to Modify
- Content YAML files (content/ directory)
- Template files for characters, episodes, lore, map locations
- CSS for related content styling
- Recommendation engine logic (new JavaScript file)

**Dependencies**: Access to content management system, existing template structure"

echo ""

# Phase 3 Issue 4: SEO Optimization  
echo "Creating SEO and Social Sharing Optimization issue..."
gh issue create \
  --title "[IMPL-PLAN] SEO and Social Sharing Optimization" \
  --body "## 🎨 PHASE 3: LOW IMPACT, LOW EFFORT

**Priority**: FILL TIME  
**Effort**: 4 hours  
**Impact**: Discovery, organic growth, and social sharing improvement  
**Risk Level**: Very Low

### Task Description
Optimize page metadata, social sharing cards, and search engine visibility with engaging CTAs and improved discoverability to increase organic traffic and social media engagement.

### SEO Enhancement Areas

#### Meta Descriptions with Engaging CTAs (1 hour)
- **Homepage**: \"Enter a world where mystery meets music. Explore the Wavelength Lore universe with interactive stories, character mysteries, and community discussions. Start your investigation now.\"
- **Character Pages**: \"[Character Name] - [Tagline]. Discover their secrets, motivations, and role in the Wavelength mystery. Uncover the truth behind their story.\"
- **Episode Pages**: \"[Episode Title] - [Cliffhanger Hook]. Watch the mystery unfold and join thousands in community discussions. Your investigation continues here.\"
- **Lore Pages**: \"[Lore Item] - Ancient secrets revealed. Explore mysterious artifacts and locations in the Wavelength universe. What will you discover?\"

#### Title Tag Optimization (1 hour)
- Include emotional hooks and intrigue elements in all page titles
- Add primary character names and mystery themes for better search relevance
- Optimize for search intent and click-through from search results
- Create compelling titles that drive curiosity and engagement

#### Schema.org Structured Data Implementation (1 hour)
\`\`\`json
{
  \"@context\": \"https://schema.org\",
  \"@type\": \"TVSeries\",
  \"name\": \"Wavelength Lore\",
  \"description\": \"A mystery series where radio signals hide ancient secrets and modern conspiracies collide with ancient wisdom\",
  \"genre\": [\"Mystery\", \"Supernatural\", \"Drama\", \"Thriller\"],
  \"character\": [
    {
      \"@type\": \"Person\",
      \"name\": \"Marcus Sterling\",
      \"description\": \"Detective haunted by unsolved cases, racing against time\",
      \"jobTitle\": \"Detective\"
    },
    {
      \"@type\": \"Person\", 
      \"name\": \"Elena Vasquez\",
      \"description\": \"Keeper of ancient wisdom in a modern world\",
      \"jobTitle\": \"Mystic\"
    }
  ],
  \"creator\": {
    \"@type\": \"Organization\",
    \"name\": \"Wavelength Lore\"
  }
}
\`\`\`

### Social Media Optimization (1 hour)

#### Open Graph Tags for Facebook/LinkedIn
\`\`\`html
<meta property=\"og:title\" content=\"Marcus Sterling - The Detective Who Questions Everything | Wavelength Lore\">
<meta property=\"og:description\" content=\"Haunted by unsolved cases, racing against time to prevent the next tragedy. Follow Marcus into the Wavelength mystery and uncover the truth.\">
<meta property=\"og:image\" content=\"https://wavelengthlore.com/images/marcus-social-card.png\">
<meta property=\"og:type\" content=\"video.tv_show\">
<meta property=\"og:url\" content=\"https://wavelengthlore.com/characters/marcus-sterling\">
<meta property=\"og:site_name\" content=\"Wavelength Lore\">
\`\`\`

#### Twitter Cards for Enhanced Sharing
\`\`\`html
<meta name=\"twitter:card\" content=\"summary_large_image\">
<meta name=\"twitter:title\" content=\"Enter the Wavelength Mystery\">
<meta name=\"twitter:description\" content=\"Where radio signals hide ancient secrets and every clue leads deeper into conspiracy. Start your investigation now.\">
<meta name=\"twitter:image\" content=\"https://wavelengthlore.com/images/twitter-mystery-card.png\">
<meta name=\"twitter:site\" content=\"@WavelengthLore\">
\`\`\`

#### Social Sharing Enhancement Features
- Character-specific sharing prompts (\"Share your theory about Marcus\")
- Episode discussion sharing with automatic spoiler warnings
- Mystery-themed social cards with engaging visuals
- \"Share your theory\" CTAs with pre-filled social media text

### Content Optimization for Search

#### Image Alt Text Enhancement
- Descriptive, mystery-themed alt text for all images
- Include character names and story context in descriptions
- Optimize for screen readers while improving SEO
- Add emotional descriptors and intrigue elements

#### Internal Linking Strategy
- Strategic links between related mysteries and characters
- Create topic clusters around main characters and story arcs
- Build authority for key story pages through internal link structure
- Optimize anchor text with engaging, mystery-focused descriptions

### Implementation Checklist

#### Technical SEO (2 hours)
- [ ] Update all page meta descriptions with CTAs
- [ ] Optimize title tags for engagement and search
- [ ] Implement structured data markup site-wide
- [ ] Create XML sitemap with proper priority settings

#### Social Optimization (1 hour)
- [ ] Design and implement social sharing cards
- [ ] Add Open Graph and Twitter Card tags to all pages
- [ ] Create social sharing buttons with mystery-themed prompts
- [ ] Test social sharing across all major platforms

#### Content Enhancement (1 hour)
- [ ] Update all image alt text with descriptive, engaging descriptions
- [ ] Implement strategic internal linking throughout content
- [ ] Create topic cluster structure for better search authority
- [ ] Optimize existing content for target keywords

### Success Criteria
- [ ] All pages have optimized, engaging meta descriptions
- [ ] Social sharing cards display correctly across all platforms
- [ ] Structured data validates without errors in Google Search Console
- [ ] 25% increase in social sharing activity within 60 days
- [ ] Improved search engine visibility and click-through rates
- [ ] Internal linking drives 20% more cross-content navigation

### Files to Modify
- HTML template files (head sections)
- Meta tag configuration files
- Social sharing card images (design/create new ones)
- Content files for internal linking optimization
- Sitemap generation configuration

**Dependencies**: Access to page templates and metadata configuration, social media accounts for testing, image creation tools for social cards"

echo ""
echo "✅ All Phase 3 issues created successfully!"
echo ""
echo "🎨 PHASE 3 SUMMARY:"
echo "• Additional CTA Variations (10 hrs) - Seasonal & contextual alternatives"
echo "• Minor UI Polish (6 hrs) - Button enhancements and micro-animations"
echo "• Content Cross-Linking (3 hrs) - Related suggestions system"
echo "• SEO Optimization (4 hrs) - Social sharing and search improvements"
echo ""
echo "Total Phase 3 effort: 23 hours"
echo "Perfect for fill time and polishing work!"
echo ""
echo "🎉 COMPLETE IMPLEMENTATION PLAN CREATED!"
echo "📊 TOTAL PROJECT: 12 Issues, ~139 hours, 6-week timeline"
echo "🔗 View all issues: gh issue list"