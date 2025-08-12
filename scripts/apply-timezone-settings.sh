#!/bin/bash

# Script to apply Vancouver timezone settings to all deployments
# This ensures all containers use America/Vancouver timezone

NAMESPACE="merchant-system"
TIMEZONE="America/Vancouver"

echo "========================================="
echo "Applying Vancouver Timezone Settings"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Apply updated deployment configurations
echo -e "${YELLOW}Step 1: Applying updated deployment configurations...${NC}"
kubectl apply -f /Users/aisenyc/merchant-system/k8s-deployment/

# Step 2: Wait for configurations to be applied
echo -e "${YELLOW}Step 2: Waiting for configurations to be applied...${NC}"
sleep 5

# Step 3: Restart all deployments to pick up timezone changes
echo -e "${YELLOW}Step 3: Restarting all deployments...${NC}"
kubectl rollout restart deployment -n ${NAMESPACE} --all

# Step 4: Wait for rollout to complete
echo -e "${YELLOW}Step 4: Waiting for rollout to complete...${NC}"
kubectl rollout status deployment -n ${NAMESPACE} --timeout=300s

# Step 5: Verify timezone settings
echo -e "${YELLOW}Step 5: Verifying timezone settings...${NC}"
echo ""

# Get all pods and check their timezone
PODS=$(kubectl get pods -n ${NAMESPACE} -o jsonpath='{.items[*].metadata.name}')

for pod in $PODS; do
    TZ_VALUE=$(kubectl exec -n ${NAMESPACE} $pod -- printenv TZ 2>/dev/null || echo "NOT_SET")
    if [ "$TZ_VALUE" == "$TIMEZONE" ]; then
        echo -e "${GREEN}✓${NC} Pod $pod: TZ=$TZ_VALUE"
    else
        echo -e "⚠ Pod $pod: TZ=$TZ_VALUE (Expected: $TIMEZONE)"
    fi
done

echo ""
echo "========================================="
echo "Timezone Configuration Complete!"
echo "========================================="
echo ""
echo "All deployments have been updated with timezone: $TIMEZONE"
echo ""
echo "To verify timezone in a specific pod, run:"
echo "  kubectl exec -n $NAMESPACE <pod-name> -- date"
echo ""
echo "To check environment variables:"
echo "  kubectl exec -n $NAMESPACE <pod-name> -- printenv TZ"
echo ""