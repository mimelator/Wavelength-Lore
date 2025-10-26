#!/usr/bin/env node

/**
 * Character Forum Management MCP Server
 * AI-powered character registration and forum interaction
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

class CharacterForumMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "character-forum-tools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "register_lore_character",
          description: "Register a new Lore character as a forum user with full profile",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Character name" },
              role: { type: "string", enum: ["mage", "warrior", "rogue", "scholar", "healer", "bard", "ranger", "merchant", "noble", "commoner"], description: "Character role/class" },
              bio: { type: "string", description: "Character biography and personality" },
              location: { type: "string", description: "Character's home location in the Wavelength universe" },
              traits: { type: "array", items: { type: "string" }, description: "Character personality traits" },
              avatar: { type: "string", description: "Avatar icon path (optional)" }
            },
            required: ["name", "role", "bio"]
          }
        },
        {
          name: "create_character_post",
          description: "Create a forum post as a registered character",
          inputSchema: {
            type: "object",
            properties: {
              characterName: { type: "string", description: "Name of the character making the post" },
              title: { type: "string", description: "Post title" },
              content: { type: "string", description: "Post content in character voice" },
              category: { type: "string", enum: ["general", "lore", "episodes", "fanart"], description: "Forum category" },
              tags: { type: "array", items: { type: "string" }, description: "Post tags" },
              type: { type: "string", enum: ["roleplay", "theory", "discussion", "story", "announcement"], description: "Post type" },
              isPinned: { type: "boolean", description: "Whether to pin the post" }
            },
            required: ["characterName", "title", "content"]
          }
        },
        {
          name: "character_conversation",
          description: "Create a conversation between multiple characters",
          inputSchema: {
            type: "object",
            properties: {
              topic: { type: "string", description: "Conversation topic" },
              characters: { type: "array", items: { type: "string" }, description: "Character names participating" },
              category: { type: "string", enum: ["general", "lore", "episodes", "fanart"], description: "Forum category" },
              conversationStyle: { type: "string", enum: ["debate", "friendly", "mysterious", "urgent", "scholarly"], description: "Tone of conversation" }
            },
            required: ["topic", "characters"]
          }
        },
        {
          name: "list_forum_characters",
          description: "List all registered Lore characters in the forum",
          inputSchema: {
            type: "object",
            properties: {
              filter: { type: "string", enum: ["all", "active", "by_role"], description: "Filter criteria" },
              role: { type: "string", description: "Specific role to filter by (if filter=by_role)" }
            }
          }
        },
        {
          name: "character_activity_report",
          description: "Generate activity report for character forum participation",
          inputSchema: {
            type: "object",
            properties: {
              timeframe: { type: "string", enum: ["day", "week", "month"], description: "Time period to analyze" },
              characterName: { type: "string", description: "Specific character (optional)" }
            },
            required: ["timeframe"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "register_lore_character":
            return await this.registerLoreCharacter(args);
          case "create_character_post":
            return await this.createCharacterPost(args);
          case "character_conversation":
            return await this.createCharacterConversation(args);
          case "list_forum_characters":
            return await this.listForumCharacters(args.filter, args.role);
          case "character_activity_report":
            return await this.generateActivityReport(args.timeframe, args.characterName);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }]
        };
      }
    });
  }

  async registerLoreCharacter(args) {
    const ForumUserManager = require('../scripts/forum-user-cleanup');
    const manager = new ForumUserManager();
    await manager.initialize();

    const characterData = {
      name: args.name,
      type: 'lore',
      role: args.role,
      bio: args.bio,
      location: args.location || 'The Wavelength Realm',
      traits: args.traits || ['mysterious', 'wise'],
      avatar: args.avatar || `/icons/${args.role}-icon.svg`
    };

    const result = await manager.registerCharacterUser(characterData);
    
    return {
      content: [{
        type: "text",
        text: `🎭 Successfully registered Lore character: ${args.name}
        
Character Details:
• Role: ${args.role}
• Location: ${characterData.location}
• Traits: ${characterData.traits.join(', ')}
• Character ID: ${result.characterId}

The character is now ready to participate in forum discussions!`
      }]
    };
  }

  async createCharacterPost(args) {
    const ForumUserManager = require('../scripts/forum-user-cleanup');
    const manager = new ForumUserManager();
    await manager.initialize();

    const characterId = `char_${args.characterName.toLowerCase().replace(/\s+/g, '_')}`;
    
    const postData = {
      title: args.title,
      content: args.content,
      category: args.category || 'general',
      tags: args.tags || [],
      type: args.type || 'roleplay',
      isPinned: args.isPinned || false
    };

    const result = await manager.createCharacterPost(characterId, postData);
    
    return {
      content: [{
        type: "text",
        text: `📝 Character post created successfully!

Post: "${args.title}"
By: ${args.characterName}
Category: ${postData.category}
Type: ${postData.type}
Post ID: ${result.postId}

The character's voice is now part of the forum community!`
      }]
    };
  }

  async createCharacterConversation(args) {
    const ForumUserManager = require('../scripts/forum-user-cleanup');
    const manager = new ForumUserManager();
    await manager.initialize();

    // Create initial post by first character
    const firstCharacter = args.characters[0];
    const characterId = `char_${firstCharacter.toLowerCase().replace(/\s+/g, '_')}`;
    
    const conversationStarters = {
      debate: `I've been pondering ${args.topic} and I believe we need to examine this from multiple perspectives. What are your thoughts, fellow travelers?`,
      friendly: `Greetings, friends! I wanted to discuss ${args.topic} with you all. It's always wonderful to share ideas with such wise companions.`,
      mysterious: `Something strange has come to my attention regarding ${args.topic}. I sense there are deeper mysteries at work here...`,
      urgent: `Urgent news about ${args.topic}! We must discuss this immediately - the implications could affect us all.`,
      scholarly: `I have been researching ${args.topic} extensively and would like to present my findings for scholarly discussion.`
    };

    const postData = {
      title: `${args.topic} - A Discussion Among Friends`,
      content: conversationStarters[args.conversationStyle] || conversationStarters.friendly,
      category: args.category || 'general',
      tags: ['character-discussion', 'community', args.topic.toLowerCase().replace(/\s+/g, '-')],
      type: 'discussion'
    };

    const result = await manager.createCharacterPost(characterId, postData);
    
    return {
      content: [{
        type: "text",
        text: `💬 Character conversation started!

Topic: ${args.topic}
Started by: ${firstCharacter}
Style: ${args.conversationStyle}
Participants: ${args.characters.join(', ')}
Post ID: ${result.postId}

Other characters can now reply to continue the conversation!`
      }]
    };
  }

  async listForumCharacters(filter = 'all', role = null) {
    const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
    const db = getAdminDatabase();
    
    if (!db) throw new Error('Firebase not initialized');

    const snapshot = await db.ref('forum/users').once('value');
    const users = snapshot.val() || {};
    
    const characters = Object.entries(users)
      .filter(([uid, user]) => user.isCharacter)
      .map(([uid, user]) => ({
        id: uid,
        name: user.displayName,
        role: user.characterRole,
        type: user.characterType,
        location: user.characterLocation,
        traits: user.characterTraits,
        postCount: user.postCount || 0,
        lastActive: user.lastActive
      }));

    let filteredCharacters = characters;
    
    if (filter === 'by_role' && role) {
      filteredCharacters = characters.filter(char => char.role === role);
    } else if (filter === 'active') {
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      filteredCharacters = characters.filter(char => char.lastActive > oneDayAgo);
    }

    return {
      content: [{
        type: "text",
        text: `🎭 Forum Characters (${filteredCharacters.length} found):

${filteredCharacters.map(char => 
  `• ${char.name} (${char.role})
    Location: ${char.location}
    Posts: ${char.postCount}
    Traits: ${char.traits?.join(', ') || 'None listed'}`
).join('\n\n')}

Total registered characters: ${characters.length}`
      }]
    };
  }

  async generateActivityReport(timeframe, characterName = null) {
    const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
    const db = getAdminDatabase();
    
    if (!db) throw new Error('Firebase not initialized');

    const timeframes = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const timeLimit = Date.now() - timeframes[timeframe];
    
    const postsSnapshot = await db.ref('forum/posts').once('value');
    const posts = postsSnapshot.val() || {};
    
    const characterPosts = Object.values(posts)
      .filter(post => post.isCharacterPost && post.createdAt > timeLimit)
      .filter(post => !characterName || post.authorName === characterName);

    const activityByCharacter = {};
    characterPosts.forEach(post => {
      if (!activityByCharacter[post.authorName]) {
        activityByCharacter[post.authorName] = { posts: 0, categories: new Set() };
      }
      activityByCharacter[post.authorName].posts++;
      activityByCharacter[post.authorName].categories.add(post.forumId);
    });

    const report = Object.entries(activityByCharacter)
      .map(([name, data]) => ({
        character: name,
        posts: data.posts,
        categories: Array.from(data.categories)
      }))
      .sort((a, b) => b.posts - a.posts);

    return {
      content: [{
        type: "text",
        text: `📊 Character Activity Report (${timeframe}):

${report.length > 0 ? 
  report.map(char => 
    `• ${char.character}: ${char.posts} posts
      Categories: ${char.categories.join(', ')}`
  ).join('\n\n') :
  'No character activity in this timeframe.'
}

Total character posts: ${characterPosts.length}
Active characters: ${report.length}`
      }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Character Forum MCP Server running on stdio");
  }
}

const server = new CharacterForumMCPServer();
server.run().catch(console.error);