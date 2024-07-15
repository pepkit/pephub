import { Modal } from 'react-bootstrap';

import { useEditProjectMetaMutation } from '../../hooks/mutations/useEditProjectMetaMutation';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { ProjectMetaEditForm } from '../forms/edit-project-meta';

type Props = {
  namespace: string;
  project: string;
  tag: string;
  show: boolean;
  onHide: () => void;
};

export const EditMetaMetadataModal = (props: Props) => {
  const { namespace, project, tag, show, onHide } = props;

  const projectInfo = useProjectAnnotation(namespace, project, tag);

  const { data: sampleTable } = useSampleTable({
    namespace,
    project,
    tag,
    enabled: true,
  });

  // check if all samples have a namespace, name, and tag (i.e. can convert to pop)
  const hasNamespace = sampleTable?.items.every((sample) => sample.namespace);
  const hasName = sampleTable?.items.every((sample) => sample.name);
  const hasTag = sampleTable?.items.every((sample) => sample.tag);
  const canConvertToPop = sampleTable && sampleTable.items.length > 0 && hasNamespace && hasName && hasTag;

  const { isPending: isSubmitting, submit } = useEditProjectMetaMutation(namespace, project, tag);

  return (
    <Modal centered animation={false} show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Metadata</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ProjectMetaEditForm
          key={projectInfo.dataUpdatedAt}
          projectInfo={projectInfo.data}
          canConvertToPop={canConvertToPop || false}
          isSubmitting={isSubmitting}
          onSubmit={submit}
          onCancel={onHide}
        />
      </Modal.Body>
    </Modal>
  );
};
