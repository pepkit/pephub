import { useState } from 'react';
import Select from 'react-select';
import { useDebounce } from 'usehooks-ts';

import { NamespaceResponse } from '../../../api/namespace';
import { useSearchForNamespaces } from '../../../hooks/queries/useSearchForNamespaces';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const NamespaceSearchDropdown = (props: Props) => {
  const { value, onChange } = props;
  const limit = 1000;
  const offset = 0;
  const [search, setSearch] = useState<string>('');

  const searchDebounced = useDebounce<string>(search, 500);

  const { data: namespaces, isLoading } = useSearchForNamespaces({
    limit,
    offset,
    search: searchDebounced,
  });

  const selectedNamespace = namespaces?.results.find((v) => v.namespace === value);
  let selectValue;
  if (selectedNamespace) {
    selectValue = {
      label: selectedNamespace.namespace,
      value: selectedNamespace.namespace,
    };
  } else {
    selectValue = undefined;
  }

  return (
    <Select
      className="w-100"
      isLoading={isLoading}
      inputValue={search}
      value={selectValue}
      onInputChange={(newValue) => setSearch(newValue)}
      onChange={(newValue) => {
        onChange(newValue?.value || '');
      }}
      options={
        namespaces?.results.map((n) => ({
          label: n.namespace,
          value: n.namespace,
        })) || []
      }
      placeholder="Search"
      isClearable
      menuPlacement="bottom"
      controlShouldRenderValue={true}
    />
  );
};
