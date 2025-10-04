# Staging Docker Setup - ✅ TESTED

This directory contains the network-accessible staging configuration for the Restaurant Recipe App.

## Quick Start

```bash
# From project root
cd deployment/docker/stage

# Start services
docker-compose up -d
```

## Services

- **MongoDB**: `192.168.68.129:27017`
- **Backend API**: `http://192.168.68.129:8080`
- **Frontend**: `http://192.168.68.129:3000`
- **Prometheus**: `http://192.168.68.129:9090`
- **Grafana**: `http://192.168.68.129:3001`

## Features

- ✅ Network accessible from other devices on LAN
- ✅ Clean container naming (stage-*)
- ✅ Staging environment configuration
- ✅ Monitoring with Prometheus and Grafana
- ✅ Volume persistence for data
- ✅ Health checks for MongoDB

## Environment Variables

All configuration is in `env.stage`:

- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Staging JWT secret
- `REACT_APP_API_URL`: Frontend API endpoint (network accessible)
- `WDS_SOCKET_HOST`: WebSocket host (network accessible)
- `FRONTEND_URL`: Frontend URL for CORS
- `ALLOWED_ORIGINS`: CORS allowed origins

## Network Access

This configuration is designed for network access:
- **Frontend**: Accessible from any device on `192.168.68.129:3000`
- **Backend**: API accessible from any device on `192.168.68.129:8080`
- **Monitoring**: Prometheus and Grafana accessible on network

## Admin Account

Create admin user for testing:
```bash
# Copy script to backend container
docker cp ../../scripts/sample_data/createAdmin.js stage-backend-1:/app/
docker exec stage-backend-1 node createAdmin.js
```
- **Username**: `admin`
- **Password**: `SecurePassword123`

## Development Workflow

1. Make changes to your code in `backend/` or `frontend/`
2. Rebuild containers: `docker-compose build`
3. Restart services: `docker-compose up -d`
4. View logs: `docker-compose logs -f`
5. Stop services: `docker-compose down`

## Troubleshooting

### Services won't start
```bash
# Check configuration
docker-compose config

# View logs
docker-compose logs
```

### Network access issues
- Ensure your IP address is correct in `env.stage`
- Check firewall settings on host machine
- Verify containers are running: `docker ps`

### Port conflicts
If ports are in use:
```bash
# Edit env.stage
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
- ✅ Network accessibility confirmed
- ✅ Monitoring services working

This configuration is ready for staging and network testing.