#!/bin/bash

# Script to set up branch protection rules for Site Generator project
# This script uses GitHub REST API to configure branch protection rules

# Color codes for output formatting
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

# Function to display usage information
usage() {
  echo -e "\nUsage: $0 -r REPO_OWNER/REPO_NAME -t TOKEN\n"
  echo -e "Options:"
  echo -e "  -r REPO       Repository in format 'owner/repo'"
  echo -e "  -t TOKEN      GitHub personal access token with 'repo' scope"
  echo -e "  -h            Display this help message\n"
  exit 1
}

# Parse command line arguments
while getopts ":r:t:h" opt; do
  case ${opt} in
    r )
      REPO=$OPTARG
      ;;
    t )
      TOKEN=$OPTARG
      ;;
    h )
      usage
      ;;
    \? )
      echo -e "${RED}Invalid option: -$OPTARG${NC}" 1>&2
      usage
      ;;
    : )
      echo -e "${RED}Option -$OPTARG requires an argument.${NC}" 1>&2
      usage
      ;;
  esac
done

# Check if required arguments are provided
if [ -z "$REPO" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}Error: Repository and token are required.${NC}"
  usage
fi

# Extract owner and repo name
IFS='/' read -r OWNER REPO_NAME <<< "$REPO"
if [ -z "$OWNER" ] || [ -z "$REPO_NAME" ]; then
  echo -e "${RED}Error: Repository must be in format 'owner/repo'.${NC}"
  usage
fi

echo -e "\n${GREEN}Setting up branch protection rules for $OWNER/$REPO_NAME...${NC}\n"

# Function to set up branch protection rules
setup_branch_protection() {
  local branch=$1
  local require_code_owner_reviews=$2
  local required_approving_review_count=$3
  local dismiss_stale_reviews=$4
  local require_lint=$5
  
  echo -e "${YELLOW}Setting up protection for $branch branch...${NC}"
  
  # Prepare the JSON payload for branch protection
  local payload='{'
  payload+='"required_status_checks": {'
  payload+='"strict": true,'
  payload+='"contexts": ["build", "test"'
  
  # Add lint check for main branch
  if [ "$require_lint" = true ]; then
    payload+=', "lint"'
  fi
  
  payload+=']},'
  payload+='"enforce_admins": true,'
  payload+='"required_pull_request_reviews": {'
  payload+='"dismissal_restrictions": {},'
  payload+='"dismiss_stale_reviews": '$dismiss_stale_reviews','
  payload+='"require_code_owner_reviews": '$require_code_owner_reviews','
  payload+='"required_approving_review_count": '$required_approving_review_count'
  payload+='},'
  payload+='"restrictions": null,'
  payload+='"required_conversation_resolution": true'
  payload+='}'
  
  # Make API request to set branch protection
  response=$(curl -s -X PUT \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/$OWNER/$REPO_NAME/branches/$branch/protection" \
    -d "$payload")
  
  # Check if the request was successful
  if [[ "$response" == *""required_status_checks""* ]]; then
    echo -e "${GREEN}✓ Branch protection for $branch has been set up successfully!${NC}"
  else
    echo -e "${RED}✗ Failed to set up branch protection for $branch.${NC}"
    echo -e "${RED}Response: $response${NC}"
  fi
}

# Set up protection for main branch (stricter rules)
setup_branch_protection "main" true 1 true true

# Set up protection for develop branch (less strict rules)
setup_branch_protection "develop" false 1 false false

echo -e "\n${GREEN}Branch protection setup completed!${NC}"
echo -e "${YELLOW}Please verify the settings in your GitHub repository:${NC}"
echo -e "https://github.com/$OWNER/$REPO_NAME/settings/branches\n"

echo -e "${YELLOW}Don't forget to update your GitHub Features Checklist!${NC}\n"