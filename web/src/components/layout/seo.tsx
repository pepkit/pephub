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
  const pageImage = image || 'https://github.com/pepkit/pephub/assets/41063083/d195244b-bc2c-4c17-9e4c-87e7e867bb9c';
  const pageUrl = 'https://pephub.databio.org/';
  const pageType = 'website';
  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:type" content={pageType} />
      <meta property="og:url" content={pageUrl} />
    </Helmet>
  );
};
