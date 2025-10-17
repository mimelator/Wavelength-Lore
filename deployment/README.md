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

### AWS App Runner Deployment

#### Environment Variables Management
Update production environment variables from your local `.env` file:

```bash
# Preview changes (safe - shows what would be updated)
node scripts/apprunner-env-updater.js

# Apply changes to production App Runner service
node scripts/apprunner-env-updater.js --force
```

#### First-Time Setup
If you encounter permissions errors, you need to add App Runner permissions to your IAM user:

1. **Generate IAM Policy**:
   ```bash
   node scripts/setup-apprunner-permissions.js
   ```

2. **Add Permissions via AWS Console**:
   - Go to AWS Console → IAM → Users → `wavelength-lore-app-user`
   - Click "Add permissions" → "Create inline policy"
   - Choose "JSON" tab and paste the generated policy
   - Name it "AppRunnerEnvironmentUpdate"
   - Click "Create policy"

3. **Test Connection**:
   ```bash
   node scripts/apprunner-env-updater.js
   ```

#### Production Environment Variables
The updater automatically filters and deploys these variables:
- **Firebase Configuration**: API keys, database URL, project settings
- **AWS Credentials**: Access keys for S3, CloudFront, and other services
- **Security Settings**: Rate limiting, input sanitization, profanity filtering
- **External APIs**: YouTube API, CDN configuration
- **Application Settings**: Version, site URL, port configuration

**Note**: Development-only variables (backup system, local settings) are automatically excluded from production deployment.

#### Cache Management
Clear application and CDN caches after deployments:

```bash
# Clear all caches (local application + CloudFront CDN)
./scripts/bust-cache.sh

# Clear only local application caches
./scripts/bust-cache.sh --local

# Clear only CloudFront CDN cache
./scripts/bust-cache.sh --cdn

# Clear specific cache types with refresh
./scripts/bust-cache.sh --local --characters --refresh
```

**CloudFront Cache Setup**: If you encounter CloudFront permissions errors:
1. **Generate IAM Policy**: `node scripts/setup-cloudfront-permissions.js`
2. **Add Policy to IAM User**: Follow the displayed instructions
3. **Test**: `node scripts/cloudfront-cache-bust.js`

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