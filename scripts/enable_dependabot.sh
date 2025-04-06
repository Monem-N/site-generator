#!/bin/bash

# Script to enable Dependabot alerts and security updates for a GitHub repository
# Usage: ./enable_dependabot.sh -t YOUR_GITHUB_TOKEN -r OWNER/REPO

# Parse command line arguments
while getopts t:r: flag
do
    case "${flag}" in
        t) TOKEN=${OPTARG};;
        r) REPO=${OPTARG};;
    esac
done

# Check if token and repo are provided
if [ -z "$TOKEN" ] || [ -z "$REPO" ]; then
    echo "Usage: ./enable_dependabot.sh -t YOUR_GITHUB_TOKEN -r OWNER/REPO"
    exit 1
fi

# Extract owner and repo name
OWNER=$(echo $REPO | cut -d '/' -f 1)
REPO_NAME=$(echo $REPO | cut -d '/' -f 2)

echo "Enabling Dependabot features for repository: $REPO"

# Enable Dependabot alerts
echo "Enabling Dependabot alerts..."
curl -X PUT \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/vulnerability-alerts"

# Enable Dependabot security updates
echo "Enabling Dependabot security updates..."
curl -X PUT \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/automated-security-fixes"

# Check if dependabot.yml exists in the repository
echo "Checking for existing dependabot.yml file..."
DEPENDABOT_EXISTS=$(curl -s -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO/contents/.github/dependabot.yml" | grep -c "name")

if [ "$DEPENDABOT_EXISTS" -eq 1 ]; then
    echo "Dependabot configuration file already exists."
else
    echo "Creating dependabot.yml file..."
    
    # Create dependabot.yml file if it doesn't exist
    # First, check if .github directory exists
    GITHUB_DIR_EXISTS=$(curl -s -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/$REPO/contents/.github" | grep -c "name")
    
    if [ "$GITHUB_DIR_EXISTS" -eq 0 ]; then
        echo "Creating .github directory..."
        # Create an empty file to create the directory
        curl -X PUT \
          -H "Authorization: token $TOKEN" \
          -H "Accept: application/vnd.github.v3+json" \
          "https://api.github.com/repos/$REPO/contents/.github/.gitkeep" \
          -d '{
            "message": "Create .github directory for Dependabot configuration",
            "content": "'"$(echo -n "" | base64)"'"
          }'
    fi
    
    # Now create the dependabot.yml file
    DEPENDABOT_CONTENT=$(cat <<EOF
version: 2
updates:
  # Enable version updates for npm
  - package-ecosystem: "npm"
    # Look for package.json and package-lock.json files in the root directory
    directory: "/"
    # Check for updates once a week (on Monday)
    schedule:
      interval: "weekly"
      day: "monday"
    # Specify labels for pull requests
    labels:
      - "dependencies"
      - "enhancement"
    # Allow up to 10 open pull requests at a time
    open-pull-requests-limit: 10
    # Configure version update behavior
    versioning-strategy: auto
    # Group all dev dependencies together
    groups:
      dev-dependencies:
        patterns:
          - "*"
        update-types:
          - "minor"
          - "patch"
EOF
)
    
    # Encode content to base64
    ENCODED_CONTENT=$(echo -n "$DEPENDABOT_CONTENT" | base64)
    
    # Create the file
    curl -X PUT \
      -H "Authorization: token $TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/$REPO/contents/.github/dependabot.yml" \
      -d '{
        "message": "Add Dependabot configuration",
        "content": "'"$ENCODED_CONTENT"'"
      }'
fi

echo "Dependabot alerts and security updates have been enabled successfully!"
echo "Dependabot will now scan your repository for vulnerabilities and create pull requests for security updates."
