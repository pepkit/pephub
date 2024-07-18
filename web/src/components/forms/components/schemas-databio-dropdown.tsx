import { FC } from 'react';
import Select, { SingleValue } from 'react-select';

import { useSchemas } from '../../../hooks/queries/useSchemas';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  showDownload?: boolean;
}

const SchemaDropdown: FC<Props> = ({ value, onChange, showDownload = true }) => {
  const { data: schemas, isLoading } = useSchemas();

  const options = Object.keys(schemas || {}).map((schema) => ({
    label: schema,
    value: schema,
  }));

  const valueForSelect = options.find((option) => option.value === value);

  return (
    <div className="d-flex flex-row align-items-center gap-1 w-100">
      <Select
        options={options}
        value={valueForSelect}
        onChange={(newValue: SingleValue<{ label: string; value: string }>) => {
          onChange(newValue?.value || '');
        }}
        placeholder={isLoading ? 'Fetching schemas...' : 'Assign a schema...'}
        isClearable
        menuPlacement="top"
        className="w-100"
      />
      {showDownload && (
        <a
          target="_blank"
          href={`https://schema.databio.org/${value}.yaml`}
          className="btn btn-outline-secondary opacity-50"
        >
          <i className="bi bi-download" />
        </a>
      )}
    </div>
  );
};

export { SchemaDropdown };
