# AyvCodr - AI API Platform

AyvCodr is a comprehensive FastAPI platform that allows users to build and customize their own AI APIs with enterprise-grade infrastructure. The platform supports both local development and cloud deployment with advanced orchestration capabilities.

## Features
- **Multi-deployment Support**: ECS Fargate, Kubernetes (EKS), or hybrid deployments
- **Enterprise Security**: WAF, GuardDuty, AWS Config, KMS encryption
- **Auto-scaling**: Horizontal pod autoscaling and ECS service auto-scaling
- **Comprehensive Monitoring**: CloudWatch, X-Ray tracing, custom dashboards
- **Privacy-focused**: Local development with secure cloud deployment options
- **Infrastructure as Code**: Complete Terraform and Quali Torque integration

## Quick Start

### Local Development
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the API server:
   ```bash
   uvicorn main:app --reload
   ```
3. Access the docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Cloud Deployment

#### Prerequisites
- AWS CLI configured with appropriate permissions
- Docker installed and running
- Quali Torque CLI (optional, for advanced orchestration)

#### ECS Fargate Deployment
```bash
# Deploy to development environment
./deploy.sh development dev.ayvcodr.com

# Deploy to production environment  
./deploy.sh production ayvcodr.com
```

#### Kubernetes (EKS) Deployment
```bash
# Linux/macOS
./deploy-k8s.sh development dev.ayvcodr.com

# Windows PowerShell
.\deploy-k8s.ps1 -Environment development -Domain dev.ayvcodr.com
```

## Architecture

### Infrastructure Components
- **VPC & Networking**: Multi-AZ subnets, NAT gateways, security groups
- **Container Orchestration**: ECS Fargate and/or Amazon EKS
- **Database**: RDS PostgreSQL with Multi-AZ deployment
- **Load Balancing**: Application Load Balancer with WAF protection
- **Security**: GuardDuty, Config, SecurityHub, KMS encryption
- **Monitoring**: CloudWatch, X-Ray, custom dashboards and alarms

### Kubernetes Features
- **Helm Charts**: Production-ready charts with configurable values
- **Kustomize**: Environment-specific overlays for different deployments
- **Auto-scaling**: HPA with CPU and memory metrics
- **Security**: Pod security contexts, network policies, RBAC
- **Service Mesh Ready**: Istio-compatible with injection labels

## API Endpoints
- `/health` (GET): Health check endpoint for load balancers
- `/analyze` (POST): Text analysis with length and word count
- `/docs` (GET): Interactive API documentation
- `/metrics` (GET): Prometheus-compatible metrics

## Development

### Adding New Endpoints
1. Define your endpoint in `main.py`:
   ```python
   @app.post("/your-endpoint")
   async def your_endpoint(data: YourModel):
       # Your logic here
       return {"result": "success"}
   ```

2. Add corresponding models in `models_apikey.py`
3. Update tests in `tests/`
4. Deploy using your preferred method

### Environment Configuration
- **Development**: Single replica, relaxed security, debug logging
- **Production**: Multi-replica, enhanced security, structured logging
- **Hybrid**: Both ECS and Kubernetes deployments for A/B testing

## Monitoring and Observability

### CloudWatch Integration
- Application logs with structured JSON
- Custom metrics for business logic
- Automated alerting on errors and performance issues

### Kubernetes Monitoring
- Prometheus metrics collection
- Grafana dashboards (configurable)
- Service mesh observability with Istio

## Security Features

### AWS Security Services
- **WAF**: Web application firewall with OWASP rules
- **GuardDuty**: Threat detection and monitoring
- **Config**: Compliance monitoring and remediation
- **SecurityHub**: Centralized security findings
- **KMS**: Encryption at rest and in transit

### Kubernetes Security
- Pod security contexts with non-root users
- Network policies for traffic isolation
- RBAC with minimal required permissions
- Secret management with AWS Secrets Manager integration

---

*AyvCodr empowers you to create enterprise-grade AI solutions with modern cloud-native architecture, complete security, and flexible deployment options.*
