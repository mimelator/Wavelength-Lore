#!/usr/bin/env node

/**
 * WAVELENGTH Tool Documentation Ingestion
 * Ingests all tool documentation into memory system for agent discovery
 */

import WavelengthVectorStorage from '../lib/vector-storage.js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function ingestToolDocumentation() {
  console.log('📚 Ingesting WAVELENGTH Tool Documentation...\n');

  try {
    const vectorStorage = new WavelengthVectorStorage();
    await vectorStorage.initialize();

    // Extract tool documentation from WAVELENGTH_MINI_QUICKSTART.md
    const quickstartPath = './WAVELENGTH_MINI_QUICKSTART.md';
    const quickstartContent = readFileSync(quickstartPath, 'utf8');
    
    // Parse MCP commands from the quickstart
    const mcpCommands = extractMCPCommands(quickstartContent);
    
    console.log(`🔍 Found ${mcpCommands.length} MCP tool commands to ingest\n`);
    
    let processed = 0;
    
    for (const command of mcpCommands) {
      const knowledge = {
        id: `wavelength_tool_${command.tool}_${Date.now()}_${processed}`,
        type: 'wavelength_tool',
        content: `${command.tool}: ${command.description}\n\nUsage: ${command.usage}\n\nExample: ${command.example}`,
        tags: [
          'wavelength',
          'mcp-tool',
          command.category,
          ...command.keywords
        ],
        context: {
          tool_name: command.tool,
          category: command.category,
          usage_pattern: command.usage,
          example_code: command.example,
          keywords: command.keywords
        },
        timestamp: new Date().toISOString()
      };

      await vectorStorage.storeKnowledge(knowledge);
      processed++;
      
      if (processed % 5 === 0) {
        console.log(`📊 Processed ${processed}/${mcpCommands.length} tools`);
      }
    }

    console.log(`\n✅ Successfully ingested ${processed} WAVELENGTH tools`);
    
    // Test the ingestion
    console.log('\n🧪 Testing tool discovery...');
    const testQueries = [
      'Docker tools',
      'testing commands', 
      'AWS deployment',
      'memory system',
      'Firebase database'
    ];
    
    for (const query of testQueries) {
      const results = await vectorStorage.searchKnowledge(query, { limit: 2 });
      if (results.success && results.results.length > 0) {
        console.log(`✅ "${query}" → Found ${results.results.length} tools`);
      }
    }

    console.log('\n🎉 Tool documentation ingestion completed!');
    console.log('\n📋 Agents can now discover tools with:');
    console.log('   await mcp.callTool("wavelength_memory", {action: "recall", query: "Docker tools"});');

  } catch (error) {
    console.error('❌ Tool documentation ingestion failed:', error);
    process.exit(1);
  }
}

function extractMCPCommands(content) {
  const commands = [];
  
  // Tool patterns to extract
  const toolPatterns = [
    {
      tool: 'wavelength_session',
      category: 'session',
      description: 'Manage WAVELENGTH development sessions',
      usage: 'await mcp.callTool("wavelength_session", {action: "start|status|restart|stop"})',
      example: 'await mcp.callTool("wavelength_session", {action: "start"});',
      keywords: ['session', 'startup', 'server']
    },
    {
      tool: 'wavelength_test',
      category: 'testing',
      description: 'Unified testing tool for health checks and validation',
      usage: 'await mcp.callTool("wavelength_test", {action: "health|run|validate", target?: string})',
      example: 'await mcp.callTool("wavelength_test", {action: "health"});',
      keywords: ['test', 'health', 'validate', 'check']
    },
    {
      tool: 'wavelength_memory',
      category: 'memory',
      description: 'AI memory system with 100+ commits of historical knowledge',
      usage: 'await mcp.callTool("wavelength_memory", {action: "recall|store|suggest|correlate", query?: string})',
      example: 'await mcp.callTool("wavelength_memory", {action: "recall", query: "Docker issues"});',
      keywords: ['memory', 'recall', 'history', 'knowledge', 'search']
    },
    {
      tool: 'wavelength_aws_manager',
      category: 'aws',
      description: 'AWS service management and monitoring',
      usage: 'await mcp.callTool("wavelength_aws_manager", {operation: "status|health|logs", service: string})',
      example: 'await mcp.callTool("wavelength_aws_manager", {operation: "status", service: "all"});',
      keywords: ['aws', 'cloud', 'deployment', 'app-runner']
    },
    {
      tool: 'wavelength_deployment_manager',
      category: 'deployment',
      description: 'Deployment status and management',
      usage: 'await mcp.callTool("wavelength_deployment_manager", {action: "status|history|rollback-check"})',
      example: 'await mcp.callTool("wavelength_deployment_manager", {action: "status"});',
      keywords: ['deploy', 'deployment', 'production', 'rollback']
    },
    {
      tool: 'wavelength_build_monitor',
      category: 'build',
      description: 'Build monitoring and status checking',
      usage: 'await mcp.callTool("wavelength_build_monitor", {action: "check|latest|history"})',
      example: 'await mcp.callTool("wavelength_build_monitor", {action: "check"});',
      keywords: ['build', 'monitor', 'ci-cd', 'github-actions']
    },
    {
      tool: 'wavelength_docker_validator',
      category: 'docker',
      description: 'Docker configuration validation and diagnostics',
      usage: 'await mcp.callTool("wavelength_docker_validator", {check: "full|quick"})',
      example: 'await mcp.callTool("wavelength_docker_validator", {check: "full"});',
      keywords: ['docker', 'container', 'validate', 'diagnostic']
    },
    {
      tool: 'firebase_query',
      category: 'database',
      description: 'Firebase database operations and queries',
      usage: 'await mcp.callTool("firebase_query", {path: string, operation: "read|count|health"})',
      example: 'await mcp.callTool("firebase_query", {path: "/episodes", operation: "read"});',
      keywords: ['firebase', 'database', 'query', 'data']
    },
    {
      tool: 'wavelength_tool_finder',
      category: 'discovery',
      description: 'Find WAVELENGTH tools by keyword',
      usage: 'await mcp.callTool("wavelength_tool_finder", {keyword: string})',
      example: 'await mcp.callTool("wavelength_tool_finder", {keyword: "docker"});',
      keywords: ['find', 'discover', 'search', 'tools']
    },
    {
      tool: 'wavelength_help_finder',
      category: 'help',
      description: 'Get targeted help for specific problems',
      usage: 'await mcp.callTool("wavelength_help_finder", {problem: string})',
      example: 'await mcp.callTool("wavelength_help_finder", {problem: "build-failure"});',
      keywords: ['help', 'problem', 'guidance', 'support']
    }
  ];

  return toolPatterns;
}

ingestToolDocumentation();