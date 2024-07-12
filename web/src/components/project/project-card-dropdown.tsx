import { FC, Fragment } from 'react';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import toast from 'react-hot-toast';

import { ProjectAnnotation } from '../../../types';
import { useSession } from '../../contexts/session-context';
import { useAddStar } from '../../hooks/mutations/useAddStar';
import { useRemoveStar } from '../../hooks/mutations/useRemoveStar';
import { useNamespaceStars } from '../../hooks/queries/useNamespaceStars';
import { copyToClipboard } from '../../utils/etc';
import { LoadingSpinner } from '../spinners/loading-spinner';

interface Props {
  project: ProjectAnnotation;
  isStarred: boolean;
  copied: boolean;
  setCopied: (copied: boolean) => void;
  setShowDeletePEPModal: (show: boolean) => void;
  setShowForkPEPModal: (show: boolean) => void;
}

export const ProjectCardDropdown: FC<Props> = (props) => {
  const { project, isStarred, copied, setCopied, setShowDeletePEPModal, setShowForkPEPModal } = props;
  const { user } = useSession();

  const { addStarMutation, removeStarMutation } = useNamespaceStars(user?.login || '/', {}, true);

  return (
    <Dropdown as={ButtonGroup}>
      <Button
        disabled={addStarMutation.isPending || removeStarMutation.isPending}
        variant="outline-dark"
        size="sm"
        onClick={() => {
          if (!user) {
            toast.error('You must be logged in to star a project!');
          } else if (isStarred) {
            removeStarMutation.mutate({
              namespaceToRemove: project.namespace,
              projectNameToRemove: project.name,
              projectTagToRemove: project.tag,
            });
          } else {
            addStarMutation.mutate({
              namespaceToStar: project.namespace,
              projectNameToStar: project.name,
              projectTagToStar: project.tag,
            });
          }
        }}
      >
        {isStarred ? (
          <Fragment>
            <div className="d-flex align-items-center">
              <i className="text-primary bi bi-star-fill me-1"></i>
              <span className="text-primary">
                {removeStarMutation.isPending ? (
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
                {addStarMutation.isPending ? (
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
        {user && user.orgs.includes(project.namespace) && (
          <Fragment>
            <Dropdown.Divider />
            <Dropdown.Item
              onClick={() => {
                setShowDeletePEPModal(true);
              }}
              className="text-danger"
            >
              <i className="bi bi-trash me-1"></i>
              Delete
            </Dropdown.Item>
          </Fragment>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};
