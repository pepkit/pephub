import { FC, useEffect, useState } from 'react';
import Select, { MultiValue } from 'react-select';

import { ProjectAnnotation } from '../../../../types';
import { useNamespaceProjects } from '../../../hooks/queries/useNamespaceProjects';
import { useSession } from '../../../hooks/useSession';

interface Props {
  value: ProjectAnnotation[];
  onChange: (value: ProjectAnnotation[]) => void;
}

const PepSelector: FC<Props> = ({ onChange, value }) => {
  const { user } = useSession();

  const [search, setSearch] = useState<string>('');
  const [namespace, setNamespace] = useState<string>(user?.login || '');
  const [cachedOptions, setCachedOptions] = useState<ProjectAnnotation[]>([]);

  const { data: projects, isLoading } = useNamespaceProjects(namespace, {
    limit: 100,
    search: search,
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
    if (projects?.items) {
      // see if any new projects are in the list
      const newProjects = projects.items.filter((project) => !cachedOptions.find((p) => p.digest === project.digest));
      if (newProjects.length > 0) {
        setCachedOptions([...cachedOptions, ...newProjects]);
      }
    }
  }, [projects]);

  return (
    <div className="d-flex flex-row align-items-center">
      <select
        className="form-control w-25 me-1 border"
        value={namespace}
        onChange={(e) => setNamespace(e.target.value)}
        disabled={isLoading}
      >
        <option value={user?.login}>{user?.login}</option>
        {user?.orgs.map((org) => (
          <option key={org}>{org}</option>
        ))}
      </select>
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
        options={mapOptions(cachedOptions)}
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
