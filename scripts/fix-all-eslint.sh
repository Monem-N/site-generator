#!/bin/bash

# Make all scripts executable
chmod +x scripts/fix-prettier.sh
chmod +x scripts/fix-eslint-auto.sh
chmod +x scripts/fix-type-safety-issues.js
chmod +x scripts/fix-module-system-issues.js
chmod +x scripts/fix-logic-errors-issues.js
chmod +x scripts/analyze_eslint.py

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

# Phase 0: Analyze ESLint issues
echo "Phase 0: Analyzing ESLint issues..."
npx eslint --format json "src/**/*.ts" > eslint_report.json
python scripts/analyze_eslint.py

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

# Phase 6: Fix console statements
echo "Phase 6: Fixing console statements..."
node --experimental-modules ./scripts/fix-console-statements.js

# Final analysis to see progress
echo "Final analysis of remaining issues..."
npx eslint --format json "src/**/*.ts" > eslint_report.json
python scripts/analyze_eslint.py

echo "Done! Please review the changes and fix the remaining issues manually."
echo "Use './scripts/fix-directory.sh <directory>' to fix issues in specific directories based on the analysis."
