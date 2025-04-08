#!/bin/bash

# This script fixes ESLint issues in a specific directory

if [ -z "$1" ]; then
  echo "Usage: ./fix-directory.sh <directory>"
  echo "Example: ./fix-directory.sh src/parsers"
  exit 1
fi

DIRECTORY=$1

# Phase 1: Fix formatting issues
echo "Phase 1: Fixing formatting issues in $DIRECTORY..."
npx prettier --write "$DIRECTORY/**/*.{ts,js,json,md}"

# Phase 2: Fix auto-fixable ESLint issues
echo "Phase 2: Fixing auto-fixable ESLint issues in $DIRECTORY..."
npx eslint --fix "$DIRECTORY/**/*.{ts,js}"

# Phase 3: Run type safety fixes
echo "Phase 3: Fixing type safety issues in $DIRECTORY..."
node --experimental-modules ./scripts/fix-type-safety-issues.js "$DIRECTORY"

# Phase 4: Run module system fixes
echo "Phase 4: Fixing module system issues in $DIRECTORY..."
node --experimental-modules ./scripts/fix-module-system-issues.js "$DIRECTORY"

# Phase 5: Run logic error fixes
echo "Phase 5: Fixing logic and runtime errors in $DIRECTORY..."
node --experimental-modules ./scripts/fix-logic-errors-issues.js "$DIRECTORY"

echo "Done! Please review the changes in $DIRECTORY and fix the remaining issues manually."
