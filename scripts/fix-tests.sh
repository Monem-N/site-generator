#!/bin/bash

# Make the script exit on any error
set -e

# Function to fix _async in test files
fix_async_tests() {
  local file=$1
  echo "Fixing async tests in $file"
  
  # Replace _async () => with async () =>
  sed -i '' 's/_async () =>/async () =>/g' "$file"
}

# Find all test files in the src directory
find src -name "*.test.ts" | while read -r file; do
  fix_async_tests "$file"
done

echo "Test fixes completed!"
