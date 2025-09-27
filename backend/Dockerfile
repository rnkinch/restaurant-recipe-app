FROM node:20

WORKDIR /app

# Copy package.json and lock file for reproducible builds
COPY package*.json ./
RUN npm install --only=production

# Copy source code
COPY . .

# Expose API port
EXPOSE 8080

# Start server
CMD ["npm", "start"]

