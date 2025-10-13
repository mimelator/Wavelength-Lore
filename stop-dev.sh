#!/bin/bash

# Get the CONTAINER_ID for the IMAGE: wavelength-lore-nginx
CONTAINER_ID=$(docker ps --filter "ancestor=wavelength-lore-nginx" --format "{{.ID}}")

# Check if a container ID was found
if [ -n "$CONTAINER_ID" ]; then
  echo "Stopping container with ID: $CONTAINER_ID"
  docker stop $CONTAINER_ID
else
  echo "No running container found for image: wavelength-lore-nginx"
fi