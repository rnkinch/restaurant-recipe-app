# 🚀 DigitalOcean Quick Start Checklist

## 15-Minute Deployment Guide

### ✅ Pre-Deployment (5 minutes)
- [ ] DigitalOcean account created
- [ ] Domain name ready (optional)
- [ ] SSH key generated on local machine

### ✅ Create Droplet (3 minutes)
- [ ] Ubuntu 22.04, 4GB RAM, $24/month
- [ ] Add SSH key
- [ ] Enable monitoring
- [ ] Create droplet

### ✅ Initial Setup (5 minutes)
```bash
# Connect to droplet
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y

# Create deploy user
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
su - deploy
```

### ✅ Install Docker (2 minutes)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in
exit
ssh deploy@YOUR_DROPLET_IP
```

### ✅ Deploy App (5 minutes)
```bash
# Clone repo
git clone https://github.com/rnkinch/restaurant-recipe-app.git
cd restaurant-recipe-app/deployment/docker/production

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
GRAFANA_PASSWORD=$(openssl rand -base64 16)

# Get SSL certificate (if you have a domain)
sudo apt install -y certbot
sudo certbot certonly --standalone -d yourdomain.com
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*

# Deploy
chmod +x deploy.sh
./deploy.sh yourdomain.com "$JWT_SECRET" "$GRAFANA_PASSWORD"
```

### ✅ Configure Firewall (1 minute)
```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 9090/tcp
sudo ufw enable
```

### ✅ Verify Deployment
- [ ] App accessible: https://yourdomain.com
- [ ] Grafana: https://yourdomain.com:3001
- [ ] Prometheus: https://yourdomain.com:9090

---

## 🎯 Total Time: ~15 minutes
## 💰 Total Cost: ~$24-29/month
## 🚀 Result: Production-ready app with monitoring

---

## 📞 Quick Commands Reference

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update app
git pull && docker-compose up -d --build

# Backup database
docker-compose exec -T mongo-container mongodump --db recipeDB --out /tmp/backup
```

---

**That's it! Your restaurant recipe app is now live on DigitalOcean!** 🎉
