# Port Configuration

This document explains the port configuration for the Wavelength Lore application.

## Environment Variables

The application uses the following environment variables for port configuration:

- `NODE_PORT`: The internal port where the Node.js application runs (default: 3001)
- `NGINX_PORT`: The external port where Nginx listens for incoming requests (default: 8080)
- `PORT`: Legacy port variable, now falls back to NODE_PORT if not set

## Docker Architecture

The Docker container runs both Nginx and Node.js:

1. **Nginx** listens on port 8080 (external)
2. **Node.js** runs on port 3001 (internal)
3. **Nginx** proxies requests from 8080 → 3001

## Port Priority

The application determines the Node.js port using this priority:

1. `NODE_PORT` environment variable
2. `PORT` environment variable (legacy support)
3. Default: 3001

## Production Configuration

For production deployment, ensure these environment variables are set:

```bash
NODE_PORT=3001
NGINX_PORT=8080
```

This configuration ensures:
- Clear separation between internal and external ports
- Nginx can properly proxy to the Node.js application
- No port conflicts between services

## Troubleshooting

If you see a 502 Bad Gateway error:

1. Check that NODE_PORT=3001 (not 8080)
2. Verify Nginx is running and listening on port 8080
3. Ensure Node.js app is running on port 3001
4. Run the diagnostic script: `node debug/production-diagnostic.js`

## Local Development

For local development without Docker, the Node.js app will run directly on port 3001:

```bash
npm start
# Server accessible at http://localhost:3001
```