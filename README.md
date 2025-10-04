# 🍴 Restaurant Recipe & Plating Guide

A full-stack application for managing recipes, ingredients, purveyors, and plating guides.  
Built with **React (frontend)** and **Node.js/Express + MongoDB (backend)**.

## ✨ Features

- **Recipe Management** - Create, edit, and organize recipes
- **Ingredient Tracking** - Manage ingredients and purveyors
- **Plating Guides** - Visual plating instructions
- **User Authentication** - Role-based access control
- **Change Logging** - Track recipe modifications
- **Bulk Upload** - Import recipes from CSV/Excel
- **PDF Generation** - Export recipes and reports
- **Comprehensive Validation** - Data integrity protection

---

## 🐳 Running with Docker

The application supports multiple deployment configurations:

### Development (Localhost Only)
```bash
cd deployment/docker/development
docker-compose up -d
```
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **MongoDB**: localhost:27017
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001

### Staging (Network Accessible)
```bash
cd deployment/docker/stage
docker-compose up -d
```
- **Frontend**: http://192.168.68.129:3000
- **Backend API**: http://192.168.68.129:8080
- **MongoDB**: 192.168.68.129:27017
- **Prometheus**: http://192.168.68.129:9090
- **Grafana**: http://192.168.68.129:3001

### Production
```bash
cd deployment/docker/production
docker-compose up -d
```
- Full production setup with Nginx reverse proxy and SSL

### Admin Account
Create admin user:
```bash
# Copy script to backend container
docker cp scripts/sample_data/createAdmin.js <container-name>:/app/
docker exec <container-name> node createAdmin.js
```
- **Username**: `admin`
- **Password**: `SecurePassword123`

---

## 🛠 Docker Tips & Troubleshooting

### 🔄 Rebuild Services
```bash
# Rebuild specific service
docker-compose build frontend
docker-compose up -d frontend

# Rebuild all services
docker-compose build
docker-compose up -d
```

### 🧹 Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove images and rebuild
docker-compose down --rmi all
docker-compose up --build
```

### 🌐 Network Issues
- **Development**: Uses localhost only
- **Staging**: Uses `192.168.68.129` for network access
- **Frontend not loading**: Check if backend is running on correct port (8080)
- **MongoDB connection**: Ensure `MONGO_URI=mongodb://mongo:27017/recipeDB`

### 📦 Data Persistence
- **MongoDB**: `stage-mongo-data` volume (staging) or `mongo-data` (development)
- **Uploads**: `stage-uploads` volume (staging) or `uploads` (development)
- **Monitoring**: `stage-prometheus-data` and `stage-grafana-data` (staging)

### 🕵️ Debugging
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo
```

### 📊 Monitoring
- **Prometheus**: Metrics collection and querying
- **Grafana**: Dashboards and visualization
- Access via respective ports (9090/3001)

---

## 🌐 Future Production Note (Nginx)

Right now, the stack works fine for **development and LAN use**:
- React static files are served by `serve` (port 3000).
- Backend API is served by Express (port 5000).

For **production deployment** (cloud/VPS), you’d likely add **Nginx** as a reverse proxy:
- Serve the React build from `/` (instead of port 3000).
- Proxy API requests (`/api`) to the backend container.
- Handle HTTPS (with Let’s Encrypt).
- Enable caching and gzip for static assets.

This setup reduces exposed ports (only `80/443`) and improves performance & security.

> ✅ Nginx is **not required** for your current local/LAN usage — only add it if/when you deploy publicly.

---

## 🧪 Testing

### Automated Tests
```bash
# Run validation tests
node test-validation.js

# Quick validation check
node -e "
const { validateRecipe } = require('./frontend/src/utils/validation.js');
const result = validateRecipe({ name: '', steps: 'Valid steps', platingGuide: 'Valid guide', ingredients: [] });
console.log('Validation test:', result.isValid ? 'FAIL' : 'PASS');
"
```

### Manual Testing
1. Open `manual-validation-test.html` in your browser
2. Test form validation interactively
3. Verify error messages and user feedback

### Test Coverage
- ✅ **Frontend Validation** - Real-time form validation
- ✅ **Backend Validation** - API endpoint validation  
- ✅ **Database Validation** - Schema constraints
- ✅ **Security Testing** - XSS protection, input sanitization
- ✅ **File Upload Testing** - Size, type, extension validation

---

## 🔧 Development

### Project Structure
```
├── frontend/                    # React application
├── backend/                     # Node.js/Express API
├── scripts/                     # Utility scripts
│   └── sample_data/            # Data loading scripts
├── deployment/                  # Deployment configurations
│   └── docker/
│       ├── development/        # Localhost-only dev setup
│       ├── stage/              # Network-accessible staging
│       └── production/         # Production with Nginx
├── monitoring/                  # Prometheus & Grafana configs
└── test-validation.js          # Automated test runner
```

### Key Technologies
- **Frontend**: React, Bootstrap, Axios
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Validation**: Custom validation middleware
- **Security**: Input sanitization, XSS protection
- **Testing**: Jest, Supertest, Manual testing suite
