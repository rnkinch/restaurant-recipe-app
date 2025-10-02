# Migration Guide: Separating Deployment from Code

This guide will help you migrate from your current structure to the new deployment-separated structure.

## ⚠️ TESTING STATUS
- ✅ **TESTED**: Local Docker development configuration
- 🔧 **TEMPLATES**: Production Docker, AWS, Kubernetes configurations (require customization and testing)

## Current Issues Identified

1. **Hardcoded Environment Values**: IP addresses like `172.30.176.1:8080` in docker-compose.yml
2. **Mixed Concerns**: Docker files scattered in application directories
3. **No Environment Separation**: Single docker-compose.yml for all environments
4. **Platform Coupling**: Configuration tied to local WSL development

## Migration Steps

### Phase 1: Backup and Prepare

```bash
# 1. Create a backup (you already have backup.sh)
./scripts/backup.sh

# 2. Create a new branch for the migration
git checkout -b feature/deployment-separation
```

### Phase 2: Move Docker Configurations

```bash
# 1. Create the new deployment structure (already done)
# deployment/ directory has been created with all configurations

# 2. Update your current docker-compose.yml to use the new development setup
# Replace your current docker-compose.yml with:
cp deployment/docker/development/docker-compose.yml ./docker-compose.yml

# 3. Create environment file
cp deployment/docker/development/env.development ./.env
```

### Phase 3: Update Dockerfile Paths

Your current Dockerfiles need to be updated to work with the new structure:

**For Backend (backend/Dockerfile):**
- Move to: `deployment/docker/development/backend.Dockerfile`
- Update context paths in docker-compose.yml

**For Frontend (frontend/Dockerfile):**
- Move to: `deployment/docker/development/frontend.Dockerfile`
- Update context paths in docker-compose.yml

### Phase 4: Environment Configuration

1. **Development Environment**
   ```bash
   # Copy and customize development environment
   cp deployment/docker/development/env.development .env.development
   # Edit .env.development with your specific settings
   ```

2. **Production Environment**
   ```bash
   # Copy and customize production environment
   cp deployment/docker/production/env.production .env.production
   # IMPORTANT: Replace all placeholder values!
   ```

### Phase 5: Update Scripts and Documentation

1. **Update package.json scripts** (if any reference Docker)
2. **Update README.md** with new deployment instructions
3. **Update CI/CD pipelines** to use new paths

## Immediate Benefits

After migration, you'll have:

✅ **Environment Separation**: Different configs for dev/staging/prod
✅ **Platform Flexibility**: Easy to add AWS, GCP, K8s deployments
✅ **Clean Codebase**: No deployment configs mixed with application code
✅ **Scalable Structure**: Ready for multi-platform deployments
✅ **Security**: Environment-specific secrets management

## Testing the Migration

### Test Development Environment
```bash
# Using new structure
cd deployment/docker/development
docker-compose --env-file env.development up --build

# Or using the deployment script
./scripts/deploy.sh docker-dev --build
```

### Test Production Environment
```bash
# First, configure production environment
vim deployment/docker/production/env.production
# Replace all CHANGE_THIS values

# Deploy production
./scripts/deploy.sh docker-prod --build
```

## Rollback Plan

If issues occur, you can rollback:

```bash
# 1. Stop new deployment
docker-compose down

# 2. Restore from backup
cd /path/to/backup
tar -xzf recipe-app-baseline-TIMESTAMP.tar.gz

# 3. Start old deployment
docker-compose up
```

## Next Steps After Migration

1. **AWS Deployment**
   ```bash
   # Set up AWS infrastructure
   cd deployment/aws/terraform
   terraform init && terraform apply
   
   # Deploy to ECS
   ./scripts/deploy.sh aws-ecs
   ```

2. **Kubernetes Deployment**
   ```bash
   # Deploy to K8s cluster
   ./scripts/deploy.sh kubernetes
   ```

3. **CI/CD Integration**
   - Update GitHub Actions/Jenkins pipelines
   - Use new deployment scripts
   - Implement environment-specific deployments

## Configuration Examples

### Development (.env.development)
```env
MONGO_URI=mongodb://mongo-container:27017/recipeDB
PORT=8080
NODE_ENV=development
JWT_SECRET=dev-jwt-secret
REACT_APP_API_URL=http://localhost:8080
```

### Production (.env.production)
```env
MONGO_URI=mongodb://your-prod-mongo-host:27017/recipeDB
PORT=8080
NODE_ENV=production
JWT_SECRET=your-super-secure-production-jwt-secret
REACT_APP_API_URL=https://api.yourdomain.com
```

## Troubleshooting

### Common Issues

1. **Path Issues**
   - Ensure Docker build contexts point to correct directories
   - Update volume mounts in docker-compose.yml

2. **Environment Variables**
   - Verify all required variables are set
   - Check for typos in variable names

3. **Network Issues**
   - Update API URLs to match your environment
   - Ensure CORS settings are correct

### Getting Help

1. Check the deployment/README.md for detailed instructions
2. Review logs: `docker-compose logs -f`
3. Validate environment files for missing values

## Timeline

- **Phase 1-2**: 30 minutes (backup and move files)
- **Phase 3**: 1 hour (update configurations)
- **Phase 4**: 30 minutes (environment setup)
- **Phase 5**: 1 hour (documentation updates)
- **Testing**: 1 hour (verify all environments work)

**Total estimated time: 4 hours**

This migration will set you up for easy multi-platform deployments and much cleaner code organization!
