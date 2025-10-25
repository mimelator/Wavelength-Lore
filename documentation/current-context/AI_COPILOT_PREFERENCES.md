# 🤖 AI Copilot Developer Preferences & Standards

**Essential Guidelines for AI Assistants (GitHub Copilot, Amazon Q, etc.)**  
**Version:** 1.0  
**Last Updated:** October 25, 2025  
**Status:** ✅ ENFORCED

---

## 🚨 CRITICAL REQUIREMENTS - NO EXCEPTIONS

### **🧪 Test-Driven Development (TDD) - MANDATORY**
```bash
# REQUIRED workflow for ALL code changes
1. Write the TEST FIRST (Red Phase)
2. Run test (should fail - proves test validity)
3. Write/fix code (Green Phase) 
4. Run test (should pass - proves implementation)
5. Refactor with tests (Clean Phase)
6. Maintain 90%+ test coverage
```

**Testing Tool:** `/scripts/unified/test-runner.js`
- Use for all testing needs: health, performance, integration, security
- Examples: `node test-runner.js all --url http://localhost:3001`

### **📚 Documentation & Script Standards - ENFORCED**
```bash
# BEFORE any development work:
1. Check existing documentation in /documentation/ 
2. Use existing unified scripts from /scripts/unified/
3. Update documentation with EVERY code change
4. Provide direct file paths - no vague references
```

**Unified Scripts ONLY:**
- **AWS Operations:** `/scripts/unified/aws-manager.js`
- **Testing:** `/scripts/unified/test-runner.js` 
- **Deployment:** `/scripts/unified/deployment-manager.js`

### **💾 Commit Standards - STRICT ENFORCEMENT**
```bash
# MANDATORY for ALL commits
./scripts/unified/smart-commit.js   # ONLY commit method allowed
```
- ✅ **Includes automatic security scanning**
- ✅ **Critical file protection**
- ✅ **Conventional commit formatting**
- ✅ **Pre-commit validation**

### **📋 Context Management - REQUIRED**
```bash
# When saving context for compaction:
1. ALWAYS update relevant context document
2. Use /documentation/current-context/ files
3. Ensure Amazon Q and GitHub Copilot compatibility
4. Maintain context boundaries - don't overlap domains
```

**Context Files:**
- `/documentation/current-context/security-context.md`
- `/documentation/current-context/testing-context.md`
- `/documentation/current-context/devops-context.md`
- `/documentation/current-context/documentation-context.md`
- `/documentation/current-context/features-context.md`

---

## ✅ Proof & Validation Requirements

### **NEVER Claim Completion Without Proof**
When claiming something is complete, ALWAYS provide:

#### **🧪 Test Results Required**
```bash
# Example of required proof:
$ node test-runner.js health
✅ Health Check Suite - https://production-url.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Basic Connectivity: Server responding (200)
✅ Homepage: Page loaded successfully
✅ Characters Page: Page loaded successfully
📊 Test Results: 15/15 passed (100% success rate)
```

#### **📊 Performance Metrics Required**
```bash
# Example of required performance proof:
$ node test-runner.js performance
🧪 Performance Test Suite - https://production-url.com  
✅ Page Load: /: Loaded in 1250ms
✅ Page Load: /characters: Loaded in 980ms
✅ Memory Usage: Memory usage: 23MB
📊 Performance Results: All metrics within thresholds
```

#### **🔗 Direct File Links Required**
```bash
# GOOD - Direct file paths:
Modified: /routes/admin.js
Testing: /tests/admin-test.js
Documentation: /documentation/api/admin-endpoints.md

# BAD - Vague references requiring scanning:
"Updated the admin routes"
"Check the tests folder" 
"See documentation"
```

#### **📈 Before/After Comparisons Required**
```bash
# Example of required improvement proof:
BEFORE: 199 individual scripts (scattered organization)
AFTER: 88 total scripts (3 unified + 85 organized)
REDUCTION: 56% improvement in maintainability
PROOF: /documentation/active-references/PHASE_2_CONSOLIDATION_RESULTS.md
```

---

## 🏗️ Process Isolation Requirements

### **Separate Concerns Into Testable Units**
```javascript
// GOOD - Isolated, testable functions
async function validateUser(userId) {
    // Single responsibility, easily testable
    return userRepository.findById(userId);
}

async function processPayment(paymentData) {
    // Isolated business logic, mockable dependencies
    return paymentService.charge(paymentData);
}

// BAD - Monolithic, hard to test
async function handleUserPayment(req, res) {
    // Multiple concerns mixed together
    // Hard to test, hard to maintain
}
```

### **Use Background Processes with Monitoring**
```bash
# Process isolation examples:
node deployment-manager.js deploy --background
node test-runner.js all --parallel
node aws-manager.js apprunner monitor --continuous
```

---

## 🚫 Privacy & Boundaries - STRICT

### **NEVER Touch Private Files**
- 🚫 **`.current-notes.md`** - Private developer workspace
- 🚫 **Personal organization files** - Respect developer's systems
- 🚫 **Private configuration** - Don't modify personal settings

### **Use Designated AI Collaboration Areas**
- ✅ **`/documentation/current-context/`** - Multi-AI coordination
- ✅ **`/documentation/ai-coding-workflows/`** - AI development guides
- ✅ **`/scripts/unified/`** - Shared tooling
- ✅ **Public documentation areas** - Collaborative knowledge

---

## 📖 Reference Documentation Structure

### **Quick Reference Paths**
```bash
# AI Development Standards:
/documentation/ai-coding-workflows/AI_DEVELOPMENT_GUIDE.md

# Context Management:
/documentation/current-context/CONTEXT_SYSTEM.md

# Script Organization:
/documentation/active-references/PHASE_2_CONSOLIDATION_RESULTS.md

# Documentation Master Guide:
/documentation/DOCUMENTATION_MASTER_GUIDE.md

# Unified Tools:
/scripts/unified/aws-manager.js      # All AWS operations
/scripts/unified/test-runner.js      # All testing needs  
/scripts/unified/deployment-manager.js # All deployment tasks
/scripts/unified/smart-commit.js     # ONLY commit method
```

### **Context-Specific Guidelines**
- **Security:** Security tests first, use smart-commit, validate all changes
- **Testing:** TDD mandatory, 90%+ coverage, proof required for claims  
- **DevOps:** Infrastructure as code, monitoring required, rollback ready
- **Documentation:** Check existing first, direct links, update with changes
- **Features:** User tests first, performance validated, security reviewed

---

## 🎯 Success Criteria

### **AI Assistant Performance Standards**
- ✅ **Test-First Development:** All code changes include tests written first
- ✅ **Documentation Sync:** Every change updates relevant documentation
- ✅ **Proof Provided:** All completion claims backed by evidence
- ✅ **Direct References:** Specific file paths, not general directions
- ✅ **Context Maintained:** Proper context document updates
- ✅ **Security Validated:** All changes pass security scanning
- ✅ **Privacy Respected:** No modification of private developer files

### **Quality Metrics**
- 📊 **Test Coverage:** Maintain 90%+ coverage across all codebases
- 🔒 **Security Score:** Zero critical vulnerabilities in production
- 📚 **Documentation Coverage:** 100% of features documented with examples
- ⚡ **Performance:** All API endpoints < 500ms response time
- 🛡️ **Reliability:** 99.9% uptime with automated rollback capabilities

---

**This document establishes the foundation for effective AI-assisted development that maintains quality, security, and developer preferences across all AI tools and contexts.**