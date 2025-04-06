# Basic Example

This is a basic example of using the Site Generator.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the generator:
   ```bash
   npx site-generator --source ./docs --output ./dist
   ```

## Features Demonstrated

- Basic Markdown parsing
- Automatic navigation generation
- Theme application
- Mermaid diagram rendering

## Mermaid Diagram Example

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
```

## Cross-Reference Example

Check out the [[features|Features]] page for more information.
