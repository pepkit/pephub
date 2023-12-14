import { Fragment, useState } from 'react';

import { ProjectAnnotation } from '../../../types';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { PageLayout } from '../layout/page-layout';
import { ConvertToPEPModal } from '../modals/convert-to-pep';

interface Props {
  project: ProjectAnnotation;
}

export const PopInterface = ({ project }: Props) => {
  const { namespace, name, tag } = project;
  const { data: peps, isLoading } = useSampleTable(namespace, name, tag);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  return (
    <Fragment>
      <div className="my-3 border-top w-100"></div>
      <div className="container">
        <div>
          {peps?.items.map((pep) => (
            <div className="rounded border border-dark my-2 p-3 shdaow-sm">
              <span className="fw-bold">
                {pep.namespace}/{pep.name}:{pep.tag}
              </span>
            </div>
          ))}
        </div>
        <div className="d-flex flex-row align-items-center justify-content-center">
          {!isAddingNew ? (
            <button className="btn btn-outline-success" onClick={() => setIsAddingNew(true)}>
              <i className="bi bi-plus-circle me-1"></i>
              Add
            </button>
          ) : (
            <div className="d-flex flex-row align-items-center gap-2 w-100">
              <input
                className="form-control"
                placeholder="Add new PEP"
                value={''}
                onChange={(e) => {
                  // setNewPEP(e.target.value);
                }}
              />
              <button
                className="btn btn-md btn-success"
                onClick={() => {
                  setIsAddingNew(false);
                }}
              >
                Add
              </button>
              <button className="btn btn-md btn-outline-dark" onClick={() => setIsAddingNew(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      <ConvertToPEPModal
        show={modalOpen}
        onHide={() => {
          setModalOpen(false);
        }}
        namespace={namespace}
        project={name}
        tag={tag}
      />
    </Fragment>
  );
};
