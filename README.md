# 🍴 Restaurant Recipe & Plating Guide

A full-stack application for managing recipes, ingredients, purveyors, and plating guides.  
Built with **React (frontend)** and **Node.js/Express + MongoDB (backend)**.

---

## 🐳 Running with Docker (Current Setup)

You can run the entire stack (frontend, backend, and MongoDB) using Docker Compose.

### 1. Build & Start Services
```bash
docker-compose up --build
```

This will start:
- **MongoDB** (`mongo-container`) on port `27017`
- **Backend API** (`backend-container`) on port `5000`
- **React frontend** (`frontend-container`) on port `3000`

### 2. Access the App
- Frontend: [http://localhost:3000](http://localhost:3000) (host browser)
- Backend API: [http://192.168.68.129:5000](http://192.168.68.129:5000) (LAN access)

⚠️ If your LAN IP changes, update `REACT_APP_API_URL` in `docker-compose.yml` and rebuild:
```bash
docker-compose build frontend-container
docker-compose up -d
```

### 3. Stopping Services
```bash
docker-compose down
```

### 4. Data Persistence
- MongoDB data → `mongo-data` volume
- Uploaded images → `uploads` volume

Wipe everything:
```bash
docker-compose down -v
```

---

## 🛠 Docker Tips & Troubleshooting

### 🔄 Rebuild Only One Service
```bash
docker-compose build frontend-container
docker-compose up -d frontend-container
```

```bash
docker-compose build backend-container
docker-compose up -d backend-container
```

### 🧹 Clear Old Builds / Cache
```bash
docker-compose down --rmi all --volumes --remove-orphans
docker-compose up --build
```

### 🌐 Network Issues
- If the frontend shows `ERR_NAME_NOT_RESOLVED`, make sure it’s pointing to your LAN IP (`192.168.68.129:5000`).
- If MongoDB won’t connect, ensure backend uses:
  ```yaml
  MONGO_URI=mongodb://mongo-container:27017/recipeDB
  ```

### 📦 Persistent Data
- MongoDB → `mongo-data` volume
- Images → `uploads` volume

Wipe volumes:
```bash
docker-compose down -v
```

### 🕵️ Debugging Logs
All logs:
```bash
docker-compose logs -f
```
Single service logs:
```bash
docker-compose logs -f backend-container
```

### ⚡ Performance Tips
- Keep your source code in WSL (`~/projects/...`), not `/mnt/c/...`, for speed.
- Use `.dockerignore` to avoid copying unnecessary files.

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
