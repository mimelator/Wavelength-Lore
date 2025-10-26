#!/bin/bash

# Simple working approach based on commit b93b82f
echo "🌊 WAVELENGTH Simple Container Starting"

# Start nginx in background
nginx &

# Start Node.js application
node index.js