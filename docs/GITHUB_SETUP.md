# GitHub Repository Setup Guide

This guide provides instructions for setting up and configuring GitHub repository features for the Site Generator project.

## Table of Contents

- [GitHub Actions](#github-actions)
- [Repository Settings](#repository-settings)
  <<<<<<< Updated upstream
  =======
- [Branch Protection Rules](#branch-protection-rules)
  > > > > > > > Stashed changes
- [Issue Labels](#issue-labels)
- [Project Boards](#project-boards)
- [Additional Features](#additional-features)

## GitHub Actions

The Site Generator project has two GitHub Actions workflows already configured:

- **CI Workflow** (`ci.yml`): Runs on push to main/develop branches and pull requests
- **Publish Workflow** (`publish.yml`): Runs when a new release is created

### Verifying GitHub Actions Setup

1. Navigate to the Actions tab in your GitHub repository
2. You should see your workflow files listed:
   - CI workflow (ci.yml)
   - Publish workflow (publish.yml)
3. If the workflows aren't visible, check that:
   - The files are in the correct location: `.github/workflows/`
   - The YAML syntax is valid

### Manually Triggering a Workflow

To ensure your CI workflow is working properly:

1. Go to the Actions tab
2. Click on the CI workflow in the left sidebar
3. Click the Run workflow dropdown button
4. Select the main branch
5. Click the green Run workflow button

### Setting Up Workflow Secrets

For the publish workflow to work, you'll need to add an NPM token:

1. Go to Settings > Secrets and variables > Actions
2. Click New repository secret
3. Name: `NPM_TOKEN`
4. Value: Your NPM access token (create one at npmjs.com if needed)
5. Click Add secret

If you're using Codecov for coverage reporting (as configured in the CI workflow), also add:

1. Name: `CODECOV_TOKEN`
2. Value: Your Codecov token
3. Click Add secret

## Repository Settings

### General Settings

1. Go to Settings > General
2. Under Features, enable:
   - Issues
   - Pull requests
   - Discussions (if you want a forum-like feature)
   - Projects
   - Wiki (if you plan to use it)
3. Under Pull Requests, select:
   - Allow merge commits
   - Allow squash merging
   - Allow rebase merging
4. Under Merge button, check:
   - Automatically delete head branches

### Tags and Releases

To set up tags and releases:

1. Go to the Code tab
2. Click on Releases in the right sidebar
3. Click Create a new release
4. Click Choose a tag and enter v1.0.0 (or appropriate version)
5. Check Create new tag on publish
6. Title: "Initial Release"
7. Description: Add release notes based on your CHANGELOG.md
8. If this is a pre-release, check This is a pre-release
9. Click Publish release

### Collaborators

To add collaborators:

1. Go to Settings > Collaborators
2. Click Add people
3. Enter GitHub usernames or email addresses
4. Select appropriate permission level:
   - Read: Can read and clone the repository
   - Triage: Can also manage issues and pull requests
   - Write: Can also push to the repository
   - Maintain: Can also manage the repository without admin access
   - Admin: Full access including sensitive settings
5. Click Add

# <<<<<<< Updated upstream

## Branch Protection Rules

Branch protection rules help maintain code quality and prevent accidental changes to important branches.

### Setting Up Branch Protection for Main Branch

1. Go to Settings > Branches
2. Under "Branch protection rules", click Add rule
3. In the "Branch name pattern" field, enter `main`
4. Configure these recommended settings:
   - Require a pull request before merging
   - Require approvals (at least 1)
   - Require status checks to pass before merging
   - Select status checks: build, test, lint (from your CI workflow)
   - Require conversation resolution before merging
5. Click Create to save the rule

### Setting Up Branch Protection for Develop Branch

1. Go to Settings > Branches
2. Under "Branch protection rules", click Add rule
3. In the "Branch name pattern" field, enter `develop`
4. Configure these recommended settings:
   - Require a pull request before merging
   - Require approvals (at least 1)
   - Require status checks to pass before merging
   - Select status checks: build, test (from your CI workflow)
5. Click Create to save the rule

For more detailed instructions and additional protection options, see the [Branch Protection Rules Setup Guide](./BRANCH_PROTECTION_RULES.md).

> > > > > > > Stashed changes

## Issue Labels

The repository already has basic issue templates for bug reports and feature requests. To enhance organization with custom labels:

1. Go to Issues tab
2. Click Labels button
3. Click New label to create each of these recommended labels:

| Name                 | Color   | Description                                |
| -------------------- | ------- | ------------------------------------------ |
| bug                  | #d73a4a | Something isn't working                    |
| enhancement          | #a2eeef | New feature or request                     |
| documentation        | #0075ca | Improvements or additions to documentation |
| good first issue     | #7057ff | Good for newcomers                         |
| help wanted          | #008672 | Extra attention is needed                  |
| question             | #d876e3 | Further information is requested           |
| wontfix              | #ffffff | This will not be worked on                 |
| priority:high        | #ff0000 | High priority issues                       |
| priority:medium      | #ffff00 | Medium priority issues                     |
| priority:low         | #00ff00 | Low priority issues                        |
| component:parser     | #fbca04 | Related to the parser component            |
| component:generator  | #fbca04 | Related to the generator component         |
| component:plugins    | #fbca04 | Related to plugins                         |
| component:themes     | #fbca04 | Related to themes                          |
| component:navigation | #fbca04 | Related to navigation                      |

For each label:

1. Enter the name
2. Choose the color (or enter the hex code)
3. Add the description
4. Click Create label

## Project Boards

Project boards help visualize and manage work in progress.

### Creating a Project Board

1. Go to the Projects tab
2. Click New project
3. Select Board as the template
4. Name: "Site Generator Development"
5. Description: "Development tracking for the Site Generator project"
6. Click Create

### Configuring Project Columns

In your new project board, set up these columns:

1. To Do: Issues that are ready to be worked on
2. In Progress: Issues currently being worked on
3. Review: Pull requests waiting for review
4. Done: Completed issues and merged pull requests

For each column:

1. Click + Add column (or edit existing columns)
2. Enter the column name
3. Configure automation if desired (e.g., automatically move issues when they're closed)
4. Click Create column

### Adding Issues to the Project Board

1. Go to the Issues tab
2. Create some initial issues based on your implementation plan
3. For each issue:
   - Add appropriate labels
   - Assign to the project board
   - Place in the appropriate column (usually "To Do")

## Additional Features

### GitHub Pages for Documentation

Set up GitHub Pages to host your project documentation:

1. Go to Settings > Pages
2. Under Source, select the branch (usually main or a dedicated gh-pages branch)
3. Select the folder (usually /docs or /)
4. Click Save

This will create a website at https://[username].github.io/site-generator/

### GitHub Discussions

Enable Discussions for community engagement:

1. Go to Settings > General
2. Under Features, check Discussions
3. Go to the new Discussions tab
4. Click Start a new discussion to create categories like:
   - Announcements
   - Ideas
   - Q&A
   - Show and Tell

### Dependabot Alerts

Enable Dependabot to automatically check for dependency vulnerabilities:

1. Go to Settings > Security & analysis
2. Enable Dependabot alerts
3. Enable Dependabot security updates to automatically create PRs for vulnerable dependencies

## Conclusion

By following this guide, you'll have a well-configured GitHub repository with proper workflows, settings, issue management, and additional features that enhance collaboration and project management for your Site Generator project.
