#!/bin/bash

docker run -it -p 3001:3001 -v $(pwd):/app wavelength-lore-nginx npm run dev