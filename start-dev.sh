#!/bin/bash

docker run -it -p 8080:8080 -v $(pwd):/app wavelength-lore-nginx npm run dev