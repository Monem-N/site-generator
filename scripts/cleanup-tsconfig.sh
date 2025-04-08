#!/bin/bash

# Make the script exit on any error
set -e

echo "Cleaning up unused TypeScript configuration files..."

# Remove unused tsconfig files
echo "Removing unused tsconfig files..."
rm -f tsconfig.minimal.json
rm -f tsconfig.optimized.json
rm -f tsconfig.original.json

echo "TypeScript configuration cleanup completed!"
