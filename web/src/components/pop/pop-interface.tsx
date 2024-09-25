import { Fragment, useState } from 'react';
import toast from 'react-hot-toast';

import { ProjectAnnotation } from '../../../types';
import { useProjectPage } from '../../contexts/project-page-context';
import { useSession } from '../../contexts/session-context';
import { useSampleTableMutation } from '../../hooks/mutations/useSampleTableMutation';
import { useMultiProjectAnnotation } from '../../hooks/queries/useMultiProjectAnnotation';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { useSubsampleTable } from '../../hooks/queries/useSubsampleTable';
import { useProjectConfig } from '../../hooks/queries/useProjectConfig';
import { NamespaceSearchDropdown } from '../forms/components/namespace-search-dropdown';
import { PepSearchDropdown } from '../forms/components/pep-search-dropdown';
import { ProjectCardPlaceholder } from '../placeholders/project-card-placeholder';
import { LoadingSpinner } from '../spinners/loading-spinner';
import { PopCard } from './pop-card';
import { useTotalProjectChangeMutation } from '../../hooks/mutations/useTotalProjectChangeMutation';

type Props = {
  projectInfo: ReturnType<typeof useProjectAnnotation>['data'];
  sampleTable: ReturnType<typeof useSampleTable>['data'];
  subSampleTable: ReturnType<typeof useSubsampleTable>['data'];
  projectConfig: ReturnType<typeof useProjectConfig>['data'];
};

export const PopInterface = (props: Props) => {
  const { projectInfo, subSampleTable, projectConfig } = props;

  const { namespace, projectName, tag } = useProjectPage();

  const { user } = useSession();
  const { data: peps } = useSampleTable({
    namespace,
    project: projectName,
    tag,
  });
  const { data: allProjectsInfo, isFetching: isLoading } = useMultiProjectAnnotation(
    peps?.items.map((p) => `${p.namespace}/${p.name}:${p.tag}`),
  );

  const [addToPopNamespace, setAddToPopNamespace] = useState<string>('');
  const [addToPopRegistry, setAddToPopRegistry] = useState<string | undefined>(undefined);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // const { isPending: isSampleTablePending, submit } = useSampleTableMutation(namespace, projectName, tag);
  const { isPending: isSampleTablePending, submit } = useTotalProjectChangeMutation(namespace, projectName, tag);

  if (isLoading) {
    return (
      <Fragment>
        <div className="mt-3 border-top w-100"></div>
        <div className="px-2">
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <ProjectCardPlaceholder key={i} />
            ))}
          </div>
        </div>
      </Fragment>
    );
  } else {
    return (
      <Fragment>
        <div className="px-2">
          <div className="mt-1 w-100"></div>
          <div className="px-2">
            <div className="d-flex flex-column">
              {allProjectsInfo?.results.map((project: ProjectAnnotation | null) =>
                project === null ? null : (
                  <PopCard
                    parentNamespace={namespace}
                    parentName={projectName}
                    parentTag={tag}
                    currentPeps={peps?.items || []}
                    key={`${project.namespace}/${project.name}:${project.tag}`}
                    project={project}
                  />
                ),
              )}
            </div>
            {user && (user.login === namespace || user.orgs.includes(namespace)) && (
              <div className="d-flex flex-row align-items-center justify-content-center my-3">
                {!isAddingNew ? (
                  <button className="btn btn-success" onClick={() => setIsAddingNew(true)}>
                    <i className="bi bi-plus-circle me-1"></i>
                    Add
                  </button>
                ) : (
                  <div className="d-flex flex-column w-100 align-items-center mb-5">
                    <div className="border-top mt-3 w-100"></div>
                    <div
                      className="bg-white"
                      style={{
                        width: '10%',
                        transform: 'translateY(-30%)',
                      }}
                    >
                      <p className="text-secondary text-sm text-center">
                        <i className="bi bi-plus-circle me-1"></i>
                        Add a new PEP
                      </p>
                    </div>
                    <div className="d-flex flex-row align-items-center gap-2 w-100">
                      <div className="d-flex flex-row align-items-center w-100">
                        <div className="w-25 me-1">
                          <NamespaceSearchDropdown
                            value={addToPopNamespace}
                            onChange={(value) => setAddToPopNamespace(value)}
                          />
                        </div>
                        <div className="w-75">
                          <PepSearchDropdown
                            value={addToPopRegistry}
                            onChange={(value) => setAddToPopRegistry(value)}
                            namespace={addToPopNamespace}
                          />
                        </div>
                      </div>
                      <button
                        className="btn btn-md btn-success"
                        onClick={() => {
                          if (addToPopRegistry === undefined) {
                            toast.error('Please select a PEP to add to the POP.');
                            return;
                          }
                          let newPeps = peps?.items || [];
                          const [newNamespace, newProjectNameAndTag] = addToPopRegistry.split('/');
                          const [newProjectName, newProjectTag] = newProjectNameAndTag.split(':');
                          newPeps?.push({
                            sample_name: `${newNamespace}/${newProjectName}:${newProjectTag}`,
                            namespace: newNamespace,
                            name: newProjectName,
                            tag: newProjectTag,
                          });
                          submit({
                            config: projectConfig?.config,
                            samples: newPeps,
                            subsamples: subSampleTable?.items,
                          });
                        }}
                        disabled={addToPopNamespace === '' || addToPopRegistry === '' || isSampleTablePending}
                      >
                        {isSampleTablePending ? (
                          <Fragment>
                            <span className="d-flex flex-row align-items-center">
                              <LoadingSpinner className="w-4 h-4 spin me-1 fill-light" />
                              Add
                            </span>
                          </Fragment>
                        ) : (
                          <Fragment>Add</Fragment>
                        )}
                      </button>
                      <button className="btn btn-md btn-outline-dark" onClick={() => setIsAddingNew(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Fragment>
    );
  }
};
