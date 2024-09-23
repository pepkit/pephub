import { FC, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useParams, useSearchParams } from 'react-router-dom';

import { Sample } from '../../../types';
import { useTotalProjectChangeMutation } from '../../hooks/mutations/useTotalProjectChangeMutation';
import { useProjectConfig } from '../../hooks/queries/useProjectConfig';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { useSubsampleTable } from '../../hooks/queries/useSubsampleTable';

interface Props {
  show: boolean;
  onHide: () => void;
  currentPeps: Sample[];
  namespaceToRemove: string;
  projectToRemove: string;
  tagToRemove?: string;
  namespaceToRemoveFrom: string;
  projectToRemoveFrom: string;
  tagToRemoveFrom?: string;
}

export const RemovePEPFromPOPModal: FC<Props> = ({
  show,
  onHide,
  currentPeps,
  namespaceToRemoveFrom,
  projectToRemoveFrom,
  tagToRemoveFrom,
  namespaceToRemove,
  projectToRemove,
  tagToRemove,
}) => {
  const [confirmText, setConfirmText] = useState('');

  const onSuccess = () => {
    setConfirmText('');
  };

  let { namespace, project, tag } = useParams();

  const { data: projectConfig } = useProjectConfig(namespace, project, tag);
  const { data: subSampleTable } = useSubsampleTable(namespace, project, tag);

  // const { isPending: isSampleTablePending, submit } = useSampleTableMutation(
  //   namespaceToRemoveFrom!,
  //   projectToRemoveFrom!,
  //   tagToRemoveFrom || 'default',
  // );

  const { isPending: isSampleTablePending, submit } = useTotalProjectChangeMutation(
    namespaceToRemoveFrom!,
    projectToRemoveFrom!,
    tagToRemoveFrom || 'default',
  );

  return (
    <Modal
      centered
      animation={false}
      show={show}
      onHide={() => {
        onHide();
        setConfirmText('');
      }}
    >
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Remove PEP from POP?</h1>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to remove this PEP? This action cannot be undone.</p>
        <label className="mb-3">
          Please type{' '}
          <span className="fw-bold">
            {namespaceToRemove}/{projectToRemove}:{tagToRemove}
          </span>{' '}
          to confirm:
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          id="delete-confirm-input"
          type="text"
          className="form-control"
          placeholder={`${namespaceToRemove}/${projectToRemove}:${tagToRemove}`}
        />
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={() => {
            submit({
              config: projectConfig?.config,
              samples: currentPeps.filter((pep) => pep.sample_name !== `${namespaceToRemove}/${projectToRemove}:${tagToRemove}`),
              subsamples: subSampleTable?.items,
            });
            // submit(
            //   currentPeps.filter((pep) => pep.sample_name !== `${namespaceToRemove}/${projectToRemove}:${tagToRemove}`),
            //   {
            //     onSuccess: () => {
            //       onSuccess();
            //       onHide();
            //     },
            //   },
            // );
          }}
          disabled={confirmText !== `${namespaceToRemove}/${projectToRemove}:${tagToRemove}` || isSampleTablePending}
          type="button"
          className="btn btn-danger"
        >
          {isSampleTablePending ? 'Removing...' : 'Yes, remove'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
