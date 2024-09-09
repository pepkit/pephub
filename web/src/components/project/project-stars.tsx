import { FC, Fragment, useState } from 'react';
import { Button, ButtonGroup, Dropdown } from 'react-bootstrap';
import toast from 'react-hot-toast';

import { ProjectAnnotation } from '../../../types';
import { useSession } from '../../contexts/session-context';
import { useAddStar } from '../../hooks/mutations/useAddStar';
import { useRemoveStar } from '../../hooks/mutations/useRemoveStar';
import { numberWithCommas } from '../../utils/etc';

interface Props {
  project: ProjectAnnotation;
  isStarred: boolean;
  starNumber: number;
}

export const ProjectStars: FC<Props> = (props) => {
  const { project, isStarred, starNumber } = props;
  const { user } = useSession();

  const { isPending: isAddingStar, addStar } = useAddStar(user?.login);
  const { isPending: isRemovingStar, removeStar } = useRemoveStar(user?.login);

  const [localStarred, setLocalStarred] = useState(isStarred);

  return (
    <Button
      disabled={isAddingStar || isRemovingStar}
      variant='outline'
      className={isStarred ? 'border border-black shadow-sm rounded-1 starred-button' : 'border border-black shadow-sm rounded-1 star-button'} 
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
        <div className="d-flex align-items-center">
          <i className="bi bi-star-fill me-1 position-relative" style={{paddingRight: '2px', marginTop: '-0.666666px'}}></i>
          <span className='fw-semibold'>
            <Fragment>
              {(localStarred ? numberWithCommas(starNumber) : numberWithCommas(starNumber + 1))}
            </Fragment>
          </span>
        </div>
      ) : (
        <div className="d-flex align-items-center">
          <i className="bi bi-star me-1 position-relative" style={{paddingRight: '2px', marginTop: '-0.666666px'}}></i>
          <span className='fw-normal'>
            <Fragment>
              {(localStarred ? numberWithCommas(starNumber - 1) : numberWithCommas(starNumber))}
            </Fragment>
          </span>
        </div>
      )}
    </Button>
  );
};
