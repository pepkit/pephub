import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';

export const ProjectPage: FC = () => {
  const { namespace, project } = useParams();
  return (
    <PageLayout title={`${namespace}/${project}`}>
      <h1>Project Page</h1>
      <p>Namespace: {namespace}</p>
      <p>Project: {project}</p>
    </PageLayout>
  );
};
