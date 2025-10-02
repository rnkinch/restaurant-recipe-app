# Development Dockerfile for Backend
FROM node:20

WORKDIR /app

# Copy package files for dependency installation
COPY backend/package*.json ./

# Install all dependencies (including dev dependencies for development)
RUN npm install

# Copy source code
COPY backend/ .

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node uploads

# Switch to non-root user
USER node

# Expose API port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
