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
      <Modal.Body>
        <div className='p-1 modal-pill'>
          <h1 className="fs-5 mb-1 fw-semibold d-inline">Edit Metadata</h1>
            <button
              className="btn btn-outline-dark px-1 py-0 m-0 float-end d-inline rounded-3 border-0 shadow-none"
              type="button" 
              onClick={() => {
                onHide();
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
            <p className='text-sm mt-1 mb-3'></p>
            <div className="border-bottom" style={{ margin: '0 -1.25em' }}></div>

          <ProjectMetaEditForm
            key={projectInfo.dataUpdatedAt}
            projectInfo={projectInfo.data}
            canConvertToPop={canConvertToPop || false}
            isSubmitting={isSubmitting}
            onSubmit={submit}
            onCancel={onHide}
          />
        </div>
      </Modal.Body>
    </Modal>
  );
};
