#!/bin/bash

# Build script for Docker images using centralized Dockerfiles
# This script uses the Dockerfiles from the docker/ folder

AWS_REGION="ca-central-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
TIMEZONE="America/Vancouver"

echo "========================================="
echo "Building Docker Images"
echo "========================================="
echo ""
echo "Timezone: $TIMEZONE"
echo "ECR Registry: $ECR_REGISTRY"
echo "Using Dockerfiles from docker/ folder"
echo ""

# Function to build Java service
build_java_service() {
    local SERVICE=$1
    
    echo "Building $SERVICE..."
    
    # Check if Dockerfile exists in docker folder
    if [ ! -f "docker/Dockerfile.$SERVICE" ]; then
        echo "  ⚠️ Dockerfile not found: docker/Dockerfile.$SERVICE"
        return 1
    fi
    
    # Build the image using the Dockerfile from docker folder
    docker build \
        --build-arg TIMEZONE=$TIMEZONE \
        -f docker/Dockerfile.$SERVICE \
        -t $ECR_REGISTRY/$SERVICE:latest \
        merchant-server/
    
    if [ $? -eq 0 ]; then
        echo "  ✅ $SERVICE built successfully"
    else
        echo "  ❌ Failed to build $SERVICE"
        return 1
    fi
}

# Build Java services
echo "Building Java services..."
echo ""
build_java_service "auth-service"
build_java_service "business-service"
build_java_service "merchant-service"
build_java_service "notification-service"
build_java_service "analytics-service"

# Build Python AI service
echo ""
echo "Building AI service..."
if [ -f "docker/Dockerfile.ai-service-python" ] && [ -d "ai-service-python" ]; then
    docker build \
        --build-arg TIMEZONE=$TIMEZONE \
        -f docker/Dockerfile.ai-service-python \
        -t $ECR_REGISTRY/ai-service-python:latest \
        ai-service-python/
    
    if [ $? -eq 0 ]; then
        echo "  ✅ ai-service-python built successfully"
    else
        echo "  ❌ Failed to build ai-service-python"
    fi
else
    echo "  ⚠️ AI service not found or Dockerfile missing"
fi

# Build frontend
echo ""
echo "Building frontend..."
if [ -f "docker/Dockerfile.merchant-admin" ] && [ -d "merchant-admin" ]; then
    # Copy nginx.conf to merchant-admin if it doesn't exist
    if [ ! -f "merchant-admin/nginx.conf" ] && [ -f "docker/nginx.conf" ]; then
        cp docker/nginx.conf merchant-admin/
    fi
    
    docker build \
        --build-arg TIMEZONE=$TIMEZONE \
        -f docker/Dockerfile.merchant-admin \
        -t $ECR_REGISTRY/merchant-admin:latest \
        merchant-admin/
    
    if [ $? -eq 0 ]; then
        echo "  ✅ merchant-admin built successfully"
    else
        echo "  ❌ Failed to build merchant-admin"
    fi
else
    echo "  ⚠️ merchant-admin not found or Dockerfile missing"
fi

echo ""
echo "========================================="
echo "Build Summary"
echo "========================================="
echo ""
docker images | grep $ECR_REGISTRY | head -10

echo ""
echo "To push images to ECR, run:"
echo "  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY"
echo "  docker push $ECR_REGISTRY/<service-name>:latest"
echo ""
echo "Or use the push-all script:"
echo "  ./scripts/push-images.sh"
echo ""