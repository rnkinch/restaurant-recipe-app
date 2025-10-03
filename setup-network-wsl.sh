#!/bin/bash

# Restaurant Recipe App - WSL Network Setup Script
# This script helps configure the application for local network access from WSL
# Updated for new deployment structure

echo "🍽️  Restaurant Recipe App - WSL Network Setup"
echo "============================================="
echo "📁 Using new deployment structure"

# Function to get the Windows host IP from WSL
get_windows_ip() {
    # Try multiple methods to get the actual Windows network IP
    if command -v powershell.exe >/dev/null 2>&1; then
        # Method 1: Use PowerShell to get the actual network adapter IP
        local windows_ip=$(powershell.exe -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object {\$_.InterfaceAlias -notlike '*Loopback*' -and \$_.InterfaceAlias -notlike '*WSL*' -and \$_.InterfaceAlias -notlike '*vEthernet*'} | Where-Object {\$_.IPAddress -like '192.168.*' -or \$_.IPAddress -like '10.*' -or (\$_.IPAddress -like '172.*' -and \$_.IPAddress -notlike '172.30.*')} | Select-Object -First 1 -ExpandProperty IPAddress" 2>/dev/null | tr -d '\r')
        if [[ -n "$windows_ip" && "$windows_ip" != "" ]]; then
            echo "$windows_ip"
            return 0
        fi
    fi
    
    # Method 2: Use cmd.exe with ipconfig (fallback)
    if command -v cmd.exe >/dev/null 2>&1; then
        local windows_ip=$(cmd.exe /c "ipconfig" 2>/dev/null | grep -A 1 "Ethernet\|Wi-Fi" | grep "IPv4" | head -1 | sed 's/.*: //' | tr -d '\r\n' | sed 's/[[:space:]]*$//')
        if [[ -n "$windows_ip" && "$windows_ip" != "" ]]; then
            echo "$windows_ip"
            return 0
        fi
    fi
    
    # Method 3: WSL gateway as last resort (original method)
    if command -v ip >/dev/null 2>&1; then
        local gateway_ip=$(ip route | grep default | awk '{print $3}' | head -1)
        echo "Warning: Using WSL gateway IP. This may not work for external devices." >&2
        echo "$gateway_ip"
        return 0
    fi
    
    echo "Could not determine Windows host IP automatically"
    return 1
}

# Function to get the WSL IP
get_wsl_ip() {
    if command -v ip >/dev/null 2>&1; then
        ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1
    else
        echo "Could not determine WSL IP automatically"
        return 1
    fi
}

# Get IP addresses
WINDOWS_IP=$(get_windows_ip)
WSL_IP=$(get_wsl_ip)

echo "📍 Windows Host IP: $WINDOWS_IP"
echo "📍 WSL IP: $WSL_IP"

# Ask user which IP to use
echo ""
echo "Which IP address should the application use?"
echo "1) Windows Host IP ($WINDOWS_IP) - Access from Windows and other devices"
echo "2) WSL IP ($WSL_IP) - Access from WSL/Linux only"
echo "3) Enter custom IP address"
read -p "Choose option (1-3): " choice

case $choice in
    1)
        SELECTED_IP=$WINDOWS_IP
        echo "✅ Using Windows Host IP: $SELECTED_IP"
        ;;
    2)
        SELECTED_IP=$WSL_IP
        echo "✅ Using WSL IP: $SELECTED_IP"
        ;;
    3)
        read -p "Enter custom IP address: " SELECTED_IP
        echo "✅ Using custom IP: $SELECTED_IP"
        ;;
    *)
        echo "❌ Invalid choice, using Windows Host IP: $WINDOWS_IP"
        SELECTED_IP=$WINDOWS_IP
        ;;
esac

# Update deployment configuration files
echo "🔧 Updating deployment configuration with IP: $SELECTED_IP"

# Update development environment file
DEV_ENV_FILE="deployment/docker/development/env.development"
if [ -f "$DEV_ENV_FILE" ]; then
    echo "🔧 Updating $DEV_ENV_FILE"
    sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=http://$SELECTED_IP:8080|g" "$DEV_ENV_FILE"
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://$SELECTED_IP:3000|g" "$DEV_ENV_FILE"
    sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://$SELECTED_IP:3000,http://127.0.0.1:3000,http://localhost:3000|g" "$DEV_ENV_FILE"
else
    echo "❌ Development environment file not found: $DEV_ENV_FILE"
fi

# Update development docker-compose.yml
DEV_COMPOSE_FILE="deployment/docker/development/docker-compose.yml"
if [ -f "$DEV_COMPOSE_FILE" ]; then
    echo "🔧 Updating $DEV_COMPOSE_FILE"
    sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=http://$SELECTED_IP:8080|g" "$DEV_COMPOSE_FILE"
    sed -i "s|- REACT_APP_API_URL=.*|- REACT_APP_API_URL=http://$SELECTED_IP:8080|g" "$DEV_COMPOSE_FILE"
else
    echo "❌ Development docker-compose file not found: $DEV_COMPOSE_FILE"
fi

# Update legacy docker-compose.yml if it exists (for backward compatibility)
if [ -f "docker-compose.yml" ]; then
    echo "🔧 Updating legacy docker-compose.yml for backward compatibility"
    sed -i "s/172\.30\.176\.1/$SELECTED_IP/g" docker-compose.yml
    sed -i "s/192\.168\.68\.129/$SELECTED_IP/g" docker-compose.yml
fi

echo ""
echo "✅ Configuration updated successfully!"
echo ""
echo "🌐 Your application will be available at:"
echo "   Frontend: http://$SELECTED_IP:3000"
echo "   Backend API: http://$SELECTED_IP:8080"
echo ""
echo "📱 Access options:"
if [ "$SELECTED_IP" = "$WINDOWS_IP" ]; then
    echo "   - From Windows: http://localhost:3000"
    echo "   - From WSL: http://$SELECTED_IP:3000"
    echo "   - From other devices: http://$SELECTED_IP:3000"
else
    echo "   - From WSL: http://localhost:3000"
    echo "   - From Windows: http://$SELECTED_IP:3000"
    echo "   - From other devices: http://$SELECTED_IP:3000"
fi
echo ""
echo "🔧 Files updated:"
echo "   - deployment/docker/development/env.development"
echo "   - deployment/docker/development/docker-compose.yml"
echo "   - docker-compose.yml (legacy, for backward compatibility)"
echo ""
echo "🚀 To start the application (new deployment structure):"
echo "   cd deployment/docker/development"
echo "   docker-compose --env-file env.development up --build"
echo ""
echo "🚀 Alternative (using deployment script):"
echo "   ./scripts/deploy.sh docker-dev --build"
echo ""
echo "🛑 To stop the application:"
echo "   cd deployment/docker/development"
echo "   docker-compose --env-file env.development down"
echo ""
echo "📝 Note: If your IP address changes, run this script again."
echo "💡 Tip: Use Windows Host IP for access from mobile devices and other computers."
