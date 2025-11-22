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

# Function to rotate logs if date has changed
rotate_logs_if_needed() {
    local service_name=$1
    local log_file="${LOG_DIR}/${service_name}.log"

    # Check if log file exists
    if [ -f "$log_file" ]; then
        # Get the last modification date of the log file
        local log_date=$(date -r "$log_file" +%Y-%m-%d 2>/dev/null || date +%Y-%m-%d)
        local today=$(date +%Y-%m-%d)

        # If the log file is from a previous day, rotate it
        if [ "$log_date" != "$today" ]; then
            local archive_file="${LOG_DIR}/${service_name}.${log_date}.log"
            # If archive already exists, append a timestamp
            if [ -f "$archive_file" ]; then
                archive_file="${LOG_DIR}/${service_name}.${log_date}.$(date +%H%M%S).log"
            fi
            mv "$log_file" "$archive_file"
            echo -e "${GREEN}Rotated old log to ${archive_file}${NC}"
        fi
    fi
}

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

    # Start the service (Maven编译和启动日志都输出到日志文件)
    cd "${BASE_DIR}/${service_name}"
    local log_file="${LOG_DIR}/${service_name}.log"
    # 所有输出（stdout和stderr）都追加到日志文件，方便排查启动失败问题
    nohup mvn spring-boot:run >> "${log_file}" 2>&1 &
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
    local service_port=$2

    echo -e "${BLUE}Stopping ${service_name}...${NC}"

    if [ -f "${PID_DIR}/${service_name}.pid" ]; then
        local pid=$(cat "${PID_DIR}/${service_name}.pid")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid

            # Wait for the process to terminate (up to 30 seconds)
            local count=0
            while ps -p $pid > /dev/null 2>&1; do
                if [ $count -ge 30 ]; then
                    echo -e "${YELLOW}Process did not stop gracefully, forcing kill...${NC}"
                    kill -9 $pid 2>/dev/null
                    sleep 2
                    break
                fi
                sleep 1
                count=$((count + 1))
            done

            # Wait for port to be released (up to 10 seconds)
            if [ -n "$service_port" ]; then
                local port_count=0
                while lsof -Pi :${service_port} -sTCP:LISTEN -t >/dev/null 2>&1; do
                    if [ $port_count -ge 10 ]; then
                        echo -e "${YELLOW}Port ${service_port} still in use after 10 seconds${NC}"
                        break
                    fi
                    sleep 1
                    port_count=$((port_count + 1))
                done
            fi

            echo -e "${GREEN}${service_name} stopped${NC}"
        else
            echo -e "${YELLOW}${service_name} is not running${NC}"
        fi
        rm -f "${PID_DIR}/${service_name}.pid"
    else
        echo -e "${YELLOW}${service_name} PID file not found${NC}"

        # Even without PID file, try to kill any process using the port
        if [ -n "$service_port" ]; then
            local port_pid=$(lsof -Pi :${service_port} -sTCP:LISTEN -t 2>/dev/null)
            if [ -n "$port_pid" ]; then
                echo -e "${YELLOW}Found process using port ${service_port}, killing it...${NC}"
                kill $port_pid 2>/dev/null
                sleep 2
            fi
        fi
    fi
}

# Function to check service status
check_service_status() {
    local service_name=$1
    local service_port=$2

    if is_service_running "$service_name"; then
        local pid=$(cat "${PID_DIR}/${service_name}.pid")
        echo -e "${GREEN}${service_name}: Running (PID: ${pid})${NC}"
    else
        echo -e "${RED}${service_name}: Not running${NC}"
    fi
}

# Function to start all services
start_all() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Starting all services...${NC}"
    echo -e "${BLUE}========================================${NC}"

    # Start Eureka Server first and wait longer
    local eureka_info="${SERVICES[0]}"
    IFS=':' read -r service_name service_port <<< "$eureka_info"
    start_service "$service_name" "$service_port"

    # Wait for Eureka to fully start
    echo -e "${YELLOW}Waiting for Eureka Server to fully start...${NC}"
    sleep 15

    # Start other services
    for i in "${!SERVICES[@]}"; do
        if [ $i -eq 0 ]; then
            continue
        fi
        local service_info="${SERVICES[$i]}"
        IFS=':' read -r service_name service_port <<< "$service_info"
        start_service "$service_name" "$service_port"
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

    # Stop services in reverse order
    for ((i=${#SERVICES[@]}-1; i>=0; i--)); do
        local service_info="${SERVICES[$i]}"
        IFS=':' read -r service_name service_port <<< "$service_info"
        stop_service "$service_name" "$service_port"
    done

    echo -e "${GREEN}All services stopped!${NC}"
}

# Function to restart services
restart_services() {
    if [ -z "$1" ]; then
        # Restart all services
        stop_all
        sleep 3  # Extra wait between stop and start
        start_all
    else
        # Restart specific service
        local target_service=$1
        local found=false

        for service_info in "${SERVICES[@]}"; do
            IFS=':' read -r service_name service_port <<< "$service_info"
            if [ "$service_name" == "$target_service" ]; then
                stop_service "$service_name" "$service_port"
                start_service "$service_name" "$service_port"
                found=true
                break
            fi
        done

        if [ "$found" = false ]; then
            echo -e "${RED}Service '$target_service' not found${NC}"
            exit 1
        fi
    fi
}

# Function to check status of all services
status_all() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Service Status:${NC}"
    echo -e "${BLUE}========================================${NC}"

    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r service_name service_port <<< "$service_info"
        check_service_status "$service_name" "$service_port"
    done

    echo -e "${BLUE}========================================${NC}"
}

# Main script logic
case "$1" in
    start)
        if [ -z "$2" ]; then
            start_all
        else
            # Start specific service
            found=false
            for service_info in "${SERVICES[@]}"; do
                IFS=':' read -r service_name service_port <<< "$service_info"
                if [ "$service_name" == "$2" ]; then
                    start_service "$service_name" "$service_port"
                    found=true
                    break
                fi
            done

            if [ "$found" = false ]; then
                echo -e "${RED}Service '$2' not found${NC}"
                exit 1
            fi
        fi
        ;;
    stop)
        if [ -z "$2" ]; then
            stop_all
        else
            # Stop specific service - need to find its port
            found=false
            for service_info in "${SERVICES[@]}"; do
                IFS=':' read -r service_name service_port <<< "$service_info"
                if [ "$service_name" == "$2" ]; then
                    stop_service "$service_name" "$service_port"
                    found=true
                    break
                fi
            done

            if [ "$found" = false ]; then
                echo -e "${RED}Service '$2' not found${NC}"
                exit 1
            fi
        fi
        ;;
    restart)
        restart_services "$2"
        ;;
    status)
        status_all
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status} [service_name]"
        echo ""
        echo "Available services:"
        for service_info in "${SERVICES[@]}"; do
            IFS=':' read -r service_name service_port <<< "$service_info"
            echo "  - $service_name (port: $service_port)"
        done
        exit 1
        ;;
esac

exit 0