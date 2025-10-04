#!/bin/bash

# Staging environment cleanup script
# Run from: deployment/docker/stage/

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

log_info "Staging Environment Cleanup"
log_info "==========================="

# Check if we're in the right directory
if [[ ! -f "docker-compose.yml" ]] || [[ ! -f "env.stage" ]]; then
    log_error "Please run this script from deployment/docker/stage/"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop staging containers
log_info "Stopping staging containers..."
if docker-compose ps -q | grep -q .; then
    docker-compose down
    log_success "Staging containers stopped ✓"
else
    log_info "No staging containers running"
fi

# Remove staging containers
log_info "Removing staging containers..."
if docker-compose ps -aq | grep -q .; then
    docker-compose rm -f
    log_success "Staging containers removed ✓"
else
    log_info "No staging containers found"
fi

# Remove staging volumes
log_info "Removing staging volumes..."
if docker volume ls -q | grep -E "(stage-|staging-)" | grep -q .; then
    docker volume rm $(docker volume ls -q | grep -E "(stage-|staging-)")
    log_success "Staging volumes removed ✓"
else
    log_info "No staging volumes found"
fi

# Remove staging images
log_info "Removing staging images..."
if docker images | grep -E "(stage-|staging-)" | awk '{print $3}' | grep -q .; then
    docker rmi -f $(docker images | grep -E "(stage-|staging-)" | awk '{print $3}') 2>/dev/null || true
    log_success "Staging images removed ✓"
else
    log_info "No staging images found"
fi

# Clean up build cache
log_info "Cleaning build cache..."
docker builder prune -f
log_success "Build cache cleaned ✓"

log_success "Staging cleanup completed!"
log_info "You can now run 'docker-compose up --build' to start fresh."
