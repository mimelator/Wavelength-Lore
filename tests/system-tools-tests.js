#!/usr/bin/env node

/**
 * System Tools MCP Server Tests
 * Comprehensive test suite for all command line tools
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SystemToolsTests {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runMCPTool(toolName, args) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name: toolName, arguments: args },
        id: 1
      };
      
      const child = spawn('node', ['mcp/system-tools-server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let error = '';
      
      child.stdout.on('data', data => output += data);
      child.stderr.on('data', data => error += data);
      
      child.on('close', code => {
        try {
          const response = JSON.parse(output);
          resolve(response.result);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}, Output: ${output}`));
        }
      });
      
      child.on('error', reject);
      
      child.stdin.write(JSON.stringify(request));
      child.stdin.end();
    });
  }

  async test(name, testFn) {
    console.log(`🧪 Testing: ${name}`);
    try {
      await testFn();
      console.log(`   ✅ PASSED`);
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
    }
  }

  async createTestFile() {
    const testContent = `# Test File
This is a test file for system tools.
Line 1: Hello World
Line 2: Testing grep
Line 3: JSON data {"test": true}
Line 4: Numbers 123 456 789
Line 5: End of file`;
    
    fs.writeFileSync('test-file.txt', testContent);
    return 'test-file.txt';
  }

  async createTestJSON() {
    const jsonContent = {
      "name": "test",
      "version": "1.0.0",
      "items": [
        {"id": 1, "name": "item1"},
        {"id": 2, "name": "item2"}
      ]
    };
    
    fs.writeFileSync('test.json', JSON.stringify(jsonContent, null, 2));
    return 'test.json';
  }

  async runAllTests() {
    console.log('🚀 Starting System Tools MCP Server Tests\n');

    // Create test files
    const testFile = await this.createTestFile();
    const testJSON = await this.createTestJSON();

    // File Operations Tests
    await this.test('cat - Read file contents', async () => {
      const result = await this.runMCPTool('cat', { file: testFile });
      if (!result.content[0].text.includes('Hello World')) {
        throw new Error('Cat command did not return expected content');
      }
    });

    await this.test('head - Show first lines', async () => {
      const result = await this.runMCPTool('head', { file: testFile, lines: 3 });
      if (!result.content[0].text.includes('First 3 lines')) {
        throw new Error('Head command format incorrect');
      }
    });

    await this.test('tail - Show last lines', async () => {
      const result = await this.runMCPTool('tail', { file: testFile, lines: 2 });
      if (!result.content[0].text.includes('Last 2 lines')) {
        throw new Error('Tail command format incorrect');
      }
    });

    await this.test('grep - Search file contents', async () => {
      const result = await this.runMCPTool('grep', { 
        pattern: 'Hello', 
        file: testFile,
        context: 1
      });
      if (!result.content[0].text.includes('Search results')) {
        throw new Error('Grep command format incorrect');
      }
    });

    await this.test('find - Locate files', async () => {
      const result = await this.runMCPTool('find', { 
        path: '.',
        name: '*.txt',
        type: 'f'
      });
      if (!result.content[0].text.includes('Found')) {
        throw new Error('Find command format incorrect');
      }
    });

    await this.test('wc - Count words/lines', async () => {
      const result = await this.runMCPTool('wc', { file: testFile });
      if (!result.content[0].text.includes('Word count')) {
        throw new Error('WC command format incorrect');
      }
    });

    // System Information Tests
    await this.test('ps - Process status', async () => {
      const result = await this.runMCPTool('ps', {});
      if (!result.content[0].text.includes('Process Status')) {
        throw new Error('PS command format incorrect');
      }
    });

    await this.test('top - System performance', async () => {
      const result = await this.runMCPTool('top', { processes: 5 });
      if (!result.content[0].text.includes('Top 5 processes')) {
        throw new Error('Top command format incorrect');
      }
    });

    await this.test('df - Disk usage', async () => {
      const result = await this.runMCPTool('df', { human: true });
      if (!result.content[0].text.includes('Disk Usage')) {
        throw new Error('DF command format incorrect');
      }
    });

    await this.test('du - Directory usage', async () => {
      const result = await this.runMCPTool('du', { path: '.', depth: 1 });
      if (!result.content[0].text.includes('Directory Usage')) {
        throw new Error('DU command format incorrect');
      }
    });

    await this.test('free - Memory usage', async () => {
      const result = await this.runMCPTool('free', { human: true });
      if (!result.content[0].text.includes('Memory Usage')) {
        throw new Error('Free command format incorrect');
      }
    });

    await this.test('uptime - System uptime', async () => {
      const result = await this.runMCPTool('uptime', {});
      if (!result.content[0].text.includes('System Uptime')) {
        throw new Error('Uptime command format incorrect');
      }
    });

    // Network Tools Tests
    await this.test('ping - Network connectivity', async () => {
      const result = await this.runMCPTool('ping', { 
        host: 'localhost',
        count: 2,
        timeout: 3
      });
      if (!result.content[0].text.includes('Ping Results')) {
        throw new Error('Ping command format incorrect');
      }
    });

    await this.test('netstat - Network connections', async () => {
      const result = await this.runMCPTool('netstat', { 
        listening: true,
        numeric: true
      });
      if (!result.content[0].text.includes('Network Connections')) {
        throw new Error('Netstat command format incorrect');
      }
    });

    await this.test('nslookup - DNS resolution', async () => {
      const result = await this.runMCPTool('nslookup', { host: 'localhost' });
      if (!result.content[0].text.includes('DNS Lookup')) {
        throw new Error('Nslookup command format incorrect');
      }
    });

    // Development Tools Tests
    await this.test('git_status - Git repository status', async () => {
      const result = await this.runMCPTool('git_status', { path: '.' });
      if (!result.content[0].text.includes('Git Status')) {
        throw new Error('Git status command format incorrect');
      }
    });

    await this.test('npm_info - NPM information', async () => {
      const result = await this.runMCPTool('npm_info', { action: 'list' });
      if (!result.content[0].text.includes('NPM list')) {
        throw new Error('NPM info command format incorrect');
      }
    });

    // Text Processing Tests
    await this.test('sort - Sort file contents', async () => {
      const result = await this.runMCPTool('sort', { 
        file: testFile,
        numeric: false,
        unique: true
      });
      if (!result.content[0].text.includes('Sorted Output')) {
        throw new Error('Sort command format incorrect');
      }
    });

    await this.test('jq - JSON processing', async () => {
      const result = await this.runMCPTool('jq', { 
        filter: '.name',
        file: testJSON
      });
      if (!result.content[0].text.includes('JSON Query Results')) {
        throw new Error('JQ command format incorrect');
      }
    });

    // Archive Operations Tests
    await this.test('tar - Archive operations', async () => {
      const result = await this.runMCPTool('tar', { 
        action: 'create',
        archive: 'test.tar.gz',
        files: [testFile],
        compress: true
      });
      if (!result.content[0].text.includes('Tar create')) {
        throw new Error('Tar command format incorrect');
      }
    });

    await this.test('rsync - File synchronization', async () => {
      const result = await this.runMCPTool('rsync', { 
        source: testFile,
        destination: 'test-copy.txt',
        dryRun: true
      });
      if (!result.content[0].text.includes('Rsync Preview')) {
        throw new Error('Rsync command format incorrect');
      }
    });

    // Cleanup test files
    this.cleanup();

    // Generate report
    this.generateReport();
  }

  cleanup() {
    const testFiles = [
      'test-file.txt',
      'test.json',
      'test.tar.gz',
      'test-copy.txt'
    ];

    testFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.log(`⚠️ Could not cleanup ${file}: ${error.message}`);
      }
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYSTEM TOOLS MCP SERVER TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n✅ PASSED: ${this.results.passed}`);
    console.log(`❌ FAILED: ${this.results.failed}`);
    console.log(`📊 TOTAL: ${this.results.passed + this.results.failed}`);
    
    const successRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);
    console.log(`📈 SUCCESS RATE: ${successRate}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    console.log(`\n🎯 OVERALL STATUS: ${this.results.failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    
    return this.results.failed === 0;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SystemToolsTests();
  
  tester.runAllTests()
    .then(() => {
      const success = tester.results.failed === 0;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = SystemToolsTests;