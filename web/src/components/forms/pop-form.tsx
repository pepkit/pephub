import { ErrorMessage } from '@hookform/error-message';
import { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ProjectAnnotation } from '../../../types';
import { useBlankProjectFormMutation } from '../../hooks/mutations/useBlankProjectFormMutation';
import { usePopCreateMutation } from '../../hooks/mutations/usePopCreateMutation';
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
    mode: 'onChange',
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

  const mutation = usePopCreateMutation(
    namespace,
    projectName,
    tag,
    isPrivate,
    description,
    'pep/2.1.0', // default schema for now
    peps.map((pep) => {
      return {
        sample_name: `${pep.namespace}/${pep.name}:${pep.tag}`,
        namespace: pep.namespace,
        name: pep.name,
        tag: pep.tag,
      };
    }),
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
              value: /^[a-zA-Z0-9_-]+$/,
              message: "Project Name must contain only alphanumeric characters, '-', or '_'.",
            },
          })}
          id="blank-project-name"
          type="text"
          className="form-control"
          placeholder="name"
        />
        <span className="mx-1 mb-1">:</span>
        <input {...register('tag', {
          required: false,
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message: "Project Tag must contain only alphanumeric characters, '-', or '_'.",
            },
          })}
        id="blank_tag" type="text" className="form-control" placeholder="default" />
      </span>
      <ErrorMessage errors={errors} name="project_name" render={({ message }) => message ? (<p className='text-danger pt-1' style={{fontSize: '.75em'}}>{message}</p>) : null} />
      <ErrorMessage errors={errors} name="tag" render={({ message }) => message ? (<p className='text-danger pt-1' style={{fontSize: '.75em'}}>{message}</p>) : null} />
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
            />
          )}
        />
      </div>
      {peps.length > 0 ? (
        <div className="mt-3 pt-3 border-top">
          {peps.map((pep) => {
            return (
              <div className="rounded border my-1 px-2 pt-0 pb-2 shadow-sm">
                <div className="d-flex flex-row align-items-center justify-content-between">
                  <div className="w-100">
                    <div className="d-flex flex-row align-items-center justify-content-between w-100">
                      <p className="m-0 fw-bold">{`${pep.namespace}/${pep.name}:${pep.tag}`}</p>
                      <button
                        type="button"
                        className="btn btn-sm btn-link shadow-none text-danger px-2 py-1"
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
                    <p className="m-0 text-sm text-secondary fst-italic">{pep.description || 'No description.'}</p>
                  </div>
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
