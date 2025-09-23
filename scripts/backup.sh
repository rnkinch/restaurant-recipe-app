#!/bin/bash

# Script to back up the restaurant recipe app, excluding node_modules, with date and timestamp
# Working directory: /mnt/c/Users/rnkin/projects/restaurant-recipe-app
# Backup destination: /mnt/c/Users/rnkin/backups

# Exit on any error
set -e

# Define project and backup directories
PROJECT_DIR="/mnt/c/Users/rnkin/projects/restaurant-recipe-app"
BACKUP_DIR="/mnt/c/Users/rnkin/backups"
TEMP_DIR="/tmp"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="recipe-app-baseline-${TIMESTAMP}.tar.gz"
TEMP_BACKUP_FILE="${TEMP_DIR}/${BACKUP_FILE}"
BACKUP_DEST_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Change to project directory
cd "$PROJECT_DIR" || { echo "Error: Cannot access $PROJECT_DIR"; exit 1; }

# Check if backup directory exists and is writable
if [ ! -d "$BACKUP_DIR" ]; then
  echo "Creating backup directory $BACKUP_DIR..."
  mkdir -p "$BACKUP_DIR" || { echo "Error: Cannot create $BACKUP_DIR"; exit 1; }
fi
if [ ! -w "$BACKUP_DIR" ]; then
  echo "Error: Backup directory $BACKUP_DIR is not writable"
  exit 1
fi


# Create tarball in temporary directory, excluding node_modules and backup files
echo "Creating backup $BACKUP_FILE in $TEMP_DIR..."
tar --exclude='./frontend/node_modules' --exclude='./backend/node_modules' --exclude='recipe-app-baseline-*.tar.gz' -czvf "$TEMP_BACKUP_FILE" . 2>&1 || { 
  echo "Error: Failed to create backup $TEMP_BACKUP_FILE"
  # Check for modified files during tar
  echo "Checking for recently modified files..."
  find . -type f -mmin -1
  exit 1
}

# Verify tarball exists
if [ ! -f "$TEMP_BACKUP_FILE" ]; then
  echo "Error: Backup file $TEMP_BACKUP_FILE not created"
  exit 1
fi

# Move backup to backup directory
echo "Moving backup to $BACKUP_DEST_PATH..."
mv -f "$TEMP_BACKUP_FILE" "$BACKUP_DEST_PATH" 2>&1 || { echo "Error: Failed to move $TEMP_BACKUP_FILE to $BACKUP_DEST_PATH"; exit 1; }

# Verify backup
if [ -f "$BACKUP_DEST_PATH" ]; then
  echo "Backup successful: $BACKUP_DEST_PATH"
else
  echo "Error: Backup file not found at $BACKUP_DEST_PATH"
  exit 1
fi
