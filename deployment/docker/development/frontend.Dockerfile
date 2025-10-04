# Development Dockerfile for Frontend
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY frontend/ .

# Accept build arguments
ARG REACT_APP_API_URL
ARG WDS_SOCKET_HOST

# Set environment variables
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV WDS_SOCKET_HOST=$WDS_SOCKET_HOST

# Expose development server port
EXPOSE 3000

# Development: Start development server with hot reload
CMD ["npm", "start"]
