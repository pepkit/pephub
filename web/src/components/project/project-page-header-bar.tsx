import { Fragment, useEffect, useState } from 'react';
import { Breadcrumb, Dropdown } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';

import { AddToPOPModal } from '../../components/modals/add-to-pop';
import { DeletePEPModal } from '../../components/modals/delete-pep';
import { EditMetaMetadataModal } from '../../components/modals/edit-meta-metadata';
import { ForkPEPModal } from '../../components/modals/fork-pep';
import { ProjectAPIEndpointsModal } from '../../components/modals/project-api-endpoints';
import { useProjectPage } from '../../contexts/project-page-context';
import { useSession } from '../../contexts/session-context';
import { useAddStar } from '../../hooks/mutations/useAddStar';
import { useRemoveStar } from '../../hooks/mutations/useRemoveStar';
import { useNamespaceStars } from '../../hooks/queries/useNamespaceStars';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { useStandardizeModalStore } from '../../hooks/stores/useStandardizeModalStore';
import { copyToClipboard, getOS, numberWithCommas } from '../../utils/etc';
import { canEdit } from '../../utils/permissions';
import { downloadZip } from '../../utils/project';
import { ProjectHistoryModal } from '../modals/project-history';
import { ProjectHeaderBarPlaceholder } from './placeholders/project-header-bar-placeholder';
import { ProjectStars } from './project-stars';

type Props = {
  sampleTable: ReturnType<typeof useSampleTable>['data'];
  sampleTableIndex: string;
};

export const ProjectHeaderBar = (props: Props) => {
  const { sampleTable, sampleTableIndex } = props;

  const { user, login, jwt } = useSession();

  const [searchParams] = useSearchParams();

  // get fork from url
  const fork = searchParams.get('fork');

  // get project info
  const { namespace, projectName, tag, forceTraditionalInterface, setForceTraditionalInterface } = useProjectPage();

  // add star and remove star mutations
  const { data: stars, isLoading } = useNamespaceStars(user?.login, {}, true);
  const { isPending: isAddingStar, addStar } = useAddStar(user?.login);
  const { isPending: isRemovingStar, removeStar } = useRemoveStar(user?.login);

  // local state
  const [copied, setCopied] = useState(false);
  const [showDeletePEPModal, setShowDeletePEPModal] = useState(false);
  const [showForkPEPModal, setShowForkPEPModal] = useState(false);
  const [showAPIEndpointsModal, setShowAPIEndpointsModal] = useState(false);
  const [showEditMetaMetadataModal, setShowEditMetaMetadataModal] = useState(false);
  const [showAddToPOPModal, setShowAddToPOPModal] = useState(false);
  const [showProjectHistoryModal, setShowProjectHistoryModal] = useState(false);

  const { showStandardizeMetadataModal, setShowStandardizeMetadataModal } = useStandardizeModalStore();

  // queries
  const projectAnnotationQuery = useProjectAnnotation(namespace, projectName, tag);
  const projectInfo = projectAnnotationQuery.data;

  // is starred?
  const isStarred =
    stars?.find((star) => star.namespace === projectInfo?.namespace && star.name === projectInfo?.name) !== undefined;

  // watch for the fork query param to open the fork modal
  useEffect(() => {
    if (fork) {
      if (user) {
        setShowForkPEPModal(true);
      } else {
        login();
      }
    }
  }, [fork]);

  // key bindings for opening header
  useEffect(() => {
    const os = getOS();

    const handleKeyDown = (e: KeyboardEvent) => {
      let ctrlKey = false;
      switch (os) {
        case 'Mac OS':
          ctrlKey = e.metaKey;
          break;
        default:
          ctrlKey = e.ctrlKey;
          break;
      }
      // OPEN HISTORY MODAL
      if (ctrlKey && e.key === 'h') {
        e.preventDefault();
        setShowProjectHistoryModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // if (true) {
  if (projectAnnotationQuery.isLoading) {
    return <ProjectHeaderBarPlaceholder />;
  }

  return (
    <div className="d-flex align-items-start justify-content-between mx-0 mb-1 row">
      <div className="d-flex flex-row align-items-center col-md-6">
        <Breadcrumb className="fw-bold pt-2">
          <Breadcrumb.Item href="/">home</Breadcrumb.Item>
          <Breadcrumb.Item href={`/${namespace}`}>{namespace}</Breadcrumb.Item>
          <Breadcrumb.Item active>
            {projectName}:{tag}
          </Breadcrumb.Item>
          {projectInfo?.is_private && (
            <li>
              <span className="border py-1 ms-2 badge rounded-pill border-danger text-danger">Private</span>
            </li>
          )}
        </Breadcrumb>
      </div>
      <div className="d-flex align-items-center gap-1 justify-content-end pt-2 col-md-6">
        <div className="d-flex flex-row align-items-center">
          <div className="border border-dark shadow-sm rounded-1 ps-2 d-flex align-items-center">
            <span className="text-sm fw-bold">
              {projectAnnotationQuery.data
                ? `${projectInfo?.namespace}/${projectInfo?.name}:${projectInfo?.tag || 'default'}`
                : 'Loading'}
            </span>
            <button
              className="btn btn-sm btn-link-dark shadow-none ms-1 pe-2 border-0"
              onClick={() => {
                copyToClipboard(`${projectInfo?.namespace}/${projectInfo?.name}:${projectInfo?.tag || 'default'}`);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 1000);
              }}
            >
              {copied ? <i className="bi bi-check"></i> : <i className="bi bi-clipboard" />}
            </button>
          </div>
        </div>
        {projectInfo && !isLoading ? (
          <ProjectStars project={projectInfo} isStarred={isStarred} starNumber={projectInfo.stars_number} />
        ) : null}
        <Dropdown>
          <Dropdown.Toggle size="sm" variant="dark">
            <i className="bi bi-gear-fill me-1"></i>
            More
          </Dropdown.Toggle>
          <Dropdown.Menu className="border border-light-subtle shadow">
            <Dropdown.Item onClick={() => downloadZip(namespace, projectName, tag, jwt)}>
              <i className="bi bi-file-earmark-zip me-1"></i>
              Download
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setShowAPIEndpointsModal(true)}>
              <i className="bi bi-hdd-rack me-1"></i>
              API
            </Dropdown.Item>
            <Fragment>
              {user && (
                <Fragment>
                  <Dropdown.Item onClick={() => setShowForkPEPModal(true)}>
                    <i className="me-1 bi bi-bezier2"></i>
                    Fork
                  </Dropdown.Item>
                  {!projectInfo?.pop && (
                    <>
                      <Dropdown.Item onClick={() => setShowAddToPOPModal(true)}>
                        <i className="me-1 bi bi-plus-circle"></i>
                        Add to POP
                      </Dropdown.Item>
                    </>
                  )}
                </Fragment>
              )}
            </Fragment>
            <Fragment>
              {projectInfo?.pop && (
                <Fragment>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => setForceTraditionalInterface(!forceTraditionalInterface)}>
                    <i className="me-1 bi bi-layout-text-sidebar-reverse"></i>
                    {forceTraditionalInterface ? 'View as POP' : 'View as PEP'}
                  </Dropdown.Item>
                </Fragment>
              )}
            </Fragment>
            <Fragment>
              {user && projectInfo && canEdit(user, projectInfo) && (
                <Fragment>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => setShowEditMetaMetadataModal(true)}>
                    <i className="me-1 bi bi-pencil-square"></i>
                    Edit
                  </Dropdown.Item>
                  {!projectInfo.pop && (
                    <>
                      <Dropdown.Item onClick={() => setShowProjectHistoryModal(true)}>
                        <i className="me-1 bi bi-stopwatch" />
                        History
                      </Dropdown.Item>
                      {/* <Dropdown.Item onClick={() => setShowStandardizeMetadataModal(true)}>
                        <i className="me-1 bi bi-magic"></i>
                        Standardize
                      </Dropdown.Item> */}
                    </>
                  )}
                  <Dropdown.Item className="text-danger" onClick={() => setShowDeletePEPModal(true)}>
                    <i className="me-1 bi bi-trash3"></i>
                    Delete
                  </Dropdown.Item>
                </Fragment>
              )}
            </Fragment>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <EditMetaMetadataModal
        show={showEditMetaMetadataModal}
        onHide={() => setShowEditMetaMetadataModal(false)}
        namespace={namespace}
        project={projectName}
        tag={tag}
      />
      <ProjectAPIEndpointsModal
        show={showAPIEndpointsModal}
        onHide={() => setShowAPIEndpointsModal(false)}
        namespace={namespace || ''}
        project={projectName}
        tag={tag}
      />
      <DeletePEPModal
        show={showDeletePEPModal}
        onHide={() => setShowDeletePEPModal(false)}
        namespace={namespace}
        project={projectName}
        tag={tag}
        redirect={`/${user?.login}`}
      />
      <ForkPEPModal
        show={showForkPEPModal}
        onHide={() => setShowForkPEPModal(false)}
        namespace={namespace}
        project={projectName}
        description={projectInfo?.description || 'No description'}
        tag={tag}
      />
      <AddToPOPModal
        show={showAddToPOPModal}
        onHide={() => setShowAddToPOPModal(false)}
        namespace={namespace!}
        project={projectName}
        tag={tag}
      />
      <ProjectHistoryModal
        show={showProjectHistoryModal}
        onHide={() => setShowProjectHistoryModal(false)}
        namespace={namespace}
        project={projectName}
        tag={tag}
      />
    </div>
  );
};
