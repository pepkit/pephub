import { PageLayout } from '../components/layout/page-layout';
import { useSession } from '../hooks/useSession';

function Home() {
  const { user } = useSession();
  return (
    <PageLayout>
      <div className="h-100">
        Welcome to PEPhub. This is a demo react app. Please try to navigate to an example namespace page.
      </div>
      <div>
        <pre>
          <code>{JSON.stringify(user, null, 2)}</code>
        </pre>
      </div>
    </PageLayout>
  );
}

export default Home;
