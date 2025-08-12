#!/bin/bash

# Script to set Vancouver timezone for all Kubernetes deployments
# This ensures all containers use America/Vancouver timezone

echo "Setting Vancouver timezone for all Kubernetes deployments..."

# List of deployment YAML files to update
DEPLOYMENT_FILES=(
    "auth-service.yaml"
    "business-service.yaml"
    "merchant-service.yaml"
    "notification-service.yaml"
    "analytics-service.yaml"
    "ai-service.yaml"
    "file-service.yaml"
    "merchant-admin.yaml"
)

# Function to add timezone environment variable to a deployment file
add_timezone_to_deployment() {
    local file=$1
    local filepath="/Users/aisenyc/merchant-system/k8s-deployment/$file"
    
    echo "Processing $file..."
    
    # Check if TZ environment variable already exists
    if grep -q "name: TZ" "$filepath"; then
        echo "  TZ environment variable already exists in $file"
    else
        # Add TZ environment variable after the first env: section
        # This uses sed to insert the timezone configuration
        sed -i.bak '/env:/a\
        - name: TZ\
          value: America/Vancouver' "$filepath"
        
        echo "  Added TZ environment variable to $file"
    fi
}

# Process each deployment file
for file in "${DEPLOYMENT_FILES[@]}"; do
    add_timezone_to_deployment "$file"
done

echo ""
echo "Timezone configuration completed!"
echo ""
echo "To apply these changes to your Kubernetes cluster, run:"
echo "  kubectl apply -f /Users/aisenyc/merchant-system/k8s-deployment/"
echo ""
echo "Note: You may need to restart pods for the timezone change to take effect:"
echo "  kubectl rollout restart deployment -n merchant-system --all"