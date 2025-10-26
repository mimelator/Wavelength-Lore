/**
 * Retry Threshold Test Runner
 * A utility script to test the retry threshold system
 * 
 * This test runner provides a UI and automation for testing the retry threshold system.
 * It can be accessed from:
 * 1. Console via window.thresholdTests
 * 2. Admin panel button
 */

const ThresholdTestRunner = {
    // Configuration
    config: {
        testDelay: 500, // ms delay between test steps
        logPrefix: '🧪 THRESHOLD TEST:'
    },
    
    /**
     * Initialize the test runner
     */
    init() {
        console.log(`${this.config.logPrefix} Test runner initialized`);
        
        // Create test button on page
        this.createTestUI();
    },
    
    /**
     * Create simple UI for running tests
     */
    createTestUI() {
        // Only add to admin panel - no standalone button
        const addedToPanel = this.addToAdminPanel();
        if (addedToPanel) {
            console.log(`${this.config.logPrefix} Added test button to admin panel`);
        } else {
            console.log(`${this.config.logPrefix} Couldn't add test button to admin panel`);
            // No standalone button - functionality will be available via console
        }
    },
    
    /**
     * Try to add test button to admin panel
     */
    addToAdminPanel() {
        console.log(`${this.config.logPrefix} Attempting to add button to admin panel`);
        
        // Look for the admin panel
        const adminPanel = document.querySelector('.admin-panel');
        if (!adminPanel) {
            console.log(`${this.config.logPrefix} Admin panel not found, will create floating button`);
            return false;
        }
        
        // Add directly to the Retry Threshold Controls section if it exists
        const allHeadings = adminPanel.querySelectorAll('.admin-section h4');
        let thresholdSection = null;
        
        // Find the section heading with Retry Threshold Controls text
        for (const heading of allHeadings) {
            if (heading.textContent.includes('Retry Threshold Controls')) {
                thresholdSection = heading;
                break;
            }
        }
        
        if (thresholdSection) {
            const parentSection = thresholdSection.closest('.admin-section');
            if (parentSection) {
                console.log(`${this.config.logPrefix} Found retry threshold section, adding button there`);
                
                // Create the button row
                const buttonRow = document.createElement('div');
                buttonRow.className = 'admin-row';
                
                // Create test button
                const testButton = document.createElement('button');
                testButton.className = 'admin-btn admin-btn-primary';
                testButton.style.backgroundColor = '#9b59b6';
                testButton.textContent = '🧪 Run Threshold Tests';
                testButton.addEventListener('click', () => this.showTestMenu());
                
                // Add button to row
                buttonRow.appendChild(testButton);
                parentSection.appendChild(buttonRow);
                
                return true;
            }
        }
        
        // Otherwise add to Quick Actions section
        let quickActionsSection = null;
        
        // Find the section heading with Quick Actions text
        for (const heading of allHeadings) {
            if (heading.textContent.includes('Quick Actions')) {
                quickActionsSection = heading;
                break;
            }
        }
        
        if (quickActionsSection) {
            const parentSection = quickActionsSection.closest('.admin-section');
            if (parentSection) {
                console.log(`${this.config.logPrefix} Adding button to quick actions section`);
                
                // Create the button row
                const buttonRow = document.createElement('div');
                buttonRow.className = 'admin-row';
                
                // Create test button
                const testButton = document.createElement('button');
                testButton.className = 'admin-btn';
                testButton.style.backgroundColor = '#9b59b6'; 
                testButton.textContent = '🧪 Run Threshold Tests';
                testButton.addEventListener('click', () => this.showTestMenu());
                
                // Add button to row
                buttonRow.appendChild(testButton);
                parentSection.appendChild(buttonRow);
                
                return true;
            }
        }
        
        // Create a new section as last resort
        const lastSection = adminPanel.querySelector('.admin-panel-content > .admin-section:last-child');
        if (lastSection) {
            console.log(`${this.config.logPrefix} Creating new section for testing tools`);
            
            const testingSection = document.createElement('div');
            testingSection.className = 'admin-section';
            
            const sectionHeader = document.createElement('h4');
            sectionHeader.textContent = '🧪 Threshold Testing';
            testingSection.appendChild(sectionHeader);
            
            // Create the button row
            const buttonRow = document.createElement('div');
            buttonRow.className = 'admin-row';
            
            // Create test button
            const testButton = document.createElement('button');
            testButton.className = 'admin-btn';
            testButton.style.backgroundColor = '#9b59b6';
            testButton.textContent = '🧪 Run Threshold Tests';
            testButton.addEventListener('click', () => this.showTestMenu());
            
            // Add button to row and section
            buttonRow.appendChild(testButton);
            testingSection.appendChild(buttonRow);
            
            // Insert after the last section
            lastSection.parentNode.insertBefore(testingSection, lastSection.nextSibling);
            
            return true;
        }
        
        return false;
    },
    
    /**
     * Show test menu with options
     */
    showTestMenu() {
        const menu = document.createElement('div');
        menu.style.position = 'fixed';
        menu.style.top = '50%';
        menu.style.left = '50%';
        menu.style.transform = 'translate(-50%, -50%)';
        menu.style.backgroundColor = '#2c3e50';
        menu.style.padding = '20px';
        menu.style.borderRadius = '10px';
        menu.style.zIndex = '10000';
        menu.style.width = '80%';
        menu.style.maxWidth = '600px';
        menu.style.maxHeight = '90vh';
        menu.style.overflow = 'auto';
        menu.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        menu.style.color = 'white';
        
        // Get current threshold info
        const thresholdInfo = RetryThresholdManager.getThresholdInfo();
        
        menu.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #555; padding-bottom: 10px;">
                <h2 style="color: white; margin: 0;">🧪 Threshold Test Suite</h2>
                <button style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0;" onclick="this.parentNode.parentNode.remove()">&times;</button>
            </div>
            
            <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
                <div style="flex: 1; min-width: 250px;">
                    <h3 style="color: #a78bfa;">Current Threshold Status</h3>
                    <div style="background: #1a1a2e; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <div style="margin-bottom: 8px;">
                            <span style="color: #aaa;">Retries:</span>
                            <span style="float: right; font-weight: bold;">${thresholdInfo.retriesRemaining}/${thresholdInfo.retriesTotal}</span>
                        </div>
                        <div style="background: #111; border-radius: 5px; height: 10px; overflow: hidden;">
                            <div style="background: ${thresholdInfo.retriesRemaining === 0 ? '#e74c3c' : '#2ecc71'}; width: ${(thresholdInfo.retriesRemaining/thresholdInfo.retriesTotal)*100}%; height: 100%;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                            <div>
                                <span style="color: #aaa;">Next Reset:</span>
                                <div style="font-weight: bold;">${thresholdInfo.timeUntilReset}</div>
                            </div>
                            <div>
                                <span style="color: #aaa;">Period:</span>
                                <div style="font-weight: bold; text-align: right;">${thresholdInfo.thresholdPeriod}/${thresholdInfo.thresholdsPerDay}</div>
                            </div>
                        </div>
                    </div>
                    
                    <h3 style="color: #a78bfa;">Quick Actions</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;">
                        <button class="quick-action-btn" data-action="useRetry">Use Retry</button>
                        <button class="quick-action-btn" data-action="resetThreshold">Reset Threshold</button>
                        <button class="quick-action-btn" data-action="forceThreshold">Force Threshold Reached</button>
                        <button class="quick-action-btn" data-action="setShortTimer">Set 10s Reset Timer</button>
                    </div>
                </div>
                
                <div style="flex: 1; min-width: 250px;">
                    <h3 style="color: #a78bfa;">Automated Tests</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button class="test-btn" data-test="basicThresholdCycle">🔄 Basic Threshold Cycle</button>
                        <button class="test-btn" data-test="retryFlow">� Retry Flow</button>
                        <button class="test-btn" data-test="resetTimerTest">⏱️ Reset Timer Test</button>
                        <button class="test-btn" data-test="multiSessionTest">👥 Multi-Session Test</button>
                        <button class="test-btn" data-test="resetAllData">🔄 Reset All Data</button>
                    </div>
                </div>
            </div>
            
            <div style="border-top: 1px solid #555; padding-top: 10px; font-size: 12px; color: #aaa; text-align: center;">
                Check browser console for detailed test output. Press F12 to open Developer Tools.
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Style the buttons
        const testBtns = menu.querySelectorAll('.test-btn');
        testBtns.forEach(btn => {
            btn.style.padding = '12px 15px';
            btn.style.backgroundColor = '#3498db';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            btn.style.fontWeight = 'bold';
            btn.style.textAlign = 'left';
            
            btn.addEventListener('click', () => {
                menu.remove();
                const testName = btn.dataset.test;
                this.runTest(testName);
            });
        });
        
        // Style quick action buttons
        const quickActionBtns = menu.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach(btn => {
            btn.style.padding = '8px 12px';
            btn.style.backgroundColor = '#9b59b6';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.performQuickAction(action);
                menu.remove();
                // Reopen the menu to show updated state
                setTimeout(() => this.showTestMenu(), 500);
            });
        });
    },
    
    /**
     * Run a specific test by name
     */
    async runTest(testName) {
        console.group(`${this.config.logPrefix} Running test: ${testName}`);
        
        switch (testName) {
            case 'basicThresholdCycle':
                await this.runBasicThresholdCycleTest();
                break;
            case 'retryFlow':
                await this.runRetryFlowTest();
                break;
            case 'resetTimerTest':
                await this.runResetTimerTest();
                break;
            case 'multiSessionTest':
                await this.runMultiSessionTest();
                break;
            case 'resetAllData':
                await this.resetAllData();
                break;
            default:
                console.log(`${this.config.logPrefix} Unknown test: ${testName}`);
        }
        
        console.groupEnd();
    },
    
    /**
     * Test the basic threshold cycle
     */
    async runBasicThresholdCycleTest() {
        console.log(`${this.config.logPrefix} Running Basic Threshold Cycle Test`);
        
        // Ensure RetryThresholdManager is available
        if (!window.RetryThresholdManager) {
            console.error(`${this.config.logPrefix} RetryThresholdManager not available!`);
            alert('RetryThresholdManager not available!');
            return;
        }
        
        // Step 1: Reset the threshold to start fresh
        console.log(`${this.config.logPrefix} Step 1: Reset threshold`);
        RetryThresholdManager.resetThreshold(true);
        await this.delay();
        
        // Step 2: Check initial state
        console.log(`${this.config.logPrefix} Step 2: Check initial state`);
        this.logThresholdState();
        await this.delay();
        
        // Step 3: Use retries one by one until threshold is reached
        const limit = RetryThresholdManager.thresholdConfig.defaultDailyLimit;
        console.log(`${this.config.logPrefix} Step 3: Using ${limit} retries one by one`);
        
        for (let i = 0; i < limit; i++) {
            const useResult = RetryThresholdManager.useRetry();
            console.log(`${this.config.logPrefix} Used retry ${i+1}/${limit} - Result: ${useResult}`);
            this.logThresholdState();
            await this.delay();
        }
        
        // Step 4: Try to use one more retry (should fail)
        console.log(`${this.config.logPrefix} Step 4: Trying to use one more retry (should fail)`);
        const extraResult = RetryThresholdManager.useRetry();
        console.log(`${this.config.logPrefix} Extra retry result: ${extraResult} (expected: false)`);
        this.logThresholdState();
        await this.delay();
        
        // Step 5: Reset threshold and check state
        console.log(`${this.config.logPrefix} Step 5: Reset threshold again`);
        RetryThresholdManager.resetThreshold(true);
        await this.delay();
        this.logThresholdState();
        
        console.log(`${this.config.logPrefix} Basic Threshold Cycle Test completed`);
        alert('Basic Threshold Cycle Test completed - Check console for details');
    },
    
    /**
     * Test the retry flow
     */
    async runRetryFlowTest() {
        console.log(`${this.config.logPrefix} Running Retry Flow Test`);
        
        // Check if necessary components are available
        if (!window.RetryThresholdManager) {
            console.error(`${this.config.logPrefix} Required components not available!`);
            alert('Required components not available!');
            return;
        }
        
        // Step 1: Force threshold to be reached
        console.log(`${this.config.logPrefix} Step 1: Force threshold to be reached`);
        const limit = RetryThresholdManager.thresholdConfig.defaultDailyLimit;
        RetryThresholdManager.currentState.retriesUsed = limit;
        RetryThresholdManager.saveState();
        this.logThresholdState();
        await this.delay();
        
        // Step 2: Verify threshold is reached
        console.log(`${this.config.logPrefix} Step 2: Verify threshold is reached`);
        const isAtThreshold = RetryThresholdManager.isThresholdReached();
        console.log(`${this.config.logPrefix} Is at threshold: ${isAtThreshold} (expected: true)`);
        await this.delay();
        
        // Step 3: Set up test callback for ad viewing
        console.log(`${this.config.logPrefix} Step 3: Setting up ad callback test`);
        const adCallback = () => {
            console.log(`${this.config.logPrefix} Ad callback executed`);
            alert('Ad reward callback executed successfully');
        };
        await this.delay();
        
        // Step 4: Show retry threshold modal (ads removed)
        console.log(`${this.config.logPrefix} Step 4: Show retry threshold modal`);
        if (typeof showRetryThresholdReachedModal === 'function') {
            showRetryThresholdReachedModal();
        } else {
            console.log(`${this.config.logPrefix} Retry threshold modal function not available`);
        }
        await this.delay(2000);
        
        // Step 5: Simulate clicking the ad accept button
        console.log(`${this.config.logPrefix} Step 5: Simulate clicking accept button`);
        console.log(`${this.config.logPrefix} (Manual action needed) Click 'Watch Video' in the dialog`);
        alert('Please click "Watch Video" in the dialog to continue the test');
        
        console.log(`${this.config.logPrefix} Retry Flow Test completed`);
    },
    
    /**
     * Test the reset timer functionality
     */
    async runResetTimerTest() {
        console.log(`${this.config.logPrefix} Running Reset Timer Test`);
        
        // Ensure RetryThresholdManager is available
        if (!window.RetryThresholdManager) {
            console.error(`${this.config.logPrefix} RetryThresholdManager not available!`);
            alert('RetryThresholdManager not available!');
            return;
        }
        
        // Step 1: Reset the threshold
        console.log(`${this.config.logPrefix} Step 1: Reset threshold`);
        RetryThresholdManager.resetThreshold(true);
        this.logThresholdState();
        await this.delay();
        
        // Step 2: Force a short reset timer for testing
        console.log(`${this.config.logPrefix} Step 2: Force a short reset timer (10 seconds)`);
        const now = new Date().getTime();
        RetryThresholdManager.currentState.nextResetTime = now + (10 * 1000); // 10 seconds
        RetryThresholdManager.saveState();
        this.logThresholdState();
        await this.delay();
        
        // Step 3: Use all retries
        console.log(`${this.config.logPrefix} Step 3: Use all retries`);
        const limit = RetryThresholdManager.thresholdConfig.defaultDailyLimit;
        RetryThresholdManager.currentState.retriesUsed = limit;
        RetryThresholdManager.saveState();
        this.logThresholdState();
        await this.delay();
        
        // Step 4: Wait for timer to expire
        console.log(`${this.config.logPrefix} Step 4: Wait for timer to expire (10 seconds)`);
        console.log(`${this.config.logPrefix} Current time: ${new Date().toLocaleTimeString()}`);
        console.log(`${this.config.logPrefix} Reset time: ${new Date(RetryThresholdManager.currentState.nextResetTime).toLocaleTimeString()}`);
        
        // Create more accurate countdown that shows actual time remaining
        const resetTime = RetryThresholdManager.currentState.nextResetTime;
        const startWaitTime = new Date().getTime();
        let elapsedTime = 0;
        let autoResetDetected = false;
        
        // Set up listener for auto-reset event
        const autoResetListener = () => {
            console.log(`${this.config.logPrefix} Auto reset event detected!`);
            autoResetDetected = true;
        };
        
        // Add event listener
        window.addEventListener('retryThresholdAutoReset', autoResetListener);
        
        try {
            // Show alert to watch for reset
            alert('The test will now wait for the timer to reset (10 seconds). Watch for auto-reset notification!');
            
            // Start countdown
            while (elapsedTime < 12000) { // 12 seconds max (buffer of 2 seconds)
                const now = new Date().getTime();
                elapsedTime = now - startWaitTime;
                const remaining = Math.max(0, Math.ceil((resetTime - now) / 1000));
                
                console.log(`${this.config.logPrefix} Waiting... ${remaining} seconds remaining`);
                console.log(`${this.config.logPrefix} Time until reset: ${RetryThresholdManager.getTimeUntilNextReset()}`);
                
                // Check if auto reset was detected
                if (autoResetDetected) {
                    console.log(`${this.config.logPrefix} Auto reset notification was shown!`);
                    break;
                }
                
                await this.delay(1000);
                
                // If we've reached the reset time, force a check
                if (now >= resetTime) {
                    console.log(`${this.config.logPrefix} Reset time reached! Checking for updates...`);
                    RetryThresholdManager.checkTimeBasedUpdates();
                    
                    // If we still haven't detected auto-reset, but retries are reset, we're done
                    if (RetryThresholdManager.getRemainingRetries() > 0) {
                        console.log(`${this.config.logPrefix} Reset confirmed - retries available again`);
                        break;
                    }
                }
            }
        } finally {
            // Always clean up the event listener
            window.removeEventListener('retryThresholdAutoReset', autoResetListener);
        }
        
        // Step 5: Check if reset happened automatically
        console.log(`${this.config.logPrefix} Step 5: Check if reset happened automatically`);
        RetryThresholdManager.checkTimeBasedUpdates(); // Force check
        this.logThresholdState();
        await this.delay();
        
        // Step 6: Try using a retry
        console.log(`${this.config.logPrefix} Step 6: Try using a retry after reset`);
        const useResult = RetryThresholdManager.useRetry();
        console.log(`${this.config.logPrefix} Use retry result: ${useResult} (expected: true)`);
        this.logThresholdState();
        
        console.log(`${this.config.logPrefix} Reset Timer Test completed`);
        alert('Reset Timer Test completed - Check console for details');
    },
    
    /**
     * Test multiple session behavior
     */
    async runMultiSessionTest() {
        console.log(`${this.config.logPrefix} Running Multi-Session Test`);
        
        // Ensure RetryThresholdManager is available
        if (!window.RetryThresholdManager) {
            console.error(`${this.config.logPrefix} RetryThresholdManager not available!`);
            alert('RetryThresholdManager not available!');
            return;
        }
        
        // Step 1: Set up a known state
        console.log(`${this.config.logPrefix} Step 1: Set up a known state`);
        RetryThresholdManager.resetThreshold(true);
        RetryThresholdManager.currentState.retriesUsed = 2; // 2 retries used
        RetryThresholdManager.saveState();
        this.logThresholdState();
        await this.delay();
        
        // Step 2: Simulate closing and reopening page (reload localStorage)
        console.log(`${this.config.logPrefix} Step 2: Simulate page reload (reload from localStorage)`);
        RetryThresholdManager.currentState = {}; // Clear in-memory state
        RetryThresholdManager.loadState(); // Reload from localStorage
        this.logThresholdState();
        await this.delay();
        
        // Step 3: Use another retry
        console.log(`${this.config.logPrefix} Step 3: Use another retry after "reload"`);
        const useResult = RetryThresholdManager.useRetry();
        console.log(`${this.config.logPrefix} Use retry result: ${useResult}`);
        this.logThresholdState();
        await this.delay();
        
        // Step 4: Set up for day change test
        console.log(`${this.config.logPrefix} Step 4: Set up for day change test`);
        // Set "last reset day" to yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        RetryThresholdManager.currentState.lastResetDay = yesterday.toDateString();
        RetryThresholdManager.saveState();
        this.logThresholdState();
        await this.delay();
        
        // Step 5: Trigger day change check
        console.log(`${this.config.logPrefix} Step 5: Trigger day change check`);
        RetryThresholdManager.checkTimeBasedUpdates();
        this.logThresholdState();
        await this.delay();
        
        console.log(`${this.config.logPrefix} Multi-Session Test completed`);
        alert('Multi-Session Test completed - Check console for details');
    },
    
    /**
     * Reset all threshold data
     */
    async resetAllData() {
        console.log(`${this.config.logPrefix} Resetting all threshold data`);
        
        if (!window.RetryThresholdManager) {
            console.error(`${this.config.logPrefix} RetryThresholdManager not available!`);
            alert('RetryThresholdManager not available!');
            return;
        }
        
        // Clear localStorage
        localStorage.removeItem(RetryThresholdManager.thresholdConfig.storageKey);
        
        // Reset in-memory state
        RetryThresholdManager.resetThreshold(true);
        
        console.log(`${this.config.logPrefix} All threshold data reset`);
        this.logThresholdState();
        
        alert('All threshold data has been reset');
    },
    
    /**
     * Perform a quick action from the test menu
     */
    performQuickAction(action) {
        if (!window.RetryThresholdManager) {
            console.error(`${this.config.logPrefix} RetryThresholdManager not available!`);
            return;
        }
        
        console.log(`${this.config.logPrefix} Performing quick action: ${action}`);
        
        switch (action) {
            case 'useRetry':
                const result = RetryThresholdManager.useRetry();
                console.log(`${this.config.logPrefix} Used retry - Result: ${result}`);
                break;
                
            case 'resetThreshold':
                RetryThresholdManager.resetThreshold(true);
                console.log(`${this.config.logPrefix} Threshold reset`);
                break;
                
            case 'forceThreshold':
                // Set retries used to max
                RetryThresholdManager.currentState.retriesUsed = RetryThresholdManager.thresholdConfig.defaultDailyLimit;
                RetryThresholdManager.saveState();
                console.log(`${this.config.logPrefix} Forced threshold reached`);
                break;
                
            case 'setShortTimer':
                const now = new Date().getTime();
                const tenSeconds = now + (10 * 1000); // 10 seconds from now
                RetryThresholdManager.currentState.nextResetTime = tenSeconds;
                RetryThresholdManager.saveState();
                const timeUntilReset = RetryThresholdManager.getTimeUntilNextReset();
                console.log(`${this.config.logPrefix} Set reset timer to 10 seconds (${timeUntilReset})`);
                console.log(`${this.config.logPrefix} Current time: ${new Date(now).toLocaleTimeString()}`);
                console.log(`${this.config.logPrefix} Reset time: ${new Date(tenSeconds).toLocaleTimeString()}`);
                break;
        }
        
        this.logThresholdState();
    },
    
    /**
     * Log current threshold state
     */
    logThresholdState() {
        if (!window.RetryThresholdManager) return;
        
        const info = RetryThresholdManager.getThresholdInfo();
        
        console.group(`${this.config.logPrefix} Threshold State`);
        console.log(`Retries Used: ${info.retriesUsed}/${info.retriesTotal}`);
        console.log(`Retries Remaining: ${info.retriesRemaining}`);
        console.log(`At Threshold: ${info.isAtThreshold}`);
        console.log(`Next Reset: ${info.timeUntilReset}`);
        console.log(`Threshold Period: ${info.thresholdPeriod}/${info.thresholdsPerDay}`);
        console.log(`Full Info:`, info);
        console.groupEnd();
    },
    
    /**
     * Utility delay function
     */
    delay(ms = this.config.testDelay) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment for the game to initialize
    setTimeout(() => {
        ThresholdTestRunner.init();
    }, 2000);
});