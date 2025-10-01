# AyvCodr Kubernetes Troubleshooting Guide

This guide helps you diagnose and resolve common issues when deploying AyvCodr to Amazon EKS.

## Table of Contents
- [Pre-deployment Checks](#pre-deployment-checks)
- [Common Deployment Issues](#common-deployment-issues)
- [Pod Issues](#pod-issues)
- [Networking Issues](#networking-issues)
- [Load Balancer Issues](#load-balancer-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)
- [Monitoring and Debugging](#monitoring-and-debugging)

## Pre-deployment Checks

### 1. Verify Prerequisites
```bash
# Check required tools
kubectl version --client
helm version
docker version
aws --version
kustomize version

# Verify AWS credentials
aws sts get-caller-identity

# Check EKS cluster status
aws eks describe-cluster --name ayvcodr-dev-eks --region us-east-1
```

### 2. Verify Permissions
Ensure your AWS user/role has the following permissions:
- EKS cluster management
- ECR image push/pull
- Secrets Manager access
- IAM role management for service accounts
- Load Balancer Controller permissions

## Common Deployment Issues

### Issue: EKS Cluster Not Found
```
Error: EKS cluster 'ayvcodr-dev-eks' not found
```

**Solution:**
```bash
# 1. Deploy infrastructure first
./deploy.sh development dev.ayvcodr.com

# 2. Verify cluster exists
aws eks list-clusters --region us-east-1

# 3. Check cluster status
aws eks describe-cluster --name ayvcodr-dev-eks --region us-east-1
```

### Issue: Docker Image Push Failed
```
Error: authentication required
```

**Solution:**
```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Verify ECR repository exists
aws ecr describe-repositories --repository-names ayvcodr --region us-east-1
```

### Issue: Helm Chart Installation Failed
```
Error: failed to install CRD crds/aws-load-balancer-controller_v1_targetgroupbinding.yaml
```

**Solution:**
```bash
# Update Helm repositories
helm repo update

# Install AWS Load Balancer Controller CRDs manually
kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller/crds?ref=master"

# Then retry Helm installation
helm install aws-load-balancer-controller eks/aws-load-balancer-controller -n kube-system --set clusterName=ayvcodr-dev-eks
```

## Pod Issues

### Issue: Pods Stuck in Pending State
```bash
# Check pod status
kubectl get pods -n ayvcodr

# Describe pod for details
kubectl describe pod <pod-name> -n ayvcodr
```

**Common Causes and Solutions:**

1. **Insufficient Resources:**
   ```bash
   # Check node capacity
   kubectl describe nodes
   
   # Scale cluster if needed
   aws eks update-nodegroup-config --cluster-name ayvcodr-dev-eks --nodegroup-name ayvcodr-dev-node-group --scaling-config minSize=2,maxSize=5,desiredSize=3
   ```

2. **Image Pull Errors:**
   ```bash
   # Check image exists
   aws ecr describe-images --repository-name ayvcodr --region us-east-1
   
   # Verify service account has ECR permissions
   kubectl describe serviceaccount ayvcodr-service-account -n ayvcodr
   ```

3. **Security Context Issues:**
   ```bash
   # Check security policies
   kubectl get psp
   
   # Verify pod security context
   kubectl get pod <pod-name> -n ayvcodr -o yaml | grep -A 10 securityContext
   ```

### Issue: Pods Crashing (CrashLoopBackOff)
```bash
# Check pod logs
kubectl logs <pod-name> -n ayvcodr --previous

# Check current logs
kubectl logs -f deployment/ayvcodr-api -n ayvcodr
```

**Common Solutions:**

1. **Database Connection Issues:**
   ```bash
   # Verify database secret
   kubectl get secret ayvcodr-db-secret -n ayvcodr -o yaml
   
   # Test database connectivity
   kubectl run -it --rm debug --image=postgres:13 --restart=Never -- psql -h <db-host> -U <db-user> -d <db-name>
   ```

2. **Application Configuration:**
   ```bash
   # Check ConfigMap
   kubectl get configmap ayvcodr-config -n ayvcodr -o yaml
   
   # Verify environment variables
   kubectl exec deployment/ayvcodr-api -n ayvcodr -- env | grep -E "(DB_|ENVIRONMENT)"
   ```

## Networking Issues

### Issue: Service Not Reachable
```bash
# Check service
kubectl get svc -n ayvcodr

# Test service internally
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- curl http://ayvcodr-api-service.ayvcodr.svc.cluster.local/health
```

### Issue: Ingress Not Working
```bash
# Check ingress status
kubectl get ingress -n ayvcodr
kubectl describe ingress ayvcodr-api-ingress -n ayvcodr

# Check AWS Load Balancer Controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

**Solutions:**

1. **Load Balancer Controller Issues:**
   ```bash
   # Restart controller
   kubectl rollout restart deployment/aws-load-balancer-controller -n kube-system
   
   # Check service account annotations
   kubectl describe serviceaccount aws-load-balancer-controller -n kube-system
   ```

2. **Certificate Issues:**
   ```bash
   # Check SSL certificate
   aws acm list-certificates --region us-east-1
   
   # Verify certificate ARN in ingress
   kubectl get ingress ayvcodr-api-ingress -n ayvcodr -o yaml | grep certificate-arn
   ```

## Load Balancer Issues

### Issue: Load Balancer Not Created
```bash
# Check ingress events
kubectl get events -n ayvcodr --sort-by='.lastTimestamp'

# Check AWS Load Balancer Controller
kubectl logs -n kube-system deployment/aws-load-balancer-controller --tail=100
```

**Solutions:**

1. **IAM Permissions:**
   ```bash
   # Verify service account role
   aws iam get-role --role-name ayvcodr-dev-aws-load-balancer-controller
   
   # Check role trust policy
   aws iam get-role --role-name ayvcodr-dev-aws-load-balancer-controller --query 'Role.AssumeRolePolicyDocument'
   ```

2. **Subnet Tags:**
   ```bash
   # Verify subnet tags for load balancer
   aws ec2 describe-subnets --filters "Name=tag:kubernetes.io/role/elb,Values=1" --region us-east-1
   ```

### Issue: Health Check Failures
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# Test health endpoint directly
kubectl port-forward deployment/ayvcodr-api 8080:8000 -n ayvcodr
curl http://localhost:8080/health
```

## Performance Issues

### Issue: High CPU/Memory Usage
```bash
# Check resource usage
kubectl top pods -n ayvcodr
kubectl top nodes

# Check HPA status
kubectl get hpa -n ayvcodr
kubectl describe hpa ayvcodr-api-hpa -n ayvcodr
```

**Solutions:**

1. **Adjust Resource Limits:**
   ```bash
   # Update deployment resources
   kubectl patch deployment ayvcodr-api -n ayvcodr -p '{"spec":{"template":{"spec":{"containers":[{"name":"ayvcodr-api","resources":{"limits":{"cpu":"1000m","memory":"1Gi"},"requests":{"cpu":"500m","memory":"512Mi"}}}]}}}}'
   ```

2. **Scale Horizontally:**
   ```bash
   # Manual scaling
   kubectl scale deployment ayvcodr-api --replicas=5 -n ayvcodr
   
   # Update HPA
   kubectl patch hpa ayvcodr-api-hpa -n ayvcodr --type='merge' -p='{"spec":{"maxReplicas":10}}'
   ```

### Issue: Slow Response Times
```bash
# Check application metrics
kubectl port-forward deployment/ayvcodr-api 9090:9090 -n ayvcodr
curl http://localhost:9090/metrics

# Analyze logs for slow queries
kubectl logs deployment/ayvcodr-api -n ayvcodr | grep -E "(slow|error|timeout)"
```

## Security Issues

### Issue: Pod Security Context Violations
```bash
# Check pod security policy
kubectl describe psp

# Verify security context
kubectl get pod <pod-name> -n ayvcodr -o jsonpath='{.spec.securityContext}'
```

**Solution:**
```bash
# Update deployment with proper security context
kubectl patch deployment ayvcodr-api -n ayvcodr --type='merge' -p='{"spec":{"template":{"spec":{"securityContext":{"runAsNonRoot":true,"runAsUser":1000,"fsGroup":1000}}}}}'
```

### Issue: Network Policy Violations
```bash
# Check network policies
kubectl get networkpolicy -n ayvcodr

# Test network connectivity
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n ayvcodr -- curl http://ayvcodr-api-service:80/health
```

## Monitoring and Debugging

### Essential Commands
```bash
# Pod status and events
kubectl get pods -n ayvcodr -o wide
kubectl get events -n ayvcodr --sort-by='.lastTimestamp'

# Resource usage
kubectl top pods -n ayvcodr
kubectl top nodes

# Logs
kubectl logs -f deployment/ayvcodr-api -n ayvcodr
kubectl logs deployment/ayvcodr-api -n ayvcodr --previous

# Describe resources
kubectl describe deployment ayvcodr-api -n ayvcodr
kubectl describe service ayvcodr-api-service -n ayvcodr
kubectl describe ingress ayvcodr-api-ingress -n ayvcodr

# Configuration
kubectl get configmap ayvcodr-config -n ayvcodr -o yaml
kubectl get secret ayvcodr-db-secret -n ayvcodr -o yaml
```

### Debug Pod
Create a debug pod for troubleshooting:
```bash
# Create debug pod
kubectl run debug --image=busybox --rm -it --restart=Never -n ayvcodr -- sh

# Or use a more feature-rich debug image
kubectl run debug --image=nicolaka/netshoot --rm -it --restart=Never -n ayvcodr -- bash
```

### Port Forwarding for Local Testing
```bash
# Forward application port
kubectl port-forward deployment/ayvcodr-api 8080:8000 -n ayvcodr

# Forward metrics port
kubectl port-forward deployment/ayvcodr-api 9090:9090 -n ayvcodr

# Test locally
curl http://localhost:8080/health
curl http://localhost:9090/metrics
```

### Cleanup Commands
```bash
# Delete deployment
helm uninstall ayvcodr -n ayvcodr

# Or using kubectl
kubectl delete namespace ayvcodr

# Clean up load balancer resources
kubectl delete ingress --all -n ayvcodr

# Remove stuck finalizers (if needed)
kubectl patch ingress ayvcodr-api-ingress -n ayvcodr -p '{"metadata":{"finalizers":[]}}' --type=merge
```

## Getting Help

If you continue to experience issues, gather this information:

1. **Environment Details:**
   ```bash
   kubectl version
   aws eks describe-cluster --name ayvcodr-dev-eks --region us-east-1
   ```

2. **Resource Status:**
   ```bash
   kubectl get all -n ayvcodr
   kubectl get events -n ayvcodr --sort-by='.lastTimestamp'
   ```

3. **Logs:**
   ```bash
   kubectl logs deployment/ayvcodr-api -n ayvcodr --tail=100
   kubectl logs -n kube-system deployment/aws-load-balancer-controller --tail=100
   ```

4. **Configuration:**
   ```bash
   helm get values ayvcodr -n ayvcodr
   kubectl describe ingress ayvcodr-api-ingress -n ayvcodr
   ```

Contact the AyvCodr team with this information for faster resolution.

---

*Remember: Always test in a development environment before applying fixes to production!*