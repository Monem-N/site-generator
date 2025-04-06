# Branch Protection Rules Setup Guide

This guide provides instructions for setting up branch protection rules in your GitHub repository for the Site Generator project. Branch protection rules help maintain code quality and prevent accidental changes to important branches.

## Table of Contents

- [Overview](#overview)
- [Setting Up Branch Protection for Main Branch](#setting-up-branch-protection-for-main-branch)
- [Setting Up Branch Protection for Develop Branch](#setting-up-branch-protection-for-develop-branch)
- [Additional Protection Options](#additional-protection-options)
- [Verifying Branch Protection Rules](#verifying-branch-protection-rules)

## Overview

Branch protection rules are essential for maintaining code quality and preventing accidental changes to important branches. For the Site Generator project, we recommend setting up protection rules for at least two branches:

- **Main Branch**: This is your production branch and should have the strictest protection rules.
- **Develop Branch**: This is your integration branch for ongoing development and should have moderate protection rules.

## Setting Up Branch Protection for Main Branch

Follow these steps to set up protection rules for your main branch:

1. Go to your repository on GitHub
2. Click on **Settings** in the top navigation bar
3. In the left sidebar, click on **Branches**
4. Under "Branch protection rules", click **Add rule**
5. In the "Branch name pattern" field, enter `main`
6. Configure the following settings:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals (set to at least 1)
     - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ Require review from Code Owners (if you have a CODEOWNERS file)
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - ✅ Search for and select the following status checks:
       - `build` (from your CI workflow)
       - `test` (from your CI workflow)
       - `lint` (from your CI workflow)
   - ✅ **Require conversation resolution before merging**
   - ✅ **Do not allow bypassing the above settings**
7. Click **Create** to save the branch protection rule

## Setting Up Branch Protection for Develop Branch

Follow these steps to set up protection rules for your develop branch:

1. Go to your repository on GitHub
2. Click on **Settings** in the top navigation bar
3. In the left sidebar, click on **Branches**
4. Under "Branch protection rules", click **Add rule**
5. In the "Branch name pattern" field, enter `develop`
6. Configure the following settings:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals (set to at least 1)
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - ✅ Search for and select the following status checks:
       - `build` (from your CI workflow)
       - `test` (from your CI workflow)
   - ✅ **Require conversation resolution before merging**
7. Click **Create** to save the branch protection rule

## Additional Protection Options

Depending on your project's needs, you might want to consider these additional protection options:

### Require Linear History

This prevents merge commits and enforces a linear commit history:

1. In the branch protection rule settings, check **Require linear history**

### Require Signed Commits

This ensures all commits are signed with GPG:

1. In the branch protection rule settings, check **Require signed commits**

### Lock Branch

This prevents force pushes to the branch and prevents it from being deleted:

1. In the branch protection rule settings, check **Lock branch**

### Required Deployments

If you have deployment environments set up:

1. In the branch protection rule settings, under **Require deployments to succeed before merging**, select your environments

## Verifying Branch Protection Rules

To verify that your branch protection rules are working correctly:

1. Try to push directly to the protected branch

   ```bash
   git push origin main
   ```

   You should receive an error message indicating that direct pushes are not allowed.

2. Create a new branch, make changes, and open a pull request

   ```bash
   git checkout -b feature/test-branch-protection
   # Make some changes
   git add .
   git commit -m "Test branch protection"
   git push origin feature/test-branch-protection
   ```

3. In the pull request, verify that:
   - Required status checks are running
   - Merging is blocked until all requirements are met
   - After approval and passing checks, the merge button becomes active

## Conclusion

By setting up branch protection rules, you've added an important safeguard to your repository that helps maintain code quality and prevents accidental changes to critical branches. These rules work in conjunction with your CI workflows to ensure that only properly reviewed and tested code makes it into your main and develop branches.
