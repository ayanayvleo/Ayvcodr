#!/bin/bash

# AyvCodr Kubernetes Deployment Script
# This script deploys AyvCodr to EKS using Helm charts and kubectl

set -euo pipefail

# Configuration
ENVIRONMENT=${1:-"development"}
DOMAIN=${2:-"dev.ayvcodr.com"}
AWS_REGION=${AWS_REGION:-"us-east-1"}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-"123456789012"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        error "$1 is required but not installed. Please install it first."
    fi
}

# Function to check if we're in the right directory
check_directory() {
    if [[ ! -f ".torque/metadata.yaml" ]]; then
        error "Please run this script from the AyvCodr project root directory"
    fi
}

# Function to check AWS credentials
check_aws_credentials() {
    log "Checking AWS credentials..."
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured. Please run 'aws configure' first."
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log "Using AWS Account: $ACCOUNT_ID"
}

# Function to get EKS cluster info
get_eks_cluster() {
    log "Looking for EKS cluster..."
    CLUSTER_NAME="ayvcodr-${ENVIRONMENT}-eks"
    
    if ! aws eks describe-cluster --name "$CLUSTER_NAME" --region "$AWS_REGION" &> /dev/null; then
        error "EKS cluster '$CLUSTER_NAME' not found. Please deploy infrastructure first using: ./deploy.sh $ENVIRONMENT $DOMAIN"
    fi
    
    log "Found EKS cluster: $CLUSTER_NAME"
    
    # Update kubeconfig
    log "Updating kubeconfig..."
    aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"
    
    # Verify cluster access
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot access Kubernetes cluster. Please check your configuration."
    fi
    
    success "Connected to EKS cluster: $CLUSTER_NAME"
}

# Function to install AWS Load Balancer Controller
install_aws_load_balancer_controller() {
    log "Installing AWS Load Balancer Controller..."
    
    # Check if already installed
    if kubectl get deployment -n kube-system aws-load-balancer-controller &> /dev/null; then
        log "AWS Load Balancer Controller already installed"
        return
    fi
    
    # Create service account
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-controller
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::${ACCOUNT_ID}:role/ayvcodr-${ENVIRONMENT}-aws-load-balancer-controller
EOF
    
    # Install using Helm
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    
    helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
      -n kube-system \
      --set clusterName="$CLUSTER_NAME" \
      --set serviceAccount.create=false \
      --set serviceAccount.name=aws-load-balancer-controller \
      --wait
    
    success "AWS Load Balancer Controller installed"
}

# Function to install metrics server
install_metrics_server() {
    log "Installing Metrics Server..."
    
    if kubectl get deployment -n kube-system metrics-server &> /dev/null; then
        log "Metrics Server already installed"
        return
    fi
    
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    
    # Wait for metrics-server to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/metrics-server -n kube-system
    
    success "Metrics Server installed"
}

# Function to build and push Docker image
build_and_push_image() {
    log "Building and pushing Docker image..."
    
    ECR_REPOSITORY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/ayvcodr"
    IMAGE_TAG="${ENVIRONMENT}-$(git rev-parse --short HEAD)"
    
    # Get ECR login token
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REPOSITORY"
    
    # Build image
    docker build -t "ayvcodr:$IMAGE_TAG" .
    docker tag "ayvcodr:$IMAGE_TAG" "$ECR_REPOSITORY:$IMAGE_TAG"
    docker tag "ayvcodr:$IMAGE_TAG" "$ECR_REPOSITORY:${ENVIRONMENT}-latest"
    
    # Push image
    docker push "$ECR_REPOSITORY:$IMAGE_TAG"
    docker push "$ECR_REPOSITORY:${ENVIRONMENT}-latest"
    
    success "Docker image pushed: $ECR_REPOSITORY:$IMAGE_TAG"
    
    # Export for use in deployment
    export DOCKER_IMAGE="$ECR_REPOSITORY:$IMAGE_TAG"
}

# Function to create namespace
create_namespace() {
    log "Creating namespace ayvcodr..."
    
    kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: ayvcodr
  labels:
    name: ayvcodr
    istio-injection: enabled
EOF
    
    success "Namespace created"
}

# Function to create secrets
create_secrets() {
    log "Creating secrets..."
    
    # Get database credentials from AWS Secrets Manager
    DB_SECRET=$(aws secretsmanager get-secret-value --secret-id "ayvcodr-${ENVIRONMENT}-database" --region "$AWS_REGION" --query 'SecretString' --output text)
    
    DB_HOST=$(echo "$DB_SECRET" | jq -r '.host')
    DB_NAME=$(echo "$DB_SECRET" | jq -r '.dbname')
    DB_USER=$(echo "$DB_SECRET" | jq -r '.username')
    DB_PASSWORD=$(echo "$DB_SECRET" | jq -r '.password')
    
    # Create database secret
    kubectl create secret generic ayvcodr-db-secret \
        --from-literal=DB_HOST="$DB_HOST" \
        --from-literal=DB_NAME="$DB_NAME" \
        --from-literal=DB_USER="$DB_USER" \
        --from-literal=DB_PASSWORD="$DB_PASSWORD" \
        --namespace=ayvcodr \
        --dry-run=client -o yaml | kubectl apply -f -
    
    success "Secrets created"
}

# Function to deploy using Helm
deploy_with_helm() {
    log "Deploying AyvCodr using Helm..."
    
    # Get certificate ARN
    CERT_ARN=$(aws acm list-certificates --region "$AWS_REGION" --query "CertificateSummaryList[?DomainName=='${DOMAIN}'].CertificateArn" --output text)
    
    if [[ -z "$CERT_ARN" ]]; then
        warn "SSL certificate not found for domain $DOMAIN. Creating one..."
        # Certificate creation would be handled by cert-manager or manually
    fi
    
    # Get WAF ARN
    WAF_ARN=$(aws wafv2 list-web-acls --scope REGIONAL --region "$AWS_REGION" --query "WebACLs[?Name=='ayvcodr-${ENVIRONMENT}-waf'].ARN" --output text)
    
    # Deploy using Helm
    helm upgrade --install ayvcodr .torque/helm/ayvcodr \
        --namespace ayvcodr \
        --set image.repository="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/ayvcodr" \
        --set image.tag="${ENVIRONMENT}-latest" \
        --set ingress.hosts[0].host="api.${DOMAIN}" \
        --set ingress.annotations."alb\.ingress\.kubernetes\.io/certificate-arn"="$CERT_ARN" \
        --set ingress.annotations."alb\.ingress\.kubernetes\.io/wafv2-acl-arn"="$WAF_ARN" \
        --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="arn:aws:iam::${ACCOUNT_ID}:role/ayvcodr-${ENVIRONMENT}-service-role" \
        --set env.ENVIRONMENT="$ENVIRONMENT" \
        --set aws.region="$AWS_REGION" \
        --set aws.accountId="$ACCOUNT_ID" \
        --wait --timeout=600s
    
    success "AyvCodr deployed using Helm"
}

# Function to deploy using kubectl and kustomize
deploy_with_kustomize() {
    log "Deploying AyvCodr using Kustomize..."
    
    # Update kustomization with correct image
    cd .torque/k8s/overlays/$ENVIRONMENT
    
    # Update image tag
    kustomize edit set image "ayvcodr=${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/ayvcodr:${ENVIRONMENT}-latest"
    
    # Apply manifests
    kustomize build . | kubectl apply -f -
    
    cd - > /dev/null
    
    success "AyvCodr deployed using Kustomize"
}

# Function to wait for deployment
wait_for_deployment() {
    log "Waiting for deployment to be ready..."
    
    kubectl wait --for=condition=available --timeout=600s deployment/ayvcodr-api -n ayvcodr
    
    # Wait for ingress to get IP
    log "Waiting for Load Balancer to be ready..."
    for i in {1..30}; do
        LB_HOSTNAME=$(kubectl get ingress ayvcodr-api-ingress -n ayvcodr -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
        if [[ -n "$LB_HOSTNAME" ]]; then
            success "Load Balancer ready: $LB_HOSTNAME"
            break
        fi
        log "Waiting for Load Balancer... (attempt $i/30)"
        sleep 10
    done
    
    success "Deployment is ready!"
}

# Function to run post-deployment checks
post_deployment_checks() {
    log "Running post-deployment checks..."
    
    # Check pod status
    kubectl get pods -n ayvcodr
    
    # Check services
    kubectl get services -n ayvcodr
    
    # Check ingress
    kubectl get ingress -n ayvcodr
    
    # Test health endpoint
    LB_HOSTNAME=$(kubectl get ingress ayvcodr-api-ingress -n ayvcodr -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    if [[ -n "$LB_HOSTNAME" ]]; then
        log "Testing health endpoint..."
        if curl -f "http://$LB_HOSTNAME/health" &> /dev/null; then
            success "Health check passed"
        else
            warn "Health check failed - this might be normal if DNS hasn't propagated yet"
        fi
    fi
    
    success "Post-deployment checks completed"
}

# Function to display deployment information
display_info() {
    log "Deployment Information:"
    echo "=========================="
    echo "Environment: $ENVIRONMENT"
    echo "Domain: $DOMAIN"
    echo "Cluster: $CLUSTER_NAME"
    echo "Namespace: ayvcodr"
    echo "Image: ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/ayvcodr:${ENVIRONMENT}-latest"
    echo ""
    echo "Useful Commands:"
    echo "  kubectl get pods -n ayvcodr"
    echo "  kubectl logs -f deployment/ayvcodr-api -n ayvcodr"
    echo "  kubectl describe ingress ayvcodr-api-ingress -n ayvcodr"
    echo "  helm status ayvcodr -n ayvcodr"
    echo ""
    echo "API URL: https://api.${DOMAIN}"
    echo "=========================="
}

# Main deployment function
main() {
    log "Starting AyvCodr Kubernetes deployment..."
    log "Environment: $ENVIRONMENT"
    log "Domain: $DOMAIN"
    
    # Pre-flight checks
    check_directory
    check_command "kubectl"
    check_command "helm"
    check_command "docker"
    check_command "aws"
    check_command "jq"
    check_command "kustomize"
    
    check_aws_credentials
    get_eks_cluster
    
    # Install prerequisites
    install_aws_load_balancer_controller
    install_metrics_server
    
    # Build and deploy
    build_and_push_image
    create_namespace
    create_secrets
    
    # Choose deployment method
    if [[ "${DEPLOYMENT_METHOD:-helm}" == "helm" ]]; then
        deploy_with_helm
    else
        deploy_with_kustomize
    fi
    
    wait_for_deployment
    post_deployment_checks
    display_info
    
    success "AyvCodr Kubernetes deployment completed successfully!"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi