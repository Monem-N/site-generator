#!/bin/bash

# Make the script exit on any error
set -e

# Run TypeScript with the relaxed configuration
echo "Building with relaxed TypeScript configuration..."
npx tsc --project tsconfig.relaxed.json --diagnostics
