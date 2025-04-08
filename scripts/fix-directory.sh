#!/bin/bash

# This script fixes ESLint issues in a specific directory
# IMPORTANT: This script only fixes TypeScript files, not generated JavaScript files

if [ -z "$1" ]; then
  echo "Usage: ./fix-directory.sh <directory>"
  echo "Example: ./fix-directory.sh src/parsers"
  exit 1
fi

DIRECTORY=$1

# Make sure .eslintignore exists to exclude generated files
if [ ! -f ".eslintignore" ]; then
  echo "Creating .eslintignore to exclude generated files..."
  cat > .eslintignore << EOL
# Ignore generated JavaScript files
**/*.js
!scripts/*.js

# Don't ignore JavaScript files that are not generated from TypeScript
# Add specific JS files or directories that are not generated here

# Ignore build and dependency directories
node_modules/
dist/
build/
coverage/

# Ignore configuration files
*.config.js
EOL
fi

# Initial analysis to see issues in this directory
echo "Initial analysis of issues in $DIRECTORY..."
npx eslint --format json "$DIRECTORY/**/*.ts" > eslint_report.json
python scripts/analyze_eslint.py

# Phase 1: Fix formatting issues
echo "Phase 1: Fixing formatting issues in $DIRECTORY..."
npx prettier --write "$DIRECTORY/**/*.{ts,js,json,md}"

# Phase 2: Fix auto-fixable ESLint issues
echo "Phase 2: Fixing auto-fixable ESLint issues in $DIRECTORY..."
npx eslint --fix "$DIRECTORY/**/*.ts"

# Phase 3: Run type safety fixes
echo "Phase 3: Fixing type safety issues in $DIRECTORY..."
node --experimental-modules ./scripts/fix-type-safety-issues.js "$DIRECTORY"

# Phase 4: Run module system fixes
echo "Phase 4: Fixing module system issues in $DIRECTORY..."
node --experimental-modules ./scripts/fix-module-system-issues.js "$DIRECTORY"

# Phase 5: Run logic error fixes
echo "Phase 5: Fixing logic and runtime errors in $DIRECTORY..."
node --experimental-modules ./scripts/fix-logic-errors-issues.js "$DIRECTORY"

# Final analysis to see progress
echo "Final analysis of remaining issues in $DIRECTORY..."
npx eslint --format json "$DIRECTORY/**/*.ts" > eslint_report.json
python scripts/analyze_eslint.py

echo "Done! Please review the changes in $DIRECTORY and fix the remaining issues manually."
echo "Consider running this script on other directories based on the analysis results."
