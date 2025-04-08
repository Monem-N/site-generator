#!/bin/bash

# Default timeout is 10 seconds
TIMEOUT=${2:-10}

# Run the test with a timeout
TIMEOUT_CMD=""
if command -v timeout &> /dev/null; then
  # Use timeout command if available
  TIMEOUT_CMD="timeout $TIMEOUT"
fi

# Run the test
$TIMEOUT_CMD npx jest $1 --forceExit --detectOpenHandles
RESULT=$?

# Check if the test timed out
if [ $RESULT -eq 124 ]; then
  echo "Test timed out after $TIMEOUT seconds"
fi

exit $RESULT
