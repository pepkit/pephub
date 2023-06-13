import { motion } from 'framer-motion';
import React, { FC } from 'react';

import { PageLayout } from '../components/layout/page-layout';
import { useSession } from '../hooks/useSession';

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
  return (
    <PageLayout>
      <div className="container" style={{ height: '80vh' }}>
        <div className="d-flex flex-column h-100 align-items-center justify-content-center">
          <div className="row align-items-center">
            <div className="col-6">
              <h1 className="fw-bolder">Easy management of sample metadata.</h1>
              <p>
                PEPhub is a database, web interface, and API for sharing, retrieving, and validating sample metadata.
                PEPhub takes advantage of the Portable Encapsulated Projects (PEP) biological metadata standard to let
                you store, edit, and access your PEPs in one convenient place.
              </p>
              <p>To get started submitting your own sample metadata, you only need a GitHub account.</p>
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
                  <i className="bi bi-github"></i> Login with GitHub
                </MotionButton>
              )}
              <a href="/validate">
                <MotionButton className="btn btn-outline-dark btn-lg me-3">
                  <i className="bi bi-check2-circle me-1"></i>Validation
                </MotionButton>
              </a>
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
