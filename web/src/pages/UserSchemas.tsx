import { useParams } from 'react-router-dom';

import { PageLayout } from '../components/layout/page-layout';

export function UserSchemas() {
  let { namespace } = useParams();
  return (
    <PageLayout title="Schemas">
      <div className="p-2">
        <h1>{namespace}</h1>
      </div>
    </PageLayout>
  );
}
