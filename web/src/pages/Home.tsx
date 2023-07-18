import { motion } from 'framer-motion';
import React, { FC, useState } from 'react';

import { PageLayout } from '../components/layout/page-layout';
import { LandingInfoPlaceholder } from '../components/placeholders/landing-leaderboard';
import { GenericTooltip } from '../components/tooltips/generic-tooltip';
import { useBiggestNamespace } from '../hooks/queries/useBiggestNamespace';
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

function Home() {
  const { user, login } = useSession();
  const limit = 3;
  const { data: largestNamespaces } = useBiggestNamespace(limit);

  type ArrayOfNumbersOrNull = (number | null)[];

  const [xAnimation, setXAnimation] = useState<ArrayOfNumbersOrNull>([null, 8, 0]);

  // stop pulsing after 6 seconds
  setTimeout(() => {
    setXAnimation([0]);
  }, 6000);

  return (
    <PageLayout>
      <div className="container" style={{ height: '80vh' }}>
        <div className="d-flex flex-column h-100 align-items-center justify-content-center">
          <div className="row align-items-center">
            <div className="col-6">
              <h1 className="fw-bolder">Manage your sample metadata.</h1>
              <p>
                PEPhub is a database, web interface, and API for sharing, retrieving, and validating sample metadata.
                PEPhub takes advantage of the Portable Encapsulated Projects (PEP) biological metadata standard to
                store, edit, and access your PEPs in one place.
              </p>
              <br />
              <p>Log in with your GitHub account to get started.</p>
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
                <MotionButton className="btn btn-dark btn-lg me-3" onClick={() => login()}>
                  <i className="bi bi-github"></i> Log in with GitHub
                </MotionButton>
              )}
              <a href="/validate">
                <MotionButton className="btn btn-outline-dark btn-lg me-3">
                  <i className="bi bi-check2-circle me-1"></i>Validation
                </MotionButton>
              </a>
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
            <div className="col-6 align-items-center">
              <img className="ms-5" src="/landing_icon.svg" alt="Landing icon" height="500" />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default Home;
