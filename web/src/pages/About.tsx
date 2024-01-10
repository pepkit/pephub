import { MDXProvider } from '@mdx-js/react';
import * as Prism from 'prismjs';

import AboutContent from './about.mdx';

Prism.highlightAll();

export const About = () => {
  return (
    <MDXProvider>
      <AboutContent />
    </MDXProvider>
  );
};
