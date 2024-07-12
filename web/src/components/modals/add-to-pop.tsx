import { AxiosError } from 'axios';
import { FC, Fragment, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';

import { useSession } from '../../contexts/session-context';
import { useSampleTableMutation } from '../../hooks/mutations/useSampleTableMutation';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { extractErrorMessage } from '../../utils/etc';
import { PepSearchDropdown } from '../forms/components/pep-search-dropdown';
import { LoadingSpinner } from '../spinners/loading-spinner';

interface Props {
  show: boolean;
  onHide: () => void;
  namespace: string;
  project: string;
  tag: string;
}

export const AddToPOPModal: FC<Props> = (props) => {
  const { show, onHide } = props;
  const namespaceToAdd = props.namespace;
  const projectToAdd = props.project;
  const tagToAdd = props.tag;
  const { user } = useSession();

  // @ts-ignore (local storage)
  const [namespace, setNamespace] = useState<string>(user?.login);
  const [project, setProject] = useState<string | undefined>(undefined);

  // derived from project
  const [projectName, tag] = project?.split('/')[1].split(':') || [undefined, undefined];

  // I run data validation in the actual button click, so im not doing it here
  const { data: currentSampleTable } = useSampleTable({
    namespace,
    project: projectName!,
    tag: tag,
  });
  const sampleTableMutation = useSampleTableMutation(namespace, projectName!, tag!);

  const onCancel = () => {
    setNamespace(user!.login);
    setProject(undefined);
    onHide();
  };

  const onAdd = () => {
    if (!projectName || !tag) {
      toast.error('Please select a project to add to the POP.');
      return;
    }
    if (!currentSampleTable) {
      toast.error('There was an issue fetching the current sample table for the selected POP.');
      return;
    }
    if (
      currentSampleTable.items.includes({
        namespace: namespaceToAdd,
        project: projectToAdd,
        tag: tagToAdd,
      })
    ) {
      toast.error('This project is already in the POP!');
      return;
    }

    // finally add the project to the pop if it passes all the checks
    sampleTableMutation.mutate(
      [
        ...currentSampleTable.items,
        {
          sample_name: `${namespaceToAdd}/${projectToAdd}:${tagToAdd}`,
          namespace: namespaceToAdd,
          name: projectToAdd,
          tag: tagToAdd,
        },
      ],
      {
        onSuccess: () => {
          toast.success('Successfully added project to POP!');
          onCancel();
        },
        onError: (err: AxiosError) => {
          const errorMessage = extractErrorMessage(err);
          toast.error(`There was an issue adding the project to the POP" ${errorMessage}`);
        },
      },
    );
  };

  useEffect(() => {
    setProject(undefined);
  }, [namespace]);

  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="text-lg mb-0">
          Add <span className="fw-bold">{`${namespaceToAdd}/${projectToAdd}:${tagToAdd}`}</span> to POP
        </h1>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-row align-items-center gap-2">
          <select className="form-select rounded w-25" value={namespace} onChange={(e) => setNamespace(e.target.value)}>
            <option>{user?.login}</option>
            {user?.orgs.map((org) => (
              <option key={org} value={org}>
                {org}
              </option>
            ))}
          </select>
          <span className="text-2xl mb-1 fw-light">/</span>
          <PepSearchDropdown
            projectNameOnly
            type="pop"
            namespace={namespace}
            value={project || 'databio/example:tag'}
            onChange={(n) => setProject(n)}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex align-items-center gap-1 justify-content-end">
          <button className="btn btn-outline-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            onClick={onAdd}
            className="btn btn-success"
            disabled={!projectName || !tag || !currentSampleTable || sampleTableMutation.isPending}
          >
            {sampleTableMutation.isPending ? (
              <Fragment>
                <LoadingSpinner className="w-4 h-4 mb-1 me-1 spin fill-light" />
                Add
              </Fragment>
            ) : (
              <Fragment>
                <i className="bi bi-plus-circle me-1"></i>
                Add
              </Fragment>
            )}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
