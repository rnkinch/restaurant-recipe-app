FROM node:20
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
ARG REACT_APP_API_URL=http://192.168.68.129:5000
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
EXPOSE 3000
