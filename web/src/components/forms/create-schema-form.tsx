import { Editor } from '@monaco-editor/react';
import { ErrorMessage } from '@hookform/error-message';
import { Controller, FieldErrors, useForm } from 'react-hook-form';

import { useSession } from '../../contexts/session-context';
import { useCreateSchemaMutation } from '../../hooks/mutations/useCreateSchemaMutation';

const defaultSchemaYaml = `properties:
  samples:
    type: array
    items:
      type: object
      properties:
        sample_name: 
          type: string
          description: "name of the sample, which is the name of the output BED file"
        genome:
          type: string
          description: "namespace for the assets to be build"
          pattern: ^[^/:]*$
required:
  - samples
`;

type Props = {
  defaultNamespace?: string;
  editorHeight?: string;
  onCancel: () => void;
  onSubmit: () => void;
};

type FormFields = {
  isPrivate: boolean;
  namespace: string;
  name: string;
  description: string;
  schemaYaml: string;
};

type CombinedErrorMessageProps = {
  errors: FieldErrors<POPInputs>;
};

const CombinedErrorMessage = (props: CombinedErrorMessageProps) => {
  const { errors } = props;
  const nameError = errors.name?.message;
  let msg = null;

  if (nameError == 'empty') {
    msg = 'Project Name must not be empty.';
  } else if (nameError == 'invalid') {
    msg = "Project Name must contain only alphanumeric characters, '-', or '_'.";
  }

  if (nameError) {
    return <p className="text-danger text-xs pt-1 mb-0">{msg}</p>;
  }

  return null;
};

export const CreateSchemaForm = (props: Props) => {
  const { onCancel, onSubmit, editorHeight, defaultNamespace } = props;
  const { user } = useSession();
  const { 
    watch, 
    register, 
    control, 
    reset, 
    formState: { isValid, isDirty, errors }, 
  } = useForm<FormFields>({
    mode: 'onChange',
    defaultValues: {
      namespace: defaultNamespace || user?.login || undefined,
      schemaYaml: defaultSchemaYaml,
    },
  });

  const { isPending: isSubmitting, submit } = useCreateSchemaMutation();

  const namespace = watch('namespace');
  const name = watch('name');
  const description = watch('description');
  const schemaYaml = watch('schemaYaml');
  const isPrivate = watch('isPrivate');

  return (
    <form>
      {/* <div className="mb-3 form-check form-switch">
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
      </div> */}
      <div className="namespace-name-tag-container mt-2">
        <label className="fw-semibold text-sm">Namespace*</label>
        <label className="fw-semibold text-sm">Name*</label>
      </div>
      <div className="namespace-name-tag-container fs-4">
        <div className="d-flex flex-row align-items-center justify-content-between w-full ">
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
        <div className="d-flex flex-row align-items-center justify-content-between w-full ">
          <input
            // dont allow any whitespace
            {...register('name', {
              required: true,
              required: {
                value: true,
                message: "empty",
              },
              pattern: {
                value: /^\S+$/,
                message: 'No spaces allowed.',
                value: /^[a-zA-Z0-9_-]+$/,
                message: "invalid",
              },
            })}
            id="schema-name"
            type="text"
            className="form-control"
            placeholder="name"
          />
        </div>
      </div>
      <CombinedErrorMessage errors={errors} />
      <label className="fw-semibold text-sm mt-2">Description</label>
      <textarea
        {...register('description')}
        id="schema-description"
        className="form-control"
        placeholder="Schema description"
      />
      <div className="border rounded mt-3 py-1">
        <Controller
          name="schemaYaml"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Editor
              onChange={(v) => {
                onChange(v);
              }}
              saveViewState
              language={'yaml'}
              defaultLanguage="yaml"
              value={value}
              loading={null}
              height={editorHeight || '50vh'}
            />
          )}
        />
      </div>
      <p className='text-xs mt-1'>
        * Namespace and Schema Name are required.
      </p>
      <div className="mt-3">
        <button
          disabled={isSubmitting || !isDirty || !isValid}
          type="button"
          className="btn btn-success float-end"
          onClick={() => {
            submit(
              {
                namespace,
                name,
                description,
                schema: schemaYaml,
                isPrivate,
              },
              {
                onSuccess: () => {
                  reset();
                  onSubmit();
                },
              },
            );
          }}
        >
          <i className="bi bi-plus-circle me-1"></i>
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>
        <button
          className="btn btn-outline-dark me-1 float-end"
          onClick={() => {
            reset();
            onCancel();
          }}
          type="reset"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
