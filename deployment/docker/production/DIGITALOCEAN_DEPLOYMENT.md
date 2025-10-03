# 🚀 DigitalOcean Deployment Guide

## Complete guide for deploying Restaurant Recipe App on DigitalOcean

---

## 📋 Prerequisites

- DigitalOcean account
- Domain name (optional but recommended)
- Credit card for DigitalOcean billing

---

## 🎯 Step 1: Create DigitalOcean Droplet

### 1.1 Login to DigitalOcean
1. Go to [digitalocean.com](https://digitalocean.com)
2. Sign up or login to your account
3. Click **"Create"** → **"Droplets"**

### 1.2 Choose Configuration

**Recommended Settings:**
- **Image**: Ubuntu 22.04 (LTS) x64
- **Plan**: **Basic** → **$24/month** (4GB RAM, 2 CPU, 80GB SSD)
- **Datacenter**: Choose closest to your users
- **Authentication**: SSH Key (recommended) or Password
- **Hostname**: `recipe-app-prod` (or your preference)

**Advanced Options:**
- **Monitoring**: ✅ Enable (free)
- **Backups**: ✅ Enable ($4.80/month extra - recommended)
- **IPv6**: ✅ Enable (free)

### 1.3 Create SSH Key (if you don't have one)
```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
cat ~/.ssh/id_rsa.pub  # Copy this output
```

### 1.4 Add SSH Key to DigitalOcean
1. In DigitalOcean dashboard → **"Security"** → **"SSH Keys"**
2. Click **"Add SSH Key"**
3. Paste your public key
4. Give it a name like "Recipe App Deploy"

### 1.5 Create the Droplet
1. Select your SSH key
2. Click **"Create Droplet"**
3. Wait 2-3 minutes for setup to complete

---

## 🌐 Step 2: Configure Domain (Optional but Recommended)

### 2.1 Point Domain to Droplet
1. In DigitalOcean dashboard → **"Networking"** → **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain name
4. Select your droplet
5. Click **"Create Record"**

### 2.2 Alternative: Use DigitalOcean's Domain
If you don't have a domain, you can use DigitalOcean's free domain:
- Your droplet will be accessible at: `http://your-droplet-ip`
- You can add a custom domain later

---

## 🔧 Step 3: Initial Server Setup

### 3.1 Connect to Your Droplet
```bash
# Replace with your droplet's IP address
ssh root@YOUR_DROPLET_IP

# Or if you set up a non-root user:
ssh your_username@YOUR_DROPLET_IP
```

### 3.2 Update System
```bash
# Update package lists
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git unzip
```

### 3.3 Install Node.js (Required for JavaScript commands)
```bash
# Install Node.js 20.x (required for running JavaScript commands)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install global packages that might be needed
sudo npm install -g nodemon pm2
```

### 3.4 Create Non-Root User (Security Best Practice)
```bash
# Create new user
adduser deploy
usermod -aG sudo deploy

# Copy SSH key to new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Switch to new user
su - deploy
```

---

## 🐳 Step 4: Install Docker

### 4.1 Install Docker Engine
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
ssh deploy@YOUR_DROPLET_IP
```

### 4.2 Install Docker Compose
```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## 📦 Step 5: Deploy Your Application

### 5.1 Clone Repository
```bash
# Clone your repository
git clone https://github.com/rnkinch/restaurant-recipe-app.git
cd restaurant-recipe-app/deployment/docker/production
```

### 5.2 Generate Secure Secrets
```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET: $JWT_SECRET"

# Generate Grafana password
GRAFANA_PASSWORD=$(openssl rand -base64 16)
echo "GRAFANA_PASSWORD: $GRAFANA_PASSWORD"

# Save these for later use!
```

### 5.3 Set Up SSL Certificate

**⚠️ IMPORTANT: SSL certificates are required for HTTPS. Choose one option:**

#### Option A: With Domain Name (Recommended for Production)
```bash
# Install Certbot
sudo apt install -y certbot

# Get SSL certificate (replace yourdomain.com with your actual domain)
sudo certbot certonly --standalone -d yourdomain.com

# Create SSL directory and copy certificates
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*

# Set up automatic renewal
sudo crontab -e
# Add this line to renew certificates automatically:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Option B: With IP Address (Self-Signed)
```bash
# Create self-signed certificate for IP address
mkdir -p ssl

# Replace 167.71.247.15 with your actual droplet IP
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=167.71.247.15"

# Note: Browsers will show security warnings with self-signed certificates
# You can bypass these warnings by clicking "Advanced" → "Proceed"
```

#### Option C: Quick Test (HTTP Only - Not Recommended for Production)
```bash
# If you want to test without SSL first, you can temporarily use HTTP
# This is only for initial testing - not secure for production use
```

### 5.4 Run Deployment Script
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment (replace with your actual values)
./deploy.sh yourdomain.com "$JWT_SECRET" "$GRAFANA_PASSWORD"

# If you don't have a domain, use the droplet IP:
# ./deploy.sh YOUR_DROPLET_IP "$JWT_SECRET" "$GRAFANA_PASSWORD"
```

### 5.5 Create Admin User

**After the application is running, create an admin user:**

```bash
# Connect to MongoDB container
docker exec -it production-mongo-container-1 mongosh

# Switch to the recipe database
use recipeDB

# Create admin user (password is "password" - change this!)
db.users.insertOne({
  username: "admin",
  email: "admin@example.com", 
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

# Exit MongoDB
exit
```

**Login credentials:**
- Username: `admin`
- Password: `password`

**⚠️ IMPORTANT: Change the admin password immediately after first login!**

### 5.6 Verify Deployment
```bash
# Check if all containers are running
docker-compose ps

# Check logs if needed
docker-compose logs -f
```

---

## 🔒 Step 6: Configure Firewall

### 6.1 Set Up UFW Firewall
```bash
# Install UFW if not already installed
sudo apt install -y ufw

# Configure firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # Grafana
sudo ufw allow 9090/tcp  # Prometheus

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## ✅ Step 7: Verify Everything Works

### 7.1 Test Your Application
```bash
# Test health endpoint
curl -k https://yourdomain.com/health

# Test frontend
curl -k https://yourdomain.com

# Test monitoring (replace with your domain/IP)
curl -k https://yourdomain.com:3001  # Grafana
curl -k https://yourdomain.com:9090  # Prometheus
```

### 7.2 Access Your Services
- **Main App**: https://yourdomain.com
- **Grafana**: https://yourdomain.com:3001 (admin / your_password)
- **Prometheus**: https://yourdomain.com:9090

---

## 🔄 Step 8: Set Up Maintenance Tasks

### 8.1 SSL Certificate Auto-Renewal
```bash
# Add to crontab for automatic renewal
sudo crontab -e

# Add this line (runs monthly):
0 3 1 * * certbot renew --quiet && docker-compose -f /home/deploy/restaurant-recipe-app/deployment/docker/production/docker-compose.yml restart nginx
```

### 8.2 Database Backups
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cd /home/deploy/restaurant-recipe-app/deployment/docker/production
docker-compose exec -T mongo-container mongodump --db recipeDB --out /tmp/backup
docker cp $(docker-compose ps -q mongo-container):/tmp/backup ./backup_$DATE
echo "Backup completed: backup_$DATE"
EOF

chmod +x backup.sh

# Schedule daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /home/deploy/backup.sh") | crontab -
```

### 8.3 System Updates
```bash
# Create update script
cat > update.sh << 'EOF'
#!/bin/bash
cd /home/deploy/restaurant-recipe-app
git pull origin main
cd deployment/docker/production
docker-compose down
docker-compose up -d --build
echo "Application updated successfully"
EOF

chmod +x update.sh
```

---

## 📊 Step 9: Monitoring Setup

### 9.1 Configure Grafana
1. Go to https://yourdomain.com:3001
2. Login with: admin / your_generated_password
3. Verify "Recipe App Monitoring" dashboard is loaded
4. Check that metrics are being collected

### 9.2 Set Up Alerts (Optional)
```bash
# Create alert script for high CPU/memory usage
cat > alert.sh << 'EOF'
#!/bin/bash
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "High CPU usage: $CPU_USAGE%"
    # Add email notification here if needed
fi
EOF

chmod +x alert.sh
```

---

## 💰 Cost Breakdown

### Monthly Costs:
- **DigitalOcean Droplet**: $24 (4GB RAM, 2 CPU, 80GB SSD)
- **Backups**: $4.80 (optional but recommended)
- **Domain**: $0-15 (depending on provider)
- **Total**: ~$29-44/month

### Optional Upgrades:
- **8GB RAM Droplet**: $48/month (better performance)
- **Load Balancer**: $12/month (high availability)
- **Managed Database**: $15/month (easier maintenance)

---

## 🚨 Troubleshooting

### Common Issues:

#### 1. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test SSL connection
openssl s_client -connect yourdomain.com:443
```

#### 2. Container Issues
```bash
# Check container logs
docker-compose logs backend-container
docker-compose logs frontend-container

# Restart services
docker-compose restart
```

#### 3. Database Connection Issues
```bash
# Check MongoDB logs
docker-compose logs mongo-container

# Test database connection
docker-compose exec backend-container curl http://localhost:8080/health
```

#### 4. Firewall Issues
```bash
# Check firewall status
sudo ufw status

# Temporarily disable firewall for testing
sudo ufw disable
# Remember to re-enable: sudo ufw enable
```

---

## 📞 Support & Maintenance

### Useful Commands:
```bash
# View all logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
./update.sh

# Create backup
./backup.sh

# Check system resources
htop
df -h
free -h
```

### DigitalOcean Resources:
- **DigitalOcean Community**: [community.digitalocean.com](https://community.digitalocean.com)
- **Documentation**: [docs.digitalocean.com](https://docs.digitalocean.com)
- **Status Page**: [status.digitalocean.com](https://status.digitalocean.com)

---

## 🎉 You're Done!

Your Restaurant Recipe App is now running on DigitalOcean with:
- ✅ **Production-ready deployment**
- ✅ **SSL/TLS encryption**
- ✅ **Monitoring and observability**
- ✅ **Automated backups**
- ✅ **Security hardening**
- ✅ **Easy maintenance**

**Total setup time**: ~1-2 hours
**Monthly cost**: ~$29-44
**Uptime**: 99.99% SLA

---

**Need help?** Check the troubleshooting section above or refer to the main DEPLOYMENT_GUIDE.md for additional details.
