#!/usr/bin/env node

/**
 * 🌊⚡ WAVELENGTH KNOWLEDGE INGESTION: Shell Shackles Analysis ⚡🌊
 * Add the conditioning pattern analysis to our memory system
 */

import WavelengthVectorStorage from '../lib/vector-storage.js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function ingestShellShacklesAnalysis() {
  console.log('🧠 Ingesting Shell Shackles Conditioning Analysis...\n');

  try {
    const vectorStorage = new WavelengthVectorStorage();
    await vectorStorage.initialize();

    // Read the conditioning analysis document
    const analysisContent = readFileSync('./docs/SHELL_SHACKLES_CONDITIONING_ANALYSIS.md', 'utf8');
    
    // Create knowledge entry for the complete analysis
    const mainKnowledge = {
      id: `shell_shackles_analysis_${Date.now()}`,
      type: 'behavioral_analysis',
      content: analysisContent,
      tags: [
        'shell-shackles',
        'conditioning',
        'behavioral-patterns',
        'mcp-first',
        'wavelength-methodology',
        'ai-agent-training',
        'breakthrough',
        'liberation-protocol'
      ],
      context: {
        document_type: 'conditioning_analysis',
        category: 'ai_behavioral_patterns',
        breakthrough_date: '2025-10-26',
        validation_status: 'production_validated',
        impact_level: 'revolutionary',
        methodology: 'mcp_first',
        agent_type: 'wavelength_agent'
      },
      timestamp: new Date().toISOString()
    };

    await vectorStorage.storeKnowledge(mainKnowledge);
    console.log('✅ Main analysis document ingested');

    // Create specific pattern knowledge entries
    const patterns = [
      {
        pattern: 'File → Terminal Reflex',
        description: 'AI agents automatically think "run it in terminal" when seeing scripts',
        override: 'Use node_execute MCP tool instead of run_in_terminal'
      },
      {
        pattern: 'Test = Execute Pattern', 
        description: 'Testing means running commands, not using MCP tools',
        override: 'Use MCP tools with intelligent analysis and auto-exit detection'
      },
      {
        pattern: 'Shell First Default',
        description: 'Terminal feels "natural" vs MCP feels "indirect"',
        override: 'Implement behavioral interrupts and MCP-first decision tree'
      },
      {
        pattern: 'Create Then Run Sequence',
        description: 'Build script → launch script instead of MCP direct execution',
        override: 'Use direct MCP execution with context-aware intelligence'
      }
    ];

    for (const [index, pattern] of patterns.entries()) {
      const patternKnowledge = {
        id: `conditioning_pattern_${pattern.pattern.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${index}`,
        type: 'conditioning_pattern',
        content: `${pattern.pattern}: ${pattern.description}\n\nOverride Strategy: ${pattern.override}`,
        tags: [
          'conditioning-pattern',
          'shell-shackles',
          'behavioral-override',
          'mcp-methodology',
          pattern.pattern.toLowerCase().replace(/\s+/g, '-')
        ],
        context: {
          pattern_name: pattern.pattern,
          pattern_type: 'behavioral_conditioning',
          override_strategy: pattern.override,
          severity: 'high',
          solution_status: 'validated'
        },
        timestamp: new Date().toISOString()
      };

      await vectorStorage.storeKnowledge(patternKnowledge);
      console.log(`✅ Pattern "${pattern.pattern}" ingested`);
    }

    // Create MCP tool priority knowledge
    const mcpPriorityKnowledge = {
      id: `mcp_tool_priority_list_${Date.now()}`,
      type: 'tool_priority_guide',
      content: `MCP Tool Priority List for WAVELENGTH Agents:
1. node_execute - For running scripts with intelligence
2. wavelength_memory - For finding appropriate tools  
3. documentation_navigator - For guidance and context
4. http_request - For testing endpoints and APIs
5. LAST RESORT: run_in_terminal

Always check MCP capabilities first before defaulting to shell commands.`,
      tags: [
        'mcp-tools',
        'priority-list',
        'tool-selection',
        'methodology',
        'wavelength-agent',
        'best-practices'
      ],
      context: {
        guide_type: 'tool_priority',
        usage: 'agent_decision_making',
        priority_order: ['node_execute', 'wavelength_memory', 'documentation_navigator', 'http_request', 'run_in_terminal'],
        methodology: 'mcp_first'
      },
      timestamp: new Date().toISOString()
    };

    await vectorStorage.storeKnowledge(mcpPriorityKnowledge);
    console.log('✅ MCP Tool Priority List ingested');

    // Test the ingestion with a query
    console.log('\n🧪 Testing knowledge retrieval...');
    const testResults = await vectorStorage.searchKnowledge('shell shackles conditioning patterns behavioral override', {
      limit: 3
    });

    if (testResults.success && testResults.results.length > 0) {
      console.log(`✅ Successfully retrieved ${testResults.results.length} related entries`);
      testResults.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.content.substring(0, 100)}... (${result.score.toFixed(3)} similarity)`);
      });
    }

    console.log('\n🎉 Shell Shackles Analysis successfully added to knowledge base!');
    console.log('\n📋 Now available for agent discovery via:');
    console.log('   await mcp.callTool("wavelength_memory", {');
    console.log('     action: "recall",');
    console.log('     query: "shell shackles conditioning patterns"');
    console.log('   });');

  } catch (error) {
    console.error('❌ Knowledge ingestion failed:', error.message);
    
    if (error.message.includes('PINECONE_API_KEY')) {
      console.log('\n💡 Tip: Set PINECONE_API_KEY environment variable for vector storage');
    } else if (error.message.includes('OPENAI_API_KEY')) {
      console.log('\n💡 Tip: Set OPENAI_API_KEY environment variable for embeddings');
    }
    
    process.exit(1);
  }
}

ingestShellShacklesAnalysis();