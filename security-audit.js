#!/usr/bin/env node

/**
 * Security Audit for Code Check-in
 * Comprehensive security review of changed files
 */

const fs = require('fs');
const path = require('path');

const SECURITY_PATTERNS = {
    // XSS and Injection Vulnerabilities
    'Potential XSS': [
        /innerHTML\s*=\s*[^'"]/, // innerHTML without proper escaping
        /document\.write\s*\(/,
        /eval\s*\(/,
        /Function\s*\(/,
        /setTimeout\s*\(\s*['"][^'"]*\+/,
        /setInterval\s*\(\s*['"][^'"]*\+/
    ],
    
    // SQL Injection (though we're using Firebase, check for any raw queries)
    'SQL Injection Risk': [
        /SELECT\s+.*\+.*FROM/i,
        /INSERT\s+.*\+.*INTO/i,
        /UPDATE\s+.*\+.*SET/i,
        /DELETE\s+.*\+.*FROM/i
    ],
    
    // Credential Exposure
    'Credential Exposure': [
        /password\s*[:=]\s*['"][^'"]+['"]/i,
        /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
        /secret\s*[:=]\s*['"][^'"]+['"]/i,
        /token\s*[:=]\s*['"][^'"]+['"]/i,
        /private[_-]?key/i,
        /BEGIN\s+PRIVATE\s+KEY/
    ],
    
    // Unsafe File Operations
    'File System Risk': [
        /fs\.writeFile.*\+/,
        /fs\.readFile.*\+/,
        /path\.join.*req\./,
        /\.\.\//,
        /process\.env\.[A-Z_]+\s*\+/
    ],
    
    // Code Injection
    'Code Injection': [
        /require\s*\(\s*.*\+/,
        /import\s*\(\s*.*\+/,
        /new\s+Function\s*\(/,
        /vm\.runInNewContext/,
        /child_process\.exec.*\+/
    ],
    
    // Client-Side Security Issues
    'Client Security': [
        /window\.location\s*=.*\+/,
        /document\.location\s*=.*\+/,
        /location\.href\s*=.*\+/,
        /postMessage\s*\(/,
        /localStorage\.setItem.*\+/,
        /sessionStorage\.setItem.*\+/
    ],
    
    // Server-Side Request Forgery
    'SSRF Risk': [
        /fetch\s*\(\s*.*req\./,
        /http\.get\s*\(\s*.*req\./,
        /axios\s*\(\s*.*req\./,
        /request\s*\(\s*.*req\./
    ]
};

function auditFile(filePath) {
    const findings = [];
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\\n');
        
        Object.entries(SECURITY_PATTERNS).forEach(([category, patterns]) => {
            patterns.forEach(pattern => {
                lines.forEach((line, index) => {
                    if (pattern.test(line)) {
                        findings.push({
                            category,
                            line: index + 1,
                            content: line.trim(),
                            severity: getSeverity(category),
                            file: filePath
                        });
                    }
                });
            });
        });
        
        // Additional context-specific checks
        if (filePath.endsWith('.ejs')) {
            checkEJSTemplates(content, filePath, findings);
        }
        
        if (filePath.includes('routes/')) {
            checkRouteHandlers(content, filePath, findings);
        }
        
        if (filePath.includes('static/js/')) {
            checkClientSideJS(content, filePath, findings);
        }
        
    } catch (error) {
        findings.push({
            category: 'File Access Error',
            line: 0,
            content: error.message,
            severity: 'INFO',
            file: filePath
        });
    }
    
    return findings;
}

function checkEJSTemplates(content, filePath, findings) {
    // Check for unescaped output in EJS
    const unescapedOutputPattern = /<%-\\s*[^%]+%>/g;
    const matches = content.match(unescapedOutputPattern);
    
    if (matches) {
        matches.forEach(match => {
            const lineNum = content.substring(0, content.indexOf(match)).split('\\n').length;
            findings.push({
                category: 'EJS XSS Risk',
                line: lineNum,
                content: match.trim(),
                severity: 'HIGH',
                file: filePath
            });
        });
    }
}

function checkRouteHandlers(content, filePath, findings) {
    // Check for missing input validation
    if (content.includes('req.params') || content.includes('req.query') || content.includes('req.body')) {
        if (!content.includes('validate') && !content.includes('sanitize') && !content.includes('escape')) {
            findings.push({
                category: 'Missing Input Validation',
                line: 0,
                content: 'Route uses req.params/query/body without apparent validation',
                severity: 'MEDIUM',
                file: filePath
            });
        }
    }
}

function checkClientSideJS(content, filePath, findings) {
    // Check for DOM manipulation with user input
    if (content.includes('innerHTML') && (content.includes('user') || content.includes('input') || content.includes('data'))) {
        const lineNum = content.indexOf('innerHTML');
        findings.push({
            category: 'DOM XSS Risk',
            line: content.substring(0, lineNum).split('\\n').length,
            content: 'innerHTML usage detected with potential user data',
            severity: 'HIGH',
            file: filePath
        });
    }
}

function getSeverity(category) {
    const highRisk = ['Credential Exposure', 'Code Injection', 'Potential XSS', 'SQL Injection Risk'];
    const mediumRisk = ['File System Risk', 'SSRF Risk', 'Client Security'];
    
    if (highRisk.includes(category)) return 'HIGH';
    if (mediumRisk.includes(category)) return 'MEDIUM';
    return 'LOW';
}

async function runSecurityAudit() {
    console.log('🔒 SECURITY AUDIT - CODE CHECK-IN REVIEW');
    console.log('='.repeat(60));
    
    const changedFiles = [
        'app.js',
        'content/maps/wavelength-world-map.svg',
        'routes/content.js',
        'routes/merchandise.js',
        'scripts/batch-product-preview-builder.js',
        'scripts/production_validation.js',
        'scripts/validate-production.sh',
        'static/css/map.css',
        'static/js/components/merchandise-store.js',
        'static/js/map-modal-fix.js',
        'tests/merchandise/product-card-actions.test.js',
        'tests/merchandise/product-customization-modal.test.js',
        'views/admin/vendor-catalog.ejs',
        'views/episode.ejs',
        'views/map.ejs'
    ];
    
    let allFindings = [];
    let filesScanned = 0;
    
    console.log('📁 Scanning Files:');
    
    for (const file of changedFiles) {
        const fullPath = `/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh/${file}`;
        
        try {
            if (fs.existsSync(fullPath)) {
                console.log(`   📄 ${file}`);
                const findings = auditFile(fullPath);
                allFindings = allFindings.concat(findings);
                filesScanned++;
            } else {
                console.log(`   ⚠️  ${file} (not found)`);
            }
        } catch (error) {
            console.log(`   ❌ ${file} (error: ${error.message})`);
        }
    }
    
    console.log(`\\n📊 Audit Results: ${filesScanned} files scanned`);
    console.log('='.repeat(60));
    
    // Group findings by severity
    const findingsBySeverity = {
        HIGH: allFindings.filter(f => f.severity === 'HIGH'),
        MEDIUM: allFindings.filter(f => f.severity === 'MEDIUM'),
        LOW: allFindings.filter(f => f.severity === 'LOW'),
        INFO: allFindings.filter(f => f.severity === 'INFO')
    };
    
    let hasHighRisk = false;
    
    Object.entries(findingsBySeverity).forEach(([severity, findings]) => {
        if (findings.length > 0) {
            const icon = severity === 'HIGH' ? '🚨' : severity === 'MEDIUM' ? '⚠️' : '📋';
            console.log(`\\n${icon} ${severity} SEVERITY (${findings.length} issues):`);
            
            findings.forEach(finding => {
                const fileName = path.basename(finding.file);
                console.log(`   ${fileName}:${finding.line} - ${finding.category}`);
                console.log(`   └─ ${finding.content.substring(0, 80)}${finding.content.length > 80 ? '...' : ''}`);
            });
            
            if (severity === 'HIGH') hasHighRisk = true;
        }
    });
    
    console.log('\\n' + '='.repeat(60));
    
    if (allFindings.length === 0) {
        console.log('✅ SECURITY AUDIT PASSED');
        console.log('   No security issues detected in changed files');
        console.log('   Safe to proceed with check-in');
    } else if (hasHighRisk) {
        console.log('❌ SECURITY AUDIT FAILED');
        console.log('   HIGH SEVERITY issues detected - review required before check-in');
        console.log('   Address high-risk issues before proceeding');
    } else {
        console.log('⚠️  SECURITY AUDIT - WARNINGS');
        console.log('   Medium/Low severity issues detected');
        console.log('   Review recommended but may proceed with caution');
    }
    
    console.log(`\\n📋 Summary: ${allFindings.length} total findings across ${filesScanned} files`);
    
    return {
        passed: !hasHighRisk,
        totalFindings: allFindings.length,
        highRisk: findingsBySeverity.HIGH.length,
        mediumRisk: findingsBySeverity.MEDIUM.length,
        filesScanned
    };
}

if (require.main === module) {
    runSecurityAudit().catch(console.error);
}

module.exports = { runSecurityAudit };