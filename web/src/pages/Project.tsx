import { FC, useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { ProjectPageheaderPlaceholder } from '../components/placeholders/project-page-header';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/page-layout';
import { useSession } from '../hooks/useSession';
import { canEdit } from '../utils/permissions';
import { DeletePEPModal } from '../components/modals/delete-pep';
import { ForkPEPModal } from '../components/modals/fork-pep';
import { useProject } from '../hooks/queries/useProject';
import { SampleTable } from '../components/tables/sample-table';
import { useSampleTable } from '../hooks/queries/useSampleTable';
import { ProjectConfigEditor } from '../components/project/project-config';
import { useProjectConfig } from '../hooks/queries/useProjectConfig';
import { ProjectAPIEndpointsModal } from '../components/modals/project-api-endpoints';
import { CompatibilityModal } from '../components/modals/compatibility-modal';
import { Breadcrumb } from 'react-bootstrap';
import { EditMetaMetadataModal } from '../components/modals/edit-meta-metadata';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editProjectConfig, editProjectSampleTable } from '../api/project';
import { toast } from 'react-hot-toast';
import { Markdown } from '../components/markdown/render';
import { SchemaTag } from '../components/forms/components/shema-tag';

type ProjectView = 'samples' | 'subsamples' | 'config';

export const ProjectPage: FC = () => {
  const { user, jwt } = useSession();

  const queryClient = useQueryClient();

  let { namespace, project } = useParams();
  namespace = namespace?.toLowerCase();
  // project = project?.toLowerCase();

  let [searchParams] = useSearchParams();
  const tag = searchParams.get('tag') || 'default';

  const { data: projectInfo, isLoading: projectInfoIsLoading, error } = useProject(namespace, project || '', tag, jwt);
  const { data: projectSamples } = useSampleTable(namespace, project, tag, jwt);
  const { data: projectConfig, isLoading: projectConfigIsLoading } = useProjectConfig(
    namespace,
    project || '',
    tag,
    'yaml',
    jwt,
  );

  // state
  const [projectView, setProjectView] = useState<ProjectView>('samples');
  const [showDeletePEPModal, setShowDeletePEPModal] = useState(false);
  const [showForkPEPModal, setShowForkPEPModal] = useState(false);
  const [showAPIEndpointsModal, setShowAPIEndpointsModal] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [showEditMetaMetadataModal, setShowEditMetaMetadataModal] = useState(false);

  // state for editing config, samples, and subsamples
  const [newProjectConfig, setNewProjectConfig] = useState(projectConfig || '');
  const [newProjectSamples, setNewProjectSamples] = useState(projectSamples || '');
  // const [newProjectSubsamples, setNewProjectSubsamples] = useState(projectSubSamples? || '');

  // watch for query changes to update newProjectConfig and newProjectSamples
  useEffect(() => {
    setNewProjectConfig(projectConfig || '');
    setNewProjectSamples(projectSamples || '');
    // console.log(projectConfig === newProjectConfig, projectSamples === newProjectSamples);
    // if (projectSamples !== newProjectSamples) {
    //   let indx = findStringDifference(projectSamples, newProjectSamples);
    //   console.log(indx);
    //   console.log(projectSamples?.slice(indx - 10, indx + 10));
    //   console.log(newProjectSamples?.slice(indx - 10, indx + 10));
    // }
  }, [projectConfig, projectSamples]);

  const downloadZip = () => {
    const completeName = `${namespace}-${project}-${tag}`;
    fetch(`/api/v1/projects/${namespace}/${project}/zip?tag=${tag}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        var a = document.createElement('a');
        var file = window.URL.createObjectURL(blob);
        a.href = file;
        a.download = completeName + '.zip';
        a.click();
        window.URL.revokeObjectURL(file);
      });
  };

  // check if config or samples are dirty
  const configIsDirty = newProjectConfig !== projectConfig;
  const samplesIsDirty = newProjectSamples.trim() !== projectSamples?.trim();

  // reset config and samples
  const resetConfig = () => {
    setNewProjectConfig(projectConfig || '');
  };
  const resetSamples = () => {
    setNewProjectSamples(projectSamples || '');
  };

  const configMutation = useMutation({
    mutationFn: () => editProjectConfig(namespace || '', project || '', tag, jwt || '', newProjectConfig),
    onSuccess: () => {
      toast.success('Successfully updated project config');
      queryClient.invalidateQueries([namespace, project, tag, 'config']);
    },
    onError: (err) => {
      toast.error(`Error updating project samples: ${err}`);
    },
  });

  const sampleTableMutation = useMutation({
    mutationFn: () => editProjectSampleTable(namespace || '', project || '', tag, jwt || '', newProjectSamples),
    onSuccess: () => {
      toast.success('Successfully updated project samples');
      queryClient.invalidateQueries([namespace, project, tag, 'samples']);
    },
    onError: (err) => {
      toast.error(`Error updating project samples: ${err}`);
    },
  });

  const handleProjectChange = () => {
    if (configIsDirty) {
      configMutation.mutate();
    }
    if (samplesIsDirty) {
      sampleTableMutation.mutate();
    }
  };

  if (error) {
    return (
      <PageLayout fullWidth footer={false} title={`${namespace}/${project}`}>
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
          <h1 className="fw-bold">Error 😫</h1>
          <p className="text-muted fst-italic">An error occured fetching the project... Are you sure it exists?</p>
          <div>
            <a href={`/${namespace}`}>
              <button className="btn btn-dark">Take me back</button>
            </a>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout fullWidth footer={false} title={`${namespace}/${project}`}>
      {/* breadcrumbs */}
      <div className="d-flex flex-row align-items-center justify-content-between px-4 my-2">
        <div className="d-flex flex-row align-items-center">
          <Breadcrumb className="fw-bold">
            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
            <Breadcrumb.Item href={`/${namespace}`}>{namespace}</Breadcrumb.Item>
            <Breadcrumb.Item active>
              {project}:{tag}
            </Breadcrumb.Item>
            {projectInfo?.is_private ? (
              <span className="border py-1 ms-2 badge rounded-pill border-danger text-danger">Private</span>
            ) : null}
          </Breadcrumb>
          <div className="ms-2 mb-2">
            <SchemaTag schema={projectInfo?.pep_schema} />
          </div>
        </div>
        <div className="d-flex flex-row align-items-center">
          <button className="btn btn-sm btn-dark me-1" onClick={() => downloadZip()}>
            <i className="bi bi-file-earmark-zip me-1"></i>
            Download
          </button>
          <button className="btn btn-sm btn-dark me-1" onClick={() => setShowAPIEndpointsModal(true)}>
            <i className="bi bi-hdd-rack me-1"></i>
            API Endpoints
          </button>
          {user ? (
            <button className="btn btn-sm btn-dark me-1" onClick={() => setShowForkPEPModal(true)}>
              <i className="me-1 bi bi-bezier2"></i>
              Fork
            </button>
          ) : null}
          {
            // if user is logged in and is owner of project
            user && projectInfo && canEdit(user, projectInfo) ? (
              <Dropdown>
                <Dropdown.Toggle variant="dark" size="sm">
                  <i className="bi bi-pencil"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow-lg">
                  <Dropdown.Item onClick={() => setShowEditMetaMetadataModal(true)}>
                    {/*  pencil write */}
                    <i className="bi bi-pencil-square me-1"></i>
                    Edit project
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item className="text-danger" onClick={() => setShowDeletePEPModal(true)}>
                    <i className="bi bi-trash3 me-1"></i>
                    Delete
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : null
          }
        </div>
      </div>
      <div className="border border-dark mx-4 rounded shadow-sm">
        <div className="border-dark border-bottom p-2 fw-bold text-2xl">Description</div>
        {/*  wrap text */}
        <div className="p-2 break-all">
          <Markdown>{projectInfo?.description || 'No description'}</Markdown>
        </div>
      </div>
      <div className="mt-2 px-2 border-bottom border-dark">
        {projectInfoIsLoading || projectInfo === undefined ? (
          <ProjectPageheaderPlaceholder />
        ) : (
          <>
            <div className="flex-row d-flex align-items-end justify-content-between">
              <div className="d-flex flex-row align-items-center">
                <div
                  className={
                    projectView === 'samples'
                      ? 'border-primary border-bottom bg-transparent px-2 py-1'
                      : 'border-bottom px-2 py-1'
                  }
                >
                  <button
                    onClick={() => setProjectView('samples')}
                    className="border-0 bg-transparent project-button-toggles rounded"
                  >
                    <i className="bi bi-table me-1"></i>
                    Samples
                  </button>
                  {samplesIsDirty ? (
                    <span className="text-xs">
                      <i className="bi bi-circle-fill ms-1 text-primary-light"></i>
                    </span>
                  ) : (
                    //  spacer
                    <span className="text-xs">
                      <i className="bi bi-circle-fill ms-1 text-transparent"></i>
                    </span>
                  )}
                </div>
                <div
                  className={
                    projectView === 'config'
                      ? 'border-primary border-bottom bg-transparent px-2 py-1'
                      : 'border-bottom px-2 py-1'
                  }
                >
                  <button
                    onClick={() => setProjectView('config')}
                    className="border-0 bg-transparent project-button-toggles rounded"
                  >
                    <i className="bi bi-filetype-yml me-1"></i>Config
                    {configIsDirty ? (
                      <span className="text-xs">
                        <i className="bi bi-circle-fill ms-1 text-primary-light"></i>
                      </span>
                    ) : (
                      //  spacer
                      <span className="text-xs">
                        <i className="bi bi-circle-fill ms-1 text-transparent"></i>
                      </span>
                    )}
                  </button>
                </div>
              </div>
              <div>
                {/* no matter what, only render if belonging to the user */}
                {user && projectInfo && canEdit(user, projectInfo) ? (
                  <>
                    <button
                      disabled={
                        configMutation.isLoading || sampleTableMutation.isLoading || !(configIsDirty || samplesIsDirty)
                      }
                      onClick={() => handleProjectChange()}
                      className="fst-italic btn btn-sm btn-success me-1 mb-1 border-dark"
                    >
                      {configMutation.isLoading || sampleTableMutation.isLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="fst-italic btn btn-sm btn-outline-dark me-1 mb-1"
                      onClick={() => {
                        resetConfig();
                        resetSamples();
                      }}
                      disabled={!(configIsDirty || samplesIsDirty)}
                    >
                      Discard
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="row gx-0 h-100">
        <div className="col-12">
          <div>
            {projectView === 'samples' ? (
              <SampleTable
                readOnly={!(projectInfo && canEdit(user, projectInfo))}
                data={newProjectSamples || ''}
                onChange={(value) => setNewProjectSamples(value)}
              />
            ) : (
              <ProjectConfigEditor
                readOnly={!(projectInfo && canEdit(user, projectInfo))}
                value={projectConfigIsLoading ? 'Loading.' : projectConfig ? newProjectConfig : 'No config file found.'}
                setValue={(value) => setNewProjectConfig(value)}
              />
            )}
          </div>
        </div>
      </div>
      {/* Modals */}
      <EditMetaMetadataModal
        show={showEditMetaMetadataModal}
        onHide={() => setShowEditMetaMetadataModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
      />
      <ProjectAPIEndpointsModal
        show={showAPIEndpointsModal}
        onHide={() => setShowAPIEndpointsModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
      />
      <DeletePEPModal
        show={showDeletePEPModal}
        onHide={() => setShowDeletePEPModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
        redirect={`/${user?.login}`}
      />
      <ForkPEPModal
        show={showForkPEPModal}
        onHide={() => setShowForkPEPModal(false)}
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
      />
      <CompatibilityModal
        namespace={namespace || ''}
        project={project || ''}
        tag={tag}
        show={showCompatibilityModal}
        onHide={() => setShowCompatibilityModal(false)}
      />
    </PageLayout>
  );
};
