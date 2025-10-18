# Use a Node.js base image with a supported Debian version
FROM node:18-bullseye

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY . .

# Install Nginx
RUN apt-get update && apt-get install -y nginx gettext-base

# Copy Nginx configuration template
COPY config/nginx.conf.template /etc/nginx/nginx.conf.template

# Expose the ports for Nginx
EXPOSE 8080

# Start Nginx and your Node.js app
CMD ["sh", "-c", "envsubst '${NGINX_PORT} ${NODE_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx && node index.js"]