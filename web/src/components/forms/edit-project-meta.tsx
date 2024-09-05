import { ErrorMessage } from '@hookform/error-message';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useEditProjectMetaMutation } from '../../hooks/mutations/useEditProjectMetaMutation';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { MarkdownEditor } from '../markdown/edit';
import { SchemaDropdown } from './components/schemas-databio-dropdown';
import { SchemaTooltip } from './tooltips/form-tooltips';

type FormValues = {
  tag: string;
  name: string;
  description: string;
  isPrivate: boolean;
  pep_schema: string;
  pop: boolean;
};

type Props = {
  projectInfo: ReturnType<typeof useProjectAnnotation>['data'];
  isSubmitting: boolean;
  canConvertToPop: boolean;
  onSubmit: ReturnType<typeof useEditProjectMetaMutation>['submit'];
  onCancel: () => void;
};

export const ProjectMetaEditForm = (props: Props) => {
  const { onCancel, onSubmit, projectInfo, isSubmitting, canConvertToPop } = props;

  const {
    register,
    watch,
    control,
    setValue,
    reset: resetForm,
    formState: { isValid, isDirty, errors },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      tag: projectInfo?.tag,
      name: projectInfo?.name,
      description: projectInfo?.description,
      isPrivate: projectInfo?.is_private,
      pep_schema: projectInfo?.pep_schema,
      pop: projectInfo?.pop,
    },
  });

  // watch form values to pass into mutation
  const newTag = watch('tag');
  const newName = watch('name');
  const newDescription = watch('description');
  const newIsPrivate = watch('isPrivate');
  const newSchema = watch('pep_schema');
  const newPop = watch('pop');

  useEffect(() => {
    if (newPop === true) {
      if (!canConvertToPop) {
        toast.error('Cannot convert to POP. Please ensure all samples are annotated.');
        setValue('pop', false);
      }
    }
  }, [newPop]);

  return (
    <form>
      <div className="mt-3 form-check form-switch text-sm">
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
      <div className="form-check form-switch text-sm">
        <label className="form-check-label" htmlFor="is-pop-toggle">
          POP
        </label>
        <input {...register('pop')} className="form-check-input" type="checkbox" role="switch" id="is-pop-toggle" />
      </div>
      <div className="mt-2">
        <label className="fw-semibold text-sm">Project Name</label>
        <input
          placeholder="Project name"
          type="text"
          className="form-control"
          id="project-name"
          aria-describedby="pep-name-help"
          {...register('name', {
            required: {
              value: true,
              message: 'Project Name must not be empty.',
            },
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message: "Project Name must contain only alphanumeric characters, '-', or '_'.",
            },
          })}
        />
        <ErrorMessage
          errors={errors}
          name="name"
          render={({ message }) => (message ? <p className="text-danger text-xs pt-1">{message}</p> : null)}
        />
      </div>
      <div className="mt-2">
        <label className="fw-semibold text-sm mt-2">Schema</label>
        <SchemaTooltip className="ms-1" />
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
      <div className="mt-2">
        <label className="fw-semibold text-sm mt-2">Project Tag</label>
        <input
          // {...register('tag')}
          type="text"
          className="form-control"
          id="project-tag"
          aria-describedby="pep-name-help"
          {...register('tag', {
            required: {
              value: true,
              message: 'Project Tag must not be empty.',
            },
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message: "Project Tag must contain only alphanumeric characters, '-', or '_'.",
            },
          })}
        />
        <ErrorMessage
          errors={errors}
          name="tag"
          render={({ message }) => (message ? <p className="text-danger text-xs pt-1">{message}</p> : null)}
        />
      </div>
      <div className="mt-2 mb-3">
        <label className="fw-semibold text-sm mt-2">Description</label>
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
              rows={10}
            />
          )}
        />
      </div>
      <div className="d-flex flex-row align-items-center justify-content-end">
        <button
          onClick={() => {
            resetForm();
            onCancel?.();
          }}
          type="button"
          className="btn btn-outline-dark me-1"
        >
          Cancel
        </button>
        <button
          onClick={() =>
            onSubmit(
              {
                newName: projectInfo?.name === newName ? undefined : newName,
                newTag: projectInfo?.tag === newTag ? undefined : newTag,
                newDescription: projectInfo?.description === newDescription ? undefined : newDescription,
                newIsPrivate: projectInfo?.is_private === newIsPrivate ? undefined : newIsPrivate,
                newSchema: projectInfo?.pep_schema === newSchema ? undefined : newSchema,
                isPop: projectInfo?.pop === newPop ? undefined : newPop,
              },
              {
                onSuccess: () => {
                  resetForm({}, { keepValues: false });
                  onCancel();
                },
              },
            )
          }
          id="metadata-save-btn"
          disabled={(!isDirty && isValid) || !!errors.name?.message || !!errors.tag?.message || isSubmitting}
          type="button"
          className="btn btn-success"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};
