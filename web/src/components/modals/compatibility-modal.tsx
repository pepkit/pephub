import { FC, useState } from 'react';
import { Modal } from 'react-bootstrap';
import Select from 'react-select';
import { useSchemas } from '../../hooks/queries/useSchemas';
import { useValidation } from '../../hooks/queries/useValidation';
import { useSchema } from '../../hooks/queries/useSchema';

interface Props {
  show: boolean;
  onHide: () => void;
  namespace: string;
  project: string;
  tag: string;
}

interface SchemaTagProps {
  schema: string;
  namespace: string;
  project: string;
  tag: string;
}

const SchemaTag: FC<SchemaTagProps> = ({ schema, namespace, project, tag }) => {
  const { data: schemaFull } = useSchema(schema);
  const { data: validationResult, isFetching: loadingValidation } = useValidation(
    `${namespace}/${project}:${tag}`,
    JSON.stringify(schemaFull, null, 2),
    schemaFull !== undefined,
  );
  let highlight = '';
  if (loadingValidation) {
    highlight = 'warning';
  } else if (validationResult?.valid) {
    highlight = 'success';
  } else {
    highlight = 'danger';
  }
  return (
    <div>
      <small
        className={`d-flex flex-row align-items-center shadow-sm mb-2 px-2 py-1 fw-semibold text-${highlight} bg-${highlight} bg-opacity-10 border border-${highlight} border-opacity-10 rounded-2`}
      >
        <span className="me-1">{schema}</span>
        <>
          {loadingValidation ? (
            <i className={`mb-0 bi bi-dash-circle text-${highlight} spin h5`}></i>
          ) : validationResult?.valid ? (
            <i className={`mb-0 bi bi-check-circle text-${highlight} h5`}></i>
          ) : (
            <i className={`mb-0 bi bi-exclamation-octagon text${highlight} h5`}></i>
          )}
        </>
      </small>
    </div>
  );
};

export const CompatibilityModal: FC<Props> = ({ show, onHide, namespace, project, tag }) => {
  const { data: schemas, isLoading: loadingSchemas } = useSchemas();
  const [schemasToTest, setSchemasToTest] = useState<string[]>([]);
  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">
          Check compatibility of <b>{`${namespace}/${project}:${tag}`}</b>
        </h1>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-row align-items-center">
          <Select
            isMulti
            isDisabled={loadingSchemas}
            className="w-75 me-1"
            placeholder={loadingSchemas ? 'Loading...' : 'Select schemas'}
            options={Object.keys(schemas || {}).map((schema) => ({ value: schema, label: schema }))}
            value={schemasToTest.map((schema) => ({ value: schema, label: schema }))}
            onChange={(selected) => {
              setSchemasToTest(selected ? (selected as { value: string; label: string }[]).map((s) => s.value) : []);
            }}
          />
          <button
            onClick={() => {
              setSchemasToTest(Object.keys(schemas || {}));
            }}
            className="btn btn-outline-success"
          >
            <i className="me-1 bi bi-plus-circle"></i>
            Add all
          </button>
        </div>
        <div className="d-flex flex-row flex-wrap mt-3">
          {schemasToTest.map((schema) => (
            <div className="me-2" key={schema}>
              <SchemaTag namespace={namespace} project={project} tag={tag} schema={schema} />
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
};
