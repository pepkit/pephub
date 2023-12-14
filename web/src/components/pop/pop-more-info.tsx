import { Placeholder } from 'react-bootstrap';

import { Sample } from '../../../types';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';

interface Props {
  pep: Sample;
}

export const PopMoreInfo = (props: Props) => {
  const { pep } = props;

  //@ts-ignore
  const { data: projectInfo, isLoading } = useProjectAnnotation(pep.namespace, pep!.name, pep!.tag);

  if (isLoading) {
    return (
      <Placeholder as="div" animation="wave" className="w-100">
        <Placeholder xs={12} bg="secondary" className="mb-3" />
        <Placeholder xs={12} bg="secondary" className="mb-3" />
        <Placeholder xs={12} bg="secondary" className="mb-3" />
      </Placeholder>
    );
  }

  return (
    <div className="d-flex flex-row align-items-center justify-content-between">
      <div className="d-flex flex-row align-items-center">
        <span className="fw-bold">{`${pep.namespace}/${pep.name}:${pep.tag}`}</span>
      </div>
      <div className="d-flex flex-row align-items-center">
        <span className="fw-bold">{`${projectInfo?.description}`}</span>
      </div>
    </div>
  );
};
