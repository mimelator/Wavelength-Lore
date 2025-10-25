#!/bin/bash

# 🔒 Isolated Development Terminal Session
# Creates a clean, dedicated terminal environment for development work

set -e

# Configuration
SESSION_NAME="wavelength-dev"
WORK_DIR="/Volumes/5bits/current/wavelength-dev/Wavelength-Lore/Wavelength-Lore.fresh"

echo "🔒 ISOLATED TERMINAL SESSION MANAGER"
echo "===================================="

# Function to check if tmux is available
check_tmux() {
    if ! command -v tmux &> /dev/null; then
        echo "❌ tmux not found. Installing..."
        if command -v brew &> /dev/null; then
            brew install tmux
        else
            echo "Please install tmux: https://github.com/tmux/tmux/wiki/Installing"
            exit 1
        fi
    fi
}

# Function to create isolated session
create_session() {
    echo "🚀 Creating isolated development session..."
    
    # Kill existing session if it exists
    tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
    
    # Create new session
    tmux new-session -d -s "$SESSION_NAME" -c "$WORK_DIR"
    
    # Configure the session
    tmux send-keys -t "$SESSION_NAME" 'export PS1="[DEV-ISOLATED] \w $ "' Enter
    tmux send-keys -t "$SESSION_NAME" 'clear' Enter
    tmux send-keys -t "$SESSION_NAME" 'echo "🔒 Isolated Development Terminal Active"' Enter
    tmux send-keys -t "$SESSION_NAME" 'echo "📁 Working Directory: $(pwd)"' Enter
    tmux send-keys -t "$SESSION_NAME" 'echo "🆔 Session: $SESSION_NAME"' Enter
    tmux send-keys -t "$SESSION_NAME" 'echo "---"' Enter
    
    echo "✅ Session '$SESSION_NAME' created"
}

# Function to attach to session
attach_session() {
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        echo "🔗 Attaching to existing session..."
        tmux attach-session -t "$SESSION_NAME"
    else
        echo "❌ No session found. Creating new one..."
        create_session
        tmux attach-session -t "$SESSION_NAME"
    fi
}

# Function to list sessions
list_sessions() {
    echo "📋 Active tmux sessions:"
    tmux list-sessions 2>/dev/null || echo "  No sessions found"
}

# Function to kill session
kill_session() {
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        tmux kill-session -t "$SESSION_NAME"
        echo "💀 Session '$SESSION_NAME' terminated"
    else
        echo "❌ No session to kill"
    fi
}

# Function to run command in session
run_in_session() {
    local command="$1"
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        echo "⚡ Running command in isolated session: $command"
        tmux send-keys -t "$SESSION_NAME" "$command" Enter
        echo "✅ Command sent to session"
    else
        echo "❌ No active session. Create one first."
        exit 1
    fi
}

# Main menu
case "${1:-menu}" in
    "create"|"new")
        check_tmux
        create_session
        ;;
    "attach"|"connect")
        check_tmux
        attach_session
        ;;
    "list"|"ls")
        list_sessions
        ;;
    "kill"|"stop")
        kill_session
        ;;
    "run")
        shift
        run_in_session "$*"
        ;;
    "menu"|*)
        echo "🤔 What would you like to do?"
        echo "1) create  - Create new isolated session"
        echo "2) attach  - Connect to existing session"
        echo "3) list    - Show all sessions"
        echo "4) kill    - Terminate session"
        echo "5) run     - Execute command in session"
        echo
        echo "Usage examples:"
        echo "  $0 create"
        echo "  $0 attach"
        echo "  $0 run 'git status'"
        ;;
esac