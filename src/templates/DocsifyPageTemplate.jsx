import React from 'react';
import { DocsifyLayout } from './DocsifyLayout';
import { DocsifySidebar } from './DocsifySidebar';
import { DocsifyContent } from './DocsifyContent';

export const DocsifyPageTemplate = ({ content }) => {
  return (
    <DocsifyLayout theme={content.theme} title={content.title}>
      <DocsifySidebar 
        navigation={content.navigation} 
        currentPath={content.metadata?.originalPath}
      />
      <DocsifyContent>
        <div dangerouslySetInnerHTML={{ __html: content.html }} />
      </DocsifyContent>
    </DocsifyLayout>
  );
};
