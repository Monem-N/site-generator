#!/bin/bash

# Fix Prettier formatting issues
echo "Fixing Prettier formatting issues..."
npx prettier --write 'src/**/*.{ts,js,json,md}'

echo "Done!"
