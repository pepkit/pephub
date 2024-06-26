import { ErrorMessage } from '@hookform/error-message';
import { FC, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useEditProjectMetaMutation } from '../../hooks/mutations/useEditProjectMetaMutation';
import { useProject } from '../../hooks/queries/useProject';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { MarkdownEditor } from '../markdown/edit';
import { SchemaDropdown } from './components/schemas-databio-dropdown';
import { SchemaTooltip } from './tooltips/form-tooltips';

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
  pop: boolean;
}

export const ProjectMetaEditForm: FC<Props> = ({
  namespace,
  name,
  tag,
  onSuccessfulSubmit = () => {},
  onFailedSubmit = () => {},
  onCancel = () => {},
}) => {
  const { data: projectInfo } = useProject(namespace, name, tag);

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
      name: name,
      description: projectInfo?.description || '',
      isPrivate: projectInfo?.is_private,
      tag: tag,
      pep_schema: projectInfo?.pep_schema || 'pep/2.1.0',
      pop: projectInfo?.pop || false,
    },
  });

  const onSubmit = () => {
    onSuccessfulSubmit();
    // reset form
    resetForm({}, { keepValues: false });
  };

  // watch form values to pass into mutation
  const newTag = watch('tag');
  const newName = watch('name');
  const newDescription = watch('description');
  const newIsPrivate = watch('isPrivate');
  const newSchema = watch('pep_schema');
  const newPop = watch('pop');

  // check if things are changed - only send those that are
  const metadata = {
    newName: projectInfo?.name === newName ? undefined : newName,
    newTag: projectInfo?.tag === newTag ? undefined : newTag,
    newDescription: projectInfo?.description === newDescription ? undefined : newDescription,
    newIsPrivate: projectInfo?.is_private === newIsPrivate ? undefined : newIsPrivate,
    newSchema: projectInfo?.pep_schema === newSchema ? undefined : newSchema,
    isPop: projectInfo?.pop === newPop ? undefined : newPop,
  };

  // grab the sample table to warn the user if they wont be able to swap
  // to a POP
  const { data: sampleTable } = useSampleTable({
    namespace,
    project: name,
    tag,
  });

  const mutation = useEditProjectMetaMutation(namespace, name, tag, onSubmit, onFailedSubmit, metadata);

  // reset form if project info changes
  // this is necessary because projectInfo is
  // fetched after the form is rendered
  useEffect(() => {
    resetForm({
      name: projectInfo?.name,
      description: projectInfo?.description,
      isPrivate: projectInfo?.is_private,
      tag: projectInfo?.tag,
      pep_schema: projectInfo?.pep_schema,
      pop: projectInfo?.pop,
    });
  }, [projectInfo]);

  useEffect(() => {
    if (newPop === true) {
      if (sampleTable && sampleTable.items.length > 0) {
        // check all samples have namespace, name, and tag attributes
        const hasNamespace = sampleTable.items.every((sample) => sample.namespace);
        const hasName = sampleTable.items.every((sample) => sample.name);
        const hasTag = sampleTable.items.every((sample) => sample.tag);
        if (!hasNamespace || !hasName || !hasTag) {
          toast.error(
            'Cannot convert this PEP to a POP because the sample table does not have namespace, name, and tag attributes',
          );
          // toggle back to false
          setValue('pop', false);
        }
      }
    }
  }, [newPop]);

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
      <div className="mb-3 form-check form-switch">
        <label className="form-check-label" htmlFor="is-pop-toggle">
          POP
        </label>
        <input {...register('pop')} className="form-check-input" type="checkbox" role="switch" id="is-pop-toggle" />
      </div>
      <div className="mb-3">
        <label htmlFor="project-name" className="form-label">
          Project Name
        </label>
        <input
          placeholder="Project name"
          type="text"
          className="form-control"
          id="project-name"
          aria-describedby="pep-name-help"
          {...register('name', {
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
        <ErrorMessage errors={errors} name="name" render={({ message }) => message ? (<p className='text-danger text-xs pt-1'>{message}</p>) : null} />
      </div>
      <div className="mb-3">
        <label htmlFor="schema-tag" className="form-label">
          Schema
        </label>
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
      <div className="mb-3">
        <label htmlFor="project-tag" className="form-label">
          Project Tag
        </label>
        <input
          // {...register('tag')}
          type="text"
          className="form-control"
          id="project-tag"
          aria-describedby="pep-name-help"
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
        <ErrorMessage errors={errors} name="tag" render={({ message }) => message ? (<p className='text-danger text-xs pt-1'>{message}</p>) : null} />
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
              rows={10}
            />
          )}
        />
      </div>
      <div className="d-flex flex-row align-items-center justify-content-end">
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
          disabled={(!isDirty && isValid) || errors.name?.message || errors.tag?.message || mutation.isPending}
          type="button"
          className="btn btn-success me-1"
        >
          {mutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};
