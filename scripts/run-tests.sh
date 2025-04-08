#!/bin/bash

# Make the script exit on any error
set -e

# Check if a test file or directory is provided
if [ $# -eq 0 ]; then
  # Run all tests
  npx jest --forceExit --detectOpenHandles
else
  # Run specific test(s)
  npx jest "$@" --forceExit --detectOpenHandles
fi
