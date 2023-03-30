import { FC } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Modal } from 'react-bootstrap';
import { useSession } from '../../hooks/useSession';

interface Props {
  namespace: string;
  project: string;
  tag: string;
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

export const ForkPEPModal: FC<Props> = ({ namespace, project, tag, show, onHide }) => {
  const { user } = useSession();

  // form stuff
  const {
    reset: resetForm,
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<ForkProjectInputs>({
    defaultValues: {
      namespace,
      project,
      tag: tag || 'default',
    },
  });
  const onSubmit: SubmitHandler<ForkProjectInputs> = (data) => alert(JSON.stringify(data, null, 2));

  return (
    <Modal size="lg" centered animation={false} show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <h1 className="modal-title fs-5">Fork PEP</h1>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4 border-bottom">
            <p className="mb-3 lh-sm">
              <i className="bi bi-info-circle me-1"></i>A fork is a copy of a Project. Forking a project allows you to
              freely experiment with changes without affecting the original PEP.
            </p>
          </div>
          <div className="mb-3 form-check form-switch">
            <input
              {...register('is_private')}
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="blank-is-private-toggle"
            />
            <label className="form-check-label">
              <i className="bi bi-lock"></i>
              Private
            </label>
          </div>
          <span className="fs-4 d-flex align-items-center">
            <select
              {...register('namespace', { required: true })}
              id="fork-namespace-select"
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
              {...register('project', { required: true })}
              id="fork-project-name"
              type="text"
              className="form-control"
              placeholder="project name"
            />
            <span className="mx-1 mb-1">:</span>
            <input id="fork-tag" name="fork-tag" type="text" className="form-control" placeholder="default" />
          </span>
          <p className="mt-1 lh-sm text-muted" style={{ fontSize: '0.9rem' }}>
            {' '}
            By default, forks are named the same as their original project. You can customize the name to distinguish it
            further.{' '}
          </p>
          <textarea
            {...register('description')}
            id="fork-description"
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
        <button disabled={!isValid} id="fork-submit-btn" type="submit" className="btn btn-success">
          Fork
        </button>
      </Modal.Footer>
    </Modal>
  );
};
