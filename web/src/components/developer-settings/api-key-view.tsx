import { Fragment, useState } from 'react';

import { useCreateNewApiKey } from '../../hooks/mutations/useCreateNewApiKey';
import { useRevokeApiKey } from '../../hooks/mutations/useRevokeApiKey';
import { useUserApiKeys } from '../../hooks/queries/useUserApiKeys';
import { dateStringToDateTime } from '../../utils/dates';
import { NewApiKeyModal } from '../modals/new-api-key-modal';
import { LoadingSpinner } from '../spinners/loading-spinner';

export const ApiKeyView = () => {
  const [newkey, setNewKey] = useState<string>('');
  const [newKeyModalOpen, setNewKeyModalOpen] = useState<boolean>(false);

  const { data: keysResponse } = useUserApiKeys();
  const { isPending: isCreatingKey, createKey } = useCreateNewApiKey({
    onKeyCreated: (newKey) => {
      setNewKey(newKey);
      setNewKeyModalOpen(true);
    },
  });
  const { isPending: isRevokingKey, revoke } = useRevokeApiKey();
  const testKeys = keysResponse?.keys;

  return (
    <div className="d-flex flex-column p-2">
      <div>
        <h5 className="fw-bold">Active keys:</h5>
        {testKeys && testKeys.length > 0 ? (
          testKeys.map((key, index) => (
            <div key={index} className="d-flex justify-content-between border border-dark shadow-sm p-1 rounded mb-1">
              <div className="d-flex flex-column align-items-start">
                <div className="d-flex align-items-center">
                  <i className="bi bi-key me-2 text-xl"></i>
                  <span className="text-sm">
                    <code>{key.key}</code>
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3 text-muted">
                  <span className="text-sm">Created at: {dateStringToDateTime(key.created_at)}</span>
                  <span className="text-sm">Expires: {dateStringToDateTime(key.expires)}</span>
                </div>
              </div>
              <div className="d-flex align-items-start">
                <button
                  onClick={() =>
                    revoke({
                      lastFiveChars: key.key.slice(-5),
                    })
                  }
                  className="btn btn-sm btn-danger"
                  disabled={isRevokingKey}
                >
                  {isRevokingKey ? (
                    <Fragment>
                      <LoadingSpinner className="w-4 h-4 spin me-2 mb-tiny fill-light" />
                      Revoking...
                    </Fragment>
                  ) : (
                    <Fragment>
                      <i className="bi bi-trash me-2"></i>
                      Revoke
                    </Fragment>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-muted text-sm">No active keys. You can create a new API key below.</div>
        )}
      </div>
      <div className="my-2 border-top"></div>
      <div>
        {/* <h5 className="fw-bold">Create new:</h5> */}
        <div>
          <button onClick={() => createKey()} className="btn btn-sm btn-success" disabled={isCreatingKey}>
            {isCreatingKey ? (
              <Fragment>
                <LoadingSpinner className="w-4 h-4 spin me-2 mb-tiny fill-light" />
                Creating new key...
              </Fragment>
            ) : (
              <Fragment>
                <i className="bi bi-plus-circle me-2"></i>
                Create new API key
              </Fragment>
            )}
          </button>
        </div>
      </div>
      <NewApiKeyModal
        show={newKeyModalOpen}
        onHide={() => setNewKeyModalOpen(false)}
        newKey={newkey}
        setNewKey={setNewKey}
      />
    </div>
  );
};
