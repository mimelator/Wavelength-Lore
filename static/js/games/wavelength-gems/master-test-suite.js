/**
 * Wavelength Gems - Master Test Suite
 * Comprehensive testing harness that orchestrates all test suites
 */

class WavelengthGemsMasterTestSuite {
    constructor() {
        this.testSuites = {
            mobile: null,
            desktop: null,
            mechanics: null,
            polish: null
        };
        this.masterResults = {};
        this.startTime = null;
        this.endTime = null;
        
        console.log('🧪 Wavelength Gems Master Test Suite initialized');
    }

    /**
     * Run all test suites in sequence
     */
    async runAllTests() {
        console.log('\n🚀 STARTING COMPREHENSIVE WAVELENGTH GEMS TEST SUITE');
        console.log('=' .repeat(70));
        
        this.startTime = performance.now();

        // Initialize all test suites
        await this.initializeTestSuites();

        // Run tests in optimal order
        const testOrder = [
            { name: 'mechanics', title: 'Game Mechanics', emoji: '🎮' },
            { name: 'mobile', title: 'Mobile Experience', emoji: '📱' },
            { name: 'desktop', title: 'Desktop Experience', emoji: '🖥️' },
            { name: 'polish', title: 'UI Polish', emoji: '✨' }
        ];

        for (const test of testOrder) {
            console.log(`\n${test.emoji} Running ${test.title} Tests...`);
            console.log('-' .repeat(50));
            
            try {
                if (this.testSuites[test.name]) {
                    this.masterResults[test.name] = await this.testSuites[test.name][`runAll${test.name.charAt(0).toUpperCase() + test.name.slice(1)}Tests`]();
                } else {
                    console.error(`❌ ${test.title} test suite not available`);
                    this.masterResults[test.name] = { error: 'Test suite not available' };
                }
            } catch (error) {
                console.error(`❌ ${test.title} tests failed:`, error);
                this.masterResults[test.name] = { error: error.message };
            }
        }

        this.endTime = performance.now();
        
        // Generate comprehensive report
        return this.generateMasterReport();
    }

    /**
     * Run specific test suite
     */
    async runTestSuite(suiteName) {
        if (!this.testSuites[suiteName]) {
            console.error(`❌ Test suite '${suiteName}' not found`);
            return null;
        }

        const suiteMap = {
            mobile: 'runAllMobileTests',
            desktop: 'runAllDesktopTests', 
            mechanics: 'runAllMechanicsTests',
            polish: 'runAllPolishTests'
        };

        const methodName = suiteMap[suiteName];
        if (!methodName) {
            console.error(`❌ No method mapped for suite '${suiteName}'`);
            return null;
        }

        try {
            return await this.testSuites[suiteName][methodName]();
        } catch (error) {
            console.error(`❌ ${suiteName} test suite failed:`, error);
            return { error: error.message };
        }
    }

    /**
     * Initialize all test suites
     */
    async initializeTestSuites() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize test suites if available
        if (typeof WavelengthGemsMobileTests !== 'undefined') {
            this.testSuites.mobile = new WavelengthGemsMobileTests();
        }

        if (typeof WavelengthGemsDesktopTests !== 'undefined') {
            this.testSuites.desktop = new WavelengthGemsDesktopTests();
        }

        if (typeof WavelengthGemsGameMechanicsTests !== 'undefined') {
            this.testSuites.mechanics = new WavelengthGemsGameMechanicsTests();
        }

        if (typeof WavelengthGemsUIPolishTests !== 'undefined') {
            this.testSuites.polish = new WavelengthGemsUIPolishTests();
        }

        // Check which suites are available
        const availableSuites = Object.keys(this.testSuites).filter(key => this.testSuites[key] !== null);
        console.log(`🔧 Initialized test suites: ${availableSuites.join(', ')}`);
    }

    /**
     * Generate comprehensive master report
     */
    generateMasterReport() {
        const totalTime = this.endTime - this.startTime;
        
        console.log('\n📊 WAVELENGTH GEMS COMPREHENSIVE TEST REPORT');
        console.log('=' .repeat(70));
        console.log(`⏱️  Total Test Time: ${Math.round(totalTime)}ms`);
        console.log(`📅 Test Date: ${new Date().toLocaleString()}`);
        console.log(`💻 Test Environment: ${window.innerWidth}x${window.innerHeight} (${this.getDeviceType()})`);
        
        // Summary statistics
        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        let suitesWithErrors = 0;

        const suiteStats = {};
        
        Object.keys(this.masterResults).forEach(suiteName => {
            const result = this.masterResults[suiteName];
            
            if (result.error) {
                suitesWithErrors++;
                suiteStats[suiteName] = { error: result.error };
                return;
            }

            // Extract stats from different result formats
            let suiteTotal = 0;
            let suitePassed = 0;
            let suiteFailed = 0;

            if (result.summary) {
                suiteTotal = result.summary.total || 0;
                suitePassed = result.summary.passed || 0;
                suiteFailed = result.summary.failed || 0;
            } else if (Array.isArray(result)) {
                suiteTotal = result.length;
                suitePassed = result.filter(r => r.passed).length;
                suiteFailed = suiteTotal - suitePassed;
            }

            totalTests += suiteTotal;
            totalPassed += suitePassed;
            totalFailed += suiteFailed;

            suiteStats[suiteName] = {
                total: suiteTotal,
                passed: suitePassed,
                failed: suiteFailed,
                passRate: suiteTotal > 0 ? Math.round((suitePassed / suiteTotal) * 100) : 0
            };
        });

        const overallPassRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

        console.log('\n📈 Overall Test Results:');
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Passed: ${totalPassed} (${overallPassRate}%)`);
        console.log(`   Failed: ${totalFailed}`);
        console.log(`   Suite Errors: ${suitesWithErrors}`);

        // Suite breakdown
        console.log('\n🧪 Test Suite Breakdown:');
        const suiteEmojis = {
            mechanics: '🎮',
            mobile: '📱',
            desktop: '🖥️',
            polish: '✨'
        };

        Object.keys(suiteStats).forEach(suiteName => {
            const stats = suiteStats[suiteName];
            const emoji = suiteEmojis[suiteName] || '🔧';
            
            if (stats.error) {
                console.log(`   ${emoji} ${suiteName.toUpperCase()}: ❌ ERROR - ${stats.error}`);
            } else {
                const status = stats.passRate >= 90 ? '🟢' : 
                              stats.passRate >= 75 ? '🟡' : 
                              stats.passRate >= 50 ? '🟠' : '🔴';
                console.log(`   ${emoji} ${suiteName.toUpperCase()}: ${status} ${stats.passed}/${stats.total} (${stats.passRate}%)`);
            }
        });

        // Critical issues
        const criticalIssues = this.identifyCriticalIssues(suiteStats);
        if (criticalIssues.length > 0) {
            console.log('\n🚨 Critical Issues:');
            criticalIssues.forEach(issue => {
                console.log(`   🔴 ${issue}`);
            });
        }

        // Recommendations
        const recommendations = this.generateRecommendations(suiteStats, overallPassRate);
        if (recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            recommendations.forEach(rec => {
                console.log(`   ${rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢'} ${rec.action}`);
            });
        }

        // Polish opportunities (if available)
        if (this.masterResults.polish && this.masterResults.polish.polishOpportunities) {
            const polishOpps = this.masterResults.polish.polishOpportunities;
            const highPriorityPolish = polishOpps.filter(opp => opp.priority === 'HIGH');
            
            if (highPriorityPolish.length > 0) {
                console.log('\n✨ High Priority Polish Opportunities:');
                highPriorityPolish.forEach(opp => {
                    console.log(`   🔶 ${opp.description}`);
                });
            }
        }

        // Overall assessment
        console.log('\n🏆 Overall Assessment:');
        const assessment = this.generateOverallAssessment(overallPassRate, suitesWithErrors, criticalIssues.length);
        console.log(`   ${assessment.emoji} ${assessment.status}: ${assessment.description}`);

        // Next steps
        console.log('\n🚀 Recommended Next Steps:');
        const nextSteps = this.generateNextSteps(assessment, criticalIssues);
        nextSteps.forEach((step, index) => {
            console.log(`   ${index + 1}. ${step}`);
        });

        console.log('\n' + '=' .repeat(70));

        return {
            summary: {
                totalTests,
                totalPassed,
                totalFailed,
                overallPassRate,
                suitesWithErrors,
                testTime: totalTime,
                deviceType: this.getDeviceType(),
                viewport: { width: window.innerWidth, height: window.innerHeight }
            },
            suiteStats,
            criticalIssues,
            recommendations,
            assessment,
            nextSteps,
            rawResults: this.masterResults
        };
    }

    /**
     * Identify critical issues across all test suites
     */
    identifyCriticalIssues(suiteStats) {
        const issues = [];

        // Check for suite errors
        Object.keys(suiteStats).forEach(suite => {
            if (suiteStats[suite].error) {
                issues.push(`${suite.toUpperCase()} test suite failed to run: ${suiteStats[suite].error}`);
            }
        });

        // Check for low pass rates in critical suites
        const criticalSuites = ['mechanics', 'mobile'];
        criticalSuites.forEach(suite => {
            const stats = suiteStats[suite];
            if (stats && !stats.error && stats.passRate < 70) {
                issues.push(`${suite.toUpperCase()} test suite has low pass rate: ${stats.passRate}%`);
            }
        });

        // Check for mobile-specific issues
        if (this.getDeviceType() === 'mobile' && suiteStats.mobile && suiteStats.mobile.passRate < 80) {
            issues.push('Mobile experience needs immediate attention for mobile users');
        }

        // Check for core functionality issues
        if (suiteStats.mechanics && suiteStats.mechanics.passRate < 90) {
            issues.push('Core game mechanics have issues that affect gameplay');
        }

        return issues;
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations(suiteStats, overallPassRate) {
        const recommendations = [];

        // Overall performance recommendations
        if (overallPassRate < 80) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Address failed tests to improve overall system stability'
            });
        }

        // Suite-specific recommendations
        Object.keys(suiteStats).forEach(suite => {
            const stats = suiteStats[suite];
            if (stats.error) {
                recommendations.push({
                    priority: 'HIGH',
                    action: `Fix ${suite} test suite initialization issues`
                });
            } else if (stats.passRate < 75) {
                recommendations.push({
                    priority: stats.passRate < 50 ? 'HIGH' : 'MEDIUM',
                    action: `Improve ${suite} functionality (${stats.failed} failed tests)`
                });
            }
        });

        // Device-specific recommendations
        const deviceType = this.getDeviceType();
        if (deviceType === 'mobile' && suiteStats.mobile && suiteStats.mobile.passRate < 85) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Prioritize mobile experience improvements for mobile users'
            });
        }

        // Polish recommendations
        if (suiteStats.polish && suiteStats.polish.passRate < 85) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Address UI polish opportunities to improve user experience'
            });
        }

        return recommendations;
    }

    /**
     * Generate overall assessment
     */
    generateOverallAssessment(passRate, errors, criticalIssues) {
        if (errors > 0 || criticalIssues > 2) {
            return {
                emoji: '🔴',
                status: 'CRITICAL',
                description: 'Multiple critical issues require immediate attention'
            };
        } else if (passRate < 70) {
            return {
                emoji: '🟠',
                status: 'NEEDS WORK',
                description: 'Significant improvements needed before production'
            };
        } else if (passRate < 85) {
            return {
                emoji: '🟡',
                status: 'GOOD PROGRESS',
                description: 'On track with some areas needing attention'
            };
        } else if (passRate < 95) {
            return {
                emoji: '🟢',
                status: 'EXCELLENT',
                description: 'High quality with minor improvements possible'
            };
        } else {
            return {
                emoji: '✨',
                status: 'OUTSTANDING',
                description: 'Production-ready with exceptional quality'
            };
        }
    }

    /**
     * Generate next steps based on assessment
     */
    generateNextSteps(assessment, criticalIssues) {
        const steps = [];

        if (assessment.status === 'CRITICAL') {
            steps.push('🚨 Address all critical issues immediately');
            steps.push('🔧 Re-run test suites after fixes to verify improvements'); 
            steps.push('👥 Consider code review for affected systems');
        } else if (assessment.status === 'NEEDS WORK') {
            steps.push('📋 Prioritize failed tests by impact and effort');
            steps.push('🎯 Focus on core gameplay mechanics first');
            steps.push('📱 Ensure mobile experience meets standards');
        } else if (assessment.status === 'GOOD PROGRESS') {
            steps.push('✨ Address UI polish opportunities');
            steps.push('🧪 Run tests across different devices/browsers');
            steps.push('📊 Monitor performance metrics in production');
        } else {
            steps.push('🎉 Consider this milestone complete');
            steps.push('📈 Monitor user feedback and analytics');
            steps.push('🚀 Plan next iteration improvements');
        }

        // Always include these
        steps.push('💾 Save test results for baseline comparison');
        steps.push('📝 Document any test environment or configuration issues');

        return steps;
    }

    /**
     * Quick test runner for development
     */
    async runQuickTest() {
        console.log('⚡ Running Quick Wavelength Gems Test...');
        
        await this.initializeTestSuites();
        
        // Run only essential tests
        const quickResults = {};
        
        if (this.testSuites.mechanics) {
            console.log('🎮 Quick mechanics check...');
            quickResults.mechanics = await this.testSuites.mechanics.runAllMechanicsTests();
        }

        const deviceType = this.getDeviceType();
        if (deviceType === 'mobile' && this.testSuites.mobile) {
            console.log('📱 Quick mobile check...');
            quickResults.mobile = await this.testSuites.mobile.runAllMobileTests();
        } else if (this.testSuites.desktop) {
            console.log('🖥️ Quick desktop check...');
            quickResults.desktop = await this.testSuites.desktop.runAllDesktopTests();
        }

        console.log('\n⚡ Quick Test Summary:');
        Object.keys(quickResults).forEach(suite => {
            const result = quickResults[suite];
            const passed = result.summary ? result.summary.passed : 0;
            const total = result.summary ? result.summary.total : 0;
            const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
            
            console.log(`   ${suite}: ${passed}/${total} (${passRate}%)`);
        });

        return quickResults;
    }

    /**
     * Get device type
     */
    getDeviceType() {
        const width = window.innerWidth;
        return width <= 768 ? 'mobile' : width <= 1024 ? 'tablet' : 'desktop';
    }

    /**
     * Generate test configuration for specific scenarios
     */
    generateTestConfig(scenario) {
        const configs = {
            development: {
                includeMechanics: true,
                includeMobile: true,
                includeDesktop: true,
                includePolish: false, // Skip polish in development
                timeout: 10000
            },
            staging: {
                includeMechanics: true,
                includeMobile: true,
                includeDesktop: true,
                includePolish: true,
                timeout: 30000
            },
            production: {
                includeMechanics: true,
                includeMobile: true,
                includeDesktop: false, // Focus on mobile for production
                includePolish: true,
                timeout: 20000
            },
            quick: {
                includeMechanics: true,
                includeMobile: this.getDeviceType() === 'mobile',
                includeDesktop: this.getDeviceType() !== 'mobile',
                includePolish: false,
                timeout: 5000
            }
        };

        return configs[scenario] || configs.development;
    }
}

// Global master test suite instance
window.wavelengthGemsMasterTestSuite = new WavelengthGemsMasterTestSuite();

// Global test runner functions
window.runAllWavelengthGemsTests = async function() {
    return await window.wavelengthGemsMasterTestSuite.runAllTests();
};

window.runQuickWavelengthGemsTests = async function() {
    return await window.wavelengthGemsMasterTestSuite.runQuickTest();
};

window.runWavelengthGemsTestSuite = async function(suiteName) {
    return await window.wavelengthGemsMasterTestSuite.runTestSuite(suiteName);
};

// Auto-run detection for test automation
if (window.location.search.includes('autotest=true')) {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🤖 Auto-running tests due to autotest parameter...');
        await window.runAllWavelengthGemsTests();
    });
}

console.log('🧪 Wavelength Gems Master Test Suite loaded!');
console.log('');
console.log('Available Commands:');
console.log('  runAllWavelengthGemsTests()     - Run complete test suite');
console.log('  runQuickWavelengthGemsTests()   - Run essential tests only');
console.log('  runWavelengthGemsTestSuite(name) - Run specific suite (mobile/desktop/mechanics/polish)');
console.log('');