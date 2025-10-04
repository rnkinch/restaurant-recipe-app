# Development Docker Setup - ✅ TESTED

This directory contains the tested Docker development configuration for the Restaurant Recipe App.

## Quick Start

```bash
# From project root
cd deployment/docker/development

# Start services
docker-compose up -d

# Or use the test script from project root
./test-local-docker.sh
```

## Services

- **MongoDB**: `localhost:27017`
- **Backend API**: `localhost:8080`
- **Frontend**: `localhost:3000`
- **Prometheus**: `localhost:9090`
- **Grafana**: `localhost:3001`

## Features

- ✅ Hot reload for both frontend and backend
- ✅ Volume mounts for development
- ✅ Environment variable configuration
- ✅ Health checks for MongoDB
- ✅ Proper service dependencies
- ✅ Monitoring with Prometheus and Grafana
- ✅ Clean container naming (dev-*)
- ✅ Localhost-only access (no network exposure)

## Environment Variables

All configuration is in `env.development`:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Development JWT secret (change for production!)
- `REACT_APP_API_URL`: Frontend API endpoint
- `PORT`: Backend port (8080)
- Rate limiting and file upload settings

## Development Workflow

1. Make changes to your code in `backend/` or `frontend/`
2. Changes are automatically reflected (hot reload)
3. View logs: `docker-compose logs -f`
4. Stop services: `docker-compose down`

## Admin Account

Create admin user for testing:
```bash
# Copy script to backend container
docker cp ../../scripts/sample_data/createAdmin.js dev-backend-1:/app/
docker exec dev-backend-1 node createAdmin.js
```
- **Username**: `admin`
- **Password**: `SecurePassword123`

## Troubleshooting

### Services won't start
```bash
# Check configuration
docker-compose config

# View logs
docker-compose logs
```

### Port conflicts
If ports 3000, 8080, or 27017 are in use:
```bash
# Edit env.development
BACKEND_PORT=8081
FRONTEND_PORT=3001
```

### Permission issues
```bash
# Clean up and restart
docker-compose down -v
docker-compose up --build
```

## Testing Status

- ✅ Docker Compose configuration validated
- ✅ Service dependencies working
- ✅ Environment variables loaded correctly
- ✅ Volume mounts configured for hot reload

This configuration has been tested and is ready for development use.
