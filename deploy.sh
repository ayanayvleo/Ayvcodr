#!/bin/bash
# AyvCodr Torque Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BLUEPRINT_NAME="ayvcodr-aws-deployment"
AWS_REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT=${1:-development}
DOMAIN_NAME=${2}

echo -e "${GREEN}🚀 AyvCodr Torque Deployment Script${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Region: ${YELLOW}$AWS_REGION${NC}"

# Validate inputs
if [ -z "$DOMAIN_NAME" ]; then
    echo -e "${RED}❌ Error: Domain name is required${NC}"
    echo "Usage: $0 <environment> <domain_name>"
    echo "Example: $0 production ayvcodr.com"
    exit 1
fi

# Check if Torque CLI is installed
if ! command -v torque &> /dev/null; then
    echo -e "${RED}❌ Torque CLI is not installed${NC}"
    echo "Please install Torque CLI: https://docs.qtorque.io/torque-cli"
    exit 1
fi

# Check if logged in to Torque
if ! torque login --check; then
    echo -e "${YELLOW}⚠️  Not logged in to Torque${NC}"
    echo "Please run: torque login"
    exit 1
fi

# Validate Torque blueprint
echo -e "${YELLOW}📋 Validating Torque blueprint...${NC}"
if torque blueprint validate .torque/; then
    echo -e "${GREEN}✅ Blueprint validation successful${NC}"
else
    echo -e "${RED}❌ Blueprint validation failed${NC}"
    exit 1
fi

# Set environment-specific parameters
if [ "$ENVIRONMENT" = "production" ]; then
    INSTANCE_TYPE="t3.large"
    DATABASE_INSTANCE_CLASS="db.t3.small"
    ENABLE_SSL="true"
else
    INSTANCE_TYPE="t3.medium"
    DATABASE_INSTANCE_CLASS="db.t3.micro"
    ENABLE_SSL="true"
fi

# Build deployment inputs
DEPLOYMENT_INPUTS="environment=$ENVIRONMENT,domain_name=$DOMAIN_NAME,instance_type=$INSTANCE_TYPE,database_instance_class=$DATABASE_INSTANCE_CLASS,enable_ssl=$ENABLE_SSL"

echo -e "${YELLOW}📦 Deployment Parameters:${NC}"
echo "  Environment: $ENVIRONMENT"
echo "  Domain: $DOMAIN_NAME"
echo "  Instance Type: $INSTANCE_TYPE"
echo "  Database Class: $DATABASE_INSTANCE_CLASS"
echo "  SSL Enabled: $ENABLE_SSL"

# Deploy environment
ENVIRONMENT_NAME="ayvcodr-$ENVIRONMENT"
echo -e "${YELLOW}🏗️  Deploying environment: $ENVIRONMENT_NAME${NC}"

if torque environment launch \
    --blueprint-name "$BLUEPRINT_NAME" \
    --environment-name "$ENVIRONMENT_NAME" \
    --inputs "$DEPLOYMENT_INPUTS" \
    --wait; then
    
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    
    # Show environment outputs
    echo -e "${YELLOW}📊 Environment Outputs:${NC}"
    torque environment show "$ENVIRONMENT_NAME" --outputs
    
    echo -e "${GREEN}🎉 AyvCodr deployment completed successfully!${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Configure DNS records for your domain"
    echo "2. Validate SSL certificates (if using ACM)"
    echo "3. Run database migrations"
    echo "4. Configure monitoring alerts"
    
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check Torque logs for details:"
    torque environment show "$ENVIRONMENT_NAME" --logs
    exit 1
fi