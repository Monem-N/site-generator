#!/bin/bash

# Make the script exit on any error
set -e

# Run all the fixes
echo "Running all fixes..."
npm run fix:all

# Build with the new configuration
echo "Building with the new configuration..."
npm run build

echo "Fix and build completed!"
