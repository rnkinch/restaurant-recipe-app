#!/bin/bash

# Safe production environment cleanup script
# This script cleans up containers but preserves your data volumes
# Run from: deployment/docker/production/

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

log_info "Safe Production Environment Cleanup"
log_info "==================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ] || [ ! -f "env.production" ]; then
    log_error "Please run this script from deployment/docker/production/"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop production containers
log_info "Stopping production containers..."
if docker-compose ps -q | grep -q .; then
    docker-compose down
    log_success "Production containers stopped ✓"
else
    log_info "No production containers running"
fi

# Remove production containers
log_info "Removing production containers..."
if docker-compose ps -aq | grep -q .; then
    docker-compose rm -f
    log_success "Production containers removed ✓"
else
    log_info "No production containers found"
fi

# Clean up build cache (safe - doesn't affect data)
log_info "Cleaning build cache..."
docker builder prune -f
log_success "Build cache cleaned ✓"

log_warning "Data volumes preserved - your data is safe!"
log_success "Safe cleanup completed!"
log_info "You can now run 'docker-compose up --build' to start fresh."
