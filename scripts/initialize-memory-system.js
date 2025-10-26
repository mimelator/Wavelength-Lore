#!/usr/bin/env node

/**
 * WAVELENGTH Memory System Initialization
 * Sets up the vector storage and tests basic functionality
 */

import WavelengthVectorStorage from '../lib/vector-storage.js';

async function initializeMemorySystem() {
  console.log('🧠 Initializing WAVELENGTH Memory System...\n');

  try {
    // Initialize vector storage
    const vectorStorage = new WavelengthVectorStorage();
    const initResult = await vectorStorage.initialize();
    
    if (!initResult.success) {
      console.error('❌ Initialization failed:', initResult.error);
      process.exit(1);
    }

    console.log('✅ Vector storage connected to existing Pinecone index');

    // Store initial development knowledge
    console.log('\n📚 Storing initial development knowledge...');
    
    const initialKnowledge = [
      {
        id: `wavelength_docker_fix_${Date.now()}`,
        type: 'build_issue',
        content: 'Docker build failing - /app/start.sh not found. Root cause: Dockerfile COPY command referenced wrong path after file was moved. Solution: Change "docker/docker-start.sh" to "docker-start.sh" in Dockerfile.',
        tags: ['docker', 'build-failure', 'production', 'solved', 'dockerfile'],
        context: {
          file: 'Dockerfile',
          line: 54,
          error: '/app/start.sh not found',
          solution: 'Fix COPY path reference',
          date_solved: '2024-10-26',
          impact: 'production-critical'
        },
        timestamp: new Date().toISOString()
      },
      {
        id: `wavelength_mcp_tools_${Date.now()}`,
        type: 'solution',
        content: 'WAVELENGTH Agent MCP tools redesign: Unified wavelength_session and wavelength_test tools with consistent action parameters. Replaced multiple confusing tools with simple, natural interfaces.',
        tags: ['mcp', 'tools', 'agent-experience', 'efficiency', 'solved'],
        context: {
          tools_created: ['wavelength_session', 'wavelength_test'],
          tools_replaced: ['wavelength_server_availability', 'wavelength_test_runner', 'wavelength_validate'],
          benefit: 'reduced cognitive load, consistent interface',
          date_implemented: '2024-10-26'
        },
        timestamp: new Date().toISOString()
      },
      {
        id: `wavelength_memory_system_${Date.now()}`,
        type: 'process',
        content: 'WAVELENGTH Memory System implementation: Vector storage integration with Pinecone for persistent AI agent memory. Enables knowledge retention across sessions and GitHub issue correlation.',
        tags: ['memory-system', 'vector-storage', 'pinecone', 'ai-agents', 'implementation'],
        context: {
          components: ['wavelength-memory-server.js', 'vector-storage.js', 'github-integration.js'],
          capabilities: ['store', 'recall', 'suggest', 'correlate', 'ingest_github'],
          index_name: 'wavelength-lore',
          date_created: '2024-10-26'
        },
        timestamp: new Date().toISOString()
      }
    ];

    for (const knowledge of initialKnowledge) {
      const result = await vectorStorage.storeKnowledge(knowledge);
      if (result.success) {
        console.log(`✅ Stored: ${knowledge.type} - ${knowledge.content.substring(0, 50)}...`);
      } else {
        console.log(`❌ Failed to store: ${knowledge.id}`);
      }
    }

    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    const searchResult = await vectorStorage.searchKnowledge('Docker build problems', {
      limit: 3,
      threshold: 0.5
    });

    if (searchResult.success && searchResult.results.length > 0) {
      console.log(`✅ Search working - found ${searchResult.results.length} relevant entries:`);
      searchResult.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.content.substring(0, 80)}... (Score: ${result.score.toFixed(3)})`);
      });
    } else {
      console.log('⚠️  Search returned no results - this is normal for a new system');
    }

    // Get storage statistics
    console.log('\n📊 Storage Statistics:');
    const stats = await vectorStorage.getStats();
    if (stats.success) {
      console.log(`   Total vectors: ${stats.stats.total_vectors}`);
      console.log(`   Dimension: ${stats.stats.dimension}`);
      console.log(`   Index fullness: ${(stats.stats.index_fullness * 100).toFixed(2)}%`);
    }

    console.log('\n🎉 WAVELENGTH Memory System initialized successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start using: await mcp.callTool("wavelength_memory", {action: "recall", query: "your question"})');
    console.log('   2. Run GitHub ingestion: node scripts/ingest-github-history.js');
    console.log('   3. The system will auto-capture future development sessions');

  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeMemorySystem();