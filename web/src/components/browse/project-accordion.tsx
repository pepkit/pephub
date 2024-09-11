import { useState } from 'react';

import { Markdown } from '../markdown/render';
import { ProjectAnnotation } from '../../../types';
import { dateStringToDateTime } from '../../utils/dates'

type Props = {
  projects: ProjectAnnotation[];
};

export const ProjectAccordion = (props: Props) => {
  const { projects } = props;

  // Filter out the 'length' property
  const projectItems = Object.entries(projects).filter(([key]) => key !== 'length');

  return (
    <div className="accordion" id="projectAccordion">
      {projectItems.map(([key, project], index) => (
        <div className="accordion-item shadow-sm" key={key}>
          <h2 className="accordion-header" id={`heading${key}`}>
            <button
              className={`accordion-button py-2 ${index !== 0 ? 'collapsed' : ''}`}
              type="button"
              data-bs-toggle="collapse"
              data-bs-target={`#collapse${key}`}
              aria-expanded={index === 0 ? 'true' : 'false'}
              aria-controls={`collapse${key}`}
            >
              <span style={{minWidth: '2.5em'}}>{index + 1}.</span>
              <span className='w-75'>{project.namespace}/<span className='fw-semibold'>{project.name}</span>:{project.tag}</span>
              <span style={{marginLeft: '10em', minWidth: '4.5em'}} className='text-center text-sm border border-dark rounded-2 px-2 py-1'>{project.stars_number} Stars</span>
            </button>
          </h2>
          <div
            id={`collapse${key}`}
            className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
            aria-labelledby={`heading${key}`}
            data-bs-parent="#projectAccordion"
          >
            <div className="accordion-body">
              <div className='row'>
                <div className='col'>
                  {project.description ? <Markdown>{project.description}</Markdown> : <p className='fst-italic'>No description</p>}
                  <p className='m-0 text-sm'><span className='fw-semibold'>Sample Count:</span> {project.number_of_samples}</p>
                  <p className='m-0 text-sm'><span className='fw-semibold'>Created:</span> {dateStringToDateTime(project.submission_date)}</p>
                  <p className='m-0 text-sm'><span className='fw-semibold'>Updated:</span> {dateStringToDateTime(project.last_update_date)}</p>
                </div>
                <div className='col-1 d-flex align-items-center justify-content-end'>
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};