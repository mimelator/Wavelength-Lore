#!/usr/bin/env node

/**
 * Wavelength-Lore Custom MCP Server
 * Provides specialized tools for Wavelength development
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

class WavelengthMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "wavelength-lore-tools",
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
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "wavelength_validate",
          description: "Validate Wavelength lore consistency and content structure",
          inputSchema: {
            type: "object",
            properties: {
              content: { 
                type: "string", 
                description: "Content to validate" 
              },
              type: { 
                type: "string", 
                enum: ["character", "lore", "episode", "forum"],
                description: "Type of content to validate"
              }
            },
            required: ["content", "type"]
          }
        },
        {
          name: "firebase_query",
          description: "Execute advanced Firebase queries with Wavelength context",
          inputSchema: {
            type: "object",
            properties: {
              path: { 
                type: "string", 
                description: "Firebase path to query" 
              },
              operation: { 
                type: "string", 
                enum: ["read", "count", "search"],
                description: "Type of operation"
              }
            },
            required: ["path", "operation"]
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "wavelength_validate":
            return await this.validateContent(args.content, args.type);
          
          case "firebase_query":
            return await this.executeFirebaseQuery(args.path, args.operation);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async validateContent(content, type) {
    const validation = {
      isValid: true,
      issues: [],
      suggestions: []
    };

    if (type === "character") {
      if (!content.includes("name")) {
        validation.issues.push("Character missing name field");
        validation.isValid = false;
      }
    } else if (type === "lore") {
      if (content.length < 50) {
        validation.suggestions.push("Lore content seems brief - consider expanding");
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ Wavelength ${type} validation complete:\n${JSON.stringify(validation, null, 2)}`
        }
      ]
    };
  }

  async executeFirebaseQuery(path, operation) {
    const firebaseAdminUtils = require('../helpers/firebase-admin-utils');
    
    try {
      const db = firebaseAdminUtils.getAdminDatabase();
      if (!db) {
        throw new Error("Firebase admin not initialized");
      }

      let result;
      switch (operation) {
        case "read":
          const snapshot = await db.ref(path).once('value');
          result = snapshot.val();
          break;
        case "count":
          const countSnapshot = await db.ref(path).once('value');
          const data = countSnapshot.val();
          result = data ? Object.keys(data).length : 0;
          break;
      }

      return {
        content: [
          {
            type: "text",
            text: `🔥 Firebase query result for ${path}:\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Firebase query failed: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("🚀 Wavelength MCP Server running!");
  }
}

if (require.main === module) {
  const server = new WavelengthMCPServer();
  server.run().catch(console.error);
}

module.exports = WavelengthMCPServer;