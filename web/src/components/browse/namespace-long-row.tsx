import React, { useRef, useEffect, useCallback } from 'react';

export const NamespaceLongRow = ({ namespaces, selectedNamespace, handleSelectNamespace }) => {
  const containerRef = useRef(null);
  const itemRefs = useRef({});

  const isInViewport = (element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  const scrollToItem = useCallback((namespace) => {
    if (itemRefs.current[namespace]) {
      const element = itemRefs.current[namespace];
      if (!isInViewport(element)) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        });
      }
    }
  }, []);

  useEffect(() => {
    if (selectedNamespace) {
      scrollToItem(selectedNamespace);
    }
  }, [selectedNamespace, scrollToItem]);

  const renderLongRow = () => (
    <div 
      ref={containerRef}
      className="row flex-nowrap overflow-auto py-1" 
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {namespaces?.data?.results ? (
        Object.values(namespaces.data.results).map((item, index) => (
          <div 
            key={index} 
            ref={el => itemRefs.current[item.namespace] = el}
            className="col-2 flex-shrink-0" 
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className={`card shadow-sm position-relative cursor-pointer ${item?.namespace === selectedNamespace ? 'bg-primary-subtle' : 'bg-body-tertiary namespace-card'}`}>
              <div className="card-body text-center px-0">
                <p className={`card-title mt-2 text-primary-emphasis ${item?.namespace === selectedNamespace ? 'fw-bold' : 'fw-semibold'}`}>
                  <a className='text-decoration-none text-reset stretched-link' onClick={() => handleSelectNamespace(item?.namespace)}>
                    {index + 1}. {item?.namespace}
                  </a>
                </p>
                <p className={`card-text mb-2 text-sm ${item?.namespace === selectedNamespace ? 'fw-medium' : 'fw-normal'}`}>
                  {item?.number_of_projects} Projects
                </p>
              </div>
            </div>
          </div>
        ))
      ) : null}
    </div>
  );

  return (
    <div className="position-relative">
      {renderLongRow()}
      <span><i className='bi bi-caret-left-fill'/></span>
      <span><i className='bi bi-caret-right-fill float-end'/></span>
    </div>
  );
};
