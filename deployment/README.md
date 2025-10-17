# Deployment Configuration

This directory contains all deployment-related files for the Wavelength Lore application.

## 📁 Files Overview

### Docker Configuration
- **`Dockerfile`** - Docker container configuration for the application
- **`docker-compose.yml`** - Multi-container Docker orchestration configuration

## 🚀 Usage

### Docker Deployment

#### Build and Run Single Container
```bash
# Build the Docker image
docker build -f deployment/Dockerfile -t wavelength-lore .

# Run the container
docker run -p 3001:3001 --env-file .env wavelength-lore
```

#### Multi-Container with Docker Compose
```bash
# Start all services
docker-compose -f deployment/docker-compose.yml up -d

# View logs
docker-compose -f deployment/docker-compose.yml logs -f

# Stop all services
docker-compose -f deployment/docker-compose.yml down
```

### Production Deployment
```bash
# Build for production
docker-compose -f deployment/docker-compose.yml -f deployment/docker-compose.prod.yml up -d

# Health check
docker-compose -f deployment/docker-compose.yml ps
```

## 🔧 Configuration

### Environment Variables
Make sure to configure these environment variables:
- `NODE_ENV=production`
- `PORT=3001`
- `DATABASE_URL=your_firebase_url`
- `API_KEY=your_firebase_api_key`

### Volume Mounts
- **Logs**: `./logs:/app/logs`
- **Temp**: `./temp:/app/temp`
- **Static**: `./static:/app/static`

## 🔒 Security Considerations

### Container Security
- Run containers as non-root user
- Use multi-stage builds to reduce image size
- Scan images for vulnerabilities regularly
- Keep base images updated

### Network Security
- Use internal networks for service communication
- Expose only necessary ports
- Implement proper firewall rules
- Use TLS for all external communication

## 📋 Best Practices

### Image Management
- Tag images with version numbers
- Use semantic versioning for releases
- Implement automated builds in CI/CD
- Store images in secure registry

### Monitoring
- Configure health checks
- Set up log aggregation
- Monitor resource usage
- Implement alerting for failures

---

**Note**: Review and test deployment configurations in staging environment before production use.