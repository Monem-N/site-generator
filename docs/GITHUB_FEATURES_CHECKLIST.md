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

- [ ] Features enabled

  - [ ] Issues
  - [ ] Pull requests
  - [ ] Discussions
  - [ ] Projects
  - [ ] Wiki (if needed)

- [ ] Pull request settings configured

  - [ ] Allow merge commits
  - [ ] Allow squash merging
  - [ ] Allow rebase merging
  - [ ] Automatically delete head branches

# <<<<<<< Updated upstream

- [ ] Branch protection rules configured

  - [ ] Main branch protected
    - [ ] Require pull request reviews
    - [ ] Require status checks to pass
    - [ ] Require conversation resolution
  - [ ] Develop branch protected
    - [ ] Require pull request reviews
    - [ ] Require status checks to pass

> > > > > > > Stashed changes

- [ ] Tags and releases set up

  - [ ] Initial release created (v1.0.0 or appropriate version)
  - [ ] Release notes added based on CHANGELOG.md

- [ ] Collaborators added with appropriate permissions

## Issue Labels

- [ ] Standard labels created

  - [ ] bug (#d73a4a)
  - [ ] enhancement (#a2eeef)
  - [ ] documentation (#0075ca)
  - [ ] good first issue (#7057ff)
  - [ ] help wanted (#008672)
  - [ ] question (#d876e3)
  - [ ] wontfix (#ffffff)

- [ ] Priority labels created

  - [ ] priority:high (#ff0000)
  - [ ] priority:medium (#ffff00)
  - [ ] priority:low (#00ff00)

- [ ] Component labels created
  - [ ] component:parser (#fbca04)
  - [ ] component:generator (#fbca04)
  - [ ] component:plugins (#fbca04)
  - [ ] component:themes (#fbca04)
  - [ ] component:navigation (#fbca04)

## Project Boards

- [ ] "Site Generator Development" project board created

  - [ ] To Do column
  - [ ] In Progress column
  - [ ] Review column
  - [ ] Done column

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

- [ ] Dependabot alerts enabled
  - [ ] Dependabot security updates enabled

## Next Steps

Refer to the detailed [GitHub Repository Setup Guide](./GITHUB_SETUP.md) for step-by-step instructions on how to complete each item in this checklist.
