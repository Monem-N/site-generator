#!/bin/bash

# Make the script exit on any error
set -e

# Fix import paths in test-helpers.ts
echo "Fixing import paths in test-helpers.ts"
sed -i '' "s/from '..\/..\/types\/parser.ts'/from '..\/..\/types\/parser'/g" src/__tests__/utils/test-helpers.ts

echo "Import path fixes completed!"
