import { MDXProvider } from '@mdx-js/react';

import AboutContent from './About.mdx';

export const About = () => {
  return (
    <MDXProvider>
      <AboutContent />
    </MDXProvider>
  );
};
