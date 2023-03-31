import { FC } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { editProjectMetadata } from '../../api/project';
import { useSession } from '../../hooks/useSession';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Props {
  namespace: string;
  name: string;
  description: string;
  is_private: boolean;
  tag: string;
}

export const ProjectMetaEditForm: FC<Props> = ({ namespace, name, description, is_private, tag }) => {
  const { jwt } = useSession();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    reset: resetForm,
    formState: { isValid, isDirty },
  } = useForm<Props>({
    defaultValues: {
      name: name,
      description: description,
      is_private: is_private,
      tag: tag,
    },
  });

  const newName = watch('name');
  const newTag = watch('tag');

  const onSubmit: SubmitHandler<Props> = (data) => {
    return editProjectMetadata(namespace, name, tag, jwt, { ...data });
  };

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => handleSubmit(onSubmit)(),
    onSuccess: () => {
      resetForm();
      toast.success('Project metadata updated successfully.');
      queryClient.invalidateQueries([namespace, name, tag]);
      navigate(`/${namespace}/${newName}/edit?tag=${newTag}`);
    },
    onError: (error) => {
      toast.error(`There was an error updated project metadata: ${error}`);
    },
  });

  return (
    <form>
      <div className="mb-3 form-check form-switch">
        <label className="form-check-label" htmlFor="is-private-toggle">
          Private
        </label>
        <input
          {...register('is_private')}
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="is-private-toggle"
        />
      </div>
      <div className="mb-3">
        <label htmlFor="project-name" className="form-label">
          Project Name
        </label>
        <input
          {...register('name')}
          placeholder="Project name"
          type="text"
          className="form-control"
          id="project-name"
          aria-describedby="pep-name-help"
        />
        <div id="pep-name-help" className="form-text">
          Rename your PEP.
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="project-tag" className="form-label">
          Project Tag
        </label>
        <input
          {...register('tag')}
          type="text"
          className="form-control"
          id="project-tag"
          aria-describedby="pep-name-help"
        />
        <div id="pep-name-help" className="form-text">
          Change your project tag.
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="project-description" className="form-label">
          Project Description
        </label>
        <textarea
          {...register('description')}
          placeholder="Project description"
          className="form-control"
          id="project-description"
          rows={3}
        ></textarea>
      </div>
      <button onClick={() => resetForm()} type="button" className="btn btn-outline-dark me-1">
        Cancel
      </button>
      <button
        onClick={() => mutation.mutate()}
        id="metadata-save-btn"
        disabled={!isDirty && isValid}
        type="button"
        className="btn btn-success me-1"
      >
        Save
      </button>
    </form>
  );
};
