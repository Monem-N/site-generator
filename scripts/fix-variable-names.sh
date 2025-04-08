#!/bin/bash

# Make the script exit on any error
set -e

# Fix variable names in incremental.test.ts
echo "Fixing variable names in incremental.test.ts"
sed -i '' 's/_filePath/filePath/g' src/__tests__/utils/incremental.test.ts
sed -i '' 's/_dirPath/dirPath/g' src/__tests__/utils/incremental.test.ts
sed -i '' 's/_format/format/g' src/__tests__/utils/incremental.test.ts

# Fix variable names in config-validator.test.ts
echo "Fixing variable names in config-validator.test.ts"
sed -i '' 's/_path/path/g' src/__tests__/utils/config-validator.test.ts

# Fix variable names in cache.test.ts
echo "Fixing variable names in cache.test.ts"
sed -i '' 's/_dirPath/dirPath/g' src/__tests__/utils/cache.test.ts

echo "Variable name fixes completed!"
