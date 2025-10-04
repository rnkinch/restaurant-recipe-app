# Deployment Scripts

This directory contains scripts for managing the Restaurant Recipe App deployment environments.

## 🧹 Environment-Specific Cleanup Scripts

Each environment has its own cleanup script located in its respective directory:

### Development Environment
```bash
cd deployment/docker/development
./cleanup.sh
```

### Staging Environment
```bash
cd deployment/docker/stage
./cleanup.sh
```

### Production Environment
```bash
cd deployment/docker/production
./cleanup.sh
```

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

## 📁 Directory Structure

```
deployment/
├── scripts/
│   └── README.md           # This file
├── docker/
│   ├── development/
│   │   ├── cleanup.sh      # Development cleanup
│   │   ├── docker-compose.yml
│   │   └── env.development
│   ├── stage/
│   │   ├── cleanup.sh      # Staging cleanup
│   │   ├── docker-compose.yml
│   │   └── env.stage
│   └── production/
│       ├── cleanup.sh      # Production cleanup
│       ├── docker-compose.yml
│       └── env.production
└── aws/                    # AWS deployment configs
└── kubernetes/             # K8s deployment configs
```

## 🎯 Quick Reference

| Environment | Cleanup Script | Build Command |
|-------------|----------------|---------------|
| **Development** | `cleanup.sh` | `docker-compose build` |
| **Staging** | `cleanup.sh` | `docker-compose build` |
| **Production** | `cleanup.sh` | `docker-compose build` |

## ⚠️ Important Notes

1. **Always run cleanup scripts from their respective environment directories**
2. **Build only the environment you need - no need to build all at once**
3. **Each cleanup script only affects its specific environment**
4. **All scripts include error handling and confirmation prompts where appropriate**

## 🔧 Usage Examples

### Clean up development environment
```bash
cd deployment/docker/development
./cleanup.sh
docker-compose up --build -d
```

### Clean up staging environment
```bash
cd deployment/docker/stage
./cleanup.sh
docker-compose up --build -d
```

### Build specific environment
```bash
# Build development
cd deployment/docker/development
docker-compose build

# Build staging
cd deployment/docker/stage
docker-compose build

# Build production
cd deployment/docker/production
docker-compose build
```

### Clean up production environment
```bash
cd deployment/docker/production
./cleanup.sh
docker-compose up --build -d
```

## 🚨 Safety Features

- **Environment isolation**: Each cleanup script only affects its specific environment
- **Confirmation prompts**: Scripts ask for confirmation before destructive operations
- **Error handling**: Scripts stop on errors and provide clear error messages
- **Docker health checks**: Scripts verify Docker is running before proceeding
