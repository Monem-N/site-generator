# Logging Best Practices

This document outlines the best practices for logging in the Site Generator project.

## Using the Logger

The project includes a standardized logging system in `src/utils/logger.ts`. Always use this logger instead of `console.log` statements.

### Importing the Logger

```typescript
import { logger } from './utils/logger';
```

### Log Levels

The logger provides different log levels for different types of messages:

1. **debug**: For detailed information useful during development and debugging

   ```typescript
   logger.debug('Processing file', { filePath: '/path/to/file.md' });
   ```

2. **info**: For general information about the application's operation

   ```typescript
   logger.info('Website generation started');
   ```

3. **warn**: For potentially problematic situations that don't prevent the application from working

   ```typescript
   logger.warn('Template not found, using default', { templateName: 'custom' });
   ```

4. **error**: For errors that prevent a function from working properly
   ```typescript
   logger.error('Failed to read file', { filePath: '/path/to/file.md', error: err.message });
   ```

### Context Data

Always include relevant context data as a second parameter to provide more information:

```typescript
logger.info('Processing file', {
  filePath: '/path/to/file.md',
  size: 1024,
  lastModified: '2023-01-01',
});
```

## Configuration

The logger can be configured in the application:

```typescript
import { logger } from './utils/logger';

logger.configure({
  enabled: true,
  level: 'info', // 'debug', 'info', 'warn', or 'error'
  format: 'text', // 'text' or 'json'
});
```

## When to Use Each Log Level

- **debug**: Use for detailed information that is only useful during development

  - Variable values
  - Function entry/exit
  - Processing steps
  - Performance measurements

- **info**: Use for general operational information

  - Application startup/shutdown
  - Configuration loaded
  - Major processing steps completed
  - User actions

- **warn**: Use for potential issues that don't prevent operation

  - Deprecated features used
  - Non-critical failures
  - Performance issues
  - Fallbacks activated

- **error**: Use for errors that prevent normal operation
  - File system errors
  - Network failures
  - Configuration errors
  - Plugin failures

## Avoiding Common Logging Mistakes

1. **Don't log sensitive information** (passwords, tokens, personal data)
2. **Don't log large objects** without filtering them first
3. **Don't create high-volume logs** in production environments
4. **Don't use string concatenation** for log messages (use template literals)
5. **Don't log in tight loops** without throttling

## Automatic Console Statement Replacement

The project includes a script to automatically replace `console` statements with the appropriate logger methods:

```bash
node --experimental-modules ./scripts/fix-console-statements.js
```

This script:

- Replaces `console.log()` with `logger.debug()`
- Replaces `console.info()` with `logger.info()`
- Replaces `console.warn()` with `logger.warn()`
- Replaces `console.error()` with `logger.error()`
- Adds the logger import if needed

## ESLint Configuration

The ESLint configuration includes a rule to warn about `console` statements:

```json
"no-console": ["warn", { "allow": ["warn", "error"] }]
```

This helps identify places where the logger should be used instead of direct console access.
