# Chatbot CLI Integration - Options Evaluation

**Goal:** Integrate the Wavelength lore chatbot into the main CLI (`wavelength-content-cli.js`) to:
1. Generate CTA text (taglines, hooks, cliffhangers, etc.)
2. Help update names, descriptions, and other content fields
3. Provide an interactive, conversational editing experience

**Chatbot Service:** Firebase Functions at `us-central1-wavelength-lore.cloudfunctions.net`  
**Existing Integration:** `wavelength-chat-cli.js` (standalone), `cta-validator.js` (CTA validation)

---

## Option 1: Embedded Chatbot Service Class ⭐ **RECOMMENDED**

### Approach
Create a reusable `ChatbotService` class that wraps the chatbot API, then integrate it into:
- The main CLI as a helper service
- Episode edit workflow
- CTA generation workflow
- Content enhancement workflows

### Implementation Structure
```
services/
└── chatbot-service.js          # Reusable chatbot wrapper
    ├── ask(prompt, context)    # Main query method
    ├── generateCTA(type, item) # CTA-specific helper
    ├── enhanceField(item, field) # Field enhancement helper
    └── interactiveEdit(item)   # Interactive editing mode

wavelength-content-cli.js
├── Integrated chatbot service instance
├── New menu option: "🤖 AI Chatbot Assistant"
└── Context-aware prompts for current item

commands/
└── chatbot-commands.js (optional)
    ├── chat                    # Interactive chat mode
    ├── generate-cta           # Generate CTA for item
    └── enhance-content        # Enhance item fields
```

### Pros
- ✅ Clean separation of concerns
- ✅ Reusable across multiple workflows
- ✅ Easy to test independently
- ✅ Can maintain conversation context per session
- ✅ Fits naturally into existing CLI architecture
- ✅ Can be used both interactively and programmatically

### Cons
- ⚠️ Requires refactoring chatbot logic from `wavelength-chat-cli.js`
- ⚠️ Need to handle readline conflicts (chatbot interactive mode vs. CLI interactive mode)

### Integration Points

#### A. Main CLI Menu Integration
```javascript
// In wavelength-content-cli.js interactiveEdit()
console.log('Special actions:');
console.log('  9. 🎨 Generate AI Image');
console.log('  10. 🎬 Generate AI Video');
console.log('  11. 🤖 AI Chatbot Assistant'); // NEW
console.log('  12. 💾 Save & Exit');
```

#### B. CTA Generation Workflow
```javascript
// In episode edit workflow
async generateCTAWithChatbot(episode) {
    const chatbot = new ChatbotService();
    
    // Generate tagline
    const taglinePrompt = `Generate a compelling tagline (5-8 words) for episode "${episode.title}" (Season ${episode.season}, Episode ${episode.episodeNumber}). Make it mysterious and engaging. Return only the tagline.`;
    const tagline = await chatbot.ask(taglinePrompt);
    
    // Show preview, allow editing
    const edited = await this.promptEdit('Tagline', tagline);
    
    // Apply to episode
    return edited;
}
```

#### C. Content Enhancement Workflow
```javascript
// Interactive enhancement mode
async enhanceContentWithChatbot(item) {
    const chatbot = new ChatbotService();
    
    // Show current content
    console.log(`Current description: ${item.description}`);
    
    // Ask chatbot to enhance
    const prompt = `Improve this description for "${item.title}":\n\n${item.description}\n\nMake it more engaging while staying true to Wavelength lore. Return only the improved description.`;
    const enhanced = await chatbot.ask(prompt);
    
    // Show side-by-side comparison
    await this.showDiff(item.description, enhanced);
    
    // Allow editing, then apply
    const final = await this.promptEdit('Description', enhanced);
    return final;
}
```

### Implementation Complexity: **Medium** (2-3 days)

---

## Option 2: Direct Integration into Episode Workflow

### Approach
Add chatbot-assisted steps directly into the episode creation/editing workflow without creating a separate service layer.

### Implementation Structure
```
wavelength-content-cli.js
└── Direct chatbot calls in edit workflows
    ├── generateCTAText()
    ├── enhanceDescription()
    └── suggestName()

cli/steps/
└── cta-generation.js (existing, enhanced)
    └── Use chatbot for CTA generation
```

### Pros
- ✅ Faster to implement
- ✅ No abstraction overhead
- ✅ Direct workflow integration

### Cons
- ❌ Code duplication if used in multiple places
- ❌ Harder to test chatbot integration separately
- ❌ Less flexible for future use cases

### Implementation Complexity: **Low** (1 day)

---

## Option 3: Standalone Chatbot Commands

### Approach
Create separate chatbot commands (`chatbot-commands.js`) that can be called independently, then link them from the main CLI menu.

### Implementation Structure
```
commands/
└── chatbot-commands.js
    ├── chat [item-id]          # Chat about specific item
    ├── generate-cta <item-id>  # Generate CTA for item
    ├── enhance <item-id>       # Enhance item content
    └── suggest <field>         # Suggest improvements

wavelength-content-cli.js
└── Link from menu: "🤖 Chatbot → Generate CTA"
```

### Pros
- ✅ Clear command structure
- ✅ Can be used independently or from menu
- ✅ Easy to document as separate feature

### Cons
- ❌ Less integrated experience
- ❌ User has to exit main menu to use chatbot features
- ❌ Context switching overhead

### Implementation Complexity: **Low-Medium** (1-2 days)

---

## Option 4: Hybrid Approach ⭐⭐ **BEST FOR UX**

### Approach
Combine Option 1 (Service Class) + Option 3 (Standalone Commands) + Inline Integration

### Implementation Structure
```
services/
└── chatbot-service.js          # Core chatbot wrapper (Option 1)

commands/
└── chatbot-commands.js         # Standalone commands (Option 3)
    ├── chat
    ├── generate-cta
    └── enhance

wavelength-content-cli.js
├── Integrated chatbot service instance (Option 1)
├── Inline chatbot assistance in edit workflows
└── Menu option linking to chatbot commands
```

### Features

#### A. Context-Aware Inline Assistance
```javascript
// In interactiveEdit(), when user selects a field
async editField(fieldName) {
    const currentValue = this.currentItem[fieldName];
    
    console.log(`Current ${fieldName}: ${currentValue}`);
    console.log('\nOptions:');
    console.log('  1. Edit manually');
    console.log('  2. 🤖 Get AI suggestion');  // NEW
    console.log('  3. Cancel');
    
    const choice = await this.promptUser('Choose option: ');
    
    if (choice === '2') {
        const suggestion = await this.chatbot.enhanceField(
            this.currentItem, 
            fieldName
        );
        // Show suggestion, allow editing, then apply
        return await this.applySuggestion(suggestion);
    }
    // ... existing manual edit flow
}
```

#### B. Dedicated Chatbot Mode
```javascript
// New interactive chatbot mode
async startChatbotAssistant(item = null) {
    const chatbot = new ChatbotService();
    
    console.log('🤖 Wavelength Chatbot Assistant');
    console.log(`📝 Context: ${item ? `${item.title}` : 'General Wavelength Lore'}`);
    console.log('\nCommands:');
    console.log('  /cta <type>     - Generate CTA (tagline, hook, etc.)');
    console.log('  /enhance <field> - Enhance a specific field');
    console.log('  /suggest        - Get suggestions for improvement');
    console.log('  /apply <field>  - Apply last suggestion to field');
    console.log('  /context        - Show current item context');
    console.log('  /exit           - Return to main menu');
    
    // Interactive chat loop with context awareness
    // User can chat naturally, then use /apply to save results
}
```

#### C. CTA Generation Workflow
```javascript
// In episode edit workflow
async generateCTAsForEpisode(episode) {
    const chatbot = new ChatbotService();
    
    console.log('🎯 Generating CTAs for episode...');
    
    // Generate multiple CTAs in conversation
    const context = {
        episode: episode.title,
        season: episode.season,
        episodeNumber: episode.episodeNumber,
        description: episode.description
    };
    
    chatbot.setContext(context);
    
    // Tagline
    const tagline = await chatbot.ask(
        'Generate a compelling 5-8 word tagline for this episode. Return only the tagline.'
    );
    
    // Cliffhanger hook
    const cliffhanger = await chatbot.ask(
        'Write a dramatic cliffhanger hook (1-2 sentences) that leaves viewers wanting more. Return only the hook.'
    );
    
    // Next episode tease
    const tease = await chatbot.ask(
        'Create a mysterious tease for the next episode (1-2 sentences). Return only the tease.'
    );
    
    // Show all, allow editing, then apply to episode
    return await this.reviewAndApplyCTAs({
        tagline,
        cliffhanger,
        tease
    });
}
```

### Pros
- ✅ **Best user experience** - seamless integration
- ✅ Flexible - can be used inline or standalone
- ✅ Context-aware - chatbot knows what you're editing
- ✅ Reusable - service class used everywhere
- ✅ Progressive - start simple, add features incrementally

### Cons
- ⚠️ Most complex to implement
- ⚠️ Need careful readline management for nested interactive modes

### Implementation Complexity: **Medium-High** (3-4 days)

---

## Recommendation: **Option 4 (Hybrid Approach)**

### Phase 1: Core Service (Day 1)
1. Create `services/chatbot-service.js` wrapper
2. Port chatbot logic from `wavelength-chat-cli.js`
3. Add context management for current item
4. Test with standalone script

### Phase 2: CTA Integration (Day 2)
1. Add "Generate CTA" option to episode edit menu
2. Implement `generateCTAsForEpisode()` workflow
3. Add preview/edit/apply flow
4. Integrate with episode save workflow

### Phase 3: Content Enhancement (Day 3)
1. Add "🤖 AI Chatbot Assistant" menu option
2. Implement inline field enhancement
3. Add `/apply` workflow to save suggestions
4. Test with various content types

### Phase 4: Standalone Commands (Day 4, Optional)
1. Create `commands/chatbot-commands.js`
2. Add CLI commands: `chatbot generate-cta <id>`, etc.
3. Document in help system

---

## Technical Considerations

### 1. Readline Management
**Problem:** Chatbot interactive mode uses `readline`, which conflicts with main CLI's `readline`.

**Solution:**
```javascript
// Pause main CLI readline when entering chatbot mode
async startChatbotAssistant() {
    if (this.rl) {
        this.rl.pause();
        // Remove line listeners temporarily
    }
    
    // Create separate chatbot readline
    const chatbotRl = readline.createInterface(...);
    
    try {
        // Chatbot interaction
    } finally {
        // Cleanup chatbot readline
        chatbotRl.close();
        
        // Resume main CLI
        if (this.rl) {
            this.rl.resume();
            this.rl.prompt();
        }
    }
}
```

### 2. Context Management
**Problem:** Chatbot needs to know what item you're editing.

**Solution:**
```javascript
class ChatbotService {
    constructor() {
        this.context = null;  // Current item being edited
        this.conversationHistory = [];
    }
    
    setContext(item) {
        this.context = item;
        // Add context to conversation history
        this.conversationHistory.push({
            role: 'system',
            content: `You are helping edit: ${item.title} (${item.id}). Context: ${JSON.stringify(item)}`
        });
    }
    
    async ask(prompt, options = {}) {
        // Build full prompt with context
        const fullPrompt = this.context 
            ? `${prompt}\n\nContext: Editing ${this.context.title}`
            : prompt;
        
        // Send with conversation history
        return await this.sendToChatbot(fullPrompt);
    }
}
```

### 3. Response Editing Workflow
**Problem:** Users want to edit chatbot suggestions before applying.

**Solution:**
```javascript
async applyChatbotSuggestion(suggestion, fieldName) {
    // Show suggestion
    console.log(chalk.cyan(`\n🤖 Chatbot Suggestion for ${fieldName}:`));
    console.log(chalk.white(suggestion));
    console.log();
    
    // Offer options
    console.log('Options:');
    console.log('  1. Use as-is');
    console.log('  2. Edit before applying');
    console.log('  3. Discard');
    
    const choice = await this.promptUser('Choose (1-3): ');
    
    if (choice === '1') {
        return suggestion;
    } else if (choice === '2') {
        // Open editor with suggestion pre-filled
        return await this.editMultiline(suggestion);
    } else {
        return null; // Discard
    }
}
```

### 4. Rate Limiting
**Problem:** Chatbot API has rate limits.

**Solution:**
```javascript
class ChatbotService {
    constructor() {
        this.requestQueue = [];
        this.processing = false;
        this.rateLimitDelay = 1000; // 1 second between requests
    }
    
    async ask(prompt) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ prompt, resolve, reject });
            this.processQueue();
        });
    }
    
    async processQueue() {
        if (this.processing || this.requestQueue.length === 0) return;
        
        this.processing = true;
        
        while (this.requestQueue.length > 0) {
            const { prompt, resolve, reject } = this.requestQueue.shift();
            
            try {
                const result = await this.sendToChatbot(prompt);
                resolve(result);
            } catch (error) {
                reject(error);
            }
            
            // Rate limiting delay
            if (this.requestQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
            }
        }
        
        this.processing = false;
    }
}
```

---

## Example User Workflow

### Scenario: Generating CTA for Episode

```
wavelength> episodes edit s5e1 --interactive

📝 Editing Episode: s5e1 - Mystic Druids

[Menu options...]
Enter your choice: 11  # 🤖 AI Chatbot Assistant

🤖 Wavelength Chatbot Assistant
─────────────────────────────────
📝 Context: s5e1 - Mystic Druids

Available actions:
  1. 🎯 Generate CTAs (tagline, cliffhanger, tease)
  2. ✏️  Enhance Description
  3. 💬 Chat about this episode
  4. 🔄 Suggest improvements
  0. Back

Enter choice: 1

🎯 Generating CTAs...
🤔 Asking chatbot...

✅ Generated Tagline:
   "When ancient magic awakens, which side will you choose?"

Options:
  1. Use as-is
  2. Edit before applying
  3. Generate another
  4. Skip

Enter choice: 2

📝 Edit tagline (press Enter twice to finish):
When ancient magic awakens, which side will you choose?
> [User edits]
When ancient magic awakens, will you stand with the druids?
> 

✅ Tagline updated!
🤔 Generating cliffhanger hook...

✅ Generated Cliffhanger:
   "As the veil between worlds tears, the druids' true purpose is revealed—but at what cost?"

Options:
  1. Use as-is
  2. Edit before applying
  3. Generate another
  4. Skip

Enter choice: 1

✅ All CTAs generated! Apply to episode? (y/n): y
✅ CTAs saved to episode s5e1
```

---

## Files to Create/Modify

### New Files
```
services/chatbot-service.js          # Core chatbot wrapper
commands/chatbot-commands.js         # Standalone chatbot commands (optional)
docs/CHATBOT_CLI_GUIDE.md           # User documentation
```

### Modified Files
```
wavelength-content-cli.js            # Add chatbot integration
commands/episodes-commands.js        # Add CTA generation workflow
cli/steps/cta-generation.js          # Enhance with chatbot (if exists)
```

---

## Success Metrics

- ✅ Can generate CTA text for episodes from CLI
- ✅ Can enhance content fields (descriptions, names) interactively
- ✅ Responses can be edited before applying
- ✅ Context-aware (chatbot knows what you're editing)
- ✅ No readline conflicts or input duplication
- ✅ Rate limiting handled gracefully
- ✅ Clear UX with preview/edit/apply workflow

---

## Next Steps

1. **Review this evaluation** - Confirm approach matches your vision
2. **Implement Phase 1** - Create `ChatbotService` class
3. **Test integration** - Verify chatbot API access and response handling
4. **Implement Phase 2** - Add CTA generation workflow
5. **Iterate based on feedback** - Adjust UX and features as needed

---

**Ready to proceed?** I can start implementing Option 4 (Hybrid Approach) beginning with Phase 1.

