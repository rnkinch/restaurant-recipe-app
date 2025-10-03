# Restaurant Recipe App - WSL Network Setup Script for PowerShell
# This script helps configure the application for local network access from WSL
# Updated for new deployment structure

Write-Host "🍽️  Restaurant Recipe App - WSL Network Setup" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "📁 Using new deployment structure" -ForegroundColor Cyan

# Function to get the Windows host IP
function Get-WindowsIP {
    try {
        # Method 1: Get network adapter IP (excluding WSL, Loopback, and Virtual adapters)
        $networkIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
            $_.InterfaceAlias -notlike "*Loopback*" -and 
            $_.InterfaceAlias -notlike "*WSL*" -and 
            $_.InterfaceAlias -notlike "*vEthernet*" -and
            $_.InterfaceAlias -notlike "*Hyper-V*"
        } | Where-Object {
            $_.IPAddress -like "192.168.*" -or 
            $_.IPAddress -like "10.*" -or 
            ($_.IPAddress -like "172.*" -and $_.IPAddress -notlike "172.30.*")
        } | Select-Object -First 1
        
        if ($networkIPs) {
            Write-Host "🌐 Detected network IP: $($networkIPs.IPAddress) on $($networkIPs.InterfaceAlias)" -ForegroundColor Green
            return $networkIPs.IPAddress
        }
        
        # Method 2: Fallback to ipconfig parsing
        $ipConfigOutput = ipconfig | Select-String -Pattern "IPv4.*: (\d+\.\d+\.\d+\.\d+)" | Where-Object {
            $_.Line -notlike "*127.0.0.1*" -and $_.Line -notlike "*172.30.*"
        } | Select-Object -First 1
        
        if ($ipConfigOutput) {
            $ip = $ipConfigOutput.Matches[0].Groups[1].Value
            Write-Host "🌐 Detected network IP via ipconfig: $ip" -ForegroundColor Yellow
            return $ip
        }
        
        Write-Host "❌ Could not determine Windows network IP automatically" -ForegroundColor Red
        return $null
    } catch {
        Write-Host "❌ Error detecting Windows IP: $($_.Exception.Message)" -ForegroundColor Red
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

# Update deployment configuration files
Write-Host "🔧 Updating deployment configuration with IP: $WINDOWS_IP" -ForegroundColor Yellow

# Update development environment file
$DEV_ENV_FILE = "deployment\docker\development\env.development"
if (Test-Path $DEV_ENV_FILE) {
    Write-Host "🔧 Updating $DEV_ENV_FILE" -ForegroundColor Yellow
    (Get-Content $DEV_ENV_FILE) -replace 'REACT_APP_API_URL=.*', "REACT_APP_API_URL=http://$WINDOWS_IP:8080" | Set-Content $DEV_ENV_FILE
    (Get-Content $DEV_ENV_FILE) -replace 'FRONTEND_URL=.*', "FRONTEND_URL=http://$WINDOWS_IP:3000" | Set-Content $DEV_ENV_FILE
    (Get-Content $DEV_ENV_FILE) -replace 'ALLOWED_ORIGINS=.*', "ALLOWED_ORIGINS=http://$WINDOWS_IP:3000,http://127.0.0.1:3000,http://localhost:3000" | Set-Content $DEV_ENV_FILE
} else {
    Write-Host "❌ Development environment file not found: $DEV_ENV_FILE" -ForegroundColor Red
}

# Update development docker-compose.yml
$DEV_COMPOSE_FILE = "deployment\docker\development\docker-compose.yml"
if (Test-Path $DEV_COMPOSE_FILE) {
    Write-Host "🔧 Updating $DEV_COMPOSE_FILE" -ForegroundColor Yellow
    (Get-Content $DEV_COMPOSE_FILE) -replace 'REACT_APP_API_URL=.*', "REACT_APP_API_URL=http://$WINDOWS_IP:8080" | Set-Content $DEV_COMPOSE_FILE
    (Get-Content $DEV_COMPOSE_FILE) -replace '- REACT_APP_API_URL=.*', "- REACT_APP_API_URL=http://$WINDOWS_IP:8080" | Set-Content $DEV_COMPOSE_FILE
} else {
    Write-Host "❌ Development docker-compose file not found: $DEV_COMPOSE_FILE" -ForegroundColor Red
}

# Update legacy docker-compose.yml if it exists (for backward compatibility)
if (Test-Path "docker-compose.yml") {
    Write-Host "🔧 Updating legacy docker-compose.yml for backward compatibility" -ForegroundColor Yellow
    (Get-Content docker-compose.yml) -replace '172\.30\.176\.1', $WINDOWS_IP | Set-Content docker-compose.yml
    (Get-Content docker-compose.yml) -replace '192\.168\.68\.129', $WINDOWS_IP | Set-Content docker-compose.yml
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
Write-Host "🔧 Files updated:" -ForegroundColor Yellow
Write-Host "   - deployment\docker\development\env.development" -ForegroundColor White
Write-Host "   - deployment\docker\development\docker-compose.yml" -ForegroundColor White
Write-Host "   - docker-compose.yml (legacy, for backward compatibility)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 To start the application (new deployment structure):" -ForegroundColor Green
Write-Host "   cd deployment\docker\development" -ForegroundColor White
Write-Host "   docker-compose --env-file env.development up --build" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Alternative (using deployment script):" -ForegroundColor Green
Write-Host "   .\scripts\deploy.sh docker-dev --build" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop the application:" -ForegroundColor Red
Write-Host "   cd deployment\docker\development" -ForegroundColor White
Write-Host "   docker-compose --env-file env.development down" -ForegroundColor White
Write-Host ""
Write-Host "📝 Note: If your IP address changes, run this script again." -ForegroundColor Yellow
Write-Host "💡 Tip: Use Windows Host IP for access from mobile devices and other computers." -ForegroundColor Cyan
