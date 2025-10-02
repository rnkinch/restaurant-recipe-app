# Development Dockerfile for Frontend
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY frontend/ .

# Expose development server port
EXPOSE 3000

# Development: Start development server with hot reload
CMD ["npm", "start"]
