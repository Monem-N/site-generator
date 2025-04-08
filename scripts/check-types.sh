#!/bin/bash

# Make the script exit on any error
set -e

echo "Checking types with TypeScript..."
npx tsc --project tsconfig.json --noEmit

echo "Type checking completed!"
