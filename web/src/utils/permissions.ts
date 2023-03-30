import { User, ProjectAnnotation } from '../../types';

export const canEdit = (user: User | null, ProjectAnnotation: ProjectAnnotation) => {
  if (!user) {
    return false;
  }
  if (user.orgs.includes(ProjectAnnotation.namespace)) {
    return true;
  } else if (user.login === ProjectAnnotation.namespace) {
    return true;
  } else {
    return false;
  }
};
