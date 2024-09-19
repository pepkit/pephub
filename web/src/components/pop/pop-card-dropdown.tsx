import { FC, Fragment, useState, useEffect } from 'react';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useParams, useSearchParams } from 'react-router-dom';

import { ProjectAnnotation, Sample } from '../../../types';
import { useSession } from '../../contexts/session-context';
import { useAddStar } from '../../hooks/mutations/useAddStar';
import { useRemoveStar } from '../../hooks/mutations/useRemoveStar';
import { copyToClipboard } from '../../utils/etc';
import { LoadingSpinner } from '../spinners/loading-spinner';
import { numberWithCommas } from '../../utils/etc';

interface Props {
  project: ProjectAnnotation;
  isStarred: boolean;
  copied: boolean;
  setCopied: (copied: boolean) => void;
  setShowForkPEPModal: (show: boolean) => void;
  setShowRemovePEPModal: (show: boolean) => void;
  starNumber: number;
}

export const PopCardDropdown: FC<Props> = (props) => {
  let { namespace, project: name } = useParams();

  const { project, isStarred, copied, setCopied, setShowForkPEPModal, setShowRemovePEPModal, starNumber } = props;

  const { user } = useSession();

  const { isPending: isAddingStar, addStar } = useAddStar(user?.login || '');
  const starRemoveMutation = useRemoveStar(user?.login || '');

  const [localStarred, setLocalStarred] = useState(isStarred);

  useEffect(() => {
    setLocalStarred(isStarred);
  }, [project]);

  return (
    <Dropdown as={ButtonGroup}>
      <Button
        disabled={isAddingStar || starRemoveMutation.isPending}
        variant="outline"
        className={isStarred ? 'border mt-1 shadow-none rounded-start-2 starred-button' : 'border mt-1 shadow-none rounded-start-2 star-button'} 
        style={{zIndex: 2}}
        size="sm"
        onClick={() => {
          if (!user) {
            toast.error('You must be logged in to star a project!');
          } else if (isStarred) {
            starRemoveMutation.mutate({
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
          <div className="d-flex align-items-center text-sm">
            <i className="bi bi-star-fill me-1 position-relative" style={{paddingRight: '2px', marginTop: '-0.666666px'}}></i>
            <span className='fw-semibold'>
              <Fragment>
                {copied ? 'Copied!' : (localStarred ? numberWithCommas(starNumber) : numberWithCommas(starNumber + 1))}
              </Fragment>
            </span>
          </div>
        ) : (
          <div className="d-flex align-items-center text-sm">
            <i className="bi bi-star me-1 position-relative" style={{paddingRight: '2px', marginTop: '-0.666666px'}}></i>
            <span className='fw-normal'>
              <Fragment>
                {copied ? 'Copied!' : (localStarred ? numberWithCommas(starNumber - 1) : numberWithCommas(starNumber))}
              </Fragment>
            </span>
          </div>
        )}
      </Button>
      <Dropdown.Toggle 
        split 
        variant="outline"
        className='border mt-1 me-1 shadow-none rounded-end-2 star-dropdown-button'
        style={{zIndex: 2}}
        id="dropdown-split-basic" />
      <Dropdown.Menu className='border border-light-subtle shadow-sm'>
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
