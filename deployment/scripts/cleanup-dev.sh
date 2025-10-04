#!/bin/bash

# Cleanup script for development environment
# This script cleans up only development containers and volumes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info "Development Environment Cleanup"
log_info "==============================="

# Check if we're in the right directory
if [[ ! -d "deployment/docker/development" ]]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

cd deployment/docker/development

# Stop development containers
log_info "Stopping development containers..."
if docker-compose ps -q | grep -q .; then
    docker-compose down
    log_success "Development containers stopped ✓"
else
    log_info "No development containers running"
fi

# Remove development containers
log_info "Removing development containers..."
if docker-compose ps -aq | grep -q .; then
    docker-compose rm -f
    log_success "Development containers removed ✓"
else
    log_info "No development containers found"
fi

# Remove development volumes
log_info "Removing development volumes..."
if docker volume ls -q | grep -E "(dev-|development-)" | grep -q .; then
    docker volume rm $(docker volume ls -q | grep -E "(dev-|development-)")
    log_success "Development volumes removed ✓"
else
    log_info "No development volumes found"
fi

# Remove development images
log_info "Removing development images..."
if docker images | grep -E "(dev-|development-)" | awk '{print $3}' | grep -q .; then
    docker rmi -f $(docker images | grep -E "(dev-|development-)" | awk '{print $3}') 2>/dev/null || true
    log_success "Development images removed ✓"
else
    log_info "No development images found"
fi

# Clean up build cache
log_info "Cleaning build cache..."
docker builder prune -f
log_success "Build cache cleaned ✓"

log_success "Development cleanup completed!"
log_info "You can now run 'docker-compose up --build' to start fresh."

cd ../../..
