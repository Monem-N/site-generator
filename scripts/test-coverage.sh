#!/bin/bash

# Script to run tests with coverage reporting
# Usage: ./scripts/test-coverage.sh

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running tests with coverage reporting...${NC}"
echo

# Run Jest with coverage
npx jest --coverage

# Check if coverage meets threshold
COVERAGE_FILE="coverage/coverage-summary.json"

if [ -f "$COVERAGE_FILE" ]; then
  # Extract coverage percentages
  LINES=$(cat $COVERAGE_FILE | grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9]*\.[0-9]*}' | grep -o '"pct":[0-9]*\.[0-9]*' | grep -o '[0-9]*\.[0-9]*')
  STATEMENTS=$(cat $COVERAGE_FILE | grep -o '"statements":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9]*\.[0-9]*}' | grep -o '"pct":[0-9]*\.[0-9]*' | grep -o '[0-9]*\.[0-9]*')
  FUNCTIONS=$(cat $COVERAGE_FILE | grep -o '"functions":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9]*\.[0-9]*}' | grep -o '"pct":[0-9]*\.[0-9]*' | grep -o '[0-9]*\.[0-9]*')
  BRANCHES=$(cat $COVERAGE_FILE | grep -o '"branches":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9]*\.[0-9]*}' | grep -o '"pct":[0-9]*\.[0-9]*' | grep -o '[0-9]*\.[0-9]*')
  
  echo
  echo -e "${YELLOW}Coverage Summary:${NC}"
  echo -e "Lines: ${GREEN}$LINES%${NC}"
  echo -e "Statements: ${GREEN}$STATEMENTS%${NC}"
  echo -e "Functions: ${GREEN}$FUNCTIONS%${NC}"
  echo -e "Branches: ${GREEN}$BRANCHES%${NC}"
  echo
  
  # Check if coverage meets 80% threshold
  THRESHOLD=80
  
  if (( $(echo "$LINES < $THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ Line coverage does not meet the $THRESHOLD% threshold.${NC}"
    FAILED=1
  fi
  
  if (( $(echo "$STATEMENTS < $THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ Statement coverage does not meet the $THRESHOLD% threshold.${NC}"
    FAILED=1
  fi
  
  if (( $(echo "$FUNCTIONS < $THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ Function coverage does not meet the $THRESHOLD% threshold.${NC}"
    FAILED=1
  fi
  
  if (( $(echo "$BRANCHES < $THRESHOLD" | bc -l) )); then
    echo -e "${RED}❌ Branch coverage does not meet the $THRESHOLD% threshold.${NC}"
    FAILED=1
  fi
  
  if [ -z "$FAILED" ]; then
    echo -e "${GREEN}✅ All coverage metrics meet or exceed the $THRESHOLD% threshold!${NC}"
  else
    echo
    echo -e "${YELLOW}Suggestions to improve coverage:${NC}"
    echo -e "1. Look at the coverage report in coverage/lcov-report/index.html"
    echo -e "2. Focus on files with low coverage percentages"
    echo -e "3. Add tests for uncovered functions and branches"
    echo -e "4. Use test doubles (mocks, stubs) for external dependencies"
    echo
    exit 1
  fi
else
  echo -e "${RED}Coverage file not found. Make sure tests are running correctly.${NC}"
  exit 1
fi
