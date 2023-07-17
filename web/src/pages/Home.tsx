import { motion } from 'framer-motion';
import React, { FC, useState } from 'react';

import { PageLayout } from '../components/layout/page-layout';
import { useSession } from '../hooks/useSession';
import { useBiggestNamespace } from '../hooks/queries/useBiggestNamespace';

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
  const { data: test} = useBiggestNamespace(limit);

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
              <div className="mt-3 d-flex flex-row align-items-center fw-bolder">
                <a href="/geo" className="text-decoration-none">
                  View 100,000+ projects from GEO
                </a>
                {/* arrow left */}
                <motion.i
                  // bounce animation on x axis
                  // @ts-ignore - it works and isn't critical to the app
                  animate={{ x: xAnimation }}
                  className="p-0 text-2xl bi bi-arrow-left ms-2"
                  transition={{
                    duration: 1,
                    ease: 'easeInOut',
                    times: [0, 0.2, 0.5, 0.8, 1],
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                />
              </div>
              <span className="text-muted">{test?.limit}</span>
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
