#!/bin/bash

# Production Deployment Script for Restaurant Recipe App
# DigitalOcean Droplet: 167.71.247.15
# Usage: ./deploy.sh [jwt_secret] [grafana_password]

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

# Check if required parameters are provided
if [ $# -lt 2 ]; then
    print_error "Usage: $0 <jwt_secret> <grafana_password>"
    print_error "Example: $0 mysecretjwtkey123 mygrafana123"
    print_error "Target IP: 167.71.247.15"
    exit 1
fi

# Set IP address
IP_ADDRESS="167.71.247.15"
JWT_SECRET=$1
GRAFANA_PASSWORD=$2

print_status "Starting production deployment for IP: $IP_ADDRESS"

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
    print_status "Creating self-signed certificate for IP: $IP_ADDRESS"
    
    # Create SSL directory if it doesn't exist
    mkdir -p ssl
    
    # Generate self-signed certificate for IP address
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout ssl/key.pem \
      -out ssl/cert.pem \
      -subj "/C=US/ST=State/L=City/O=Organization/CN=$IP_ADDRESS"
    
    # Set proper permissions
    chmod 600 ssl/key.pem
    chmod 644 ssl/cert.pem
    
    print_success "Self-signed SSL certificate created for IP: $IP_ADDRESS"
    print_warning "Browsers will show security warnings - users can bypass by clicking 'Advanced' → 'Proceed'"
fi

# Update environment file
print_status "Configuring environment..."

# Backup original env file
cp env.production env.production.backup

# Update environment variables
sed -i "s|CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_IN_PRODUCTION|$JWT_SECRET|g" env.production
sed -i "s|CHANGE_THIS_TO_A_SECURE_GRAFANA_PASSWORD|$GRAFANA_PASSWORD|g" env.production

# Update docker-compose.yml with Grafana password
sed -i "s|GF_SECURITY_ADMIN_PASSWORD=admin123|GF_SECURITY_ADMIN_PASSWORD=$GRAFANA_PASSWORD|g" docker-compose.yml

print_success "Environment configured"

# Update nginx configuration
print_status "Configuring Nginx..."

# Nginx is already configured for IP address 167.71.247.15
print_success "Nginx configured for IP: $IP_ADDRESS"

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
if curl -f -k "https://$IP_ADDRESS/health" > /dev/null 2>&1; then
    print_success "Health endpoint is responding"
else
    print_warning "Health endpoint not responding (this might be normal if SSL is not configured yet)"
fi

# Test frontend
if curl -f -k "https://$IP_ADDRESS" > /dev/null 2>&1; then
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
echo "Application:     https://$IP_ADDRESS"
echo "Grafana:         https://$IP_ADDRESS:3001"
echo "Prometheus:      https://$IP_ADDRESS:9090"
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
