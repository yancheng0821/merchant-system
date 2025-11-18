#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/Users/aisenyc/merchant-system/merchant-server"
LOG_DIR="${BASE_DIR}/logs"
PID_DIR="${BASE_DIR}/pids"

# Create necessary directories
mkdir -p "${LOG_DIR}"
mkdir -p "${PID_DIR}"

# Service list in startup order
SERVICES=(
    "eureka-server:8761"
    "auth-service:8081"
    "merchant-service:8082"
    "business-service:8083"
    "notification-service:8084"
    "analytics-service:8086"
    "gateway-service:8080"
)

# Function to check if a service is running
is_service_running() {
    local service_name=$1
    if [ -f "${PID_DIR}/${service_name}.pid" ]; then
        local pid=$(cat "${PID_DIR}/${service_name}.pid")
        if ps -p $pid > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to start a single service
start_service() {
    local service_name=$1
    local service_port=$2
    
    echo -e "${BLUE}Starting ${service_name}...${NC}"
    
    # Check if service is already running
    if is_service_running "$service_name"; then
        echo -e "${YELLOW}${service_name} is already running${NC}"
        return 0
    fi
    
    # Check if port is in use
    if lsof -Pi :${service_port} -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}Port ${service_port} is already in use${NC}"
        return 1
    fi
    
    # Start the service
    cd "${BASE_DIR}/${service_name}"
    nohup mvn spring-boot:run >> "${LOG_DIR}/${service_name}.log" 2>&1 &
    local pid=$!
    echo $pid > "${PID_DIR}/${service_name}.pid"
    
    echo -e "${GREEN}${service_name} started with PID: ${pid}${NC}"
    
    # Wait a bit for the service to start
    sleep 5
    
    return 0
}

# Function to stop a single service
stop_service() {
    local service_name=$1
    
    echo -e "${BLUE}Stopping ${service_name}...${NC}"
    
    if [ -f "${PID_DIR}/${service_name}.pid" ]; then
        local pid=$(cat "${PID_DIR}/${service_name}.pid")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid
            echo -e "${GREEN}${service_name} stopped${NC}"
        else
            echo -e "${YELLOW}${service_name} is not running${NC}"
        fi
        rm -f "${PID_DIR}/${service_name}.pid"
    else
        echo -e "${YELLOW}${service_name} PID file not found${NC}"
    fi
}

# Function to check service status
check_service_status() {
    local service_name=$1
    local service_port=$2
    
    if is_service_running "$service_name"; then
        local pid=$(cat "${PID_DIR}/${service_name}.pid")
        echo -e "${GREEN}✓ ${service_name} is running (PID: ${pid}, Port: ${service_port})${NC}"
    else
        echo -e "${RED}✗ ${service_name} is not running${NC}"
    fi
}

# Function to start all services
start_all() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Starting all services...${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r service_name service_port <<< "$service_info"
        start_service "$service_name" "$service_port"
        
        # Wait longer after starting eureka and gateway
        if [ "$service_name" == "eureka-server" ]; then
            echo -e "${YELLOW}Waiting for Eureka Server to fully start...${NC}"
            sleep 15
        fi
    done
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}All services started!${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to stop all services
stop_all() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Stopping all services...${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # Stop in reverse order
    for ((idx=${#SERVICES[@]}-1 ; idx>=0 ; idx--)); do
        service_info="${SERVICES[idx]}"
        IFS=':' read -r service_name service_port <<< "$service_info"
        stop_service "$service_name"
    done
    
    echo -e "${GREEN}All services stopped!${NC}"
}

# Function to show status of all services
status_all() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Service Status${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r service_name service_port <<< "$service_info"
        check_service_status "$service_name" "$service_port"
    done
    
    echo -e "${BLUE}========================================${NC}"
}

# Function to restart a service
restart_service() {
    local service_name=$1
    local service_port=$2
    
    stop_service "$service_name"
    sleep 2
    start_service "$service_name" "$service_port"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 {start|stop|restart|status} [service-name]"
    echo ""
    echo "Commands:"
    echo "  start [service]    - Start all services or a specific service"
    echo "  stop [service]     - Stop all services or a specific service"
    echo "  restart [service]  - Restart all services or a specific service"
    echo "  status             - Show status of all services"
    echo ""
    echo "Available services:"
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r service_name service_port <<< "$service_info"
        echo "  - ${service_name} (Port: ${service_port})"
    done
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start all services"
    echo "  $0 start eureka-server      # Start only eureka-server"
    echo "  $0 stop gateway-service     # Stop only gateway-service"
    echo "  $0 restart auth-service     # Restart auth-service"
    echo "  $0 status                   # Show status of all services"
}

# Main script logic
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

COMMAND=$1
SERVICE_NAME=$2

case "$COMMAND" in
    start)
        if [ -z "$SERVICE_NAME" ]; then
            start_all
        else
            # Find the service port
            for service_info in "${SERVICES[@]}"; do
                IFS=':' read -r name port <<< "$service_info"
                if [ "$name" == "$SERVICE_NAME" ]; then
                    start_service "$name" "$port"
                    exit 0
                fi
            done
            echo -e "${RED}Service '${SERVICE_NAME}' not found${NC}"
            exit 1
        fi
        ;;
    stop)
        if [ -z "$SERVICE_NAME" ]; then
            stop_all
        else
            stop_service "$SERVICE_NAME"
        fi
        ;;
    restart)
        if [ -z "$SERVICE_NAME" ]; then
            stop_all
            sleep 5
            start_all
        else
            # Find the service port
            for service_info in "${SERVICES[@]}"; do
                IFS=':' read -r name port <<< "$service_info"
                if [ "$name" == "$SERVICE_NAME" ]; then
                    restart_service "$name" "$port"
                    exit 0
                fi
            done
            echo -e "${RED}Service '${SERVICE_NAME}' not found${NC}"
            exit 1
        fi
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
