#!/bin/bash

# Make all scripts executable
chmod +x scripts/fix-prettier.sh
chmod +x scripts/fix-eslint-auto.sh
chmod +x scripts/fix-type-safety-issues.js
chmod +x scripts/fix-module-system-issues.js
chmod +x scripts/fix-logic-errors-issues.js

# Phase 1: Fix formatting issues
echo "Phase 1: Fixing formatting issues..."
./scripts/fix-prettier.sh

# Phase 2: Fix auto-fixable ESLint issues
echo "Phase 2: Fixing auto-fixable ESLint issues..."
./scripts/fix-eslint-auto.sh

# Phase 3: Fix type safety issues
echo "Phase 3: Fixing type safety issues..."
node --experimental-modules ./scripts/fix-type-safety-issues.js

# Phase 4: Fix module system issues
echo "Phase 4: Fixing module system issues..."
node --experimental-modules ./scripts/fix-module-system-issues.js

# Phase 5: Fix logic and runtime errors
echo "Phase 5: Fixing logic and runtime errors..."
node --experimental-modules ./scripts/fix-logic-errors-issues.js

echo "Done! Please review the changes and fix the remaining issues manually."
