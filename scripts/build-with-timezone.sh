#!/bin/bash

# Build script for Docker images with Vancouver timezone
# This ensures all container images have the correct timezone baked in

AWS_REGION="ca-central-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
TIMEZONE="America/Vancouver"

echo "========================================="
echo "Building Docker Images with Vancouver Timezone"
echo "========================================="
echo ""
echo "Timezone: $TIMEZONE"
echo "ECR Registry: $ECR_REGISTRY"
echo ""

# Function to build Java service with timezone
build_java_service() {
    local SERVICE=$1
    local PORT=$2
    
    echo "Building $SERVICE..."
    
    # Create Dockerfile if it doesn't exist
    if [ ! -f "merchant-server/$SERVICE/Dockerfile" ]; then
        cat > merchant-server/$SERVICE/Dockerfile << EOF
# Multi-stage build for $SERVICE
FROM maven:3.8.4-openjdk-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY $SERVICE/pom.xml ./$SERVICE/
RUN mvn -B -f $SERVICE/pom.xml dependency:go-offline
COPY $SERVICE/src ./$SERVICE/src
RUN mvn -B -f $SERVICE/pom.xml clean package -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim

# Install timezone data and set Vancouver timezone
RUN apt-get update && apt-get install -y tzdata \\
    && ln -sf /usr/share/zoneinfo/$TIMEZONE /etc/localtime \\
    && echo "$TIMEZONE" > /etc/timezone \\
    && dpkg-reconfigure -f noninteractive tzdata \\
    && apt-get clean \\
    && rm -rf /var/lib/apt/lists/*

# Set timezone environment variable
ENV TZ=$TIMEZONE

WORKDIR /app
COPY --from=builder /app/$SERVICE/target/*.jar app.jar
RUN mkdir -p /app/uploads

EXPOSE $PORT

# Set JVM options for timezone
ENV JAVA_OPTS="-Duser.timezone=$TIMEZONE"

ENTRYPOINT ["sh", "-c", "java \$JAVA_OPTS -jar app.jar"]
EOF
    fi
    
    # Build and tag the image
    cd merchant-server
    docker build -f $SERVICE/Dockerfile -t $ECR_REGISTRY/$SERVICE:latest .
    cd ..
}

# Build Java services
echo "Building Java services..."
build_java_service "auth-service" "8081"
build_java_service "business-service" "8083"
build_java_service "merchant-service" "8082"
build_java_service "notification-service" "8084"
build_java_service "analytics-service" "8085"

# Build Python AI service
echo "Building AI service..."
if [ -d "ai-service-python" ]; then
    cd ai-service-python
    
    # Update Dockerfile to include timezone
    if ! grep -q "ENV TZ=" Dockerfile; then
        # Add timezone configuration to Dockerfile
        sed -i '' '/FROM python/a\
\
# Set timezone\
ENV TZ='$TIMEZONE'\
RUN apt-get update && apt-get install -y tzdata \
    && ln -sf /usr/share/zoneinfo/'$TIMEZONE' /etc/localtime \
    && echo "'$TIMEZONE'" > /etc/timezone \
    && apt-get clean' Dockerfile
    fi
    
    docker build -t $ECR_REGISTRY/ai-service-python:latest .
    cd ..
fi

# Build frontend
echo "Building frontend..."
if [ -d "merchant-admin" ]; then
    cd merchant-admin
    
    # Create Dockerfile if it doesn't exist
    if [ ! -f "Dockerfile" ]; then
        cat > Dockerfile << EOF
# Build stage
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine

# Set timezone
RUN apk add --no-cache tzdata \\
    && cp /usr/share/zoneinfo/$TIMEZONE /etc/localtime \\
    && echo "$TIMEZONE" > /etc/timezone \\
    && apk del tzdata

ENV TZ=$TIMEZONE

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
    fi
    
    docker build -t $ECR_REGISTRY/merchant-admin:latest .
    cd ..
fi

echo ""
echo "========================================="
echo "Build Complete!"
echo "========================================="
echo ""
echo "All images have been built with timezone: $TIMEZONE"
echo ""
echo "To push images to ECR, run:"
echo "  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY"
echo "  docker push $ECR_REGISTRY/<service-name>:latest"
echo ""