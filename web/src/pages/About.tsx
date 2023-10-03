import React, { FC, useState } from 'react';


import { PageLayout } from '../components/layout/page-layout';


function About() {

  return (
    <PageLayout fullWidth>
      <div className="mx-5" style={{ height: '80vh' }}>
        <div className="d-flex flex-column align-items-center justify-content-center">
          <div className="row align-items-center mt-2">
            <h1 className="fw-bolder">Coming soon.</h1>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default About;
