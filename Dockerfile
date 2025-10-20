# Use a Node.js base image with latest security patches
FROM node:20-bookworm-slim

# Set the working directory
WORKDIR /app

# Install Nginx first (separate layer for better caching)
RUN apt-get update && apt-get install -y nginx gettext-base && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies with clean install
RUN npm ci --only=production || npm install --no-cache --only=production

# Copy Nginx configuration template
COPY config/nginx.conf.template /etc/nginx/nginx.conf.template

# Copy the application code
COPY . .

# Expose the ports for Nginx
EXPOSE 8080

# Set default environment variables for port configuration
ENV NODE_PORT=3001
ENV NGINX_PORT=8080
ENV NODE_ENV=production

# Start Nginx and your Node.js app
CMD ["sh", "-c", "echo 'Container starting with NODE_ENV=${NODE_ENV} NODE_PORT=${NODE_PORT} NGINX_PORT=${NGINX_PORT} PORT=${PORT}' && envsubst '${NGINX_PORT} ${NODE_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && echo 'Generated nginx.conf:' && cat /etc/nginx/nginx.conf && nginx && node index.js"]