#!/bin/bash

# Script to update the GitHub Features Checklist after setting up branch protection rules
# This script updates the GITHUB_FEATURES_CHECKLIST.md file to mark branch protection items as completed

# Color codes for output formatting
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

# Path to the checklist file
CHECKLIST_FILE="../docs/GITHUB_FEATURES_CHECKLIST.md"

# Check if the checklist file exists
if [ ! -f "$CHECKLIST_FILE" ]; then
  echo -e "${YELLOW}Error: Checklist file not found at $CHECKLIST_FILE${NC}"
  echo -e "${YELLOW}Make sure you're running this script from the scripts directory.${NC}"
  exit 1
fi

echo -e "\n${GREEN}Updating GitHub Features Checklist...${NC}"

# Update branch protection items in the checklist
sed -i '' \
  -e 's/- \[ \] Branch protection rules configured/- \[x\] Branch protection rules configured/g' \
  -e 's/  - \[ \] Main branch protected/  - \[x\] Main branch protected/g' \
  -e 's/    - \[ \] Require pull request reviews/    - \[x\] Require pull request reviews/g' \
  -e 's/    - \[ \] Require status checks to pass/    - \[x\] Require status checks to pass/g' \
  -e 's/    - \[ \] Require conversation resolution/    - \[x\] Require conversation resolution/g' \
  -e 's/  - \[ \] Develop branch protected/  - \[x\] Develop branch protected/g' \
  -e 's/    - \[ \] Require pull request reviews/    - \[x\] Require pull request reviews/g' \
  -e 's/    - \[ \] Require status checks to pass/    - \[x\] Require status checks to pass/g' \
  "$CHECKLIST_FILE"

echo -e "${GREEN}Checklist updated successfully!${NC}"
echo -e "${YELLOW}Please verify the changes in $CHECKLIST_FILE${NC}\n"