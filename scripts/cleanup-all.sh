#!/bin/bash

# Comprehensive cleanup script for Restaurant Recipe App
# This script cleans up Docker containers, images, volumes, and build artifacts

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

# Function to confirm action
confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

log_info "Restaurant Recipe App - Comprehensive Cleanup"
log_info "============================================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

log_info "Docker is running ✓"

# Show current Docker usage
log_info "Current Docker usage:"
docker system df

echo
log_warning "This will clean up:"
echo "  - All stopped containers"
echo "  - All unused images"
echo "  - All unused volumes"
echo "  - All unused networks"
echo "  - Build cache"
echo "  - Node modules (if found)"

if ! confirm "Are you sure you want to proceed?"; then
    log_info "Cleanup cancelled."
    exit 0
fi

# Stop all running containers
log_info "Stopping all running containers..."
if docker ps -q | grep -q .; then
    docker stop $(docker ps -q)
    log_success "All containers stopped ✓"
else
    log_info "No running containers found"
fi

# Remove all containers
log_info "Removing all containers..."
if docker ps -aq | grep -q .; then
    docker rm $(docker ps -aq)
    log_success "All containers removed ✓"
else
    log_info "No containers found"
fi

# Remove all images
log_info "Removing all images..."
if docker images -q | grep -q .; then
    docker rmi -f $(docker images -q) 2>/dev/null || true
    log_success "All images removed ✓"
else
    log_info "No images found"
fi

# Remove all volumes
log_info "Removing all volumes..."
if docker volume ls -q | grep -q .; then
    docker volume rm $(docker volume ls -q)
    log_success "All volumes removed ✓"
else
    log_info "No volumes found"
fi

# Remove all networks (except default)
log_info "Removing custom networks..."
if docker network ls --filter type=custom -q | grep -q .; then
    docker network rm $(docker network ls --filter type=custom -q) 2>/dev/null || true
    log_success "Custom networks removed ✓"
else
    log_info "No custom networks found"
fi

# Clean up build cache
log_info "Cleaning build cache..."
docker builder prune -af
log_success "Build cache cleaned ✓"

# Clean up system
log_info "Cleaning Docker system..."
docker system prune -af
log_success "Docker system cleaned ✓"

# Clean up node_modules if they exist
log_info "Cleaning node_modules..."
if [ -d "frontend/node_modules" ]; then
    rm -rf frontend/node_modules
    log_success "Frontend node_modules removed ✓"
fi

if [ -d "backend/node_modules" ]; then
    rm -rf backend/node_modules
    log_success "Backend node_modules removed ✓"
fi

# Clean up any .env files that might contain sensitive data
log_info "Cleaning up .env files..."
find . -name ".env" -not -path "./deployment/*" -delete 2>/dev/null || true
log_success "Local .env files cleaned ✓"

# Show final usage
log_info "Final Docker usage:"
docker system df

log_success "Cleanup completed successfully!"
log_info "You can now run 'docker-compose up --build' to start fresh."
