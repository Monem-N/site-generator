#!/bin/bash

# Script to create standard and priority labels for GitHub repository
# Usage: ./create_labels.sh -t YOUR_GITHUB_TOKEN -r OWNER/REPO

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
    echo "Usage: ./create_labels.sh -t YOUR_GITHUB_TOKEN -r OWNER/REPO"
    exit 1
fi

echo "Creating labels for repository: $REPO"

# Function to create a label
create_label() {
    local name=$1
    local color=$2
    local description=$3
    
    echo "Creating label: $name"
    
    # Check if label already exists
    label_check=$(curl -s -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/$REPO/labels/$name" | grep -c "\"name\": \"$name\"")
    
    if [ "$label_check" -eq 1 ]; then
        echo "Label '$name' already exists. Updating it..."
        curl -s -X PATCH -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/$REPO/labels/$name" \
            -d "{\"name\":\"$name\",\"color\":\"$color\",\"description\":\"$description\"}" > /dev/null
    else
        echo "Creating new label '$name'..."
        curl -s -X POST -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/$REPO/labels" \
            -d "{\"name\":\"$name\",\"color\":\"$color\",\"description\":\"$description\"}" > /dev/null
    fi
    
    echo "Done with label: $name"
}

# Create standard labels
echo "Creating standard labels..."
create_label "bug" "d73a4a" "Something isn't working correctly"
create_label "enhancement" "a2eeef" "New feature or request"
create_label "documentation" "0075ca" "Improvements or additions to documentation"
create_label "good first issue" "7057ff" "Good for newcomers to the project"
create_label "help wanted" "008672" "Extra attention is needed"
create_label "question" "d876e3" "Further information is requested"
create_label "wontfix" "ffffff" "This will not be worked on"

# Create priority labels
echo "Creating priority labels..."
create_label "priority:high" "ff0000" "Critical issues that need immediate attention"
create_label "priority:medium" "ffff00" "Important issues to be addressed soon"
create_label "priority:low" "00ff00" "Issues that can be addressed later"

# Create component labels
echo "Creating component labels..."
create_label "component:parser" "fbca04" "Related to the documentation parser"
create_label "component:generator" "fbca04" "Related to the component generator"
create_label "component:plugins" "fbca04" "Related to the plugin system"
create_label "component:themes" "fbca04" "Related to themes"
create_label "component:navigation" "fbca04" "Related to navigation generation"

echo "All labels have been created successfully!"
