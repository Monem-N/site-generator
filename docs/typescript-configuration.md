# TypeScript Configuration Guide

This document explains the TypeScript configuration for the Site Generator project.

## Overview

The project uses TypeScript to provide type safety and better developer experience. The TypeScript configuration is set up to handle the project's structure, which includes:

- `src/` directory: Contains the source code
- `types/` directory: Contains type definitions

## Configuration Files

### tsconfig.json

The main TypeScript configuration file is `tsconfig.json`. It is set up to:

- Set `rootDir` to `.` to include both `src/` and `types/` directories
- Include proper path mappings to resolve imports correctly
- Include both `src/**/*` and `types/**/*` in the include array

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "lib": ["es2018", "dom"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "*": ["*", "src/*", "types/*"]
    },
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "downlevelIteration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*", "types/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

### Additional Configuration Files

The project includes several additional TypeScript configuration files for different build scenarios:

#### tsconfig.fixed.json

A configuration with stricter settings, used by the `build:fixed` script. This configuration is useful when you want to enforce stricter type checking.

```json
// Key settings in tsconfig.fixed.json
{
  "compilerOptions": {
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### tsconfig.fixed-with-types.json

Similar to tsconfig.fixed.json but specifically configured to handle the types directory. Used by the `build:with-types` script.

```json
// Key settings in tsconfig.fixed-with-types.json
{
  "compilerOptions": {
    "rootDir": ".",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  },
  "include": ["src/**/*", "types/**/*"]
}
```

#### tsconfig.relaxed.json

A configuration with more relaxed type checking, used by the `build:relaxed` script. This is useful when you're working on code that has many type errors that you want to fix incrementally.

```json
// Key settings in tsconfig.relaxed.json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "skipLibCheck": true
  }
}
```

#### tsconfig.super-relaxed.json

A configuration with very relaxed type checking, used by the `build:super-relaxed` script. This is useful for initial development or when dealing with legacy code that has many type issues.

```json
// Key settings in tsconfig.super-relaxed.json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "skipLibCheck": true,
    "noEmitOnError": false
  }
}
```

## Build Scripts

The following build scripts are available:

### Standard Build Scripts

- `npm run build`: Builds the project using the main TypeScript configuration
- `npm run build:clean`: Cleans the dist directory and builds the project

### Specialized Build Scripts

- `npm run build:fixed`: Builds the project using the stricter tsconfig.fixed.json configuration
- `npm run build:with-types`: Builds the project using the tsconfig.fixed-with-types.json configuration that includes the types directory
- `npm run build:relaxed`: Builds the project using the more relaxed tsconfig.relaxed.json configuration
- `npm run build:super-relaxed`: Builds the project using the very relaxed tsconfig.super-relaxed.json configuration

### Type Checking Scripts

- `npm run check:types`: Checks for type errors without generating output

## Using Type Checking

To check for type errors without generating output, run:

```bash
npm run check:types
```

## Troubleshooting

If you encounter TypeScript errors, try the following:

1. Check that your imports are using the correct paths
2. Make sure that all required properties are included in your interfaces
3. Use type assertions (`as any`) for complex objects if necessary
4. Run `npm run fix:types` to add missing members to your types

## Best Practices

1. Always use proper imports (ES6 imports) instead of `require()`
2. Use specific types instead of `any` whenever possible
3. Make sure that all required properties are included in your interfaces
4. Use type assertions only when necessary
5. Run `npm run check:types` before committing your changes
