import { useState } from 'react';

import { Markdown } from '../markdown/render';

import 'bootstrap/dist/css/bootstrap.min.css'
import "bootstrap/dist/js/bootstrap.bundle.min.js"

export const ProjectAccordion = ({ projects }) => {
  const [openIndex, setOpenIndex] = useState(null);

  // Filter out the 'length' property
  const projectItems = Object.entries(projects).filter(([key]) => key !== 'length');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

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

              {project.description ? <Markdown>{project.description}</Markdown> : <p className='fst-italic'>No description</p>}
              <p className='m-0 text-sm'><span className='fw-semibold'>Sample Count:</span> {project.number_of_samples}</p>
              <p className='m-0 text-sm'><span className='fw-semibold'>Created:</span> {formatDate(project.submission_date)}</p>
              <p className='m-0 text-sm'><span className='fw-semibold'>Updated:</span> {formatDate(project.last_update_date)}</p>
              
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};