import { FC } from 'react';
import Select, { SingleValue } from 'react-select';
import { useSchemas } from '../../../hooks/queries/useSchemas';

interface Props {
  value?: string;
  onChange: (value: string) => void;
}

const SchemaDropdown: FC<Props> = ({ value, onChange }) => {
  const { data: schemas, isLoading } = useSchemas();

  const options = Object.keys(schemas || {}).map((schema) => ({
    label: schema,
    value: schema,
  }));

  return (
    <div>
      <Select
        options={options}
        value={options.find((option) => option.value === value)}
        onChange={(newValue: SingleValue<{ label: string; value: string }>) => {
          onChange(newValue?.value || '');
        }}
        placeholder={isLoading ? 'Fetching schemas...' : 'Assign a schema...'}
        isClearable
        menuPlacement="top"
      />
    </div>
  );
};

export { SchemaDropdown };
