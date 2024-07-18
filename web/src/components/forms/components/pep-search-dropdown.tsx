import { useState } from 'react';
import Select from 'react-select';
import { useDebounce } from 'usehooks-ts';

import { useNamespaceProjects } from '../../../hooks/queries/useNamespaceProjects';

interface Props {
  namespace: string;
  value: string | undefined;
  onChange: (value: string) => void;
  projectNameOnly?: boolean;
  type?: 'pep' | 'pop';
}

export const PepSearchDropdown = (props: Props) => {
  const { value, onChange, namespace } = props;

  // value always has the format: namespace/project:tag
  // so we need to split it to get the namespace, project, and tag
  const namespaceFromValue = value?.split('/')[0] || '';
  const [projectName, tag] = value?.split('/')[1].split(':') || '';

  const limit = 100;
  const offset = 0;
  const [search, setSearch] = useState<string>('');

  const searchDebounced = useDebounce<string>(search, 500);

  const { data: projects, isLoading } = useNamespaceProjects(namespace, {
    limit,
    offset,
    search: searchDebounced,
    type: props.type,
  });

  const selectedProject = projects?.results.find(
    (v) => v.namespace === namespaceFromValue && v.name === projectName && v.tag === tag,
  );

  let selectValue;
  if (selectedProject !== undefined) {
    selectValue = {
      label: props.projectNameOnly
        ? `${selectedProject.name}:${selectedProject.tag}`
        : `${selectedProject.namespace}/${selectedProject.name}:${selectedProject.tag}`,
      value: `${selectedProject.namespace}/${selectedProject.name}:${selectedProject.tag}`,
    };
  } else {
    selectValue = null;
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
        projects?.results.map((n) => ({
          label: props.projectNameOnly ? `${n.name}:${n.tag}` : `${n.namespace}/${n.name}:${n.tag}`,
          value: `${n.namespace}/${n.name}:${n.tag}`,
        })) || []
      }
      placeholder="Search for PEPs"
      menuPlacement="bottom"
      controlShouldRenderValue={true}
    />
  );
};
