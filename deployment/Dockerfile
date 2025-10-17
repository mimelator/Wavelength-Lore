# Use a Node.js base image with a supported Debian version
FROM node:16-bullseye

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application code
COPY . .

# Install Nginx
RUN apt-get update && apt-get install -y nginx

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose the ports for Nginx
EXPOSE 8080

# Start Nginx and your Node.js app
CMD ["sh", "-c", "nginx && node index.js"]