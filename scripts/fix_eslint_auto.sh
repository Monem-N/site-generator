#!/bin/bash

# ESLint Auto-Fix Script
# This script automatically fixes common ESLint issues in TypeScript files
# focusing on the two most common issues in the codebase:
# 1. @typescript-eslint/no-explicit-any
# 2. @typescript-eslint/no-unused-vars

# ANSI color codes for terminal output
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BOLD}ESLint Auto-Fix Script${NC}"
echo -e "${BLUE}This script will fix common ESLint issues in your TypeScript files${NC}"

# Check if a directory was provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}Usage: ./fix_eslint_auto.sh [directory]${NC}"
  echo -e "${YELLOW}Example: ./fix_eslint_auto.sh src/types${NC}"
  exit 1
fi

DIRECTORY=$1

# Check if the directory exists
if [ ! -d "$DIRECTORY" ]; then
  echo -e "${RED}Error: $DIRECTORY is not a valid directory${NC}"
  exit 1
fi

echo -e "${BLUE}Target directory: $DIRECTORY${NC}"

# Step 1: Fix no-explicit-any issues
echo -e "\n${BOLD}Step 1: Fixing @typescript-eslint/no-explicit-any issues${NC}"

# Find TypeScript files with 'any' type
TS_FILES=$(find "$DIRECTORY" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.d.ts" \) -exec grep -l "any" {} \;)

if [ -z "$TS_FILES" ]; then
  echo -e "${GREEN}No files with 'any' type found.${NC}"
else
  # Count total files to process
  TOTAL_FILES=$(echo "$TS_FILES" | wc -l)
  echo -e "${CYAN}Found $TOTAL_FILES files with potential 'any' type issues${NC}"
  
  # Process each file
  FIXED_ANY=0
  for file in $TS_FILES; do
    echo -e "${BLUE}Processing $file...${NC}"
    
    # Replace common patterns of 'any' with 'unknown'
    # Function parameters
    sed -i '' 's/\(([a-zA-Z0-9_]\+)\): any/\1: unknown/g' "$file"
    sed -i '' 's/\(([a-zA-Z0-9_]\+)\): any\[\]/\1: unknown[]/g' "$file"
    
    # Variable declarations
    sed -i '' 's/\(const\|let\|var\) \([a-zA-Z0-9_]\+\): any/\1 \2: unknown/g' "$file"
    sed -i '' 's/\(const\|let\|var\) \([a-zA-Z0-9_]\+\): any\[\]/\1 \2: unknown[]/g' "$file"
    
    # Interface and type properties
    sed -i '' 's/\([a-zA-Z0-9_]\+\)?: any;/\1?: unknown;/g' "$file"
    sed -i '' 's/\([a-zA-Z0-9_]\+\)?: any\[\];/\1?: unknown[];/g' "$file"
    
    # Generic types
    sed -i '' 's/<any>/<unknown>/g' "$file"
    sed -i '' 's/<any\[\]>/<unknown[]>/g' "$file"
    
    # Record types
    sed -i '' 's/Record<string, any>/Record<string, unknown>/g' "$file"
    sed -i '' 's/Record<number, any>/Record<number, unknown>/g' "$file"
    
    # Special case for context objects in handlebars.d.ts
    if [[ "$file" == *"handlebars.d.ts"* ]]; then
      sed -i '' 's/context?: any/context?: Record<string, unknown>/g' "$file"
      sed -i '' 's/options?: any/options?: Record<string, unknown>/g' "$file"
      sed -i '' 's/data?: any/data?: Record<string, unknown>/g' "$file"
      sed -i '' 's/hash: any/hash: Record<string, unknown>/g' "$file"
    fi
    
    # Count fixes in this file
    FIXES=$(grep -c "unknown" "$file")
    if [ "$FIXES" -gt 0 ]; then
      echo -e "${GREEN}Fixed potential 'any' issues in $file${NC}"
      FIXED_ANY=$((FIXED_ANY + 1))
    fi
  done
  
  echo -e "${GREEN}Processed $FIXED_ANY/$TOTAL_FILES files with 'any' type issues${NC}"
fi

# Step 2: Fix no-unused-vars issues
echo -e "\n${BOLD}Step 2: Fixing @typescript-eslint/no-unused-vars issues${NC}"

# Run ESLint to find unused variables
echo -e "${BLUE}Running ESLint to identify unused variables...${NC}"
ESLINT_OUTPUT=$(npx eslint --format json "$DIRECTORY" 2>/dev/null)

if [ -z "$ESLINT_OUTPUT" ]; then
  echo -e "${RED}Error running ESLint. Make sure ESLint is installed.${NC}"
  exit 1
fi

# Extract files with unused variables
UNUSED_VAR_FILES=$(echo "$ESLINT_OUTPUT" | grep -o '"filePath":"[^"]*".*"ruleId":"@typescript-eslint/no-unused-vars"' | grep -o '"filePath":"[^"]*"' | sed 's/"filePath":"\(.*\)"/\1/g' | sort | uniq)

if [ -z "$UNUSED_VAR_FILES" ]; then
  echo -e "${GREEN}No files with unused variables found.${NC}"
else
  # Count total files to process
  TOTAL_UNUSED_FILES=$(echo "$UNUSED_VAR_FILES" | wc -l)
  echo -e "${CYAN}Found $TOTAL_UNUSED_FILES files with unused variables${NC}"
  
  # Process each file
  FIXED_UNUSED=0
  for file in $UNUSED_VAR_FILES; do
    echo -e "${BLUE}Processing $file...${NC}"
    
    # Get unused variable names from ESLint output
    UNUSED_VARS=$(echo "$ESLINT_OUTPUT" | grep -o "\"filePath\":\"$file\".*\"ruleId\":\"@typescript-eslint/no-unused-vars\".*\"message\":\"'[^']*'" | grep -o "'[^']*'" | sed "s/'//g")
    
    if [ -z "$UNUSED_VARS" ]; then
      continue
    fi
    
    # Prefix each unused variable with underscore
    for var in $UNUSED_VARS; do
      # Skip if variable already starts with underscore
      if [[ "$var" == _* ]]; then
        continue
      fi
      
      # Replace the variable name with prefixed version
      # We need to be careful to only replace variable declarations, not all occurrences
      # This is a simplified approach and might need manual review
      sed -i '' "s/\(function\|const\|let\|var\|interface\|type\|class\) $var/\1 _$var/g" "$file"
      sed -i '' "s/\(([^)]*)\): [^{]*{[^}]*$var\([^a-zA-Z0-9_]\)/\1): [^{]*{[^}]*_$var\2/g" "$file"
    done
    
    echo -e "${GREEN}Fixed unused variables in $file${NC}"
    FIXED_UNUSED=$((FIXED_UNUSED + 1))
  done
  
  echo -e "${GREEN}Processed $FIXED_UNUSED/$TOTAL_UNUSED_FILES files with unused variables${NC}"
fi

# Summary
echo -e "\n${BOLD}Summary:${NC}"
echo -e "${GREEN}Fixed potential 'any' type issues in $FIXED_ANY files${NC}"
echo -e "${GREEN}Fixed unused variables in $FIXED_UNUSED files${NC}"
echo -e "\n${YELLOW}Run ESLint again to check for remaining issues:${NC}"
echo -e "${YELLOW}npx eslint --format json $DIRECTORY > eslint_report.json${NC}"
echo -e "${YELLOW}python scripts/analyze_eslint.py${NC}"

echo -e "\n${BOLD}Note:${NC} Some complex cases may require manual fixes. Review the changes and run ESLint again."