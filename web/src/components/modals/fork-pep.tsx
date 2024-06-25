import { ErrorMessage } from '@hookform/error-message';
import { FC } from 'react';
import { Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

import { useForkMutation } from '../../hooks/mutations/useForkMutation';
import { useSession } from '../../hooks/useSession';

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

const CombinedErrorMessage = ({ errors }) => {
  const projectError = errors.project?.message;
  const tagError = errors.tag?.message;

  if (projectError && tagError) {
    return (
      <p className='text-danger pt-1 text-xs'>
        Project Name and Tag must contain only alphanumeric characters, '-', or '_'.
      </p>
    );
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

  const mutation = useForkMutation(
    namespace,
    project,
    tag,
    projectNamespace,
    projectName,
    projectTag,
    projectDescription,
    onHide,
  );

  const isBadName = projectName
    ? /[^0-9a-zA-Z_-]/.test(projectName)
      ? "Project Name must contain only alphanumeric characters, '-', or '_'."
      : null
    : 'Project Name must not be empty.';
  const isBadTag = projectTag
    ? /[^0-9a-zA-Z_-]/.test(projectTag)
      ? "Project Tag must contain only alphanumeric characters, '-', or '_'."
      : null
    : 'Project Tag must not be empty.';

  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Fork PEP</h1>
      </Modal.Header>
      <Modal.Body>
        <form>
          <div className="mb-4 border-bottom">
            <p className="mb-3 lh-sm">
              <i className="bi bi-info-circle me-1"></i>A fork is a copy of a Project. Forking a project allows you to
              freely experiment with changes without affecting the original PEP.
            </p>
          </div>
          <div className="mb-3 form-check form-switch">
            <input {...register('is_private')} className="form-check-input" type="checkbox" role="switch" />
            <label className="form-check-label">
              <i className="bi bi-lock"></i>
              Private
            </label>
          </div>
          <span className="fs-4 d-flex align-items-center">
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
                  message: "Project Name must not be empty.",
                },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: "Project Name must contain only alphanumeric characters, '-', or '_'.",
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
                  message: "Project Tag must not be empty.",
                },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: "Project Tag must contain only alphanumeric characters, '-', or '_'.",
                },
              })}
            />
          </span>
          <CombinedErrorMessage errors={errors} />
          <ErrorMessage errors={errors} name="project" render={({ message }) => message && !errors.tag ? (<p className='text-danger text-xs pt-1'>{message}</p>) : null} />
          <ErrorMessage errors={errors} name="tag" render={({ message }) => message && !errors.project ? (<p className='text-danger text-xs pt-1'>{message}</p>) : null} />
          <p className="mt-1 lh-sm text-muted" style={{ fontSize: '0.9rem' }}>
            {' '}
            By default, forks are named the same as their original project. You can customize the name to distinguish it
            further.{' '}
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
          onClick={() => mutation.mutate()}
          disabled={!isValid || isBadName || isBadTag || mutation.isPending}
          id="fork-submit-btn"
          type="submit"
          className="btn btn-success"
        >
          {mutation.isPending ? 'Forking...' : 'Fork'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
