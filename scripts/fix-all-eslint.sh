#!/bin/bash

# Make all scripts executable
chmod +x scripts/fix-prettier.sh
chmod +x scripts/fix-eslint-auto.sh
chmod +x scripts/fix-type-safety.js
chmod +x scripts/fix-module-system.js
chmod +x scripts/fix-logic-errors.js

# Phase 1: Fix formatting issues
echo "Phase 1: Fixing formatting issues..."
./scripts/fix-prettier.sh

# Phase 2: Fix auto-fixable ESLint issues
echo "Phase 2: Fixing auto-fixable ESLint issues..."
./scripts/fix-eslint-auto.sh

# Phase 3: Identify type safety issues
echo "Phase 3: Identifying type safety issues..."
node ./scripts/fix-type-safety.js

# Phase 4: Identify module system issues
echo "Phase 4: Identifying module system issues..."
node ./scripts/fix-module-system.js

# Phase 5: Identify logic and runtime errors
echo "Phase 5: Identifying logic and runtime errors..."
node ./scripts/fix-logic-errors.js

echo "Done! Please review the changes and fix the remaining issues manually."
