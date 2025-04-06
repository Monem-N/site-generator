# GitHub Repository Features Checklist

Use this checklist to ensure all GitHub repository features are properly configured for the Site Generator project.

## GitHub Actions

- [x] CI workflow (`ci.yml`) is set up

  - Runs on push to main/develop branches and pull requests
  - Includes linting, building, and testing with coverage
  - Uploads coverage to Codecov

- [x] Publish workflow (`publish.yml`) is set up

  - Triggers when a new release is created
  - Publishes package to npm registry

- [ ] Workflow secrets are configured
  - [ ] `NPM_TOKEN` for publishing to npm
  - [ ] `CODECOV_TOKEN` for coverage reporting

## Repository Settings

- [x] Features enabled

  - [x] Issues
  - [x] Pull requests
  - [x] Discussions
  - [x] Projects
  - [x] Wiki (if needed)

- [x] Pull request settings configured

  - [x] Allow merge commits
  - [x] Allow squash merging
  - [x] Allow rebase merging
  - [x] Automatically delete head branches

- [ ] Branch protection rules configured

  - [ ] Main branch protected
    - [ ] Require pull request reviews
    - [ ] Require status checks to pass
    - [ ] Require conversation resolution
  - [ ] Develop branch protected
    - [ ] Require pull request reviews
    - [ ] Require status checks to pass

- [ ] Tags and releases set up

  - [ ] Initial release created (v1.0.0 or appropriate version)
  - [ ] Release notes added based on CHANGELOG.md

- [ ] Collaborators added with appropriate permissions

## Issue Labels

- [x] Standard labels created

  - [x] bug (#d73a4a)
  - [x] enhancement (#a2eeef)
  - [x] documentation (#0075ca)
  - [x] good first issue (#7057ff)
  - [x] help wanted (#008672)
  - [x] question (#d876e3)
  - [x] wontfix (#ffffff)

- [x] Priority labels created

  - [x] priority:high (#ff0000)
  - [x] priority:medium (#ffff00)
  - [x] priority:low (#00ff00)

- [x] Component labels created
  - [x] component:parser (#fbca04)
  - [x] component:generator (#fbca04)
  - [x] component:plugins (#fbca04)
  - [x] component:themes (#fbca04)
  - [x] component:navigation (#fbca04)

## Project Boards

- [x] "Site Generator Development" project board created

  - [x] To Do column
  - [x] In Progress column
  - [x] Review column
  - [x] Done column

- [ ] Initial issues created and added to project board

## Additional Features

- [ ] GitHub Pages set up for documentation

  - [ ] Source branch and folder configured
  - [ ] Documentation site accessible

- [ ] GitHub Discussions enabled

  - [ ] Discussion categories created
    - [ ] Announcements
    - [ ] Ideas
    - [ ] Q&A
    - [ ] Show and Tell

- [x] Dependabot alerts enabled
  - [x] Dependabot security updates enabled

## Next Steps

Refer to the detailed [GitHub Repository Setup Guide](./GITHUB_SETUP.md) for step-by-step instructions on how to complete each item in this checklist.
