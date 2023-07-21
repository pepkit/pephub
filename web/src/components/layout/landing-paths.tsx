import { motion } from 'framer-motion';
import { FC, Fragment } from 'react';

const API_HOST = import.meta.env.VITE_API_HOST || '';

export const LandingPaths: FC = () => {
  return (
    <Fragment>
      <motion.svg
        // fade in after 0.5 seconds
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="position-absolute top-50 end-0 landing-paths"
        viewBox={`-200 0 800 800`}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          zIndex: -1,
        }}
      >
        <path
          className="landing-path-glow"
          d="M300,10 Q275,10 275,35 L275,615 Q275,640 300,640"
          stroke="#3b82f6"
          stroke-width="3"
          fill="none"
        />
        <path
          className="landing-path-glow"
          d="M100,10 Q125,10 125,35 L125,615 Q125,640 100,640"
          stroke="#3b82f6"
          stroke-width="3"
          fill="none"
        />
        <line
          className="landing-path-glow"
          y1="10"
          x1="300"
          y2="10"
          x2="400"
          stroke="#3b82f6"
          stroke-width="3"
          fill="none"
        />
        <line
          className="landing-path-glow"
          y1="640"
          x1="300"
          y2="640"
          x2="400"
          stroke="#3b82f6"
          stroke-width="3"
          fill="none"
        />
        <line
          className="landing-path-glow"
          y1="10"
          x1="100"
          y2="10"
          x2="0"
          stroke="#3b82f6"
          stroke-width="3"
          fill="none"
        />
        <line
          className="landing-path-glow"
          y1="640"
          x1="100"
          y2="640"
          x2="0"
          stroke="#3b82f6"
          stroke-width="3"
          fill="none"
        />
      </motion.svg>
      <motion.div
        // fade in after 0.5 seconds
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <a href={'/databio/example'}>
          <motion.div
            className="bottom-right-landing-icon fw-bold text-primary bg-gradient rounded shadow border bg-white border-primary cursor-pointer d-flex flex-row align-items-center justify-content-center"
            // "sink in" on hover
            whileHover={{ scale: 1.05 }}
          >
            <i className="bi bi-eye-fill me-1"></i>
            View PEP
          </motion.div>
        </a>
        <a href="databio/example?fork=true">
          <motion.div
            className="top-right-landing-icon fw-bold text-primary bg-gradient rounded shadow border bg-white border-primary cursor-pointer d-flex flex-row align-items-center justify-content-center"
            // "sink in" on hover
            whileHover={{ scale: 1.05 }}
          >
            <img src="/github-branch-primary.svg" height="20px" className="me-1" />
            Fork PEP
          </motion.div>
        </a>
        <a href={'/validate?pepRegistryPath=databio/example'}>
          <motion.div
            className="bottom-left-landing-icon fw-bold text-primary bg-gradient rounded shadow border bg-white border-primary cursor-pointer d-flex flex-row align-items-center justify-content-center"
            // "sink in" on hover
            whileHover={{ scale: 1.05 }}
            style={{}}
          >
            <i className="bi bi-check2-circle me-1"></i>
            Validate PEP
          </motion.div>
        </a>
        <a href={`${API_HOST}/api/v1/projects/databio/example`}>
          <motion.div
            className="top-left-landing-icon fw-bold text-primary bg-gradient rounded shadow border bg-white border-primary cursor-pointer d-flex flex-row align-items-center justify-content-center"
            // "sink in" on hover
            whileHover={{ scale: 1.05 }}
          >
            <i className="bi bi-download me-1"></i>
            Get JSON
          </motion.div>
        </a>
      </motion.div>
    </Fragment>
  );
};
