# 🚀 DigitalOcean Production Deployment Guide

## Restaurant Recipe App - Complete Production Setup

**Target Server**: DigitalOcean Droplet  
**IP Address**: 167.71.247.15  
**Environment**: Production  

---

## 📋 Prerequisites

- DigitalOcean account with billing set up
- SSH access to your local machine
- Basic knowledge of Linux command line
- Domain name (optional - can use IP address)

---

## 🎯 Step 1: Create DigitalOcean Droplet

### 1.1 Create New Droplet

1. **Login to DigitalOcean**: Go to [digitalocean.com](https://digitalocean.com)
2. **Create Droplet**: Click "Create" → "Droplets"
3. **Choose Configuration**:
   - **Image**: Ubuntu 22.04 (LTS) x64
   - **Plan**: Basic → **$24/month** (4GB RAM, 2 CPU, 80GB SSD)
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH Key (recommended)
   - **Hostname**: `recipe-app-prod`
   - **Enable Backups**: ✅ (recommended for production)

### 1.2 Set Up SSH Access

```bash
# On your local machine, generate SSH key if you don't have one
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy your public key
cat ~/.ssh/id_rsa.pub
```

**Add SSH Key to DigitalOcean**:
1. In DigitalOcean dashboard → "Security" → "SSH Keys"
2. Click "Add SSH Key"
3. Paste your public key and name it "Recipe App Production"

### 1.3 Create the Droplet

1. Select your SSH key
2. Click "Create Droplet"
3. Wait 2-3 minutes for setup
4. **Note your droplet's IP address** (should be 167.71.247.15)

---

## 🔧 Step 2: Initial Server Setup

### 2.1 Connect to Your Droplet

```bash
# Connect to your droplet (replace with actual IP if different)
ssh root@167.71.247.15

# Or if you set up a non-root user:
ssh your_username@167.71.247.15
```

### 2.2 Update System and Install Dependencies

```bash
# Update package lists and upgrade system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git unzip htop ufw

# Install Node.js 20.x (required for sample data loading)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install global packages
sudo npm install -g nodemon pm2
```

### 2.3 Create Production User (Security Best Practice)

```bash
# Create production user
adduser deploy
usermod -aG sudo deploy

# Copy SSH key to new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Switch to production user
su - deploy
```

---

## 🐳 Step 3: Install Docker

### 3.1 Install Docker Engine

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
ssh deploy@167.71.247.15
```

### 3.2 Install Docker Compose

```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

---

## 📦 Step 4: Deploy Your Application

### 4.1 Clone Repository

```bash
# Clone your repository
git clone https://github.com/rnkinch/restaurant-recipe-app.git
cd restaurant-recipe-app/deployment/docker/production
```

### 4.2 Generate Secure Secrets

```bash
# Generate JWT secret (32+ characters)
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET: $JWT_SECRET"

# Generate Grafana admin password (16+ characters)
GRAFANA_PASSWORD=$(openssl rand -base64 16)
echo "GRAFANA_PASSWORD: $GRAFANA_PASSWORD"

# Save these values - you'll need them!
```

### 4.3 Set Up SSL Certificate

**For IP-based deployment, create a self-signed certificate:**

```bash
# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate for IP address
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=167.71.247.15"

# Set proper permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "SSL certificate created for IP: 167.71.247.15"
```

**Note**: Browsers will show security warnings with self-signed certificates. Users can bypass these by clicking "Advanced" → "Proceed to 167.71.247.15 (unsafe)".

### 4.4 Configure Environment

```bash
# Update environment file with your secrets
sed -i "s/CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_IN_PRODUCTION/$JWT_SECRET/g" env.production
sed -i "s/CHANGE_THIS_TO_A_SECURE_GRAFANA_PASSWORD/$GRAFANA_PASSWORD/g" env.production

# Verify the changes
grep -E "(JWT_SECRET|GRAFANA_ADMIN_PASSWORD)" env.production
```

### 4.5 Deploy the Application

```bash
# Build and start all services
docker-compose up -d --build

# Wait for services to initialize
sleep 60

# Check if all containers are running
docker-compose ps
```

### 4.6 Verify Deployment

```bash
# Check service health
docker-compose logs backend-container
docker-compose logs frontend-container
docker-compose logs nginx

# Test endpoints (ignore SSL warnings)
curl -k https://167.71.247.15/health
curl -k https://167.71.247.15
```

---

## 🔒 Step 5: Configure Firewall

### 5.1 Set Up UFW Firewall

```bash
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

## 👤 Step 6: Create Admin User

### 6.1 Create Admin User in Database

```bash
# Connect to MongoDB container
docker exec -it production_mongo-container_1 mongosh

# In MongoDB shell:
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

**Login Credentials**:
- Username: `admin`
- Password: `password`

**⚠️ IMPORTANT**: Change the admin password immediately after first login!

---

## 📊 Step 7: Load Sample Data (Optional)

### 7.1 Load Sample Data for Testing

```bash
# Navigate to sample data directory
cd /home/deploy/restaurant-recipe-app/scripts/sample_data

# Install dependencies
npm install

# Load sample data in order (dependencies first)
node loadPurveyors.js
node loadIngredients.js
node loadRecipes.js

# Verify data was loaded
docker exec -it production_mongo-container_1 mongosh
```

In MongoDB shell:
```javascript
use recipeDB
db.ingredients.countDocuments()  // Should show > 0
db.purveyors.countDocuments()    // Should show > 0
db.recipes.countDocuments()      // Should show > 0
exit
```

---

## ✅ Step 8: Verify Everything Works

### 8.1 Test Your Application

```bash
# Test health endpoint
curl -k https://167.71.247.15/health

# Test frontend (ignore SSL warning)
curl -k https://167.71.247.15

# Test monitoring services
curl -k https://167.71.247.15:3001  # Grafana
curl -k https://167.71.247.15:9090  # Prometheus
```

### 8.2 Access Your Services

- **Main Application**: https://167.71.247.15
- **Grafana Dashboard**: https://167.71.247.15:3001
  - Username: `admin`
  - Password: `[your_generated_password]`
- **Prometheus**: https://167.71.247.15:9090

---

## 🔄 Step 9: Set Up Maintenance

### 9.1 Create Backup Script

```bash
# Create backup script
cat > /home/deploy/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cd /home/deploy/restaurant-recipe-app/deployment/docker/production
docker-compose exec -T mongo-container mongodump --db recipeDB --out /tmp/backup
docker cp $(docker-compose ps -q mongo-container):/tmp/backup ./backup_$DATE
echo "Backup completed: backup_$DATE"
EOF

chmod +x /home/deploy/backup.sh

# Test backup
./backup.sh
```

### 9.2 Create Update Script

```bash
# Create update script
cat > /home/deploy/update.sh << 'EOF'
#!/bin/bash
cd /home/deploy/restaurant-recipe-app
git pull origin main
cd deployment/docker/production
docker-compose down
docker-compose up -d --build
echo "Application updated successfully"
EOF

chmod +x /home/deploy/update.sh
```

### 9.3 Schedule Automated Backups

```bash
# Schedule daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /home/deploy/backup.sh") | crontab -

# Verify cron job
crontab -l
```

---

## 📈 Step 10: Monitoring Setup

### 10.1 Access Grafana

1. Go to https://167.71.247.15:3001
2. Login with: `admin` / `[your_generated_password]`
3. Verify "Recipe App Monitoring" dashboard is loaded
4. Check that metrics are being collected

### 10.2 Monitor Application Performance

```bash
# Check system resources
htop

# Check Docker resource usage
docker stats

# Check application logs
docker-compose logs -f
```

---

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. SSL Certificate Warnings
**Problem**: Browser shows "Your connection is not private"
**Solution**: This is expected with self-signed certificates. Click "Advanced" → "Proceed to 167.71.247.15 (unsafe)"

#### 2. Cannot Login
**Problem**: "Invalid credentials" error
**Solution**: Ensure admin user was created in MongoDB:
```bash
docker exec -it production_mongo-container_1 mongosh
use recipeDB
db.users.find()
```

#### 3. CORS Errors
**Problem**: "Access to XMLHttpRequest blocked by CORS policy"
**Solution**: Check environment variables:
```bash
docker-compose exec backend-container env | grep -E "(FRONTEND_URL|ALLOWED_ORIGINS)"
```

#### 4. Container Won't Start
**Problem**: Services failing to start
**Solution**: Check logs and restart:
```bash
docker-compose logs
docker-compose restart
```

#### 5. Database Connection Issues
**Problem**: Backend can't connect to MongoDB
**Solution**: Check MongoDB container:
```bash
docker-compose logs mongo-container
docker-compose exec mongo-container mongosh --eval "db.adminCommand('ping')"
```

---

## 💰 Cost Breakdown

### Monthly Costs:
- **DigitalOcean Droplet**: $24 (4GB RAM, 2 CPU, 80GB SSD)
- **Backups**: $4.80 (optional but recommended)
- **Total**: ~$29/month

### Optional Upgrades:
- **8GB RAM Droplet**: $48/month (better performance)
- **Load Balancer**: $12/month (high availability)
- **Managed Database**: $15/month (easier maintenance)

---

## 🎉 You're Done!

Your Restaurant Recipe App is now running on DigitalOcean at:
- **Main App**: https://167.71.247.15
- **Grafana**: https://167.71.247.15:3001
- **Prometheus**: https://167.71.247.15:9090

### Next Steps:
1. ✅ Test all functionality
2. ✅ Change admin password
3. ✅ Set up domain name (optional)
4. ✅ Configure monitoring alerts
5. ✅ Schedule regular backups

---

## 📞 Support Commands

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

# Check Docker status
docker-compose ps
docker system df
```

**Total setup time**: ~1-2 hours  
**Monthly cost**: ~$29  
**Result**: Production-ready restaurant recipe application! 🚀
