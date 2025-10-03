#!/bin/bash

# Fix environment variable warnings in Docker Compose
# Usage: ./fix-env-vars.sh [domain] [grafana_password]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if domain is provided
if [ $# -lt 1 ]; then
    print_warning "Usage: $0 <domain> [grafana_password]"
    print_warning "Example: $0 mydomain.com mypassword123"
    exit 1
fi

DOMAIN=$1
GRAFANA_PASSWORD=${2:-admin123}

print_status "Fixing environment variables for domain: $DOMAIN"

# Update docker-compose.yml with actual values
sed -i "s|https://yourdomain.com/api|https://$DOMAIN/api|g" docker-compose.yml
sed -i "s|GF_SECURITY_ADMIN_PASSWORD=admin123|GF_SECURITY_ADMIN_PASSWORD=$GRAFANA_PASSWORD|g" docker-compose.yml

# Update env.production file
sed -i "s|https://yourdomain.com|https://$DOMAIN|g" env.production
sed -i "s|REACT_APP_API_URL=https://yourdomain.com/api|REACT_APP_API_URL=https://$DOMAIN/api|g" env.production
sed -i "s|CHANGE_THIS_TO_A_SECURE_GRAFANA_PASSWORD|$GRAFANA_PASSWORD|g" env.production

print_status "Environment variables fixed!"
print_status "Updated files:"
print_status "  - docker-compose.yml"
print_status "  - env.production"

print_status "You can now run: docker-compose up -d --build"
