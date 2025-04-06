# Scripts Directory

This directory contains utility scripts for the Site Generator project.

## Available Scripts

### Branch Protection Setup Script

### Overview

The `setup_branch_protection.sh` script automates the process of setting up branch protection rules for your GitHub repository according to the specifications in the [GitHub Features Checklist](../docs/GITHUB_FEATURES_CHECKLIST.md).

### Requirements

- Bash shell environment
- `curl` command-line tool (pre-installed on most systems)
- GitHub Personal Access Token with `repo` scope

### Usage

```bash
./setup_branch_protection.sh -r OWNER/REPO -t TOKEN
```

Where:

- `OWNER/REPO` is your GitHub repository in the format `username/repository`
- `TOKEN` is your GitHub Personal Access Token

### Example

```bash
./setup_branch_protection.sh -r myusername/site-generator -t ghp_1234567890abcdefghijklmnopqrstuvwxyz
```

### What It Does

This script sets up the following branch protection rules:

#### For the `main` branch:

- Requires pull request reviews before merging
- Requires at least 1 approval
- Dismisses stale pull request approvals when new commits are pushed
- Requires review from Code Owners (if CODEOWNERS file exists)
- Requires status checks to pass (build, test, and lint)
- Requires branches to be up to date before merging
- Requires conversation resolution before merging
- Enforces these rules for administrators

#### For the `develop` branch:

- Requires pull request reviews before merging
- Requires at least 1 approval
- Requires status checks to pass (build and test)
- Requires branches to be up to date before merging
- Requires conversation resolution before merging
- Enforces these rules for administrators

### Troubleshooting

If you encounter any issues:

1. Ensure your GitHub token has the correct permissions
2. Verify that the repository exists and you have admin access
3. Check that the branch names (`main` and `develop`) match your repository's branches

### Security Note

Never commit your GitHub token to the repository. Consider using environment variables or a secure method to provide the token to the script.

### Checklist Update Script

#### Overview

The `update_github_checklist.sh` script automatically updates the [GitHub Features Checklist](../docs/GITHUB_FEATURES_CHECKLIST.md) to mark branch protection items as completed after you've set them up.

#### Usage

```bash
./update_github_checklist.sh
```

#### What It Does

This script updates the GitHub Features Checklist by:

- Marking "Branch protection rules configured" as completed
- Marking all main branch protection items as completed
- Marking all develop branch protection items as completed

#### Note

Run this script after successfully setting up branch protection rules with the `setup_branch_protection.sh` script to keep your checklist up to date.
