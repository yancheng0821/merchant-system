#!/bin/bash

# Script to verify timezone settings in Kubernetes pods
# Ensures all pods are using America/Vancouver timezone

NAMESPACE="merchant-system"
EXPECTED_TZ="America/Vancouver"

echo "========================================="
echo "Verifying Timezone Settings in Kubernetes"
echo "========================================="
echo ""
echo "Expected Timezone: $EXPECTED_TZ"
echo ""

# Get all pods in the namespace
PODS=$(kubectl get pods -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)

if [ -z "$PODS" ]; then
    echo "ERROR: No pods found in namespace $NAMESPACE"
    exit 1
fi

echo "Checking pods in namespace: $NAMESPACE"
echo "-----------------------------------------"

# Check each pod
for pod in $PODS; do
    echo -n "Pod: $pod ... "
    
    # Check TZ environment variable
    TZ_ENV=$(kubectl exec -n $NAMESPACE $pod -- printenv TZ 2>/dev/null || echo "NOT_SET")
    
    # Check actual system time
    ACTUAL_TZ=$(kubectl exec -n $NAMESPACE $pod -- date +%Z 2>/dev/null || echo "ERROR")
    
    # Check /etc/timezone if it exists
    ETC_TZ=$(kubectl exec -n $NAMESPACE $pod -- cat /etc/timezone 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$TZ_ENV" == "$EXPECTED_TZ" ]; then
        echo -e "\033[0;32m✓\033[0m TZ=$TZ_ENV (System: $ACTUAL_TZ)"
    elif [ "$TZ_ENV" == "NOT_SET" ]; then
        echo -e "\033[0;33m⚠\033[0m TZ not set (System: $ACTUAL_TZ)"
    else
        echo -e "\033[0;31m✗\033[0m TZ=$TZ_ENV (Expected: $EXPECTED_TZ, System: $ACTUAL_TZ)"
    fi
done

echo ""
echo "========================================="
echo "Verification Complete"
echo "========================================="
echo ""
echo "To fix timezone issues, run:"
echo "  1. Update deployment YAML files to include TZ environment variable"
echo "  2. kubectl rollout restart deployment -n $NAMESPACE --all"
echo ""