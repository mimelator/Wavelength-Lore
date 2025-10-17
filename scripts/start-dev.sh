#!/bin/bash

# Navigate to project root and run development server
cd "$(dirname "$0")/.." && docker run -it -p 3001:3001 -v $(pwd):/app wavelength-lore-nginx npm run dev