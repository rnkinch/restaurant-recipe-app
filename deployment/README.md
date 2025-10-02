# Deployment Guide

This directory contains deployment configurations for the Restaurant Recipe App across multiple platforms and environments.

## ⚠️ TESTING STATUS

- ✅ **TESTED**: `deployment/docker/development/` - Local Docker development setup
- 🔧 **TEMPLATE**: `deployment/docker/production/` - Production Docker setup (requires customization)
- 🔧 **TEMPLATE**: `deployment/aws/` - AWS deployment configurations (requires AWS setup)
- 🔧 **TEMPLATE**: `deployment/kubernetes/` - Kubernetes manifests (requires K8s cluster)

**Only the development Docker configuration has been tested. All other configurations are templates that require customization and testing.**

## Structure

```
deployment/
├── docker/                    # Docker-based deployments
│   ├── development/          # Local development
│   ├── staging/              # Staging environment (optional)
│   └── production/           # Production environment
├── aws/                      # AWS-specific deployments
│   ├── ecs/                  # Elastic Container Service
│   ├── lambda/               # Serverless functions
│   └── terraform/            # Infrastructure as Code
├── gcp/                      # Google Cloud Platform
├── azure/                    # Microsoft Azure
├── kubernetes/               # Generic Kubernetes
│   ├── base/                 # Base manifests
│   ├── overlays/             # Environment-specific overlays
│   └── helm/                 # Helm charts
└── README.md                 # This file
```

## Quick Start

### Development (Docker) - ✅ TESTED
```bash
# Test the setup first
./test-local-docker.sh

# Using the deployment script
./scripts/deploy.sh docker-dev --build

# Or manually
cd deployment/docker/development
docker-compose --env-file env.development up --build
```

### Production (Docker) - 🔧 TEMPLATE (NOT TESTED)
```bash
# ⚠️ REQUIRES CUSTOMIZATION AND TESTING
# Configure production environment first
cp deployment/docker/production/env.production deployment/docker/production/.env.production
# Edit .env.production with your actual values

# Deploy (after testing)
./scripts/deploy.sh docker-prod
```

### AWS ECS - 🔧 TEMPLATE (NOT TESTED)
```bash
# ⚠️ REQUIRES AWS ACCOUNT SETUP AND TESTING
# Set up infrastructure with Terraform
cd deployment/aws/terraform
terraform init
terraform plan
terraform apply

# Deploy application
./scripts/deploy.sh aws-ecs
```

### Kubernetes - 🔧 TEMPLATE (NOT TESTED)
```bash
# ⚠️ REQUIRES K8S CLUSTER AND TESTING
# Apply manifests
./scripts/deploy.sh kubernetes

# Or manually
kubectl apply -f deployment/kubernetes/base/
```

## Environment Configuration

### Development
- Hot reload enabled
- Debug logging
- Permissive CORS
- Development database

### Production
- Optimized builds
- Security headers
- Rate limiting
- SSL/TLS termination
- Health checks
- Log aggregation

## Security Considerations

1. **Secrets Management**
   - Use environment variables for sensitive data
   - Never commit secrets to version control
   - Use platform-specific secret management (AWS Secrets Manager, K8s Secrets, etc.)

2. **Network Security**
   - Private subnets for databases
   - Security groups/network policies
   - SSL/TLS encryption

3. **Container Security**
   - Non-root users
   - Minimal base images
   - Regular security updates

## Monitoring and Logging

- Health checks on all services
- Centralized logging
- Metrics collection
- Alerting setup

## Backup and Recovery

- Database backups
- Volume snapshots
- Disaster recovery procedures

## Scaling

- Horizontal pod autoscaling (K8s)
- Auto Scaling Groups (AWS)
- Load balancing
- Database read replicas

## Troubleshooting

### Common Issues

1. **Container won't start**
   - Check logs: `docker logs <container>`
   - Verify environment variables
   - Check resource limits

2. **Database connection issues**
   - Verify network connectivity
   - Check credentials
   - Ensure database is running

3. **Frontend can't reach backend**
   - Check API URL configuration
   - Verify CORS settings
   - Check network policies

### Useful Commands

```bash
# Docker
docker-compose logs -f
docker-compose ps
docker system prune

# Kubernetes
kubectl get pods
kubectl logs <pod-name>
kubectl describe pod <pod-name>

# AWS
aws ecs list-tasks --cluster <cluster-name>
aws logs tail <log-group>
```

## Migration Guide

To migrate from the current structure to this new deployment structure:

1. **Move Docker files**
   ```bash
   # Current files will be moved to deployment/docker/development/
   # Update docker-compose.yml paths accordingly
   ```

2. **Update CI/CD pipelines**
   - Point to new Docker file locations
   - Use new deployment scripts

3. **Environment variables**
   - Consolidate environment files
   - Update variable references

4. **Documentation**
   - Update README files
   - Update deployment procedures

## Best Practices

1. **Version Control**
   - Tag releases
   - Use semantic versioning
   - Maintain changelog

2. **Testing**
   - Test deployments in staging
   - Automated testing pipelines
   - Rollback procedures

3. **Documentation**
   - Keep deployment docs updated
   - Document configuration changes
   - Maintain runbooks

## Support

For deployment issues:
1. Check this documentation
2. Review logs and error messages
3. Consult platform-specific documentation
4. Contact the development team
