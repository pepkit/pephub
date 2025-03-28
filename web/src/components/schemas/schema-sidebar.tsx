import { useNavigate, useParams } from 'react-router-dom';
import Select, { SingleValue } from 'react-select';

import { useSchema } from '../../hooks/queries/useSchema';
import { useCreateSchemaVersionModalStore } from '../../hooks/stores/useCreateSchemaVersionModalStore';
import { useDeleteSchemaVersionModalStore } from '../../hooks/stores/useDeleteSchemaVersionModalStore';
import { useEditSchemaVersionModalStore } from '../../hooks/stores/useEditSchemaVersionModalStore';
import { useSchemaEditModalStore } from '../../hooks/stores/useSchemaEditModalStore';
import { useSchemaVersionNumber } from '../../hooks/stores/useSchemaVersionNumber';
import { dateStringToDateTime } from '../../utils/dates';

type Props = {
  description: string;
  maintainers: string;
  isPrivate: boolean;
  lifecycleStage: string;
  releaseNotes: string;
  contributors: string;
  tags: object;
  updateDate: string;
  releaseDate: string;
  allVersionNumbers: string[];
  canEdit: boolean;
};

export const SchemaSidebar = (props: Props) => {
  const {
    maintainers,
    isPrivate,
    lifecycleStage,
    releaseNotes,
    contributors,
    tags,
    updateDate,
    releaseDate,
    allVersionNumbers,
    canEdit,
  } = props;

  const { schemaVersionNumber, setSchemaVersionNumber } = useSchemaVersionNumber();
  const { setShowCreateSchemaVersionModal } = useCreateSchemaVersionModalStore();
  const { setShowEditSchemaVersionModal } = useEditSchemaVersionModalStore();
  const { setShowDeleteSchemaVersionModal } = useDeleteSchemaVersionModalStore();
  const { setShowSchemaEditModal } = useSchemaEditModalStore();

  const { namespace, schema } = useParams();
  const { data: schemaData } = useSchema(namespace, schema);
  const navigate = useNavigate();

  return (
    <div className="pe-3">
      <small>
        <div className={`mb-4 d-flex align-items-end my-1 ${canEdit ? '' : 'mt-2'}`}>
          <span className="text-base fw-semibold">Registry Metadata</span>
          {canEdit && (
            <div className="ms-auto" style={{ marginBottom: '-.2rem' }}>
              <button
                className="btn btn-outline-dark border shadow-none btn-sm"
                onClick={() => setShowSchemaEditModal(true)}
              >
                <i className="bi bi-pen"></i>
              </button>
            </div>
          )}
        </div>

        <div className="my-4">
          <p className="fw-semibold my-1">Description</p>
          <div className={`text-muted ${schemaData?.description ? '' : 'fst-italic'}`}>
            {schemaData?.description || 'N/A'}
          </div>
        </div>

        <div className="my-4">
          <p className="fw-semibold my-1">Lifecycle Stage</p>
          <div className={`text-muted ${lifecycleStage ? '' : 'fst-italic'}`}>{lifecycleStage || 'N/A'}</div>
        </div>

        <div className="my-4">
          <p className="fw-semibold my-1">Maintainers</p>
          <div className={`text-muted ${maintainers ? '' : 'fst-italic'}`}>{maintainers || 'N/A'}</div>
        </div>

        <hr />

        <div className={`mb-4 ${canEdit ? 'mt-3' : 'mt-4'}`}>
          <div className="d-flex align-items-end my-2">
            <span className="fw-semibold text-base">Version Metadata</span>
            {canEdit && (
              <div className="ms-auto" style={{ marginBottom: '-.2rem' }}>
                <button
                  className="btn btn-outline-dark border shadow-none btn-sm"
                  onClick={() => setShowCreateSchemaVersionModal(true)}
                >
                  <i className="bi bi-file-earmark-plus me-1"></i>
                  Version
                </button>
                <button
                  className="btn btn-outline-dark border shadow-none btn-sm ms-1"
                  onClick={() => setShowEditSchemaVersionModal(true)}
                >
                  <i className="bi bi-pen"></i>
                </button>
                {allVersionNumbers.length > 1 && (
                  <button
                    className="btn btn-danger shadow-none btn-sm ms-1"
                    onClick={() => setShowDeleteSchemaVersionModal(true)}
                    disabled={allVersionNumbers.length <= 1}
                  >
                    <i className="bi bi-trash3"></i>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="fw-semibold my-2">Selected Version</p>
          <Select
            value={schemaVersionNumber ? { value: schemaVersionNumber, label: schemaVersionNumber } : null}
            options={allVersionNumbers.map((version) => ({ value: version, label: version }))}
            onChange={(newValue: SingleValue<{ label: string; value: string }>) => {
              const selectedVersion = newValue?.value || '';
              setSchemaVersionNumber(selectedVersion);
              navigate({
                search: `?version=${selectedVersion}`,
              });
            }}
            styles={{
              control: (provided) => ({
                ...provided,
                borderRadius: '.375em',
                borderColor: '#dee2e6',
                width: 'max-content',
              }),
              menu: (provided) => ({
                ...provided,
                width: 'max-content',
              }),
            }}
          />
        </div>

        <div className="my-4">
          <p className="fw-semibold my-1">Release Notes</p>
          <div className={`text-muted ${releaseNotes ? '' : 'fst-italic'}`}>{releaseNotes || 'N/A'}</div>
        </div>

        <div className="my-4">
          <p className="fw-semibold my-1">Timestamps</p>
          <div className={`text-muted ${releaseDate ? '' : 'fst-italic'}`}>
            Created: {dateStringToDateTime(releaseDate || '')}
          </div>
          <div className={`text-muted ${updateDate ? '' : 'fst-italic'}`}>
            Updated: {dateStringToDateTime(updateDate || '')}
          </div>
        </div>

        <div className="my-4">
          <p className="fw-semibold my-1">Contributors</p>
          <div className={`text-muted ${contributors ? '' : 'fst-italic'}`}>{contributors || 'N/A'}</div>
        </div>

        <div className="my-4">
          <p className="fw-semibold my-1">Tags</p>
          {tags && Object.keys(tags).length > 0 ? (
            <div className="d-flex mt-2 gap-1">
              {Object.entries(tags).map(([key, value], index) => (
                <span className="border rounded-2 p-2 text-xs" key={key}>
                  <span className="fw-bold">{String(key)}</span>
                  {String(value) && <span>: {String(value)}</span>}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted fst-italic">N/A</span>
          )}
        </div>
      </small>
    </div>
  );
};
