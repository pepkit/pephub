import { FC, useEffect, useState } from 'react';
import Select, { MultiValue } from 'react-select';

import { ProjectAnnotation } from '../../../../types';
import { useNamespaceProjects } from '../../../hooks/queries/useNamespaceProjects';

interface Props {
  namespace: string;
  value?: ProjectAnnotation[];
  onChange: (value: ProjectAnnotation[]) => void;
}

const PepSelector: FC<Props> = ({ onChange, namespace }) => {
  const [search, setSearch] = useState<string>('');

  const { data: projects, isLoading } = useNamespaceProjects(namespace, {
    limit: 100,
    search: search,
  });

  const options = (projects?.items || [{} as ProjectAnnotation]).map((project) => ({
    label: `${project.namespace}/${project.name}:${project.tag}`,
    value: `${project.namespace}/${project.name}:${project.tag}`,
    annotation: project,
  }));

  return (
    <div>
      <Select
        isMulti
        isLoading={isLoading}
        inputValue={search}
        onInputChange={(newValue) => setSearch(newValue)}
        options={options}
        // value={options.find((option) => option.value === value)}
        onChange={(newValue: MultiValue<{ label: string; value: string; annotation: ProjectAnnotation }>) => {
          const mapped = newValue?.map((v) => v.annotation) || [];
          onChange(mapped);
        }}
        placeholder={'Search'}
        isClearable
        menuPlacement="bottom"
        controlShouldRenderValue={false}
      />
    </div>
  );
};

export { PepSelector };
