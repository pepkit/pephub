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
import { useNamespaceStars } from '../../hooks/queries/useNamespaceStars';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { copyToClipboard, numberWithCommas } from '../../utils/etc';
import { canEdit } from '../../utils/permissions';
import { downloadZip } from '../../utils/project';
import { SchemaTag } from '../forms/components/shema-tag';
import { ProjectHistoryModal } from '../modals/project-history';

type ProjectPageHeaderBarProps = {
  isStarred: boolean;
};

export const ProjectHeaderBar = (props: ProjectPageHeaderBarProps) => {
  const { isStarred } = props;
  const { user, login, jwt } = useSession();

  const [searchParams] = useSearchParams();

  // get fork from url
  const fork = searchParams.get('fork');

  // get project info
  const { namespace, projectName, tag, forceTraditionalInterface, setForceTraditionalInterface } = useProjectPage();

  const { addStarMutation, removeStarMutation } = useNamespaceStars(user?.login || '/', {}, namespace === user?.login);

  const [copied, setCopied] = useState(false);
  const [showDeletePEPModal, setShowDeletePEPModal] = useState(false);
  const [showForkPEPModal, setShowForkPEPModal] = useState(false);
  const [showAPIEndpointsModal, setShowAPIEndpointsModal] = useState(false);
  const [showEditMetaMetadataModal, setShowEditMetaMetadataModal] = useState(false);
  const [showAddToPOPModal, setShowAddToPOPModal] = useState(false);
  const [showProjectHistoryModal, setShowProjectHistoryModal] = useState(false);

  const projectAnnotationQuery = useProjectAnnotation(namespace, projectName, tag);
  const projectInfo = projectAnnotationQuery.data;

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

  return (
    <div className="d-flex flex-row align-items-start justify-content-between px-4 mb-1">
      <div className="d-flex flex-row align-items-center w-75">
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
      <div className="d-flex flex-row align-items-center gap-1 justify-content-end w-100 pt-2">
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
        <Dropdown>
          <Dropdown.Toggle size="sm" variant="dark">
            <i className="bi bi-gear-fill me-1"></i>
            More
          </Dropdown.Toggle>
          <Dropdown.Menu>
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
                  <Dropdown.Item onClick={() => setShowAddToPOPModal(true)}>
                    <i className="me-1 bi bi-plus-circle"></i>
                    Add to POP
                  </Dropdown.Item>
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
                  <Dropdown.Item onClick={() => setShowProjectHistoryModal(true)}>
                    <i className="me-1 bi bi-stopwatch" />
                    History
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setShowEditMetaMetadataModal(true)}>
                    <i className="me-1 bi bi-pencil-square"></i>
                    Edit
                  </Dropdown.Item>
                  <Dropdown.Item className="text-danger" onClick={() => setShowDeletePEPModal(true)}>
                    <i className="me-1 bi bi-trash3"></i>
                    Delete
                  </Dropdown.Item>
                </Fragment>
              )}
            </Fragment>
          </Dropdown.Menu>
        </Dropdown>
        <button
          className="btn btn-outline-dark btn-sm"
          disabled={addStarMutation.isPending || removeStarMutation.isPending}
          onClick={() => {
            if (!user) {
              login();
              return;
            }
            if (isStarred) {
              removeStarMutation.mutate({
                namespaceToRemove: projectInfo?.namespace!,
                projectNameToRemove: projectInfo?.name!,
                projectTagToRemove: projectInfo?.tag!,
              });
            } else {
              addStarMutation.mutate({
                namespaceToStar: projectInfo?.namespace!,
                projectNameToStar: projectInfo?.name!,
                projectTagToStar: projectInfo?.tag!,
              });
            }
          }}
        >
          {isStarred ? (
            <Fragment>
              <span className="text-primary">
                <i className="me-1 bi bi-star-fill"></i>
                Starred
                <span className="px-2 border border-dark rounded-pill text-dark ms-1 bg-dark bg-opacity-10">
                  {numberWithCommas(projectInfo?.stars_number || 0)}
                </span>
              </span>
            </Fragment>
          ) : (
            <Fragment>
              <span>
                <i className="me-1 bi bi-star"></i>
                Star
                <span className="px-2 border border-dark rounded-pill text-dark ms-1 bg-dark bg-opacity-10">
                  {numberWithCommas(projectInfo?.stars_number || 0)}
                </span>
              </span>
            </Fragment>
          )}
        </button>
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
        onHide={() => {
          setShowAddToPOPModal(false);
        }}
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
