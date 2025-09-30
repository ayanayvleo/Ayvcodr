# AyvCodr AWS Deployment with Torque

This document provides a comprehensive guide for deploying AyvCodr using Quali Torque and AWS.

## Overview

The AyvCodr platform is deployed using a modern cloud-native architecture on AWS with the following components:

- **Frontend**: React/Next.js application hosted on S3 + CloudFront
- **Backend**: FastAPI application running on ECS Fargate
- **Database**: PostgreSQL on RDS with encryption and backups
- **Load Balancer**: Application Load Balancer with WAF protection
- **Security**: GuardDuty, Config, SecurityHub, and encrypted storage
- **Monitoring**: CloudWatch, X-Ray tracing, and comprehensive alerting

## Architecture Components

### 1. Networking (`networking.tf`)
- VPC with public/private subnets across 2 AZs
- NAT Gateways for outbound internet access
- VPC Flow Logs for network monitoring
- Network ACLs for additional security layer
- Security groups for application components

### 2. Security (`security.tf`)
- AWS Config for compliance monitoring
- GuardDuty for threat detection
- SecurityHub for centralized security findings
- Inspector for vulnerability assessment
- KMS encryption for data at rest
- Secrets Manager for secure credential storage
- IAM roles with least privilege access

### 3. Database (`database.tf`)
- PostgreSQL 15.4 on RDS
- Multi-AZ deployment for production
- Automated backups and point-in-time recovery
- Enhanced monitoring and CloudWatch alarms
- Parameter group optimization
- Encryption at rest and in transit

### 4. Backend (`backend.tf`)
- ECS Fargate for container orchestration
- Auto Scaling based on CPU/memory utilization
- Service discovery for microservices communication
- Application Load Balancer integration
- CloudWatch logging with structured logs
- Health checks and graceful shutdowns

### 5. Load Balancer (`load_balancer.tf`)
- Application Load Balancer with SSL termination
- AWS Certificate Manager for SSL certificates
- WAF protection against common attacks
- Access logging for audit and analysis
- Rate limiting and security rules

### 6. Monitoring (`monitoring.tf`)
- CloudTrail for API auditing
- CloudWatch Dashboard for operational metrics
- Custom metrics and alarms
- X-Ray tracing for performance monitoring
- SNS notifications for critical alerts
- Log aggregation and retention policies

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Torque Account** and CLI installed
3. **Docker** for building container images
4. **Domain Name** configured in Route 53 (optional)

## Environment Configuration

The deployment supports multiple environments with different configurations:

### Development Environment
- Single AZ deployment
- Minimal resources (t3.small instances)
- Shorter log retention periods
- No enhanced monitoring

### Production Environment
- Multi-AZ deployment
- High-availability configuration
- Enhanced monitoring and alerting
- Extended backup retention
- Performance Insights enabled

## Deployment Steps

### 1. Prepare Container Images

Build and push your backend container to Amazon ECR:

```bash
# Create ECR repository
aws ecr create-repository --repository-name ayvcodr/backend

# Build and tag the image
docker build -t ayvcodr/backend:latest .

# Push to ECR
docker tag ayvcodr/backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/ayvcodr/backend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/ayvcodr/backend:latest
```

### 2. Deploy with Torque

```bash
# Login to Torque
torque login

# Validate the blueprint
torque blueprint validate .torque/

# Deploy to development
torque environment launch \
  --blueprint-name ayvcodr-aws-deployment \
  --environment-name ayvcodr-dev \
  --inputs environment=development,domain_name=dev.ayvcodr.com

# Deploy to production
torque environment launch \
  --blueprint-name ayvcodr-aws-deployment \
  --environment-name ayvcodr-prod \
  --inputs environment=production,domain_name=ayvcodr.com,instance_type=t3.large
```

### 3. Post-Deployment Configuration

#### DNS Configuration
Point your domain to the ALB:
```bash
# Get ALB DNS name from outputs
torque environment show ayvcodr-prod --outputs

# Create CNAME record in Route 53
aws route53 change-resource-record-sets --hosted-zone-id <zone-id> --change-batch file://dns-change.json
```

#### SSL Certificate Validation
If using ACM certificates, validate domain ownership:
```bash
# List pending certificates
aws acm list-certificates --certificate-statuses PENDING_VALIDATION

# Add DNS validation records to Route 53
```

#### Database Migration
Run initial database migrations:
```bash
# Connect to ECS task for database operations
aws ecs execute-command \
  --cluster ayvcodr-prod \
  --task <task-id> \
  --container backend \
  --interactive \
  --command "/bin/bash"

# Run migrations inside container
python -m alembic upgrade head
```

## Monitoring and Alerting

### CloudWatch Dashboard
Access your monitoring dashboard at:
`https://console.aws.amazon.com/cloudwatch/home#dashboards:name=AyvCodr-{environment}`

### Key Metrics to Monitor
- **Application**: Request count, response time, error rate
- **Infrastructure**: CPU/memory utilization, database connections
- **Security**: Failed authentication attempts, unusual access patterns
- **Costs**: Monthly spend by service, resource utilization

### Alerting Configuration
Configure SNS subscriptions for critical alerts:
```bash
# Subscribe email to alerts topic
aws sns subscribe \
  --topic-arn arn:aws:sns:region:account:ayvcodr-prod-monitoring-alerts \
  --protocol email \
  --notification-endpoint admin@ayvcodr.com
```

## Security Best Practices

### 1. Access Control
- Use IAM roles instead of access keys
- Enable MFA for all admin accounts
- Regular access reviews and rotation

### 2. Network Security
- Keep databases in private subnets
- Use security groups as firewalls
- Enable VPC Flow Logs

### 3. Data Protection
- Encryption at rest and in transit
- Regular security assessments
- Backup and disaster recovery testing

### 4. Monitoring
- Enable CloudTrail in all regions
- Monitor GuardDuty findings
- Regular Config compliance checks

## Troubleshooting

### Common Issues

#### ECS Task Startup Failures
```bash
# Check task logs
aws logs get-log-events \
  --log-group-name /ecs/ayvcodr-prod-backend \
  --log-stream-name ecs/backend/<task-id>
```

#### Database Connection Issues
```bash
# Test database connectivity
aws rds describe-db-instances --db-instance-identifier ayvcodr-prod-db

# Check security group rules
aws ec2 describe-security-groups --group-ids <sg-id>
```

#### SSL Certificate Issues
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn <cert-arn>

# Validate DNS records
dig _<validation-name>.<domain> CNAME
```

## Cost Optimization

### 1. Resource Right-Sizing
- Monitor CloudWatch metrics for utilization
- Use AWS Compute Optimizer recommendations
- Regular review of instance types

### 2. Storage Optimization
- Configure S3 lifecycle policies
- Use appropriate RDS storage types
- Regular cleanup of old logs and backups

### 3. Reserved Instances
- Purchase RIs for predictable workloads
- Use Savings Plans for flexible compute usage

## Disaster Recovery

### 1. Backup Strategy
- Automated RDS backups with 7-day retention
- Cross-region backup replication for production
- Regular backup restore testing

### 2. High Availability
- Multi-AZ RDS deployment
- Auto Scaling groups across multiple AZs
- Load balancer health checks

### 3. Recovery Procedures
- Document recovery time objectives (RTO)
- Test failover procedures regularly
- Maintain updated runbooks

## Support and Maintenance

### Regular Tasks
- Monthly security patch updates
- Quarterly disaster recovery testing
- Annual architecture reviews
- Continuous cost optimization

### Monitoring Checklist
- [ ] All alerts configured and tested
- [ ] Dashboard metrics are accurate
- [ ] Log retention policies appropriate
- [ ] Backup restoration tested
- [ ] Security compliance verified

For additional support, contact the AyvCodr team at hello@ayvcodr.com.