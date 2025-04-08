#!/bin/bash

# Make the script exit on any error
set -e

# Function to fix type assertions in test files
fix_type_assertions() {
  local file=$1
  echo "Fixing type assertions in $file"
  
  # Replace as WebsiteGeneratorConfig with as unknown as WebsiteGeneratorConfig
  sed -i '' 's/as WebsiteGeneratorConfig/as unknown as WebsiteGeneratorConfig/g' "$file"
  
  # Replace other common type assertions
  sed -i '' 's/as ComponentConfig\[\]/as unknown as ComponentConfig\[\]/g' "$file"
  sed -i '' 's/as ComponentTemplate\[\]/as unknown as ComponentTemplate\[\]/g' "$file"
  sed -i '' 's/as ParsedContent\[\]/as unknown as ParsedContent\[\]/g' "$file"
}

# Find all test files in the src directory
find src -name "*.test.ts" | while read -r file; do
  fix_type_assertions "$file"
done

echo "Type assertion fixes completed!"
