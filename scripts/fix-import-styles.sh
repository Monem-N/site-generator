#!/bin/bash

# Make the script exit on any error
set -e

# Fix import styles in Builder.ts
echo "Fixing import styles in Builder.ts..."
sed -i '' 's/import \* as autoprefixer from '\''autoprefixer'\'';/import autoprefixer from '\''autoprefixer'\'';/g' src/Builder.ts
sed -i '' 's/import \* as cssnano from '\''cssnano'\'';/import cssnano from '\''cssnano'\'';/g' src/Builder.ts

# Fix other import styles as needed
# Add more sed commands here for other files

echo "Import style fixes completed!"
