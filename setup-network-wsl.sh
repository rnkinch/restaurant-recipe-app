#!/bin/bash

# Restaurant Recipe App - WSL Network Setup Script
# This script helps configure the application for local network access from WSL

echo "🍽️  Restaurant Recipe App - WSL Network Setup"
echo "============================================="

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

# Update docker-compose.yml with the selected IP
echo "🔧 Updating docker-compose.yml with IP: $SELECTED_IP"
sed -i.bak "s/192\.168\.68\.129/$SELECTED_IP/g" docker-compose.yml

# Update frontend Dockerfile
echo "🔧 Updating frontend Dockerfile with IP: $SELECTED_IP"
sed -i.bak "s/192\.168\.68\.129/$SELECTED_IP/g" frontend/Dockerfile

# Update all frontend source files
echo "🔧 Updating frontend source files with IP: $SELECTED_IP"
find frontend/src -name "*.js" -exec sed -i.bak "s/192\.168\.68\.129/$SELECTED_IP/g" {} \;

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
echo "🚀 To start the application:"
echo "   docker-compose up --build"
echo ""
echo "🛑 To stop the application:"
echo "   docker-compose down"
echo ""
echo "📝 Note: If your IP address changes, run this script again."
