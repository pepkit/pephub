import { FC, useEffect } from 'react';
import { SubmitHandler, useForm, Controller } from 'react-hook-form';
import { editProjectMetadata } from '../../api/project';
import { useSession } from '../../hooks/useSession';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useProject } from '../../hooks/queries/useProject';
import { SchemaDropdown } from './components/schemas-databio-dropdown';
import { MarkdownEditor } from '../markdown/edit';
import { AxiosError } from 'axios';
import { useEditProjectMeta } from '../../hooks/mutations/useEditProjectMeta';

interface Props {
  namespace: string;
  name: string;
  tag: string;
  onSuccessfulSubmit?: () => void;
  onFailedSubmit?: () => void;
  onCancel?: () => void;
}

interface FormValues extends Props {
  description: string;
  isPrivate: boolean;
  pep_schema: string;
}

export const ProjectMetaEditForm: FC<Props> = ({
  namespace,
  name,
  tag,
  onSuccessfulSubmit = () => {},
  onFailedSubmit = () => {},
  onCancel = () => {},
}) => {
  const { jwt } = useSession();
  const { data: projectInfo } = useProject(namespace, name, tag, jwt);
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    reset: resetForm,
    formState: { isValid, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      name: name,
      description: projectInfo?.description || '',
      isPrivate: projectInfo?.is_private,
      tag: tag,
      pep_schema: projectInfo?.pep_schema || 'pep/2.1.0',
    },
  });
  const newTag = watch('tag');
  const newName = watch('name');

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    return editProjectMetadata(namespace, name, tag, jwt, { is_private: data.isPrivate, ...data });
  };

  const queryClient = useQueryClient();

  const mutation = useEditProjectMeta(
  () => handleSubmit(onSubmit)(),
  resetForm,
  toast,
  queryClient,
  namespace,
  name,
  tag,
  onSuccessfulSubmit,
  onFailedSubmit,
  newTag,
  newName
);

  return (
    <form>
      <div className="mb-3 form-check form-switch">
        <label className="form-check-label" htmlFor="is-private-toggle">
          Private
        </label>
        <input
          {...register('isPrivate')}
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
        <label htmlFor="schema-tag" className="form-label">
          Schema
        </label>
        <div>
          <Controller
            control={control}
            name="pep_schema"
            render={({ field: { onChange, value } }) => (
              <SchemaDropdown
                value={value}
                onChange={(schema) => {
                  setValue('pep_schema', schema, {
                    shouldDirty: true,
                  });
                }}
              />
            )}
          />
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
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <MarkdownEditor
              name="description"
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
              }}
            />
          )}
        />
      </div>
      <button
        onClick={() => {
          onCancel();
          resetForm();
        }}
        type="button"
        className="btn btn-outline-dark me-1"
      >
        Cancel
      </button>
      <button
        onClick={() => mutation.mutate()}
        id="metadata-save-btn"
        disabled={(!isDirty && isValid) || mutation.isLoading}
        type="button"
        className="btn btn-success me-1"
      >
        {mutation.isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};
