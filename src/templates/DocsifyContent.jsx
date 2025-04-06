import React from 'react';

export const DocsifyContent = ({ children }) => {
  return (
    <main className="content">
      <section className="markdown-section">
        {children}
      </section>
    </main>
  );
};
