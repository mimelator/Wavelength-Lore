#!/bin/bash

# Development Helper Script
# Provides safe process management for Wavelength development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PORT=3001
LOG_FILE="server.log"

# Function to check if server is running
check_server() {
    if lsof -i :$PORT >/dev/null 2>&1; then
        local pid=$(lsof -t -i :$PORT)
        echo -e "${GREEN}✅ Server running on port $PORT (PID: $pid)${NC}"
        return 0
    else
        echo -e "${RED}❌ No server running on port $PORT${NC}"
        return 1
    fi
}

# Function to start server safely
start_server() {
    if check_server >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ Server already running${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🚀 Starting server in background...${NC}"
    npm start > $LOG_FILE 2>&1 &
    local server_pid=$!
    
    # Wait a moment for server to start
    sleep 3
    
    if check_server >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Server started successfully (PID: $server_pid)${NC}"
        echo -e "${BLUE}📋 Logs: tail -f $LOG_FILE${NC}"
    else
        echo -e "${RED}❌ Server failed to start. Check $LOG_FILE${NC}"
        return 1
    fi
}

# Function to stop server safely
stop_server() {
    if ! check_server >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ No server running${NC}"
        return 0
    fi
    
    local pid=$(lsof -t -i :$PORT)
    echo -e "${BLUE}🛑 Stopping server (PID: $pid)...${NC}"
    kill $pid
    
    # Wait for graceful shutdown
    sleep 2
    
    if ! check_server >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Server stopped successfully${NC}"
    else
        echo -e "${RED}❌ Server still running, force killing...${NC}"
        kill -9 $pid
    fi
}

# Function to restart server
restart_server() {
    echo -e "${BLUE}🔄 Restarting server...${NC}"
    stop_server
    sleep 1
    start_server
}

# Function to run tests safely
run_tests() {
    local test_file="$1"
    
    if ! check_server >/dev/null 2>&1; then
        echo -e "${RED}❌ Server not running. Start server first.${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🧪 Running tests: $test_file${NC}"
    
    if [ -n "$test_file" ]; then
        npm test -- "$test_file" > "test-$(basename $test_file).log" 2>&1 &
    else
        npm test > "test-all.log" 2>&1 &
    fi
    
    local test_pid=$!
    echo -e "${GREEN}✅ Tests started in background (PID: $test_pid)${NC}"
    echo -e "${BLUE}📋 Test logs: tail -f test-*.log${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Development Status:${NC}"
    check_server
    
    # Show recent log entries
    if [ -f "$LOG_FILE" ]; then
        echo -e "\n${BLUE}📋 Recent server logs:${NC}"
        tail -5 "$LOG_FILE"
    fi
    
    # Show running tests
    local test_processes=$(ps aux | grep "npm test" | grep -v grep | wc -l)
    if [ $test_processes -gt 0 ]; then
        echo -e "\n${GREEN}🧪 $test_processes test process(es) running${NC}"
    fi
}

# Main command handling
case "$1" in
    "start")
        start_server
        ;;
    "stop")
        stop_server
        ;;
    "restart")
        restart_server
        ;;
    "status")
        show_status
        ;;
    "test")
        run_tests "$2"
        ;;
    "logs")
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            echo -e "${RED}❌ No log file found${NC}"
        fi
        ;;
    *)
        echo -e "${BLUE}🛠️ Wavelength Development Helper${NC}"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|test|logs}"
        echo ""
        echo "Commands:"
        echo "  start    - Start server in background"
        echo "  stop     - Stop server safely"
        echo "  restart  - Restart server"
        echo "  status   - Show server and test status"
        echo "  test     - Run tests (optionally specify test file)"
        echo "  logs     - Follow server logs"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 test tests/merchandise/simple-test.js"
        echo "  $0 status"
        ;;
esac