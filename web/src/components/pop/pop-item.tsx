import { Fragment, useState } from 'react';

import { Sample } from '../../../types';
import { PopMoreInfoModal } from '../modals/pop-more-info-modal';

interface Props {
  pep: Sample;
}

export const PopItem = (props: Props) => {
  const { pep } = props;
  const { namespace, name, tag } = pep;

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Fragment>
      <li className="my-1 border border-dark rounded shadow-sm p-2 bg-secondary bg-opacity-10">
        <div className="d-flex flex-row align-items-center justify-content-between">
          <span className="fw-semibold">{`${namespace}/${name}:${tag}`}</span>
          <div className="d-flex flex-row align-items-center gap-1">
            <button
              className="btn btn-sm btn-outline-dark"
              onClick={() => {
                setModalOpen(true);
              }}
            >
              <i className="bi bi-three-dots"></i>
            </button>
            <button className="btn btn-sm btn-danger">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </li>
      <PopMoreInfoModal
        onHide={() => setModalOpen(false)}
        namespace={namespace!}
        project={name!}
        tag={tag!}
        show={modalOpen}
      />
    </Fragment>
  );
};
