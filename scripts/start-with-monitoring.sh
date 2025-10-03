#!/bin/bash

echo "🚀 Starting Recipe App with Monitoring..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories
mkdir -p monitoring/grafana/datasources
mkdir -p monitoring/grafana/dashboards
mkdir -p backend/logs

echo "📊 Starting all services (app + monitoring)..."
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "✅ Services started! Access URLs:"
echo "📱 Recipe App:      http://localhost:3000"
echo "📊 Grafana:         http://localhost:3001 (admin/admin123)"
echo "🔍 Prometheus:      http://localhost:9090"
echo "🔧 Backend API:     http://localhost:8080"
echo "📈 Metrics:         http://localhost:8080/metrics"

echo ""
echo "📋 Useful commands:"
echo "  View logs:        docker-compose logs -f"
echo "  Stop services:    docker-compose down"
echo "  Restart:          docker-compose restart"
echo ""
echo "🎯 Next steps:"
echo "  1. Open Grafana at http://localhost:3001"
echo "  2. Login with admin/admin123"
echo "  3. Import the Recipe App Dashboard"
echo "  4. Start using your app to see metrics!"
