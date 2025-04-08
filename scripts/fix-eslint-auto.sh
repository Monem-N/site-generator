#!/bin/bash

# Fix auto-fixable ESLint issues
echo "Fixing auto-fixable ESLint issues..."
npx eslint --fix 'src/**/*.{ts,js}'

echo "Done!"
