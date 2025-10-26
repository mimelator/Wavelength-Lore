# CRITICAL DEVELOPMENT REMINDERS

## ❌ NEVER DO THESE:

### 1. Server Management
- **NEVER** run `npm start` in foreground - it blocks the terminal
- **NEVER** run tests without `&` when server is running - kills the server
- **ALWAYS** check if server is running before starting: `lsof -i :3001`
- **ALWAYS** use background processes: `npm start > server.log 2>&1 &`

### 2. Process Management  
- **NEVER** kill all node processes with `pkill node` or similar
- **ALWAYS** target specific processes by PID
- **CHECK** what's running before killing: `ps aux | grep node`

### 3. Testing Protocol
- **ALWAYS** run tests in background when server is running: `npm test -- testfile &`
- **NEVER** run foreground tests when server is active
- **VERIFY** server status before and after tests

## ✅ CORRECT PATTERNS:

```bash
# Check server status
lsof -i :3001

# Start server properly  
npm start > server.log 2>&1 &

# Run tests safely
npm test -- tests/file.test.js > test.log 2>&1 &

# Check processes before killing
ps aux | grep "node.*3001"
kill [specific_PID]
```

## 🚨 PRODUCTIVITY IMPACT:
- Killing processes crashes VS Code
- Foreground commands block workflow  
- Repeated mistakes waste time
- Context switching hurts focus

**MEMORIZE THESE PATTERNS. NO MORE EXCUSES.**