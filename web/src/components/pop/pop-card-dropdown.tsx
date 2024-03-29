import { FC, Fragment } from 'react';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useParams, useSearchParams } from 'react-router-dom';

import { ProjectAnnotation, Sample } from '../../../types';
import { useAddStar } from '../../hooks/mutations/useAddStar';
import { useRemoveStar } from '../../hooks/mutations/useRemoveStar';
import { useSampleTableMutation } from '../../hooks/mutations/useSampleTableMutation';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { useSession } from '../../hooks/useSession';
import { copyToClipboard } from '../../utils/etc';
import { LoadingSpinner } from '../spinners/loading-spinner';

interface Props {
  project: ProjectAnnotation;
  isStarred: boolean;
  copied: boolean;
  setCopied: (copied: boolean) => void;
  setShowForkPEPModal: (show: boolean) => void;
  setShowRemovePEPModal: (show: boolean) => void;
}

export const PopCardDropdown: FC<Props> = (props) => {
  let { namespace, project: name } = useParams();

  const { project, isStarred, copied, setCopied, setShowForkPEPModal, setShowRemovePEPModal } = props;

  const { user } = useSession();

  const starAddMutation = useAddStar(user?.login || '', project.namespace, project.name, project.tag);
  const starRemoveMutation = useRemoveStar(user?.login || '', project.namespace, project.name, project.tag);

  return (
    <Dropdown as={ButtonGroup}>
      <Button
        disabled={starAddMutation.isPending || starRemoveMutation.isPending}
        variant="outline-dark"
        size="sm"
        onClick={() => {
          if (!user) {
            toast.error('You must be logged in to star a project!');
          } else if (isStarred) {
            starRemoveMutation.mutate();
          } else {
            starAddMutation.mutate();
          }
        }}
      >
        {isStarred ? (
          <Fragment>
            <div className="d-flex align-items-center">
              <i className="text-primary bi bi-star-fill me-1"></i>
              <span className="text-primary">
                {starRemoveMutation.isPending ? (
                  <Fragment>
                    {copied ? 'Copied!' : 'Star'}
                    <LoadingSpinner className="w-4 h-4 spin ms-1 mb-tiny fill-secondary" />
                  </Fragment>
                ) : (
                  <Fragment>{copied ? 'Copied!' : 'Star'}</Fragment>
                )}
              </span>
            </div>
          </Fragment>
        ) : (
          <Fragment>
            <div className="d-flex align-items-center">
              <i className="bi bi-star me-1"></i>
              <span>
                {starRemoveMutation.isPending ? (
                  <Fragment>
                    {copied ? 'Copied!' : 'Star'}
                    <LoadingSpinner className="w-4 h-4 spin ms-1 mb-tiny fill-secondary" />
                  </Fragment>
                ) : (
                  <Fragment>{copied ? 'Copied!' : 'Star'}</Fragment>
                )}
              </span>
            </div>
          </Fragment>
        )}
      </Button>
      <Dropdown.Toggle split variant="outline-dark" id="dropdown-split-basic" />
      <Dropdown.Menu>
        <Dropdown.Item href={`/${project.namespace}/${project.name}`}>
          <i className="bi bi-eye me-1"></i>
          View
        </Dropdown.Item>
        <Dropdown.Item
          onClick={(e) => {
            e.preventDefault();
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 1000);
            copyToClipboard(`${project.namespace}/${project.name}:${project.tag}`);
          }}
        >
          <i className="bi bi-copy me-1"></i>
          Copy registry path
        </Dropdown.Item>
        {user ? (
          <Dropdown.Item
            onClick={() => {
              setShowForkPEPModal(true);
            }}
          >
            <i className="bi bi-bezier2 me-1"></i>
            Fork
          </Dropdown.Item>
        ) : (
          <Dropdown.Item disabled>Fork (log in to fork)</Dropdown.Item>
        )}
        {/* only renders if we are logged in and on some page within our namespace */}
        {user && user.login === namespace && (
          <Fragment>
            <Dropdown.Divider />
            <Dropdown.Item
              onClick={() => {
                setShowRemovePEPModal(true);
              }}
              className="text-danger"
            >
              <i className="bi bi-trash me-1"></i>
              Remove
            </Dropdown.Item>
          </Fragment>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};
