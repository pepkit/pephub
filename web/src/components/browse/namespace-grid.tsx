import React, { useRef, useEffect, useCallback } from 'react';

import { BiggestNamespaceResults } from '../../../types';

type Props = {
  namespaces: BiggestNamespaceResults[] | undefined;
  selectedNamespace: string | undefined;
  handleSelectNamespace: (selectedNamespace: string) => void;
};

export const NamespaceGrid = (props: Props) => {
  const {
    namespaces,
    selectedNamespace,
    handleSelectNamespace
  } = props;

  return (
    <div className="row mt-1">
      <div className="col-12 col-lg-10 offset-lg-1">
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xxl-5 g-lg-4 g-3">
          {namespaces && (
            Object.values(namespaces).map((item, index: number) => (
              <div key={index} className="col">
                <div className={`card h-100 shadow-sm position-relative cursor-pointer ${item?.namespace_name === selectedNamespace ? 'bg-primary-subtle' : 'bg-body-tertiary namespace-card'}`}>
                  <div className="card-body text-center d-flex flex-column justify-content-center">
                    <p className={`card-title mt-2 text-primary-emphasis ${item?.namespace_name === selectedNamespace ? 'fw-bold' : 'fw-semibold'}`}>
                      <a className='text-decoration-none text-reset stretched-link' onClick={() => handleSelectNamespace(item?.namespace_name)}>
                        {index + 1}. {item?.namespace_name}
                      </a>
                    </p>
                    <p className={`card-text mb-2 text-sm ${item?.namespace_name === selectedNamespace ? 'fw-medium' : 'fw-normal'}`}>
                      {item?.number_of_projects} {item?.number_of_projects === 1 ? 'Project' : 'Projects'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
