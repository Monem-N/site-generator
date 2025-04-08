#!/bin/bash

# Make the script exit on any error
set -e

# Run TypeScript with the fixed configuration
echo "Building with fixed TypeScript configuration including types directory..."
npx tsc --project tsconfig.fixed-with-types.json --diagnostics
