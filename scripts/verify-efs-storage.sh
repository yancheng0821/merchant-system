#!/bin/bash

# EFS存储验证脚本
set -e

echo "🔍 验证EFS共享存储状态..."

# 检查命名空间是否存在
if ! kubectl get namespace merchant-system &> /dev/null; then
    echo "❌ merchant-system 命名空间不存在"
    exit 1
fi

echo "📊 1. 检查持久化卷状态..."
kubectl get pv -o wide

echo ""
echo "📋 2. 检查持久化卷声明状态..."
kubectl get pvc -n merchant-system -o wide

echo ""
echo "🔧 3. 检查EFS CSI驱动状态..."
kubectl get pods -n kube-system -l app=efs-csi-node

echo ""
echo "📦 4. 检查StorageClass..."
kubectl get storageclass efs-sc -o yaml

echo ""
echo "🚀 5. 检查相关服务状态..."
kubectl get pods -n merchant-system -l app=auth-service
kubectl get pods -n merchant-system -l app=business-service
kubectl get pods -n merchant-system -l app=file-service

echo ""
echo "🔗 6. 检查卷挂载..."
echo "Auth Service 卷挂载:"
kubectl get pod -n merchant-system -l app=auth-service -o jsonpath='{.items[0].spec.volumes[?(@.name=="shared-storage")]}' | jq .

echo ""
echo "Business Service 卷挂载:"
kubectl get pod -n merchant-system -l app=business-service -o jsonpath='{.items[0].spec.volumes[?(@.name=="shared-storage")]}' | jq .

echo ""
echo "📁 7. 测试文件系统访问..."
# 创建一个测试Pod来验证EFS访问
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: efs-test-pod
  namespace: merchant-system
spec:
  containers:
  - name: test-container
    image: busybox
    command: ['sh', '-c', 'echo "EFS test" > /shared/test.txt && cat /shared/test.txt && rm /shared/test.txt && echo "EFS access test successful"']
    volumeMounts:
    - name: shared-storage
      mountPath: /shared
  volumes:
  - name: shared-storage
    persistentVolumeClaim:
      claimName: uploads-pvc
  restartPolicy: Never
EOF

echo "⏳ 等待测试Pod完成..."
kubectl wait --for=condition=ready pod/efs-test-pod -n merchant-system --timeout=60s

echo "📝 测试Pod日志:"
kubectl logs efs-test-pod -n merchant-system

echo "🧹 清理测试Pod..."
kubectl delete pod efs-test-pod -n merchant-system

echo ""
echo "✅ EFS存储验证完成！" 