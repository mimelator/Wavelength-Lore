# Retry Threshold System - Manual Testing Steps

## Overview

This document outlines the manual testing steps for the Retry Threshold System in Wavelength Gems. The system limits the number of free retries a player can use within a time period, with automatic resets after a configured interval.

## Prerequisites

- Open Wavelength Gems game in a browser
- Access to the admin panel (Ctrl+Shift+D or Cmd+Shift+D on Mac)
- Developer console open (F12)

## Test Cases

### 1. Basic Threshold Functionality

**Objective:** Verify that retry counting and threshold detection work correctly.

1. Open the Wavelength Gems game
2. Click "Test Threshold" button in the bottom-right corner
3. Click "Reset Threshold" to start with all retries available
4. Verify the initial state shows full retries (e.g. 5/5)
5. Click "Use Retry" several times
6. Verify:
   - Retry count decreases with each use
   - Progress bar updates correctly
   - When all retries are used, status should show "At Threshold"

**Expected Result:** Threshold system correctly tracks retry usage and detects when threshold is reached.

### 2. Timer Reset Functionality

**Objective:** Verify that the threshold automatically resets after the timer expires.

1. Force the threshold to be reached by clicking "Force Threshold Reached"
2. Click "Set 10s Reset Timer" to set a short reset timer
3. Wait 10 seconds without refreshing the page
4. Verify:
   - A notification appears showing "Your free retries have been refreshed!"
   - Retry count automatically resets to full (e.g. 5/5)
   - Status updates to "Below Threshold"

**Expected Result:** Threshold automatically resets when timer expires, without requiring page refresh.

### 3. Persistence Between Sessions

**Objective:** Verify that threshold state persists between page reloads.

1. Reset the threshold and use a specific number of retries (e.g., 2)
2. Refresh the browser page
3. Open the test UI again
4. Verify:
   - Retry count still shows the same value (e.g., 3/5 if 2 were used)
   - Timer countdown continues from where it left off

**Expected Result:** Threshold state persists correctly between page reloads.

### 4. Day Change Behavior

**Objective:** Verify that threshold fully resets on day change.

1. Use automated test "Multi-Session Test" which simulates day change
2. Verify:
   - Console logs show "New day detected, performing full threshold reset"
   - All retries are available again
   - Period counter resets to 1

**Expected Result:** Full threshold reset occurs on day change.

### 5. Automated Test Suite Execution

**Objective:** Verify all automated test scenarios pass.

1. Open the test UI
2. Run each automated test one by one:
   - Basic Threshold Cycle
   - Reset Timer Test
   - Watch Ad Flow
   - Multi-Session Test
3. Monitor console logs for test progress and results

**Expected Result:** All automated tests complete successfully without errors.

## Edge Case Tests

### 1. Multiple Rapid Resets

**Objective:** Test system stability with multiple quick resets.

1. Set a 10-second timer and wait for reset
2. Immediately set another 10-second timer
3. Repeat 3-5 times in succession

**Expected Result:** System handles multiple rapid resets without errors or UI glitches.

### 2. Concurrent Timer Operations

**Objective:** Verify system behaves correctly with simultaneous operations.

1. Force threshold reached
2. Set a short timer
3. Before timer expires, try to use a retry (should fail)
4. Wait for timer to expire
5. Immediately try to use a retry (should succeed)

**Expected Result:** System maintains correct state during timer transitions.

## Issues to Watch For

- Infinite recursion or stack overflow errors
- UI not updating after timer expiration
- Incorrect retry count after page refresh
- Multiple notifications when timer resets
- Incorrect threshold period count after resets

## Test Results - October 22, 2025

✅ Basic Threshold Functionality - PASSED
✅ Timer Reset Functionality - PASSED
✅ Persistence Between Sessions - PASSED
✅ Day Change Behavior - PASSED
✅ Automated Test Suite Execution - PASSED
✅ Multiple Rapid Resets - PASSED
✅ Concurrent Timer Operations - PASSED

All tests have been successfully completed with no issues detected. The threshold system is working as expected and is ready for production deployment.