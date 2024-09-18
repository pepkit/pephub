import React, { useState } from 'react';
import { Markdown } from '../markdown/render';
import { ProjectAnnotation } from '../../../types';
import { dateStringToDateTime, dateStringToDateTimeShort } from '../../utils/dates'
import { BrowseTable } from '../tables/browse-table';

type Props = {
  projects: ProjectAnnotation[];
};

export const ProjectAccordion = (props: Props) => {
  const { projects } = props;

  // Filter out the 'length' property
  const projectItems = Object.entries(projects).filter(([key]) => key !== 'length');

  // Set the initial open item to the first item's key, or null if there are no items
  const initialOpenItem = projectItems.length > 0 ? projectItems[0][0] : null;
  const [openItem, setOpenItem] = useState<string | null>(initialOpenItem);

  const handleAccordionToggle = (key: string) => {
    setOpenItem(prevOpenItem => prevOpenItem === key ? null : key);
  };

  return (
    <div className="accordion mt-2" id="projectAccordion">
      {projectItems.map(([key, project], index) => (
        <div className="accordion-item shadow-sm" key={key}>
          <h2 className="accordion-header" id={`heading${key}`}>
            <button
              className={`accordion-button py-2 ${openItem !== key ? 'collapsed' : ''}`}
              type="button"
              onClick={() => handleAccordionToggle(key)}
              aria-expanded={openItem === key}
              aria-controls={`collapse${key}`}
            >
              <span style={{minWidth: '2.5em'}}>{index + 1}.</span>
              <div className='col-lg-9 col-md-7'>{project.namespace}/<span className='fw-semibold'>{project.name}</span>:{project.tag}</div>
              
              <div className='d-none d-md-flex text-xs text-start justify-content-between' style={{width: '15%'}}>
                <span className='ps-1' style={{minWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}><span className='fw-medium'>Sample Count: </span>{project.number_of_samples}</span>
                <span> | </span>
                <span className='ps-1' style={{minWidth: '20%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}><span className='fw-medium'>Stars: </span>{project.stars_number}</span>
              </div>
            </button>
          </h2>
          <div
            id={`collapse${key}`}
            className={`accordion-collapse collapse ${openItem === key ? 'show' : ''}`}
            aria-labelledby={`heading${key}`}
          >
            <div className="accordion-body">
              <div className='row'>
                <div className='col'>
                  {project.description ? <Markdown>{project.description}</Markdown> : <p className='fst-italic'>No description</p>}
                </div>
                <div className='col-2 d-flex align-items-center justify-content-end'>
                  <a
                    className='btn btn-dark fw-medium'
                    href={`${project.namespace}/${project.name}?tag=${project.tag}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Go <i className='bi bi-caret-right-fill'/>
                  </a>
                </div>
              </div>
              {openItem === key && (
                <div className='row'>
                  <BrowseTable namespace={project.namespace} project={project.name} tag={project.tag} />
                </div>
              )}
              <div className='row mt-3'>
                <div className='col'>
                  <p className='d-block d-md-none m-0'>
                    <span className='m-0 pe-4 text-sm'><span className='fw-medium'>Sample Count:</span> {project.number_of_samples}</span>
                    <span className='m-0 text-sm'><span className='fw-medium'>Stars:</span> {project.stars_number}</span>
                  </p>
                  <p className='m-0'>
                    <span className='m-0 pe-4 text-sm'><span className='fw-medium'>Created:</span> {dateStringToDateTime(project.submission_date)}</span>
                    <span className='m-0 text-sm'><span className='fw-medium'>Updated:</span> {dateStringToDateTime(project.last_update_date)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};