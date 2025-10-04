# Staging Dockerfile for Frontend
# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install && npm cache clean --force

# Copy source code
COPY frontend/ .

# Accept build arguments
ARG REACT_APP_API_URL
ARG WDS_SOCKET_HOST

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV WDS_SOCKET_HOST=$WDS_SOCKET_HOST
ENV NODE_ENV=staging

# Build static files with staging environment
RUN npm run build

# ---- Serve Stage ----
FROM node:20-alpine

WORKDIR /app

# Install static file server
RUN npm install -g serve

# Copy built React app from build stage
COPY --from=build /app/build ./build

# Expose port
EXPOSE 3000

# Serve static files
CMD ["serve", "-s", "build", "-l", "3000"]
