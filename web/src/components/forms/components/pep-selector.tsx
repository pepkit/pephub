import { FC, useEffect, useState } from 'react';
import Select, { MultiValue } from 'react-select';
import { useDebounce } from 'usehooks-ts';

import { ProjectAnnotation } from '../../../../types';
import { useSession } from '../../../contexts/session-context';
import { useNamespaceProjects } from '../../../hooks/queries/useNamespaceProjects';
import { NamespaceSearchDropdown } from './namespace-search-dropdown';

interface Props {
  value: ProjectAnnotation[];
  onChange: (value: ProjectAnnotation[]) => void;
}

const PepSelector: FC<Props> = ({ onChange, value }) => {
  const { user } = useSession();

  const [search, setSearch] = useState<string>('');
  const [namespace, setNamespace] = useState<string>(user?.login || '');
  const [cachedOptions, setCachedOptions] = useState<ProjectAnnotation[]>([]);

  const searchDebounced = useDebounce<string>(search, 500);

  const { data: projects, isLoading } = useNamespaceProjects(namespace, {
    limit: 100,
    search: searchDebounced,
  });

  const mapOptions = (projects: ProjectAnnotation[]) => {
    return projects.map((project) => ({
      label: `${project.namespace}/${project.name}:${project.tag}`,
      value: `${project.namespace}/${project.name}:${project.tag}`,
      annotation: project,
    }));
  };

  // this is weird, but it ultimately enables
  // us to add PEPs across namespaces
  // to our POP - we need to "remember" the
  // projects we've seen before, because it
  // changes each time we change namespace
  useEffect(() => {
    if (projects?.results) {
      // see if any new projects are in the list
      const newProjects = projects.results.filter((project) => !cachedOptions.find((p) => p.digest === project.digest));
      if (newProjects.length > 0) {
        setCachedOptions([...cachedOptions, ...newProjects]);
      }
    }
  }, [projects]);

  return (
    <div className="d-flex flex-row align-items-center">
      <div className="w-25 me-1">
        <NamespaceSearchDropdown
          value={namespace}
          onChange={(value) => {
            setNamespace(value);
          }}
        />
      </div>
      <div className="w-75">
        <Select
          className="w-100"
          isMulti
          isLoading={isLoading}
          inputValue={search}
          value={value.map((v) => ({
            label: `${v.namespace}/${v.name}:${v.tag}`,
            value: `${v.namespace}/${v.name}:${v.tag}`,
            annotation: v,
          }))}
          onInputChange={(newValue) => setSearch(newValue)}
          options={mapOptions(projects?.results || [])}
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
    </div>
  );
};

export { PepSelector };
