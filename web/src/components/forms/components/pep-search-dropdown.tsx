import { useState } from 'react';
import Select from 'react-select';
import { useDebounce } from 'usehooks-ts';

import { useNamespaceProjects } from '../../../hooks/queries/useNamespaceProjects';

interface Props {
  namespace: string;
  value: string;
  onChange: (value: string) => void;
}

export const PepSearchDropdown = (props: Props) => {
  const { value, onChange, namespace } = props;
  const limit = 100;
  const offset = 0;
  const [search, setSearch] = useState<string>('');

  const searchDebounced = useDebounce<string>(search, 500);

  const { data: namespaces, isLoading } = useNamespaceProjects(namespace, {
    limit,
    offset,
    search: searchDebounced,
  });

  const selectedNamespace = namespaces?.items.find((v) => v.namespace === value);
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
        namespaces?.items.map((n) => ({
          label: `${n.namespace}/${n.name}:${n.tag}`,
          value: `${n.namespace}/${n.name}:${n.tag}`,
        })) || []
      }
      placeholder="Search"
      isClearable
      menuPlacement="bottom"
      controlShouldRenderValue={true}
    />
  );
};
