# Production Deployment Guide

## 🚀 Prerequisites

### 1. Server Requirements
- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: Minimum 4GB, Recommended 8GB+
- **CPU**: 2+ cores
- **Storage**: 50GB+ SSD storage
- **Network**: Public IP address with domain name

### 2. Software Requirements
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- SSL Certificate (Let's Encrypt recommended)

## 🔧 Pre-Deployment Setup

### 1. Clone Repository
```bash
git clone https://github.com/rnkinch/restaurant-recipe-app.git
cd restaurant-recipe-app
```

### 2. Generate Secure Secrets
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate Grafana admin password
openssl rand -base64 16
```

### 3. Configure Environment
Edit `deployment/docker/production/env.production`:

```bash
# Replace with your actual domain
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
REACT_APP_API_URL=https://yourdomain.com/api

# Replace with generated secrets
JWT_SECRET=your_generated_jwt_secret_here
GRAFANA_ADMIN_PASSWORD=your_generated_grafana_password_here
```

### 4. SSL Certificate Setup
```bash
# Create SSL directory
mkdir -p deployment/docker/production/ssl

# Option 1: Let's Encrypt (Recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem deployment/docker/production/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem deployment/docker/production/ssl/key.pem
sudo chown $USER:$USER deployment/docker/production/ssl/*

# Option 2: Self-signed (Development only)
# openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#   -keyout deployment/docker/production/ssl/key.pem \
#   -out deployment/docker/production/ssl/cert.pem
```

### 5. Update Nginx Configuration
Edit `deployment/docker/production/nginx.conf`:
- Uncomment SSL certificate lines (lines 43-44)
- Update server_name with your domain

## 🚀 Deployment

### 1. Build and Start Services
```bash
cd deployment/docker/production
docker-compose up -d --build
```

### 2. Verify Deployment
```bash
# Check all containers are running
docker-compose ps

# Test endpoints
curl -k https://yourdomain.com/health
curl -k https://yourdomain.com
```

### 3. Access Services
- **Application**: https://yourdomain.com
- **Grafana**: https://yourdomain.com:3001 (admin/your_password)
- **Prometheus**: https://yourdomain.com:9090

## 🔒 Security Checklist

### ✅ Critical Security Steps
- [ ] Changed default JWT_SECRET
- [ ] Changed default Grafana admin password
- [ ] SSL certificates properly configured
- [ ] Firewall configured (only ports 80, 443, 3001, 9090 open)
- [ ] MongoDB not exposed externally
- [ ] Backend API not exposed externally (nginx proxy only)
- [ ] Rate limiting enabled in nginx
- [ ] Security headers configured
- [ ] File upload size limits set

### 🔧 Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # Grafana
sudo ufw allow 9090/tcp  # Prometheus
sudo ufw enable
```

## 📊 Monitoring Setup

### 1. Grafana Dashboard
- Access: https://yourdomain.com:3001
- Login: admin / your_generated_password
- Dashboard: "Recipe App Monitoring" should be auto-loaded

### 2. Prometheus Metrics
- Access: https://yourdomain.com:9090
- Check targets: Status → Targets
- Verify backend metrics are being collected

### 3. Log Management
```bash
# View application logs
docker-compose logs -f backend-container

# View nginx logs
docker-compose logs -f nginx

# View all logs
docker-compose logs -f
```

## 🔄 Maintenance

### 1. SSL Certificate Renewal (Let's Encrypt)
```bash
# Add to crontab for auto-renewal
sudo crontab -e

# Add this line (runs monthly)
0 3 1 * * certbot renew --quiet && docker-compose restart nginx
```

### 2. Database Backups
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec mongo-container mongodump --db recipeDB --out /tmp/backup
docker cp $(docker-compose ps -q mongo-container):/tmp/backup ./backup_$DATE
EOF

chmod +x backup.sh

# Schedule backups (daily at 2 AM)
echo "0 2 * * * /path/to/backup.sh" | sudo crontab -
```

### 3. Updates
```bash
# Update application
git pull origin main
docker-compose down
docker-compose up -d --build

# Update monitoring dashboards (if needed)
# Edit monitoring/grafana/dashboards/recipe-app-dashboard.json
docker-compose restart grafana
```

## 🚨 Troubleshooting

### Common Issues

#### 1. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443
```

#### 2. Database Connection Issues
```bash
# Check MongoDB logs
docker-compose logs mongo-container

# Test database connection
docker-compose exec backend-container curl http://localhost:8080/health
```

#### 3. Frontend Build Issues
```bash
# Check frontend build logs
docker-compose logs frontend-container

# Rebuild frontend
docker-compose up -d --build frontend-container
```

#### 4. Monitoring Issues
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Grafana datasource
# Login to Grafana → Configuration → Data Sources → Test
```

## 📈 Performance Optimization

### 1. Resource Limits
Add to docker-compose.yml services:
```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
```

### 2. Database Optimization
```bash
# Connect to MongoDB
docker-compose exec mongo-container mongosh recipeDB

# Create indexes for better performance
db.recipes.createIndex({ "name": 1 })
db.recipes.createIndex({ "active": 1 })
db.ingredients.createIndex({ "name": 1 })
```

### 3. Nginx Optimization
- Enable gzip compression (already configured)
- Set appropriate cache headers
- Configure rate limiting (already configured)

## 🔄 Scaling

### Horizontal Scaling
- Use Docker Swarm or Kubernetes
- Load balance multiple backend instances
- Use external MongoDB cluster
- Implement Redis for session management

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets

## 📞 Support

For issues or questions:
1. Check application logs: `docker-compose logs -f`
2. Check monitoring dashboards in Grafana
3. Review this deployment guide
4. Check GitHub issues: https://github.com/rnkinch/restaurant-recipe-app/issues

---

**⚠️ Important**: This is a production deployment. Always test in a staging environment first and ensure you have proper backups before deploying to production.
