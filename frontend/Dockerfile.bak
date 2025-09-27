# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# LAN default (your current setup)
ARG REACT_APP_API_URL=http://192.168.68.129:8080
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build static files
RUN npm run build

# ---- Serve Stage ----
FROM node:20-alpine

WORKDIR /app

# Install static file server
RUN npm install -g serve

# Copy built React app from build stage
COPY --from=build /app/build ./build

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]

