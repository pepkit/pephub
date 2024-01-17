import { MDXProvider } from '@mdx-js/react';

import AboutContent from './about.mdx';

export const About = () => {
  return (
    <MDXProvider>
      <AboutContent />
    </MDXProvider>
  );
};
