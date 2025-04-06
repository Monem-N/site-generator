import React from 'react';

export const DocsifyLayout = ({ children, theme, title }) => {
  return (
    <div className="docsify-layout">
      <head>
        <meta charset="UTF-8" />
        <title>{title || 'Documentation'}</title>
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0" />

        {/* Theme stylesheet */}
        <link rel="stylesheet" href={theme.stylesheet} />

        {/* Custom theme CSS */}
        <link rel="stylesheet" href="theme.css" />

        {/* Prism for syntax highlighting */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.css" />

        {/* Mermaid for diagrams */}
        <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      </head>
      <body>
        <div id="app">{children}</div>

        {/* Prism for syntax highlighting */}
        <script src="https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-core.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/prismjs@1/plugins/autoloader/prism-autoloader.min.js"></script>

        {/* Initialize Mermaid */}
        <script>
          {`
            document.addEventListener('DOMContentLoaded', () => {
              mermaid.initialize({ startOnLoad: true });
            });
          `}
        </script>
      </body>
    </div>
  );
};
