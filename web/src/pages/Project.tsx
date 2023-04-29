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

type ProjectView = 'samples' | 'subsamples' | 'config';

const API_HOST = import.meta.env.VITE_API_HOST || '';
const API_BASE = `${API_HOST}/api/v1`;

export const ProjectPage: FC = () => {
  const { user, jwt } = useSession();

  const queryClient = useQueryClient();

  const { namespace, project } = useParams();
  let [searchParams] = useSearchParams();
  const tag = searchParams.get('tag') || 'default';

  const { data: projectInfo, isLoading: projectInfoIsLoading } = useProject(namespace, project || '', tag, jwt);
  const { data: projectSamples } = useSampleTable(namespace, project, tag, jwt);
  const { data: projectConfig, isLoading: projectConfigIsLoading } = useProjectConfig(
    namespace,
    project || '',
    tag,
    'yaml',
    jwt,
  );

  // state
  const [projectView, setProjectView] = useState<ProjectView>('config');
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

  return (
    <PageLayout
      fullWidth
      footer={false}
      title={`${namespace}/${project}:${tag}`}
      description={projectInfo?.description || undefined}
      image={`${API_BASE}/projects/${namespace}/${project}/og-image?tag=${tag}`}
    >
      {/* breadcrumbs */}
      <div className="d-flex flex-row align-items-center justify-content-between px-4 mt-2">
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
        <div className="d-flex flex-row align-items-center">
          <Dropdown className="me-1">
            <Dropdown.Toggle variant="outline-dark" size="sm">
              <i className="bi bi-three-dots me-1"></i>
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-lg">
              <Dropdown.Item onClick={() => setShowAPIEndpointsModal(true)}>
                <i className="bi bi-hdd-rack me-1"></i>
                API Endpoints
              </Dropdown.Item>
              <Dropdown.Item onClick={() => downloadZip()}>
                <i className="bi bi-file-earmark-zip me-1"></i>
                Download zip
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setShowCompatibilityModal(true)}>
                <i className="me-1 bi bi-intersect"></i>
                Compatibility
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          {user ? (
            <button className="btn btn-sm btn-outline-dark me-1" onClick={() => setShowForkPEPModal(true)}>
              <i className="me-1 bi bi-bezier2"></i>
              Fork
            </button>
          ) : null}
          {
            // if user is logged in and is owner of project
            user && projectInfo && canEdit(user, projectInfo) ? (
              <Dropdown className="me-1">
                <Dropdown.Toggle variant="outline-dark" size="sm">
                  <i className="bi bi-gear"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow-lg">
                  <Dropdown.Item onClick={() => setShowEditMetaMetadataModal(true)}>
                    {/*  pencil write */}
                    <i className="bi bi-pencil-square me-1"></i>
                    Edit
                  </Dropdown.Item>
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
      <div className="px-4">
        <p>{projectInfo?.description}</p>
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
              </div>
              <div>
                {configIsDirty || samplesIsDirty ? (
                  <>
                    <button
                      disabled={configMutation.isLoading || sampleTableMutation.isLoading}
                      onClick={() => handleProjectChange()}
                      className="fst-italic btn btn-sm btn-success me-1 mb-1 border-dark"
                    >
                      {configMutation.isLoading || sampleTableMutation.isLoading ? 'Saving...' : 'Save changes?'}
                    </button>
                    <button
                      className="fst-italic btn btn-sm btn-outline-dark me-1 mb-1"
                      onClick={() => {
                        resetConfig();
                        resetSamples();
                      }}
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
      <div className="row h-100">
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
