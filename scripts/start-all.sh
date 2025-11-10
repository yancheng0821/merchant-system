#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="/Users/aisenyc/merchant-system/scripts"

# Function to show usage
show_usage() {
    echo "Usage: $0 {start|stop|restart|status}"
    echo ""
    echo "Commands:"
    echo "  start    - Start all backend services and frontend"
    echo "  stop     - Stop all backend services and frontend"
    echo "  restart  - Restart all services"
    echo "  status   - Show status of all services"
    echo ""
    echo "This script manages:"
    echo "  - All backend microservices (Eureka, Gateway, Auth, Merchant, Business, Notification, Analytics)"
    echo "  - Frontend application (merchant-admin)"
}

# Function to start all
start_all() {
    echo -e "${BLUE}=======================================${NC}"
    echo -e "${BLUE}Starting All Services${NC}"
    echo -e "${BLUE}=======================================${NC}"
    echo ""
    
    # Start backend services
    "${SCRIPT_DIR}/start-services.sh" start
    
    echo ""
    echo -e "${BLUE}=======================================${NC}"
    
    # Wait a bit before starting frontend
    echo -e "${YELLOW}Waiting 10 seconds before starting frontend...${NC}"
    sleep 10
    
    # Start frontend
    "${SCRIPT_DIR}/start-frontend.sh" start
    
    echo ""
    echo -e "${BLUE}=======================================${NC}"
    echo -e "${GREEN}All services have been started!${NC}"
    echo -e "${BLUE}=======================================${NC}"
    echo -e "${BLUE}Eureka Dashboard: http://localhost:8761${NC}"
    echo -e "${BLUE}API Gateway: http://localhost:8080${NC}"
    echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}=======================================${NC}"
}

# Function to stop all
stop_all() {
    echo -e "${BLUE}=======================================${NC}"
    echo -e "${BLUE}Stopping All Services${NC}"
    echo -e "${BLUE}=======================================${NC}"
    echo ""
    
    # Stop frontend first
    "${SCRIPT_DIR}/start-frontend.sh" stop
    
    echo ""
    
    # Stop backend services
    "${SCRIPT_DIR}/start-services.sh" stop
    
    echo ""
    echo -e "${GREEN}All services have been stopped!${NC}"
}

# Function to restart all
restart_all() {
    stop_all
    echo ""
    echo -e "${YELLOW}Waiting 5 seconds before restarting...${NC}"
    sleep 5
    echo ""
    start_all
}

# Function to show status
status_all() {
    echo -e "${BLUE}=======================================${NC}"
    echo -e "${BLUE}Overall System Status${NC}"
    echo -e "${BLUE}=======================================${NC}"
    echo ""
    
    # Backend services status
    "${SCRIPT_DIR}/start-services.sh" status
    
    echo ""
    
    # Frontend status
    "${SCRIPT_DIR}/start-frontend.sh" status
    
    echo ""
    echo -e "${BLUE}=======================================${NC}"
}

# Main script logic
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

COMMAND=$1

case "$COMMAND" in
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        restart_all
        ;;
    status)
        status_all
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        show_usage
        exit 1
        ;;
esac

exit 0
