#!/bin/bash

# Basic Docker cleanup script
# This script performs a basic cleanup of Docker resources

set -e

echo "Performing basic Docker cleanup..."

# Stop all containers
echo "Stopping containers..."
docker-compose down 2>/dev/null || true

# Remove unused containers
echo "Removing unused containers..."
docker container prune -f

# Remove unused images
echo "Removing unused images..."
docker image prune -f

# Remove unused volumes
echo "Removing unused volumes..."
docker volume prune -f

# Remove unused networks
echo "Removing unused networks..."
docker network prune -f

# Clean build cache
echo "Cleaning build cache..."
docker builder prune -f

echo "Basic cleanup completed!"
