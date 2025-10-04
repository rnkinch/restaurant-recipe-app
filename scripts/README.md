# Scripts Directory

This directory contains utility scripts for managing the Restaurant Recipe App.

## 🧹 Cleanup Scripts

### `cleanup-all.sh` - Complete System Cleanup
**⚠️ WARNING: This will remove ALL Docker resources!**

```bash
./scripts/cleanup-all.sh
```

**What it does:**
- Stops and removes ALL containers
- Removes ALL images
- Removes ALL volumes
- Removes ALL networks
- Cleans build cache
- Removes node_modules
- Cleans up .env files

**Use when:** You want to completely reset your Docker environment.

### Environment-Specific Cleanup Scripts
Each environment has its own cleanup script in its deployment directory:

- **Development**: `deployment/docker/development/cleanup.sh`
- **Staging**: `deployment/docker/stage/cleanup.sh`
- **Production**: `deployment/docker/production/cleanup.sh`

See `deployment/scripts/README.md` for details.

### `cleanup_docker.sh` - Basic Docker Cleanup
```bash
./scripts/cleanup_docker.sh
```

**What it does:**
- Removes unused containers, images, volumes, networks
- Cleans build cache
- Safe cleanup (doesn't remove running resources)

**Use when:** You want a safe, basic cleanup.

## 🏗️ Build Scripts

### Building Individual Environments
Each environment should be built individually as needed:

```bash
# Build development environment
cd deployment/docker/development
docker-compose build

# Build staging environment
cd deployment/docker/stage
docker-compose build

# Build production environment
cd deployment/docker/production
docker-compose build
```

**Why build individually?**
- Faster builds (only what you need)
- Less resource usage
- More targeted development workflow
- Easier to debug build issues

## 🚀 Deployment Scripts

### `deploy.sh` - Deployment Script
```bash
./scripts/deploy.sh
```

**What it does:**
- Handles deployment to various environments
- See script for specific usage

### `test-local-docker.sh` - Test Local Docker Setup
```bash
./scripts/test-local-docker.sh
```

**What it does:**
- Tests the development Docker setup
- Validates configuration
- Checks service health
- Provides detailed feedback

**Use when:** You want to verify your development environment is working.

## 📊 Monitoring Scripts

### `start-with-monitoring.sh` - Start with Monitoring
```bash
./scripts/start-with-monitoring.sh
```

**What it does:**
- Starts the application with Prometheus and Grafana
- Sets up monitoring dashboards

### `start-with-monitoring.ps1` - Windows PowerShell Version
```powershell
.\scripts\start-with-monitoring.ps1
```

## 💾 Backup Scripts

### `backup.sh` - Create Project Backup
```bash
./scripts/backup.sh
```

**What it does:**
- Creates timestamped backup of the project
- Excludes node_modules and existing backups
- Saves to `/mnt/c/Users/rnkin/backups/`

**Use when:** You want to create a backup before major changes.

## 📁 Sample Data Scripts

### `sample_data/` Directory
Contains scripts for loading sample data and creating admin accounts.

See `sample_data/README.md` for detailed information.

## 🎯 Quick Reference

| Task | Script | Description |
|------|--------|-------------|
| **Complete Reset** | `cleanup-all.sh` | Remove everything and start fresh |
| **Dev Reset** | `deployment/docker/development/cleanup.sh` | Reset development environment only |
| **Stage Reset** | `deployment/docker/stage/cleanup.sh` | Reset staging environment only |
| **Prod Reset** | `deployment/docker/production/cleanup.sh` | Reset production environment only |
| **Safe Cleanup** | `cleanup_docker.sh` | Basic cleanup of unused resources |
| **Build Dev** | `cd deployment/docker/development && docker-compose build` | Build development environment |
| **Build Stage** | `cd deployment/docker/stage && docker-compose build` | Build staging environment |
| **Build Prod** | `cd deployment/docker/production && docker-compose build` | Build production environment |
| **Test Setup** | `test-local-docker.sh` | Test development environment |
| **Create Backup** | `backup.sh` | Backup project files |

## ⚠️ Important Notes

1. **Always run scripts from the project root directory**
2. **Backup important data before running cleanup scripts**
3. **The `cleanup-all.sh` script will remove ALL Docker resources**
4. **Environment-specific cleanup scripts are safer for targeted cleanup**
5. **All scripts include error handling and confirmation prompts where appropriate**

## 🔧 Troubleshooting

### Script Permission Issues
```bash
chmod +x scripts/*.sh
```

### Docker Not Running
```bash
# Start Docker Desktop or Docker service
# Then retry the script
```

### Script Fails
```bash
# Check if you're in the project root directory
# Ensure Docker is running
# Check script permissions
```
