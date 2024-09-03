import { ErrorMessage } from '@hookform/error-message';
import { FC } from 'react';
import { Modal } from 'react-bootstrap';
import { FieldErrors, useForm } from 'react-hook-form';

import { useSession } from '../../contexts/session-context';
import { useForkMutation } from '../../hooks/mutations/useForkMutation';

interface Props {
  namespace: string;
  project: string;
  tag: string;
  description?: string;
  show: boolean;
  onHide: () => void;
}

interface ForkProjectInputs {
  namespace: string;
  project: string;
  tag?: string;
  description: string;
  is_private: boolean;
}

type CombinedErrorMessageProps = {
  errors: FieldErrors<ForkProjectInputs>;
};

const CombinedErrorMessage = (props: CombinedErrorMessageProps) => {
  const { errors } = props;
  const nameError = errors.project?.message;
  const tagError = errors.tag?.message;
  let msg = null;

  if (nameError == 'empty' && !tagError) {
    msg = 'Project Name must not be empty.';
  } else if (nameError == 'invalid' && !tagError) {
    msg = "Project Name must contain only alphanumeric characters, '-', or '_'.";
  } else if (nameError == 'empty' && tagError == 'invalid') {
    msg = "Project Name must not be empty and Tag must contain only alphanumeric characters, '-', or '_'.";
  } else if (nameError == 'invalid' && tagError == 'invalid') {
    msg = "Project Name and Tag must contain only alphanumeric characters, '-', or '_'.";
  } else if (nameError == 'empty' && tagError == 'empty') {
    msg = 'Project Name and Tag must not be empty.';
  } else if (nameError == 'invalid' && tagError == 'empty') {
    msg = "Project Name must contain only alphanumeric characters, '-', or '_' and Tag must not be empty.";
  } else if (!nameError && tagError == 'empty') {
    msg = 'Project Tag must not be empty.';
  } else if (!nameError && tagError == 'invalid') {
    msg = "Project Tag must contain only alphanumeric characters, '-', or '_'.";
  }

  if (nameError || tagError) {
    return <p className="text-danger text-xs pt-1">{msg}</p>;
  }

  return null;
};

export const ForkPEPModal: FC<Props> = ({ namespace, project, tag, description, show, onHide }) => {
  const { user } = useSession();

  // form stuff
  const {
    reset: resetForm,
    register,
    watch,
    formState: { isValid, errors },
  } = useForm<ForkProjectInputs>({
    mode: 'onChange',
    defaultValues: {
      namespace: user?.login,
      project: project,
      tag: tag || 'default',
      description: description || '',
    },
  });

  const projectName = watch('project');
  const projectNamespace = watch('namespace');
  const projectTag = watch('tag');
  const projectDescription = watch('description');

  const { isPending: isForking, fork } = useForkMutation(namespace, project, tag);

  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Fork PEP</h1>
      </Modal.Header>
      <Modal.Body>
        <form>
          <div className="mb-4 border-bottom">
            <p className="mb-3 lh-sm">
              <i className="bi bi-info-circle me-1 text-sm"></i>A fork is a copy of a Project. Forking a project allows you to
              freely experiment with changes without affecting the original PEP. By default, forks are named the same as their original project. You can customize the name to distinguish it
            further.
            </p>
          </div>
          <div className="mb-3 form-check form-switch">
            <input {...register('is_private')} className="form-check-input" type="checkbox" role="switch" />
            <label className="form-check-label">
              <i className="bi bi-lock"></i>
              Private
            </label>

          </div>
          <div className="namespace-name-tag-container">
            <label className="fw-bold text-sm">Namespace *</label>
            <label className="fw-bold text-sm">Name *</label>
            <label className="fw-bold text-sm">Tag</label>
          </div>
          <div className="namespace-name-tag-container fs-4 w-full">
            <div className="d-flex flex-row align-items-center justify-content-between w-full">
              <select
                id="blank-namespace-select"
                className="form-select"
                aria-label="Namespace selection"
                {...register('namespace', { required: true })}
              >
                <option value={user?.login}>{user?.login}</option>
                {user?.orgs.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
              <span className="mx-1 mb-1">/</span>
            </div>
            <div className="d-flex flex-row align-items-center justify-content-between w-full">
              {/*<input
                // dont allow any whitespace
                {...register('project_name', {
                  required: true,
                  pattern: {
                    value: /^\S+$/,
                    message: 'No spaces allowed.',
                  },
                })}
                id="blank-project-name"
                type="text"
                className="form-control"
                placeholder="name"
              />*/}
              <input
                // {...register('project', { required: true })}
                type="text"
                className="form-control"
                placeholder="project name"
                id="blank-project-name"
                {...register('project', {
                  required: {
                    value: true,
                    message: 'empty',
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_-]+$/,
                    message: 'invalid',
                  },
                })}
              />
              <span className="mx-1 mb-1">:</span>
            </div>
            {/*<input {...register('tag')} id="blank_tag" type="text" className="form-control" placeholder="default" />*/}
            <input
              // {...register('tag', { required: true })}
              type="text"
              className="form-control"
              placeholder="default"
              id="blank_tag" 
              {...register('tag', {
                // required: {
                //   value: true,
                //   message: 'empty',
                // },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: 'invalid',
                },
              })}
            />
          </div>
          {/*<span className="fs-4 d-flex align-items-center">
            <select
              {...register('namespace', { required: true })}
              className="form-select w-75"
              aria-label="Namespace selection"
            >
              <option value={user?.login}>{user?.login}</option>
              {user?.orgs.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
            <span className="mx-1 mb-1">/</span>
            <input
              // {...register('project', { required: true })}
              type="text"
              className="form-control"
              placeholder="project name"
              {...register('project', {
                required: {
                  value: true,
                  message: 'empty',
                },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: 'invalid',
                },
              })}
            />
            <span className="mx-1 mb-1">:</span>
            <input
              // {...register('tag', { required: true })}
              type="text"
              className="form-control"
              placeholder="default"
              {...register('tag', {
                required: {
                  value: true,
                  message: 'empty',
                },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: 'invalid',
                },
              })}
            />
          </span>
*/}          <CombinedErrorMessage errors={errors} />
          <p className='text-xs'>
              * Namespace and Project Name are required. A tag value of "default" will be supplied if the Tag input is left empty.
            </p>
          <textarea
            {...(register('description'),
            {
              defaultValue: description,
            })}
            className="form-control mt-3"
            rows={3}
            placeholder="Describe your PEP."
          ></textarea>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={() => {
            onHide();
            resetForm();
          }}
          type="button"
          className="btn btn-outline-dark"
        >
          Cancel
        </button>
        <button
          onClick={() =>
            fork(
              {
                forkTo: projectNamespace,
                forkName: projectName,
                forkTag: projectTag,
                forkDescription: projectDescription,
              },
              {
                onSuccess: () => {
                  onHide();
                  resetForm();
                },
              },
            )
          }
          disabled={!isValid || !!errors.project?.message || !!errors.tag?.message || !!isForking}
          id="fork-submit-btn"
          type="submit"
          className="btn btn-success"
        >
          {isForking ? 'Forking...' : 'Fork'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
