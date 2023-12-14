import { Fragment, useState } from 'react';

import { ProjectAnnotation } from '../../../types';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { PopItem } from './pop-item';

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
      <div className="px-2">
        <div>
          <ul className="list-group">
            {peps?.items.map((pep) => (
              <PopItem key={`${pep.namespace}/${pep.name}:${pep.tag}`} pep={pep} />
            ))}
          </ul>
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
                className="form-control border-dark"
                placeholder="Add new PEP to POP"
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
    </Fragment>
  );
};
