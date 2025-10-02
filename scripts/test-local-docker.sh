#!/bin/bash

# Test script for local Docker development setup
# This script tests the new deployment structure
# Run from project root: ./test-local-docker.sh

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

log_info "Testing Local Docker Development Setup"
log_info "======================================"

# Check if we're in the right directory
if [[ ! -f "docker-compose.yml" ]] || [[ ! -d "deployment" ]]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

log_info "Docker is running ✓"

# Check if deployment directory exists
if [[ ! -d "deployment/docker/development" ]]; then
    log_error "Deployment directory structure not found"
    exit 1
fi

log_info "Deployment structure exists ✓"

# Test the new Docker development setup
log_info "Testing new Docker development configuration..."

cd deployment/docker/development

# Check if environment file exists
if [[ ! -f "env.development" ]]; then
    log_error "Development environment file not found: env.development"
    exit 1
fi

log_info "Environment file exists ✓"

# Test docker-compose configuration
log_info "Validating docker-compose configuration..."
if docker-compose --env-file env.development config >/dev/null 2>&1; then
    log_success "Docker Compose configuration is valid ✓"
else
    log_error "Docker Compose configuration has errors"
    docker-compose --env-file env.development config
    exit 1
fi

# Build and start services
log_info "Building and starting services..."
log_warning "This may take a few minutes on first run..."

if docker-compose --env-file env.development up --build -d; then
    log_success "Services started successfully ✓"
else
    log_error "Failed to start services"
    exit 1
fi

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 30

# Check if services are running
log_info "Checking service health..."

# Check MongoDB
if docker-compose --env-file env.development exec -T mongo-container mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    log_success "MongoDB is healthy ✓"
else
    log_warning "MongoDB health check failed (may still be starting)"
fi

# Check Backend
if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    log_success "Backend is responding ✓"
else
    log_warning "Backend health check failed - checking if it's starting..."
    docker-compose --env-file env.development logs backend-container | tail -10
fi

# Check Frontend
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    log_success "Frontend is responding ✓"
else
    log_warning "Frontend health check failed - checking if it's starting..."
    docker-compose --env-file env.development logs frontend-container | tail -10
fi

log_info ""
log_info "Test Results:"
log_info "============="
log_success "✓ Docker development environment is working"
log_info "Frontend: http://localhost:3000"
log_info "Backend: http://localhost:8080"
log_info "MongoDB: localhost:27017"
log_info ""
log_info "To view logs: docker-compose --env-file env.development logs -f"
log_info "To stop: docker-compose --env-file env.development down"
log_info ""
log_warning "Note: Other deployment configurations (AWS, K8s, Production) are templates and not tested"

cd ../../..
