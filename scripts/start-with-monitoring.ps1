# PowerShell script to start Recipe App with Monitoring

Write-Host "🚀 Starting Recipe App with Monitoring..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "monitoring\grafana\datasources" | Out-Null
New-Item -ItemType Directory -Force -Path "monitoring\grafana\dashboards" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\logs" | Out-Null

Write-Host "📊 Starting all services (app + monitoring)..." -ForegroundColor Yellow
docker-compose up --build -d

Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "✅ Services started! Access URLs:" -ForegroundColor Green
Write-Host "📱 Recipe App:      http://localhost:3000" -ForegroundColor Cyan
Write-Host "📊 Grafana:         http://localhost:3001 (admin/admin123)" -ForegroundColor Cyan
Write-Host "🔍 Prometheus:      http://localhost:9090" -ForegroundColor Cyan
Write-Host "🔧 Backend API:     http://localhost:8080" -ForegroundColor Cyan
Write-Host "📈 Metrics:         http://localhost:8080/metrics" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:        docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop services:    docker-compose down" -ForegroundColor White
Write-Host "  Restart:          docker-compose restart" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open Grafana at http://localhost:3001" -ForegroundColor White
Write-Host "  2. Login with admin/admin123" -ForegroundColor White
Write-Host "  3. Import the Recipe App Dashboard" -ForegroundColor White
Write-Host "  4. Start using your app to see metrics!" -ForegroundColor White
