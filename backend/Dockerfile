FROM node:20
WORKDIR /app  # Changed from absolute WSL path for portability
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]