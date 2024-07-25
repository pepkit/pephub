import { motion } from 'framer-motion';
import React from 'react';
import { Col, Nav, Row, Tab } from 'react-bootstrap';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

import { LandingPaths } from '../components/layout/landing-paths';
import { PageLayout } from '../components/layout/page-layout';
import { LandingInfoPlaceholder } from '../components/placeholders/landing-leaderboard';
import { SampleTable } from '../components/tables/sample-table';
import { GenericTooltip } from '../components/tooltips/generic-tooltip';
import { useSession } from '../contexts/session-context';
import { useBiggestNamespace } from '../hooks/queries/useBiggestNamespace';
import { useSampleTable } from '../hooks/queries/useSampleTable';
import { CODE_SNIPPETS, PEPHUBCLIENT_SNIPPETS } from '../utils/const';
import { numberWithCommas } from '../utils/etc';
import { sampleListToArrays } from '../utils/sample-table';

type MotionButtonProps = {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
};

const MotionButton = ({ children, className, onClick }: MotionButtonProps) => (
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

  const [firstCopied, setFirstCopied] = React.useState(false);
  const [secondCopied, setSecondCopied] = React.useState(false);

  return (
    <PageLayout>
      <div className="mt-2">
        <div className="d-flex flex-column h80 align-items-center justify-content-center">
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
                    <SampleTable minRows={9} data={sampleListToArrays(exampleSamples?.items || [])} />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="my-5 w-100">
          <Row className="w-100 align-items-center mb-5 h40">
            <Col sm={6} md={6}>
              <h2 className="fw-bold">Web server and API</h2>
              <p className="text-balance pe-4">
                The PEPhub web server and API are designed to provide a user-friendly interface for exploring and
                working with biologically ortiented sample metadata. The web server allows users to search for metadata,
                view detailed information about these metadata, and create new metadata.
              </p>
            </Col>
            <Col sm={6} md={6} className="d-flex flex-column align-items-center justify-content-center h-100">
              <div className="border border-2 border-dark p-2 rounded w-100 position-relative landing-code-snippet-container shadow">
                <Tab.Container id="code-snippets" defaultActiveKey={CODE_SNIPPETS[0].language}>
                  <div className="d-flex flex-row align-items-center text-sm">
                    <Nav variant="pills" className="flex-row">
                      {CODE_SNIPPETS.map((snippet) => (
                        <Nav.Item key={snippet.language}>
                          <Nav.Link className="py-1 px-2 mx-1" eventKey={snippet.language}>
                            {snippet.language}
                          </Nav.Link>
                        </Nav.Item>
                      ))}
                    </Nav>
                  </div>
                  <Tab.Content className="w-100 h-100 code-snippet-container">
                    {CODE_SNIPPETS.map((snippet) => (
                      <Tab.Pane key={snippet.language} eventKey={snippet.language}>
                        {/* @ts-ignore not sure why rehypeHighlight is causing a type error */}
                        <Markdown className="h-100 mt-3" rehypePlugins={[rehypeHighlight]}>
                          {snippet.code}
                        </Markdown>
                        <div className="position-absolute top-0 end-0 me-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(snippet.raw);
                              setFirstCopied(true);
                              setTimeout(() => {
                                setFirstCopied(false);
                              }, 2000);
                            }}
                            className="btn btn-outline-dark btn-sm mt-2"
                          >
                            {firstCopied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </Tab.Pane>
                    ))}
                  </Tab.Content>
                </Tab.Container>
              </div>
            </Col>
          </Row>
          <div className="p-5"></div>
          {/* <div className="p-5"></div> */}
          <Row className="w-100 align-items-center">
            <Col sm={6} md={6}>
              <h2 className="fw-bold">PEPhub client </h2>
              <p className="text-balance pe-4">
                PEPhub provides a Python an R client for interacting with the PEPhub API. The client allows users to
                download and work with project metadata programmatically, without the need to interact with the native
                API. <code>peppy</code> is available on PyPI with other useful tools for genomic metadata manipulation.
                Peppy:{' '}
                <a href="https://pypi.org/project/peppy/" className="bi bi-box-fill">
                  {' '}
                  PyPI peppy
                </a>
                .
              </p>
            </Col>
            <Col sm={6} md={6} className="d-flex flex-column align-items-center justify-content-center h-100">
              <div className="border border-2 border-dark p-2 rounded w-100 position-relative landing-code-snippet-container shadow">
                <Tab.Container id="code-snippets" defaultActiveKey={CODE_SNIPPETS[0].language}>
                  <div className="d-flex flex-row align-items-center text-sm">
                    <Nav variant="pills" className="flex-row">
                      {PEPHUBCLIENT_SNIPPETS.map((snippet) => (
                        <Nav.Item key={snippet.language}>
                          <Nav.Link className="py-1 px-2 mx-1" eventKey={snippet.language}>
                            {snippet.language}
                          </Nav.Link>
                        </Nav.Item>
                      ))}
                    </Nav>
                  </div>
                  <Tab.Content className="w-100 h-100 code-snippet-container">
                    {PEPHUBCLIENT_SNIPPETS.map((snippet) => (
                      <Tab.Pane key={snippet.language} eventKey={snippet.language}>
                        {/* @ts-ignore not sure why rehypeHighlight is causing a type error */}
                        <Markdown className="h-100 mt-3" rehypePlugins={[rehypeHighlight]}>
                          {snippet.code}
                        </Markdown>
                        <div className="position-absolute top-0 end-0 me-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(snippet.raw);
                              setSecondCopied(true);
                              setTimeout(() => {
                                setSecondCopied(false);
                              }, 2000);
                            }}
                            className="btn btn-outline-dark btn-sm mt-2"
                          >
                            {secondCopied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </Tab.Pane>
                    ))}
                  </Tab.Content>
                </Tab.Container>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </PageLayout>
  );
}

export default Home;
