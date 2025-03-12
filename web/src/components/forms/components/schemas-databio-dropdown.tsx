import { FC } from 'react';
import Select, { SingleValue } from 'react-select';

import { useAllSchemas } from '../../../hooks/queries/useAllSchemas';

const API_HOST = import.meta.env.VITE_API_HOST || '';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  showDownload?: boolean;
}

const SchemaDropdown: FC<Props> = ({ value, onChange, showDownload = true }) => {
  const { data: schemas, isFetching: isLoading } = useAllSchemas({});

  const options = (schemas?.results || []).map((schema) => ({
    label: `${schema.namespace}/${schema.name}`,
    value: `${schema.namespace}/${schema.name}`,
  }));

  const defaultSchema = 'databio/pep-2.1.0';
  const valueForSelect = options.find((option) => option.value === value);

  return (
    <div className="d-flex flex-row align-items-center gap-1 w-100">
      <Select
        options={options}
        defaultValue={{label: defaultSchema, value: defaultSchema}}
        value={valueForSelect}
        onChange={(newValue: SingleValue<{ label: string; value: string }>) => {
          onChange(newValue?.value || '');
        }}
        placeholder={isLoading ? 'Fetching schemas...' : 'Assign a schema...'}
        // isClearable
        menuPlacement="top"
        className="w-100"
        styles={{
                control: (provided) => ({
                  ...provided,
                  borderRadius: '.375em',
                  borderColor: '#dee2e6'
                })
              }}
      />
      {showDownload && (
        <a
          target="_blank"
          href={`${API_HOST}/api/v1/schemas/${value}/file`}
          className="btn btn-outline-light border shadow-sm text-body-tertiary"
        >
          <i className="bi bi-download" />
        </a>
      )}
    </div>
  );
};

export { SchemaDropdown };
