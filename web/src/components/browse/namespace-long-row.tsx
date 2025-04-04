import React, { useRef, useEffect, useCallback } from 'react';

import { BiggestNamespaceResults } from '../../../types';

type Props = {
  namespaces: BiggestNamespaceResults[] | undefined;
  selectedNamespace: string | undefined;
  handleSelectNamespace: (selectedNamespace: string) => void;
};

export const NamespaceLongRow = (props: Props) => {
  const {
    namespaces,
    selectedNamespace,
    handleSelectNamespace
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const isInViewport = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    const padding = 12; // Adjust this value to increase or decrease the padding

    return (
      rect.top >= 0 - padding &&
      rect.left >= 0 - padding &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + padding &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) + padding
    );
  };

  const scrollToItem = useCallback((namespace: string) => {
    const element = itemRefs.current[namespace];
    if (element && !isInViewport(element)) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      });
    }
  }, []);

  useEffect(() => {
    if (selectedNamespace) {
      scrollToItem(selectedNamespace);
    }
  }, [selectedNamespace, scrollToItem]);

  return (
    <div className="position-relative">
      <div 
        ref={containerRef}
        className="row flex-nowrap overflow-auto pb-2 scroll-track-none" 
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {namespaces && (
          Object.values(namespaces).map((item, index) => (
            <div 
              key={index} 
              ref={(el) => { itemRefs.current[item.namespace_name] = el; }}
              className="col-xxl-2 col-lg-3 col-md-4 col-sm-6 flex-shrink-0" 
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className={`card shadow-sm position-relative cursor-pointer ${item?.namespace_name === selectedNamespace ? 'bg-primary-subtle' : 'bg-body-tertiary namespace-card'}`}>
                <div className="card-body text-center px-0">
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
  );
};
