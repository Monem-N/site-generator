#!/bin/bash

# Fix auto-fixable ESLint issues (TypeScript files only)
echo "Fixing auto-fixable ESLint issues in TypeScript files..."
npx eslint --fix 'src/**/*.ts'

echo "Done!"
