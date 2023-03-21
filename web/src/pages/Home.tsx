import { useState } from 'react';
import { PageLayout } from '../components/layout/page-layout';

function Home() {
  const [namespace, setNamespace] = useState<string>('');
  return (
    <PageLayout>
      <div className="h-100">
        Welcome to PEPhub. This is a demo react app. Please try to navigate to an example namespace page.
      </div>
    </PageLayout>
  );
}

export default Home;
