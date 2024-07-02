import { motion } from 'framer-motion';
import React, { FC } from 'react';

import { LandingPaths } from '../components/layout/landing-paths';
import { PageLayout } from '../components/layout/page-layout';
import { LandingInfoPlaceholder } from '../components/placeholders/landing-leaderboard';
import { SampleTable } from '../components/tables/sample-table';
import { GenericTooltip } from '../components/tooltips/generic-tooltip';
import { useBiggestNamespace } from '../hooks/queries/useBiggestNamespace';
import { useSampleTable } from '../hooks/queries/useSampleTable';
import { useSession } from '../hooks/useSession';
import { numberWithCommas } from '../utils/etc';

interface MotionButtonProps {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

const MotionButton: FC<MotionButtonProps> = ({ children, className, onClick }) => (
  <motion.button
    onClick={onClick}
    className={className}
    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.98 }}
  >
    {children}
  </motion.button>
);

export function Home() {
  const { user, login } = useSession();
  const limit = 3;
  const { data: largestNamespaces } = useBiggestNamespace(limit);

  const { data: exampleSamples } = useSampleTable({
    namespace: 'databio',
    project: 'example',
    tag: 'default',
    enabled: true,
  });

  return (
    <PageLayout>
      <div className="h80 mt-2">
        <div className="d-flex flex-column h-100 align-items-center justify-content-center">
          <div className="row align-items-center">
            <div className="col-lg-6 col-sm-12">
              <h1 className="fw-bolder">Manage your sample metadata.</h1>
              <p>
                PEPhub is a database, web interface, and API for sharing, retrieving, and validating sample metadata.
                PEPhub takes advantage of the Portable Encapsulated Projects (PEP) biological metadata standard to
                store, edit, and access your PEPs in one place.
              </p>
              <br />
              <p>Log in with your GitHub account to get started.</p>
              <div className="d-flex flex-row align-items-center flex-wrap">
                {user ? (
                  <a href={`/${user.login}`}>
                    <MotionButton className="btn btn-dark btn-lg me-3">
                      <span className="d-flex flex-row align-items-center">
                        <img className="me-1" src="/pep.svg" height="30px" />
                        My PEPs
                      </span>
                    </MotionButton>
                  </a>
                ) : (
                  <MotionButton className="btn btn btn-dark btn-lg me-3" onClick={() => login()}>
                    <i className="bi bi-github"></i> Log in with GitHub
                  </MotionButton>
                )}
                <a href="/validate">
                  <MotionButton className="btn btn-outline-dark btn-lg me-3">
                    <i className="bi bi-check2-circle me-1"></i>Validation
                  </MotionButton>
                </a>
              </div>
              <h4 className="mt-5">
                Largest namespaces on PEPhub
                <GenericTooltip
                  className="ms-1 text-base"
                  text="Largest namespaces are determined by the total number of PEPs contained within that namespace. Click them to view their PEPs."
                />
              </h4>
              <div>
                {largestNamespaces ? (
                  largestNamespaces.results.map((namespace, index) => {
                    return (
                      <div key={index}>
                        <span className="ms-2">
                          {index + 1}.{' '}
                          <a href={`/${namespace.namespace}`}>
                            {namespace.namespace}: {numberWithCommas(namespace.number_of_projects)}
                          </a>
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <LandingInfoPlaceholder total={3} />
                )}
              </div>
            </div>
            <div className="col-lg-6 col-sm-12 align-items-center">
              <div className="mt-5 ms-5 landing-table-container">
                <div className="position-relative">
                  <div className="mobile-gaurd">
                    <LandingPaths />
                  </div>
                  <motion.div
                    // fade in from below, subtly
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="landing-table shadow"
                  >
                    <SampleTable minRows={9} data={exampleSamples?.items || []} />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default Home;
