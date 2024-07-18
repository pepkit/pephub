import { useState } from 'react';

import { useSession } from '../../contexts/session-context';
import { GitHubAvatar } from '../badges/github-avatar';
import { DeleteAllPepsModal } from '../modals/delete-all-peps';

export const AccountView = () => {
  const { user } = useSession();

  const [showDeleteAllPepsModal, setShowDeleteAllPepsModal] = useState(false);

  return (
    <div className="d-flex flex-column p-2">
      <div>
        <h5 className="fw-bold">Account:</h5>
      </div>
      <div className="">
        <div className="mb-2">
          <h6 className="mb-0">Your organizations:</h6>
          <div className="d-flex flex-row align-items-center gap-2">
            {user?.orgs.map((org, index) => (
              <span key={index} className="">
                <GitHubAvatar namespace={org} height={20} width={20} />
                <span className="ms-1">{org}</span>
              </span>
            ))}
          </div>
        </div>
        <h6 className="mb-0">Name:</h6>
        <p>{user?.name}</p>
      </div>
      <div className="d-flex flex-row align-items-center gap-2">
        <a href={`https://github.com/${user?.login}`} target="_blank" rel="noreferrer">
          <button className="btn btn-sm btn-dark">
            <i className="bi bi-github me-2"></i>
            View on Github
          </button>
        </a>
        <button onClick={() => setShowDeleteAllPepsModal(true)} className="btn btn-sm btn-danger">
          <i className="bi bi-trash me-2"></i>
          Clear all PEPs
        </button>
      </div>
      <DeleteAllPepsModal show={showDeleteAllPepsModal} onHide={() => setShowDeleteAllPepsModal(false)} />
    </div>
  );
};
