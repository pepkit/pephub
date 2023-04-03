import { FC, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useSession } from '../../hooks/useSession';
import { submitProject } from '../../api/namespace';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BlankProjectInputs {
  is_private: boolean;
  namespace: string;
  project_name: string;
  tag: string;
  description: string;
}

interface Props {
  onHide: () => void;
}

export const BlankProjectForm: FC<Props> = ({ onHide }) => {
  // get user innfo
  const { user, jwt } = useSession();

  const queryClient = useQueryClient();

  // instantiate form
  const {
    reset: resetForm,
    register,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<BlankProjectInputs>();

  const onSubmit: SubmitHandler<BlankProjectInputs> = (data) => {
    return submitProject(
      {
        is_private: data.is_private,
        namespace: data.namespace,
        project_name: data.project_name,
        tag: data.tag || 'default',
        description: data.description || '',
      },
      jwt || '',
    );
  };

  const namespace = watch('namespace');

  // function/object to handle submitting a project
  const mutation = useMutation({
    mutationFn: () => handleSubmit(onSubmit)(),
    onSuccess: () => {
      toast.success('Project created!');
      queryClient.invalidateQueries([namespace]);
      onHide();
      resetForm();
    },
    onError: (error) => {
      toast.error(`An error occurred: ${error}`);
    },
  });

  return (
    <form id="blank-project-form" className="border-0 form-control" onSubmit={handleSubmit(onSubmit)}>
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
          {...register('project_name', { required: true })}
          id="blank-project-name"
          type="text"
          className="form-control"
          placeholder="name"
        />
        <span className="mx-1 mb-1">:</span>
        <input {...register('tag')} id="blank_tag" type="text" className="form-control" placeholder="default" />
      </span>
      <textarea
        id="blank_description"
        className="form-control mt-3"
        rows={3}
        placeholder="Describe your PEP."
        {...register('description')}
      ></textarea>
      <div className="mt-3">
        <button
          disabled={!isValid || mutation.isLoading}
          id="blank-project-submit-btn"
          className="btn btn-success me-1"
          type="submit"
          onClick={() => mutation.mutate()}
        >
          <i className="bi bi-plus-circle me-1"></i>
          {mutation.isLoading ? 'Submitting...' : 'Add'}
        </button>
        <button type="button" className="btn btn-outline-dark me-1" data-bs-dismiss="modal" onClick={() => resetForm()}>
          Cancel
        </button>
      </div>
    </form>
  );
};
