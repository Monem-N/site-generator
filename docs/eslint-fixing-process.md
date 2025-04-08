# ESLint Fixing Process

This document outlines the process for fixing the 19,035 ESLint issues in the codebase.

## Overview of Issues

The main categories of issues are:

1. **Prettier formatting issues** (8,178 errors)
2. **Type safety issues**:
   - `@typescript-eslint/no-explicit-any` (187 errors)
   - `@typescript-eslint/no-unused-vars` (85 errors)
3. **Module system issues**:
   - `@typescript-eslint/no-var-requires` (119 errors)
4. **Logic and runtime errors**:
   - `no-fallthrough` (69 errors)
   - `no-console` (64 errors)
   - `no-sparse-arrays` (23 errors)
   - `no-redeclare` (18 errors)

## Analysis and Prioritization

Before starting the fixing process, run the analysis script to identify the most problematic areas:

```bash
python analyze_eslint.py
```

This script analyzes the ESLint report and organizes issues by directory and file, helping you prioritize which areas to fix first. The analysis shows:

1. Directories with the most issues (e.g., `utils`, `plugins`, `src`)
2. Specific files with high error counts (e.g., `cache.js`, `dependency-graph.js`, `SiteMapGenerator.js`)
3. Distribution of error types across the codebase

Use this information to decide which directories to target first with the `fix-directory.sh` script.

## Phased Approach

We've created a phased approach to tackle these issues:

### Phase 1: Automatic Fixes

Run the following scripts to automatically fix formatting and other auto-fixable issues:

```bash
./scripts/fix-prettier.sh
./scripts/fix-eslint-auto.sh
```

### Phase 2: Type Safety Improvements

Run the following script to automatically fix common type safety issues:

```bash
node --experimental-modules ./scripts/fix-type-safety-issues.js
```

This script will:

1. Replace `any` types with `unknown` where appropriate
2. Prefix unused variables with underscore

For remaining issues, manually fix them by:

1. Using more specific types instead of `unknown`
2. Removing truly unused variables

### Phase 3: Module System Improvements

Run the following script to automatically fix module system issues:

```bash
node --experimental-modules ./scripts/fix-module-system-issues.js
```

This script will:

1. Replace `require()` statements with import statements
2. Convert dynamic requires to dynamic imports
3. Add .js extensions to local module imports

For complex cases, manually fix the remaining issues by:

1. Restructuring code to use ES modules properly
2. Adding ESLint disable comments where necessary

### Phase 4: Logic and Runtime Errors

Run the following script to automatically fix logic and runtime errors:

```bash
node --experimental-modules ./scripts/fix-logic-errors-issues.js
```

This script will:

1. Add `// fallthrough` comments to switch cases without break statements
2. Replace `console.log` with `logger.debug` and other console methods with appropriate logger methods
3. Fix simple sparse arrays
4. Identify variable redeclarations for manual fixing

For complex cases, manually fix the remaining issues by:

1. Adding break statements where appropriate
2. Removing unnecessary console statements
3. Fixing complex sparse arrays
4. Renaming redeclared variables

## Running All Scripts

You can run all scripts in sequence with:

```bash
./scripts/fix-all-eslint.sh
```

## Fixing a Specific Directory

Based on the analysis results, fix issues in specific directories in order of priority:

```bash
./scripts/fix-directory.sh src/utils    # Highest number of issues
./scripts/fix-directory.sh src/plugins  # Second highest
./scripts/fix-directory.sh src/parsers  # And so on...
```

This will run all the fix scripts on just the specified directory. Focus on directories with the most issues first, then move to less problematic areas.

## Tracking Progress

After fixing issues in a directory, run the analysis script again to see your progress:

```bash
python analyze_eslint.py
```

This will show you how many issues remain and which areas still need attention.

## Commit Strategy

After fixing issues, commit changes in logical groups:

1. Formatting fixes
2. Type safety improvements
3. Module system improvements
4. Logic and runtime error fixes
5. Directory-specific fixes (e.g., "Fix ESLint issues in utils directory")

This will make the changes easier to review and understand. Include before/after issue counts in your commit messages to track progress.

## Ongoing Maintenance

To prevent these issues from recurring:

1. Configure your IDE to run ESLint and Prettier on save
2. Add pre-commit hooks to run ESLint and Prettier
3. Add ESLint and Prettier to your CI/CD pipeline
4. Regularly run the fix scripts to catch new issues
