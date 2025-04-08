#!/bin/bash

# Make the script exit on any error
set -e

# Fix the import issue in NavigationGenerator.ts
echo "Fixing import issue in NavigationGenerator.ts..."

# First, add the import at the top level
sed -i '' '1s/^/import pathModule from '\''path'\'';\n/' src/navigation/NavigationGenerator.ts

# Then, remove the import inside the function
sed -i '' '/import pathModule from '\''path'\'';/d' src/navigation/NavigationGenerator.ts

echo "NavigationGenerator import fix completed!"
