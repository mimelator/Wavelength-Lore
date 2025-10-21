# Wavelength Gems Runtime Validator

## Overview
The GameValidator automatically detects board state issues, highlight problems, and visual inconsistencies in real-time during gameplay.

## Automatic Features

### 1. Continuous Validation (Every 1 Second)
- Automatically runs when game is not animating
- Checks all systems after each operation
- Logs detailed errors when issues are detected

### 2. Five Validation Types

#### Board Consistency
- Detects `undefined` values (should be `null` or gem type)
- Validates gem types are in allowed list
- Reports invalid board states

#### Visual Consistency  
- Compares DOM gems with internal board state
- Detects "phantom gems" (in DOM but not in state)
- Detects "missing gems" (in state but not in DOM)
- Reports type mismatches between DOM and state

#### Highlight Validity
- Ensures only 0 or 1 gem has `.selected` class
- Validates `gameState.selectedGem` matches DOM
- Detects orphaned `.valid-target` highlights

#### Adjacency Correctness
- Validates all `.valid-target` gems are exactly distance 1 from selected
- Checks that ALL adjacent gems are highlighted
- Reports non-adjacent or missing highlights

#### DOM Integrity
- Detects duplicate position keys
- Validates gem count matches board state
- Ensures no position conflicts

## Console Commands

### Start/Stop Validation
```javascript
startValidation(1000);  // Start checking every 1000ms (default)
stopValidation();        // Stop continuous checking
```

### Manual Check
```javascript
validateGame();  // Run all checks immediately
```

### View Summary
```javascript
validationSummary();  // Show stats: checks performed, errors found, error rate
```

### Clear Log
```javascript
gameValidator.clearLog();  // Reset error counters and history
```

## Error Output Format

When an error is detected, you'll see:

```
🚨 VALIDATION ERRORS DETECTED
  Check #42
  Timestamp: 3:45:23 PM
  
  ❌ highlightValidity (2 errors)
    Error 1: DOM has selected gem at [5][1] but gameState.selectedGem is null
    Details: {type: 'STATE_MISMATCH', domPosition: [5,1], statePosition: null}
    
    Error 2: 3 gems have .valid-target but no gem is selected
    Details: {type: 'ORPHANED_TARGETS', count: 3, positions: [[4,1],[6,1],[5,2]]}
  
  📊 Current Board State
    Row 0: jas | mil | dap | ivy | ech | atl | jas | mil
    Row 1: mil | dap | ivy | ech | atl | jas | mil | dap
    ...
```

## Integration Points

The validator automatically runs after:
1. `renderBoard()` completes (with 50ms delay)
2. `highlightValidTargets()` applies highlights (with 50ms delay)
3. Every 1 second during non-animated states

## Validation Flow

```
Game Operation → renderBoard() → Delay 50ms → validateGame()
                                             ↓
                                  Run 5 validation checks
                                             ↓
                                  Any errors? → Log detailed report
                                             ↓
                                  All passed → Silent (no output)
```

## Expected Behavior

### Normal Operation (No Errors)
- Validator runs silently
- No console output except periodic check indicators
- `validationSummary()` shows 0% error rate

### When Errors Occur
- Large red console output with full details
- Board state snapshot for context
- Specific position and type information
- Error count and categorization

## Debugging Workflow

1. **Play the game normally**
2. **Watch console for 🚨 VALIDATION ERRORS**
3. **When error appears:**
   - Note the error type and position
   - Check board state snapshot
   - Verify internal vs visual state
4. **Use `validationSummary()` to see error frequency**
5. **Use `gameValidator.errorLog` to review all errors**

## Performance Impact

- Minimal: Only runs when not animating
- Checks are fast (< 5ms typically)
- Can be disabled: `gameValidator.enabled = false`
- Can be stopped: `stopValidation()`

## Example Usage Session

```javascript
// Game loads - automatic validation starts
// Play for a while...

validationSummary();
// → { checksPerformed: 42, errorsFound: 3, errorRate: "7.14%" }

// Check specific error details
gameValidator.errorLog[0]
// → Full error object with all details

// If errors are consistent, fix the code
// Then clear log and test again
gameValidator.clearLog();
validationSummary();
// → { checksPerformed: 0, errorsFound: 0, errorRate: "N/A" }
```

## Common Error Patterns

### Multiple Selections
**Symptom:** `MULTIPLE_SELECTIONS` error
**Cause:** `highlightGem()` not clearing previous selections
**Fix:** Ensure `highlightGem()` clears all `.selected` before adding new

### Orphaned Targets
**Symptom:** `ORPHANED_TARGETS` error  
**Cause:** `.valid-target` classes not cleared when selection changes
**Fix:** Call `clearAllHighlights()` or `unhighlightGem()` properly

### Non-Adjacent Targets
**Symptom:** `NON_ADJACENT_TARGET` error
**Cause:** Wrong positions highlighted, distance != 1
**Fix:** Check `highlightValidTargets()` logic and position calculations

### Type Mismatches
**Symptom:** `TYPE_MISMATCH` error
**Cause:** DOM not updated after internal state change
**Fix:** Ensure `renderBoard()` updates gem types correctly

### Phantom/Missing Gems
**Symptom:** `PHANTOM_GEM` or `MISSING_GEM` error
**Cause:** DOM and board state out of sync
**Fix:** Check `animateGravity()` and `fillEmpty()` DOM updates
