#!/usr/bin/env node

/**
 * Forum Automation MCP Server
 * AI-controlled forum management and conversation automation
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

class ForumAutomationMCP {
  constructor() {
    this.server = new Server(
      {
        name: "wavelength-forum-automation",
        version: "1.0.0",
      },
      {
        capabilities: { tools: {} },
      }
    );

    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "forum_create_post",
          description: "Create a new forum post in specified category",
          inputSchema: {
            type: "object",
            properties: {
              category: { type: "string", enum: ["general", "lore", "episodes", "fanart"], description: "Forum category" },
              title: { type: "string", description: "Post title" },
              content: { type: "string", description: "Post content" },
              author: { type: "string", description: "Author name", default: "AI Assistant" },
              tags: { type: "array", items: { type: "string" }, description: "Post tags" }
            },
            required: ["category", "title", "content"]
          }
        },
        {
          name: "forum_reply_to_post",
          description: "Reply to an existing forum post",
          inputSchema: {
            type: "object",
            properties: {
              postId: { type: "string", description: "ID of post to reply to" },
              content: { type: "string", description: "Reply content" },
              author: { type: "string", description: "Reply author", default: "AI Assistant" }
            },
            required: ["postId", "content"]
          }
        },
        {
          name: "forum_get_posts",
          description: "Get forum posts from specified category",
          inputSchema: {
            type: "object",
            properties: {
              category: { type: "string", enum: ["general", "lore", "episodes", "fanart", "all"], description: "Category to fetch" },
              limit: { type: "number", description: "Number of posts to fetch", default: 10 }
            }
          }
        },
        {
          name: "forum_moderate_content",
          description: "Moderate forum content (pin, lock, delete posts)",
          inputSchema: {
            type: "object",
            properties: {
              postId: { type: "string", description: "Post ID to moderate" },
              action: { type: "string", enum: ["pin", "unpin", "lock", "unlock", "delete"], description: "Moderation action" },
              reason: { type: "string", description: "Reason for moderation" }
            },
            required: ["postId", "action"]
          }
        },
        {
          name: "forum_start_conversation",
          description: "Start an AI-driven conversation thread about Wavelength topics",
          inputSchema: {
            type: "object",
            properties: {
              topic: { type: "string", description: "Conversation topic (character, episode, lore)" },
              style: { type: "string", enum: ["discussion", "theory", "analysis", "creative"], description: "Conversation style" }
            },
            required: ["topic"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "forum_create_post":
            return await this.createPost(args.category, args.title, args.content, args.author, args.tags);
          case "forum_reply_to_post":
            return await this.replyToPost(args.postId, args.content, args.author);
          case "forum_get_posts":
            return await this.getPosts(args.category, args.limit);
          case "forum_moderate_content":
            return await this.moderateContent(args.postId, args.action, args.reason);
          case "forum_start_conversation":
            return await this.startConversation(args.topic, args.style);
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

  async createPost(category, title, content, author = "AI Assistant", tags = []) {
    try {
      const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
      const db = getAdminDatabase();
      
      if (!db) {
        throw new Error('Firebase admin not initialized');
      }

      const postId = `ai_post_${Date.now()}`;
      const postData = {
        id: postId,
        title: title,
        content: content,
        authorId: 'ai-system',
        authorName: author,
        authorAvatar: '/icons/hero-icon.svg',
        forumId: category,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        likes: 0,
        replyCount: 0,
        views: 0,
        status: 'published',
        type: 'discussion',
        tags: tags || [],
        isLocked: false,
        isPinned: false
      };

      await db.ref(`forum/posts/${postId}`).set(postData);

      return {
        content: [{
          type: "text",
          text: `✅ Forum post created successfully!\n\n` +
                `📝 Title: "${title}"\n` +
                `📂 Category: ${category}\n` +
                `👤 Author: ${author}\n` +
                `🆔 Post ID: ${postId}\n` +
                `🏷️ Tags: ${tags.join(', ') || 'None'}\n\n` +
                `🔗 View at: /forum/post/${postId}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  async replyToPost(postId, content, author = "AI Assistant") {
    try {
      const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
      const db = getAdminDatabase();
      
      if (!db) {
        throw new Error('Firebase admin not initialized');
      }

      const replyId = `ai_reply_${Date.now()}`;
      const replyData = {
        id: replyId,
        postId: postId,
        content: content,
        authorId: 'ai-system',
        authorName: author,
        authorAvatar: '/icons/hero-icon.svg',
        createdAt: Date.now(),
        likes: 0
      };

      // Add reply
      await db.ref(`forum/replies/${replyId}`).set(replyData);
      
      // Update post reply count
      const postRef = db.ref(`forum/posts/${postId}`);
      const postSnapshot = await postRef.once('value');
      if (postSnapshot.exists()) {
        const currentCount = postSnapshot.val().replyCount || 0;
        await postRef.update({
          replyCount: currentCount + 1,
          lastActivity: Date.now()
        });
      }

      return {
        content: [{
          type: "text",
          text: `✅ Reply posted successfully!\n\n` +
                `💬 Reply to: ${postId}\n` +
                `👤 Author: ${author}\n` +
                `🆔 Reply ID: ${replyId}\n\n` +
                `📝 Content: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to create reply: ${error.message}`);
    }
  }

  async getPosts(category = "all", limit = 10) {
    try {
      const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
      const db = getAdminDatabase();
      
      if (!db) {
        throw new Error('Firebase admin not initialized');
      }

      const postsRef = db.ref('forum/posts');
      const snapshot = await postsRef.once('value');
      const allPosts = snapshot.val() || {};
      
      let posts = Object.values(allPosts);
      
      if (category !== "all") {
        posts = posts.filter(post => post.forumId === category);
      }
      
      posts = posts
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);

      return {
        content: [{
          type: "text",
          text: `📋 Forum Posts (${category}):\n\n` +
                posts.map(post => 
                  `📝 "${post.title}" by ${post.authorName}\n` +
                  `   💬 ${post.replyCount || 0} replies | 👀 ${post.views || 0} views\n` +
                  `   🆔 ${post.id}\n`
                ).join('\n') +
                `\n📊 Total: ${posts.length} posts found`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get posts: ${error.message}`);
    }
  }

  async moderateContent(postId, action, reason = "") {
    try {
      const { getAdminDatabase } = require('../helpers/firebase-admin-utils');
      const db = getAdminDatabase();
      
      if (!db) {
        throw new Error('Firebase admin not initialized');
      }

      const postRef = db.ref(`forum/posts/${postId}`);
      const snapshot = await postRef.once('value');
      
      if (!snapshot.exists()) {
        throw new Error(`Post ${postId} not found`);
      }

      let updateData = {};
      let actionDescription = "";

      switch (action) {
        case 'pin':
          updateData.isPinned = true;
          actionDescription = "Post pinned to top of category";
          break;
        case 'unpin':
          updateData.isPinned = false;
          actionDescription = "Post unpinned";
          break;
        case 'lock':
          updateData.isLocked = true;
          actionDescription = "Post locked - no new replies allowed";
          break;
        case 'unlock':
          updateData.isLocked = false;
          actionDescription = "Post unlocked - replies enabled";
          break;
        case 'delete':
          await postRef.remove();
          actionDescription = "Post deleted";
          break;
      }

      if (action !== 'delete') {
        await postRef.update(updateData);
      }

      return {
        content: [{
          type: "text",
          text: `🛡️ Moderation Action Complete!\n\n` +
                `📝 Post: ${postId}\n` +
                `⚡ Action: ${action.toUpperCase()}\n` +
                `📋 Result: ${actionDescription}\n` +
                (reason ? `💭 Reason: ${reason}\n` : '') +
                `⏰ Timestamp: ${new Date().toISOString()}`
        }]
      };
    } catch (error) {
      throw new Error(`Moderation failed: ${error.message}`);
    }
  }

  async startConversation(topic, style = "discussion") {
    const conversationStarters = {
      discussion: {
        lucky: "What's your favorite Lucky moment? I love how he always seems to know exactly what to say to help other characters grow. His wisdom really shines through in the quieter scenes.",
        alexandria: "Alexandria's musical journey is so inspiring! The way her violin playing evolves throughout the series really shows her character development. What piece do you think represents her best?",
        goblin: "The goblin society in Wavelength is fascinating! The hierarchy and customs they've developed create such rich storytelling opportunities. What aspects intrigue you most?"
      },
      theory: {
        lucky: "Theory: Lucky's apparent immortality might be connected to his role as a guardian of the Wavelength itself. His deep understanding of time and fate suggests he's more than just a wise leprechaun.",
        alexandria: "Theory: Alexandria's music has actual magical properties that haven't been fully explored yet. Notice how significant events often coincide with her performances?",
        goblin: "Theory: The goblin king's motivations are more complex than they appear. His actions might be protecting something we haven't discovered yet."
      }
    };

    const starters = conversationStarters[style] || conversationStarters.discussion;
    const content = starters[topic.toLowerCase()] || `Let's discuss ${topic} in the Wavelength universe! What are your thoughts and theories?`;

    // Create the conversation starter post
    const title = `${style === 'theory' ? '🧠 Theory Discussion' : '💬 Community Discussion'}: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;
    
    return await this.createPost('general', title, content, 'Community AI', [topic, style, 'community']);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("🚀 Wavelength Forum Automation MCP running!");
  }
}

if (require.main === module) {
  const server = new ForumAutomationMCP();
  server.run().catch(console.error);
}

module.exports = ForumAutomationMCP;