import { FC, Fragment } from 'react';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import toast from 'react-hot-toast';

import { ProjectAnnotation } from '../../../../types';
import { useSession } from '../../../contexts/session-context';
import { useAddStar } from '../../../hooks/mutations/useAddStar';
import { useRemoveStar } from '../../../hooks/mutations/useRemoveStar';
import { copyToClipboard } from '../../../utils/etc';
import { LoadingSpinner } from '../../spinners/loading-spinner';

interface Props {
  project: ProjectAnnotation;
  isStarred: boolean;
  copied: boolean;
  setCopied: (copied: boolean) => void;
  setShowDeletePEPModal: (show: boolean) => void;
  setShowForkPEPModal: (show: boolean) => void;
  starNumber: number;
}

export const ProjectCardDropdown: FC<Props> = (props) => {
  const { project, isStarred, copied, setCopied, setShowDeletePEPModal, setShowForkPEPModal, starNumber } = props;
  const { user } = useSession();

  const { isPending: isAddingStar, addStar } = useAddStar(user?.login);
  const { isPending: isRemovingStar, removeStar } = useRemoveStar(user?.login);

  return (
    <Dropdown as={ButtonGroup}>
      <Button
        disabled={isAddingStar || isRemovingStar}
        variant='light'
        className={isStarred ? 'border border-0 mt-1 shadow-none rounded-start-2 starred-button' : 'border border-0 mt-1 shadow-none rounded-start-2 star-button'} 
        style={{zIndex: 2}}
        size="sm"
        onClick={() => {
          if (!user) {
            toast.error('You must be logged in to star a project!');
          } else if (isStarred) {
            removeStar({
              namespaceToRemove: project.namespace,
              projectNameToRemove: project.name,
              projectTagToRemove: project.tag,
            });
          } else {
            addStar({
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
              <i className="bi bi-star-fill me-2"></i>
              <span className='fw-semibold'>
                {isRemovingStar ? (
                  <Fragment>
                    {copied ? 'Copied!' : starNumber + 1}
                  </Fragment>
                ) : (
                  <Fragment>{copied ? 'Copied!' : starNumber + 1}</Fragment>
                )}
              </span>
            </div>
          </Fragment>
        ) : (
          <Fragment>
            <div className="d-flex align-items-center">
              <i className="bi bi-star me-2"></i>
              <span className='fw-normal'>
                {isAddingStar ? (
                  <Fragment>
                    {copied ? 'Copied!' : starNumber}
                  </Fragment>
                ) : (
                  <Fragment>{copied ? 'Copied!' : starNumber}</Fragment>
                )}
              </span>
            </div>
          </Fragment>
        )}
      </Button>
      <Dropdown.Toggle 
        split variant="light" 
        id="dropdown-split-basic" 
        className='border border-light border-2 border-top-0 border-end-0 border-bottom-0 mt-1 me-1 shadow-none rounded-end-2 star-button' 
        style={{zIndex: 2}}
      />
      <Dropdown.Menu className="border border-light-subtle shadow-sm">
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
        {user && (user.orgs.includes(project.namespace) || user.login === project.namespace) && (
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
