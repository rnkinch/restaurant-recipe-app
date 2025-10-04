# 🚀 Quick DigitalOcean Deployment Checklist

**Target**: DigitalOcean Droplet 167.71.247.15  
**Application**: Restaurant Recipe App  

---

## ✅ Pre-Deployment (5 minutes)

- [ ] DigitalOcean account created
- [ ] SSH key generated on local machine
- [ ] SSH key added to DigitalOcean account

---

## ✅ Create Droplet (3 minutes)

- [ ] Ubuntu 22.04, 4GB RAM, $24/month
- [ ] Add SSH key
- [ ] Enable monitoring
- [ ] Enable backups (optional)
- [ ] Create droplet
- [ ] Note IP address: 167.71.247.15

---

## ✅ Initial Setup (10 minutes)

```bash
# Connect to droplet
ssh root@167.71.247.15

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y curl wget git unzip htop ufw

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create deploy user
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
su - deploy
```

---

## ✅ Install Docker (5 minutes)

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
ssh deploy@167.71.247.15
```

---

## ✅ Deploy App (10 minutes)

```bash
# Clone repository
git clone https://github.com/rnkinch/restaurant-recipe-app.git
cd restaurant-recipe-app/deployment/docker/production

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
GRAFANA_PASSWORD=$(openssl rand -base64 16)
echo "JWT_SECRET: $JWT_SECRET"
echo "GRAFANA_PASSWORD: $GRAFANA_PASSWORD"

# Deploy with secrets
chmod +x deploy.sh
./deploy.sh "$JWT_SECRET" "$GRAFANA_PASSWORD"
```

---

## ✅ Configure Firewall (2 minutes)

```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 9090/tcp
sudo ufw enable
```

---

## ✅ Create Admin User (3 minutes)

```bash
# Connect to MongoDB
docker exec -it production-mongo-container-1 mongosh

# In MongoDB shell:
use recipeDB
db.users.insertOne({
  username: "admin",
  email: "admin@example.com", 
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
exit
```

**Login**: admin / password

---

## ✅ Verify Deployment

- [ ] App accessible: https://167.71.247.15
- [ ] Grafana: http://167.71.247.15:3001
- [ ] Prometheus: http://167.71.247.15:9090
- [ ] Health endpoint: https://167.71.247.15/health
- [ ] Can login with admin/password

---

## 🎯 Total Time: ~35 minutes
## 💰 Total Cost: ~$24-29/month
## 🚀 Result: Production-ready app with monitoring

---

## 📞 Quick Commands

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
