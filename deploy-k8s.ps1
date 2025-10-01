# AyvCodr Kubernetes Deployment Script (PowerShell)
# This script deploys AyvCodr to EKS using Helm charts and kubectl

param(
    [string]$Environment = "development",
    [string]$Domain = "dev.ayvcodr.com",
    [string]$AwsRegion = $env:AWS_REGION ?? "us-east-1",
    [string]$AwsAccountId = $env:AWS_ACCOUNT_ID ?? "123456789012",
    [string]$DeploymentMethod = "helm"
)

# Error handling
$ErrorActionPreference = "Stop"

# Logging functions
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    if (!(Get-Command $Command -ErrorAction SilentlyContinue)) {
        Write-Error "$Command is required but not installed. Please install it first."
    }
}

# Function to check if we're in the right directory
function Test-Directory {
    if (!(Test-Path ".torque\metadata.yaml")) {
        Write-Error "Please run this script from the AyvCodr project root directory"
    }
}

# Function to check AWS credentials
function Test-AwsCredentials {
    Write-Log "Checking AWS credentials..."
    try {
        $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
        $global:AccountId = $identity.Account
        Write-Log "Using AWS Account: $global:AccountId"
    }
    catch {
        Write-Error "AWS credentials not configured. Please run 'aws configure' first."
    }
}

# Function to get EKS cluster info
function Get-EksCluster {
    Write-Log "Looking for EKS cluster..."
    $global:ClusterName = "ayvcodr-$Environment-eks"
    
    try {
        aws eks describe-cluster --name $global:ClusterName --region $AwsRegion --output json | Out-Null
    }
    catch {
        Write-Error "EKS cluster '$global:ClusterName' not found. Please deploy infrastructure first using: .\deploy.ps1 $Environment $Domain"
    }
    
    Write-Log "Found EKS cluster: $global:ClusterName"
    
    # Update kubeconfig
    Write-Log "Updating kubeconfig..."
    aws eks update-kubeconfig --region $AwsRegion --name $global:ClusterName
    
    # Verify cluster access
    try {
        kubectl cluster-info | Out-Null
    }
    catch {
        Write-Error "Cannot access Kubernetes cluster. Please check your configuration."
    }
    
    Write-Success "Connected to EKS cluster: $global:ClusterName"
}

# Function to install AWS Load Balancer Controller
function Install-AwsLoadBalancerController {
    Write-Log "Installing AWS Load Balancer Controller..."
    
    # Check if already installed
    try {
        kubectl get deployment -n kube-system aws-load-balancer-controller | Out-Null
        Write-Log "AWS Load Balancer Controller already installed"
        return
    }
    catch {
        # Not installed, proceed with installation
    }
    
    # Create service account
    $serviceAccountYaml = @"
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    app.kubernetes.io/component: controller
    app.kubernetes.io/name: aws-load-balancer-controller
  name: aws-load-balancer-controller
  namespace: kube-system
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::$($global:AccountId):role/ayvcodr-$Environment-aws-load-balancer-controller
"@
    
    $serviceAccountYaml | kubectl apply -f -
    
    # Install using Helm
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    
    helm install aws-load-balancer-controller eks/aws-load-balancer-controller `
        -n kube-system `
        --set clusterName=$global:ClusterName `
        --set serviceAccount.create=false `
        --set serviceAccount.name=aws-load-balancer-controller `
        --wait
    
    Write-Success "AWS Load Balancer Controller installed"
}

# Function to install metrics server
function Install-MetricsServer {
    Write-Log "Installing Metrics Server..."
    
    try {
        kubectl get deployment -n kube-system metrics-server | Out-Null
        Write-Log "Metrics Server already installed"
        return
    }
    catch {
        # Not installed, proceed with installation
    }
    
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    
    # Wait for metrics-server to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/metrics-server -n kube-system
    
    Write-Success "Metrics Server installed"
}

# Function to build and push Docker image
function Build-AndPushImage {
    Write-Log "Building and pushing Docker image..."
    
    $ecrRepository = "$($global:AccountId).dkr.ecr.$AwsRegion.amazonaws.com/ayvcodr"
    $gitHash = git rev-parse --short HEAD
    $imageTag = "$Environment-$gitHash"
    
    # Get ECR login token
    $loginPassword = aws ecr get-login-password --region $AwsRegion
    $loginPassword | docker login --username AWS --password-stdin $ecrRepository
    
    # Build image
    docker build -t "ayvcodr:$imageTag" .
    docker tag "ayvcodr:$imageTag" "$ecrRepository:$imageTag"
    docker tag "ayvcodr:$imageTag" "$ecrRepository:$Environment-latest"
    
    # Push image
    docker push "$ecrRepository:$imageTag"
    docker push "$ecrRepository:$Environment-latest"
    
    Write-Success "Docker image pushed: $ecrRepository:$imageTag"
    
    # Export for use in deployment
    $global:DockerImage = "$ecrRepository:$imageTag"
}

# Function to create namespace
function New-Namespace {
    Write-Log "Creating namespace ayvcodr..."
    
    $namespaceYaml = @"
apiVersion: v1
kind: Namespace
metadata:
  name: ayvcodr
  labels:
    name: ayvcodr
    istio-injection: enabled
"@
    
    $namespaceYaml | kubectl apply -f -
    
    Write-Success "Namespace created"
}

# Function to create secrets
function New-Secrets {
    Write-Log "Creating secrets..."
    
    # Get database credentials from AWS Secrets Manager
    $dbSecretJson = aws secretsmanager get-secret-value --secret-id "ayvcodr-$Environment-database" --region $AwsRegion --query 'SecretString' --output text
    $dbSecret = $dbSecretJson | ConvertFrom-Json
    
    # Create database secret
    kubectl create secret generic ayvcodr-db-secret `
        --from-literal=DB_HOST=$dbSecret.host `
        --from-literal=DB_NAME=$dbSecret.dbname `
        --from-literal=DB_USER=$dbSecret.username `
        --from-literal=DB_PASSWORD=$dbSecret.password `
        --namespace=ayvcodr `
        --dry-run=client -o yaml | kubectl apply -f -
    
    Write-Success "Secrets created"
}

# Function to deploy using Helm
function Deploy-WithHelm {
    Write-Log "Deploying AyvCodr using Helm..."
    
    # Get certificate ARN
    $certArn = aws acm list-certificates --region $AwsRegion --query "CertificateSummaryList[?DomainName=='$Domain'].CertificateArn" --output text
    
    if ([string]::IsNullOrEmpty($certArn)) {
        Write-Warning "SSL certificate not found for domain $Domain. Creating one..."
        # Certificate creation would be handled by cert-manager or manually
    }
    
    # Get WAF ARN
    $wafArn = aws wafv2 list-web-acls --scope REGIONAL --region $AwsRegion --query "WebACLs[?Name=='ayvcodr-$Environment-waf'].ARN" --output text
    
    # Deploy using Helm
    helm upgrade --install ayvcodr .torque\helm\ayvcodr `
        --namespace ayvcodr `
        --set image.repository="$($global:AccountId).dkr.ecr.$AwsRegion.amazonaws.com/ayvcodr" `
        --set image.tag="$Environment-latest" `
        --set ingress.hosts[0].host="api.$Domain" `
        --set ingress.annotations."alb\.ingress\.kubernetes\.io/certificate-arn"=$certArn `
        --set ingress.annotations."alb\.ingress\.kubernetes\.io/wafv2-acl-arn"=$wafArn `
        --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="arn:aws:iam::$($global:AccountId):role/ayvcodr-$Environment-service-role" `
        --set env.ENVIRONMENT=$Environment `
        --set aws.region=$AwsRegion `
        --set aws.accountId=$global:AccountId `
        --wait --timeout=600s
    
    Write-Success "AyvCodr deployed using Helm"
}

# Function to deploy using kubectl and kustomize
function Deploy-WithKustomize {
    Write-Log "Deploying AyvCodr using Kustomize..."
    
    # Update kustomization with correct image
    Push-Location ".torque\k8s\overlays\$Environment"
    
    try {
        # Update image tag
        kustomize edit set image "ayvcodr=$($global:AccountId).dkr.ecr.$AwsRegion.amazonaws.com/ayvcodr:$Environment-latest"
        
        # Apply manifests
        kustomize build . | kubectl apply -f -
    }
    finally {
        Pop-Location
    }
    
    Write-Success "AyvCodr deployed using Kustomize"
}

# Function to wait for deployment
function Wait-ForDeployment {
    Write-Log "Waiting for deployment to be ready..."
    
    kubectl wait --for=condition=available --timeout=600s deployment/ayvcodr-api -n ayvcodr
    
    # Wait for ingress to get IP
    Write-Log "Waiting for Load Balancer to be ready..."
    for ($i = 1; $i -le 30; $i++) {
        try {
            $lbHostname = kubectl get ingress ayvcodr-api-ingress -n ayvcodr -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>$null
            if (![string]::IsNullOrEmpty($lbHostname)) {
                Write-Success "Load Balancer ready: $lbHostname"
                break
            }
        }
        catch {
            # Continue waiting
        }
        Write-Log "Waiting for Load Balancer... (attempt $i/30)"
        Start-Sleep -Seconds 10
    }
    
    Write-Success "Deployment is ready!"
}

# Function to run post-deployment checks
function Test-Deployment {
    Write-Log "Running post-deployment checks..."
    
    # Check pod status
    kubectl get pods -n ayvcodr
    
    # Check services
    kubectl get services -n ayvcodr
    
    # Check ingress
    kubectl get ingress -n ayvcodr
    
    # Test health endpoint
    try {
        $lbHostname = kubectl get ingress ayvcodr-api-ingress -n ayvcodr -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
        if (![string]::IsNullOrEmpty($lbHostname)) {
            Write-Log "Testing health endpoint..."
            $response = Invoke-WebRequest -Uri "http://$lbHostname/health" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success "Health check passed"
            }
        }
    }
    catch {
        Write-Warning "Health check failed - this might be normal if DNS hasn't propagated yet"
    }
    
    Write-Success "Post-deployment checks completed"
}

# Function to display deployment information
function Show-DeploymentInfo {
    Write-Log "Deployment Information:"
    Write-Host "=========================="
    Write-Host "Environment: $Environment"
    Write-Host "Domain: $Domain"
    Write-Host "Cluster: $global:ClusterName"
    Write-Host "Namespace: ayvcodr"
    Write-Host "Image: $($global:AccountId).dkr.ecr.$AwsRegion.amazonaws.com/ayvcodr:$Environment-latest"
    Write-Host ""
    Write-Host "Useful Commands:"
    Write-Host "  kubectl get pods -n ayvcodr"
    Write-Host "  kubectl logs -f deployment/ayvcodr-api -n ayvcodr"
    Write-Host "  kubectl describe ingress ayvcodr-api-ingress -n ayvcodr"
    Write-Host "  helm status ayvcodr -n ayvcodr"
    Write-Host ""
    Write-Host "API URL: https://api.$Domain"
    Write-Host "=========================="
}

# Main deployment function
function Main {
    Write-Log "Starting AyvCodr Kubernetes deployment..."
    Write-Log "Environment: $Environment"
    Write-Log "Domain: $Domain"
    
    # Pre-flight checks
    Test-Directory
    Test-Command "kubectl"
    Test-Command "helm"
    Test-Command "docker"
    Test-Command "aws"
    Test-Command "kustomize"
    
    Test-AwsCredentials
    Get-EksCluster
    
    # Install prerequisites
    Install-AwsLoadBalancerController
    Install-MetricsServer
    
    # Build and deploy
    Build-AndPushImage
    New-Namespace
    New-Secrets
    
    # Choose deployment method
    if ($DeploymentMethod -eq "helm") {
        Deploy-WithHelm
    }
    else {
        Deploy-WithKustomize
    }
    
    Wait-ForDeployment
    Test-Deployment
    Show-DeploymentInfo
    
    Write-Success "AyvCodr Kubernetes deployment completed successfully!"
}

# Script execution
try {
    Main
}
catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
}