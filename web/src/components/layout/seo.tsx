import { FC } from 'react';
import { Helmet } from 'react-helmet-async';

interface Props {
  title?: string;
  description?: string;
  image?: string;
}

export const SEO: FC<Props> = ({ title, description, image }) => {
  const pageTitle = title || 'PEPhub';
  const pageDescription =
    description || 'PEPhub is a web interface, API, and database to store and manage biological metadata.';

  const pageImage = image || '/landing-meta.png';
  return (
    <Helmet>
      {/*  general */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:image" content={pageImage} />
    </Helmet>
  );
};
