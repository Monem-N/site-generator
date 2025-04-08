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

To fix issues in a specific directory, use:

```bash
./scripts/fix-directory.sh src/parsers
```

This will run all the fix scripts on just the specified directory.

## Commit Strategy

After fixing issues, commit changes in logical groups:

1. Formatting fixes
2. Type safety improvements
3. Module system improvements
4. Logic and runtime error fixes

This will make the changes easier to review and understand.

## Ongoing Maintenance

To prevent these issues from recurring:

1. Configure your IDE to run ESLint and Prettier on save
2. Add pre-commit hooks to run ESLint and Prettier
3. Add ESLint and Prettier to your CI/CD pipeline
4. Regularly run the fix scripts to catch new issues
