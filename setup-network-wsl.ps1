# Restaurant Recipe App - WSL Network Setup Script for PowerShell
# This script helps configure the application for local network access from WSL

Write-Host "🍽️  Restaurant Recipe App - WSL Network Setup" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Function to get the Windows host IP
function Get-WindowsIP {
    try {
        $networkAdapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.Name -notlike "*Loopback*"}
        foreach ($adapter in $networkAdapters) {
            $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
            if ($ipConfig -and $ipConfig.IPAddress -like "192.168.*" -or $ipConfig.IPAddress -like "10.*" -or $ipConfig.IPAddress -like "172.*") {
                return $ipConfig.IPAddress
            }
        }
    } catch {
        Write-Host "❌ Could not determine Windows IP automatically" -ForegroundColor Red
        return $null
    }
}

# Get Windows IP
$WINDOWS_IP = Get-WindowsIP

if (-not $WINDOWS_IP) {
    Write-Host "Please enter your Windows machine's IP address:" -ForegroundColor Yellow
    $WINDOWS_IP = Read-Host "IP Address"
}

Write-Host "📍 Windows Host IP: $WINDOWS_IP" -ForegroundColor Cyan

# Update docker-compose.yml with the Windows IP
Write-Host "🔧 Updating docker-compose.yml with IP: $WINDOWS_IP" -ForegroundColor Yellow
(Get-Content docker-compose.yml) -replace '192\.168\.68\.129', $WINDOWS_IP | Set-Content docker-compose.yml

# Update frontend Dockerfile
Write-Host "🔧 Updating frontend Dockerfile with IP: $WINDOWS_IP" -ForegroundColor Yellow
(Get-Content frontend/Dockerfile) -replace '192\.168\.68\.129', $WINDOWS_IP | Set-Content frontend/Dockerfile

# Update all frontend source files
Write-Host "🔧 Updating frontend source files with IP: $WINDOWS_IP" -ForegroundColor Yellow
Get-ChildItem -Path "frontend/src" -Filter "*.js" -Recurse | ForEach-Object {
    (Get-Content $_.FullName) -replace '192\.168\.68\.129', $WINDOWS_IP | Set-Content $_.FullName
}

Write-Host ""
Write-Host "✅ Configuration updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your application will be available at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$WINDOWS_IP:3000" -ForegroundColor White
Write-Host "   Backend API: http://$WINDOWS_IP:8080" -ForegroundColor White
Write-Host ""
Write-Host "📱 Access options:" -ForegroundColor Cyan
Write-Host "   - From Windows: http://localhost:3000" -ForegroundColor White
Write-Host "   - From WSL: http://$WINDOWS_IP:3000" -ForegroundColor White
Write-Host "   - From other devices: http://$WINDOWS_IP:3000" -ForegroundColor White
Write-Host ""
Write-Host "🚀 To start the application:" -ForegroundColor Green
Write-Host "   docker-compose up --build" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop the application:" -ForegroundColor Red
Write-Host "   docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "📝 Note: If your IP address changes, run this script again." -ForegroundColor Yellow
