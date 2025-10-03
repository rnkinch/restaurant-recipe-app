#!/bin/bash

# Production Deployment Script for Restaurant Recipe App
# Usage: ./deploy.sh [domain] [jwt_secret] [grafana_password]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if domain is provided
if [ $# -lt 3 ]; then
    print_error "Usage: $0 <domain> <jwt_secret> <grafana_password>"
    print_error "Example: $0 mydomain.com mysecretjwtkey123 mygrafana123"
    exit 1
fi

DOMAIN=$1
JWT_SECRET=$2
GRAFANA_PASSWORD=$3

print_status "Starting production deployment for domain: $DOMAIN"

# Check prerequisites
print_status "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if running in correct directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from deployment/docker/production/"
    exit 1
fi

print_success "Prerequisites check passed"

# Create SSL directory if it doesn't exist
mkdir -p ssl

# Check for SSL certificates
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    print_warning "SSL certificates not found in ssl/ directory"
    print_warning "Please ensure you have SSL certificates before proceeding"
    print_warning "You can use Let's Encrypt:"
    print_warning "  sudo certbot certonly --standalone -d $DOMAIN"
    print_warning "  sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem"
    print_warning "  sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem"
    print_warning "  sudo chown \$USER:\$USER ssl/*"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update environment file
print_status "Configuring environment..."

# Backup original env file
cp env.production env.production.backup

# Update environment variables
sed -i "s|https://yourdomain.com|https://$DOMAIN|g" env.production
sed -i "s|CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_IN_PRODUCTION|$JWT_SECRET|g" env.production
sed -i "s|CHANGE_THIS_TO_A_SECURE_GRAFANA_PASSWORD|$GRAFANA_PASSWORD|g" env.production

print_success "Environment configured"

# Update nginx configuration
print_status "Configuring Nginx..."

# Update server name in nginx.conf
sed -i "s|server_name _;|server_name $DOMAIN;|g" nginx.conf

print_success "Nginx configured"

# Build and start services
print_status "Building and starting services..."

# Stop any existing services
docker-compose down 2>/dev/null || true

# Build and start services
docker-compose up -d --build

print_success "Services started"

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    print_error "Some services failed to start. Check logs:"
    docker-compose logs
    exit 1
fi

# Test endpoints
print_status "Testing endpoints..."

# Test health endpoint
if curl -f -k "https://$DOMAIN/health" > /dev/null 2>&1; then
    print_success "Health endpoint is responding"
else
    print_warning "Health endpoint not responding (this might be normal if SSL is not configured yet)"
fi

# Test frontend
if curl -f -k "https://$DOMAIN" > /dev/null 2>&1; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend not accessible (this might be normal if SSL is not configured yet)"
fi

# Display service information
print_success "Deployment completed!"
echo
echo "=================================="
echo "Service URLs:"
echo "=================================="
echo "Application:     https://$DOMAIN"
echo "Grafana:         https://$DOMAIN:3001"
echo "Prometheus:      https://$DOMAIN:9090"
echo
echo "=================================="
echo "Credentials:"
echo "=================================="
echo "Grafana Admin:   admin / $GRAFANA_PASSWORD"
echo
echo "=================================="
echo "Useful Commands:"
echo "=================================="
echo "View logs:       docker-compose logs -f"
echo "Stop services:   docker-compose down"
echo "Restart:         docker-compose restart"
echo "Update:          git pull && docker-compose up -d --build"
echo

# Check SSL certificate
if [ -f "ssl/cert.pem" ]; then
    print_status "SSL Certificate Information:"
    openssl x509 -in ssl/cert.pem -text -noout | grep -E "(Subject:|Not Before|Not After)"
fi

print_warning "IMPORTANT: Please review the PRODUCTION_CHECKLIST.md for additional security steps!"
print_warning "Make sure to:"
print_warning "1. Configure your firewall"
print_warning "2. Set up SSL certificate auto-renewal"
print_warning "3. Configure database backups"
print_warning "4. Test all functionality"
print_warning "5. Review monitoring dashboards"

print_success "Deployment script completed!"
