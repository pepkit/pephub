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
  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {image ? <meta name="image" content={image} /> : null}
    </Helmet>
  );
};
