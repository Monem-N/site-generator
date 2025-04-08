#!/bin/bash

# Make the script exit on any error
set -e

# Run TypeScript with the super relaxed configuration
echo "Building with super relaxed TypeScript configuration..."
npx tsc --project tsconfig.super-relaxed.json --diagnostics
