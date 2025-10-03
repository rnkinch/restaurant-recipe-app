# Production Dockerfile for Frontend
# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY frontend/ .

# Build argument for API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build static files
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install static file server
RUN npm install -g serve

# Copy built React app from build stage
COPY --from=build --chown=nodejs:nodejs /app/build ./build

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Serve static files
CMD ["serve", "-s", "build", "-l", "3000"]
