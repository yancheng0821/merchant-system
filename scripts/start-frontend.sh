#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/Users/aisenyc/merchant-system/merchant-admin"
LOG_DIR="${BASE_DIR}/logs"
PID_FILE="${BASE_DIR}/frontend.pid"

# Create log directory
mkdir -p "${LOG_DIR}"

# Function to check if frontend is running
is_frontend_running() {
    if [ -f "${PID_FILE}" ]; then
        local pid=$(cat "${PID_FILE}")
        if ps -p $pid > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}Starting merchant-admin frontend...${NC}"
    
    # Check if already running
    if is_frontend_running; then
        echo -e "${YELLOW}Frontend is already running${NC}"
        return 0
    fi
    
    # Check if port 3000 is in use
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}Port 3000 is already in use${NC}"
        return 1
    fi
    
    # Start frontend
    cd "${BASE_DIR}"
    nohup npm start >> "${LOG_DIR}/frontend.log" 2>&1 &
    local pid=$!
    echo $pid > "${PID_FILE}"
    
    echo -e "${GREEN}Frontend started with PID: ${pid}${NC}"
    echo -e "${BLUE}Access the application at: http://localhost:3000${NC}"
    
    return 0
}

# Function to stop frontend
stop_frontend() {
    echo -e "${BLUE}Stopping merchant-admin frontend...${NC}"

    local stopped=false

    # First try to kill by PID file
    if [ -f "${PID_FILE}" ]; then
        local pid=$(cat "${PID_FILE}")
        if ps -p $pid > /dev/null 2>&1; then
            # Kill the process group to kill all child processes
            kill -TERM -$pid 2>/dev/null || kill $pid
            sleep 2
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 -$pid 2>/dev/null || kill -9 $pid
            fi
            echo -e "${GREEN}Frontend process stopped (PID: ${pid})${NC}"
            stopped=true
        fi
        rm -f "${PID_FILE}"
    fi

    # Also kill any remaining processes on port 3000
    local port_pids=$(lsof -ti :3000 2>/dev/null)
    if [ -n "$port_pids" ]; then
        echo -e "${YELLOW}Killing additional processes on port 3000...${NC}"
        echo "$port_pids" | xargs kill -9 2>/dev/null
        stopped=true
    fi

    # Kill any remaining npm start or react-scripts processes
    local npm_pids=$(pgrep -f "npm start.*merchant-admin" 2>/dev/null)
    if [ -n "$npm_pids" ]; then
        echo -e "${YELLOW}Killing remaining npm processes...${NC}"
        echo "$npm_pids" | xargs kill -9 2>/dev/null
        stopped=true
    fi

    if [ "$stopped" = true ]; then
        echo -e "${GREEN}Frontend stopped${NC}"
    else
        echo -e "${YELLOW}Frontend was not running${NC}"
    fi
}

# Function to check frontend status
status_frontend() {
    if is_frontend_running; then
        local pid=$(cat "${PID_FILE}")
        echo -e "${GREEN}✓ Frontend is running (PID: ${pid}, Port: 3000)${NC}"
        echo -e "${BLUE}  URL: http://localhost:3000${NC}"
    else
        echo -e "${RED}✗ Frontend is not running${NC}"
    fi
}

# Function to restart frontend
restart_frontend() {
    stop_frontend
    sleep 2
    start_frontend
}

# Function to show usage
show_usage() {
    echo "Usage: $0 {start|stop|restart|status}"
    echo ""
    echo "Commands:"
    echo "  start    - Start the frontend"
    echo "  stop     - Stop the frontend"
    echo "  restart  - Restart the frontend"
    echo "  status   - Show frontend status"
}

# Main script logic
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

COMMAND=$1

case "$COMMAND" in
    start)
        start_frontend
        ;;
    stop)
        stop_frontend
        ;;
    restart)
        restart_frontend
        ;;
    status)
        status_frontend
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        show_usage
        exit 1
        ;;
esac

exit 0
