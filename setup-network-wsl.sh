#!/bin/bash

# Restaurant Recipe App - WSL Network Setup Script
# This script helps configure the application for local network access from WSL
# Updated for new deployment structure

echo "🍽️  Restaurant Recipe App - WSL Network Setup"
echo "============================================="
echo "📁 Using new deployment structure"

# Function to get the Windows host IP from WSL
get_windows_ip() {
    # Get the Windows host IP from WSL
    if command -v ip >/dev/null 2>&1; then
        # Get the default gateway which is usually the Windows host
        ip route | grep default | awk '{print $3}' | head -1
    else
        echo "Could not determine Windows host IP automatically"
        return 1
    fi
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
