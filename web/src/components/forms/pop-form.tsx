import { ErrorMessage } from '@hookform/error-message';
import { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ProjectAnnotation } from '../../../types';
import { useBlankProjectFormMutation } from '../../hooks/mutations/useBlankProjectFormMutation';
import { useSession } from '../../hooks/useSession';
import { PepSelector } from './components/pep-selector';

interface POPInputs {
  is_private: boolean;
  namespace: string;
  project_name: string;
  tag: string;
  description: string;
  peps: ProjectAnnotation[];
}

interface Props {
  onHide: () => void;
  defaultNamespace?: string;
}

export const PopForm: FC<Props> = ({ onHide, defaultNamespace }) => {
  // get user innfo
  const { user } = useSession();

  // instantiate form
  const {
    reset: resetForm,
    register,
    watch,
    setValue,
    control,
    formState: { isValid, errors },
  } = useForm<POPInputs>({
    defaultValues: {
      is_private: false,
      namespace: defaultNamespace || user?.login || '',
      project_name: 'new-pop',
      peps: [],
    },
  });

  const namespace = watch('namespace');
  const projectName = watch('project_name');
  const tag = watch('tag');
  const description = watch('description');
  const isPrivate = watch('is_private');
  const peps = watch('peps');

  const mutation = useBlankProjectFormMutation(
    namespace,
    projectName,
    tag,
    isPrivate,
    description,
    '',
    'pep/2.1.0', // default schema
    [],
    onHide,
  );

  return (
    <form id="blank-project-form" className="border-0 form-control">
      <div className="mb-3 mt-3 form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="blank-is-private-toggle"
          {...register('is_private')}
        />
        <label className="form-check-label">
          <i className="bi bi-lock"></i>
          Private
        </label>
      </div>
      <span className="fs-4 d-flex align-items-center">
        <select
          id="blank-namespace-select"
          className="form-select w-75"
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
        <input
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
        />
        <span className="mx-1 mb-1">:</span>
        <input {...register('tag')} id="blank_tag" type="text" className="form-control" placeholder="default" />
      </span>
      <ErrorMessage errors={errors} name="project_name" render={({ message }) => <p>{message}</p>} />
      <textarea
        id="blank_description"
        className="form-control mt-3"
        rows={3}
        placeholder="Describe your POP."
        {...register('description')}
      ></textarea>
      <label className="form-check-label mt-3 mb-1">Add PEPs to your POP</label>
      {/* Add a dropdown here */}
      <div>
        <Controller
          control={control}
          name="peps"
          render={({ field: { onChange, value } }) => (
            <PepSelector
              value={value}
              onChange={(peps) => {
                setValue('peps', peps);
              }}
              namespace={namespace}
            />
          )}
        />
      </div>
      {peps.length > 0 ? (
        <div className="my-2">
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn shadow-none btn-link text-danger px-2 py-1"
              onClick={(e) => {
                e.preventDefault();
                setValue('peps', []);
              }}
            >
              Remove all
            </button>
          </div>
          {peps.map((pep) => {
            return (
              <div className="rounded border border-primary my-1 p-1 bg-primary bg-opacity-10">
                <div className="d-flex flex-row align-items-center justify-content-between">
                  <div>
                    <p className="m-0 text-sm fw-bold">{`${pep.namespace}/${pep.name}:${pep.tag}`}</p>
                    <p className="m-0 text-sm text-secondary fst-italic">{pep.description || 'No description.'}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger px-2 py-1"
                    onClick={() => {
                      setValue(
                        'peps',
                        peps.filter((p) => p.digest !== pep.digest),
                      );
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      <div className="mt-3">
        <button
          disabled={!isValid || mutation.isPending || peps.length === 0}
          id="blank-project-submit-btn"
          className="btn btn-success me-1"
          type="button"
          onClick={() => mutation.mutate()}
        >
          <i className="bi bi-plus-circle me-1"></i>
          {mutation.isPending ? 'Submitting...' : 'Add'}
        </button>
        <button type="button" className="btn btn-outline-dark me-1" data-bs-dismiss="modal" onClick={() => resetForm()}>
          Cancel
        </button>
      </div>
    </form>
  );
};
