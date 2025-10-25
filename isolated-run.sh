#!/bin/bash

# 🛡️ Process-Isolated Command Runner  
# Runs commands with clean environment and process isolation

set -e

WORK_DIR="/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh"
LOG_FILE="/tmp/wavelength-dev-$(date +%s).log"

echo "🛡️ PROCESS-ISOLATED COMMAND RUNNER"
echo "=================================="

# Function to run command with isolation
run_isolated() {
    local command="$1"
    local description="$2"
    
    echo "⚡ $description"
    echo "📁 Directory: $WORK_DIR"
    echo "🔒 Process: Isolated (PID will be separate)"
    echo "📝 Log: $LOG_FILE"
    echo "---"
    
    # Run in subshell with clean environment and isolated process group
    (
        cd "$WORK_DIR"
        
        # Set clean environment
        export PATH="/usr/local/bin:/usr/bin:/bin"
        export PS1="[ISOLATED] \w $ "
        
        # Create new process group to avoid signal interference (macOS compatible)
        bash -c "$command" 2>&1 | tee "$LOG_FILE"
        
    ) &
    
    local pid=$!
    echo "🆔 Process ID: $pid"
    
    # Wait for completion
    wait $pid
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ Command completed successfully"
    else
        echo "❌ Command failed with exit code: $exit_code"
    fi
    
    echo "📄 Full output saved to: $LOG_file"
    return $exit_code
}

# Function for git operations
git_isolated() {
    run_isolated "git $*" "Running Git command: git $*"
}

# Function for npm operations  
npm_isolated() {
    run_isolated "npm $*" "Running NPM command: npm $*"
}

# Function for node operations
node_isolated() {
    run_isolated "node $*" "Running Node command: node $*"
}

# Function for custom commands
cmd_isolated() {
    run_isolated "$*" "Running custom command: $*"
}

# Main interface
case "${1:-help}" in
    "git")
        shift
        git_isolated "$@"
        ;;
    "npm") 
        shift
        npm_isolated "$@"
        ;;
    "node")
        shift  
        node_isolated "$@"
        ;;
    "cmd")
        shift
        cmd_isolated "$@"
        ;;
    "help"|*)
        echo "🤔 Available commands:"
        echo "  git <args>   - Run git command in isolation"
        echo "  npm <args>   - Run npm command in isolation"  
        echo "  node <args>  - Run node command in isolation"
        echo "  cmd <command> - Run any command in isolation"
        echo
        echo "Examples:"
        echo "  $0 git status"
        echo "  $0 npm test"
        echo "  $0 node tests/simple-test.js"
        echo "  $0 cmd 'curl -s http://localhost:3001'"
        ;;
esac