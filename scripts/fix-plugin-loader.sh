#!/bin/bash

# Make the script exit on any error
set -e

# Fix the error variable issue in PluginLoader.ts
echo "Fixing error variable issue in PluginLoader.ts..."

# Replace 'error' with '_error'
sed -i '' 's/throw error;/throw _error;/g' src/plugins/PluginLoader.ts

echo "PluginLoader error variable fix completed!"
