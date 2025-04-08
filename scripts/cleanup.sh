#!/bin/bash

# Make the script exit on any error
set -e

echo "Cleaning up temporary files..."

# Remove temporary fix scripts
echo "Removing temporary fix scripts..."
rm -f scripts/fix-and-build-new.sh
rm -f scripts/fix-decorators-new.sh
rm -f scripts/fix-imports-new.sh
rm -f scripts/fix-navigation-generator-new.sh
rm -f scripts/fix-plugin-loader-new.sh
rm -f scripts/fix-plugin-loader-new2.sh
rm -f scripts/fix-plugin-interface.sh
rm -f scripts/fix-type-issues-new.sh
rm -f scripts/fix-type-issues.sh
rm -f scripts/fix-plugin-options.sh
rm -f scripts/fix-template-engine.sh
rm -f scripts/build-root.sh
rm -f scripts/build-transpile-only.sh

# Remove temporary TypeScript configuration files
echo "Removing temporary TypeScript configuration files..."
rm -f tsconfig.new.json
rm -f tsconfig.root.json
rm -f tsconfig.types.json

echo "Cleanup completed!"
