# Restaurant Recipe App - WSL Setup Guide

## 🐧 WSL-Specific Setup

Since you're using WSL (Windows Subsystem for Linux), here's the optimized setup process:

## 🚀 Quick Start for WSL

### Option 1: PowerShell Script (Recommended for WSL)
```powershell
# Run from Windows PowerShell
.\setup-network-wsl.ps1
```

### Option 2: Manual WSL Setup
```bash
# Run from WSL terminal
./setup-network-wsl.sh
```

## 🔧 WSL Network Configuration

### Understanding WSL Networking:
- **Windows Host IP**: Accessible from Windows and other devices
- **WSL IP**: Accessible from WSL/Linux only
- **Localhost**: Works within WSL but not accessible from Windows

### Recommended Configuration:
Use **Windows Host IP** for maximum compatibility:
- ✅ Access from Windows browsers
- ✅ Access from other devices on network
- ✅ Access from WSL

## 📱 Access Methods

### From Windows:
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8080`

### From WSL:
- **Frontend**: `http://[WINDOWS_IP]:3000`
- **Backend**: `http://[WINDOWS_IP]:8080`

### From Other Devices:
- **Frontend**: `http://[WINDOWS_IP]:3000`
- **Backend**: `http://[WINDOWS_IP]:8080`

## 🐳 Docker Commands for WSL

### Start the application:
```bash
docker-compose up --build
```

### Stop the application:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### Clean rebuild:
```bash
docker-compose down -v
docker-compose up --build --force-recreate
```

## 🔍 Troubleshooting WSL Issues

### Port Conflicts:
```bash
# Check if ports are in use
netstat -tulpn | grep :8080
netstat -tulpn | grep :3000
```

### Docker Issues:
```bash
# Clean Docker system
docker system prune -f
docker volume prune -f
```

### Network Access Issues:
1. **Windows Firewall**: Allow Docker Desktop through Windows Firewall
2. **WSL Network**: Ensure WSL can access Windows network
3. **Docker Desktop**: Make sure Docker Desktop is running

### IP Address Issues:
```bash
# Find your Windows IP from WSL
ip route | grep default | awk '{print $3}'

# Find your WSL IP
ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1
```

## 🔧 WSL-Specific Configuration

### Docker Desktop Settings:
1. Open Docker Desktop
2. Go to Settings → Resources → WSL Integration
3. Enable integration with your WSL distro
4. Apply & Restart

### Windows Firewall:
1. Open Windows Defender Firewall
2. Allow Docker Desktop through firewall
3. Allow Node.js through firewall (if needed)

### WSL Network Bridge:
```bash
# Check WSL network status
wsl --status

# Restart WSL if needed
wsl --shutdown
# Then restart your WSL terminal
```

## 📋 WSL File Permissions

If you encounter permission issues:

```bash
# Fix file permissions in WSL
sudo chown -R $USER:$USER .
chmod +x setup-network-wsl.sh
```

## 🎯 WSL Workflow

### Development Workflow:
1. **Edit code** in Windows (VS Code, etc.)
2. **Run commands** in WSL terminal
3. **Access app** from Windows browser
4. **Share with team** using Windows IP

### Production-like Testing:
1. Use Windows Host IP for network access
2. Test from multiple devices
3. Verify firewall settings
4. Check network connectivity

## 🚨 Common WSL Issues

### Issue: "Cannot connect to Docker daemon"
**Solution**: Start Docker Desktop from Windows

### Issue: "Permission denied" on scripts
**Solution**: 
```bash
chmod +x setup-network-wsl.sh
```

### Issue: "Network unreachable"
**Solution**: 
1. Check Windows Firewall
2. Verify Docker Desktop is running
3. Restart WSL: `wsl --shutdown`

### Issue: "Port already in use"
**Solution**:
```bash
# Kill processes using ports
sudo lsof -ti:8080 | xargs kill -9
sudo lsof -ti:3000 | xargs kill -9
```

## 📞 WSL Support

### Check WSL Status:
```bash
wsl --status
wsl --list --verbose
```

### Restart WSL:
```bash
wsl --shutdown
# Wait 10 seconds, then restart terminal
```

### Update WSL:
```bash
wsl --update
```

---

**Happy coding in WSL! 🐧🍽️**
