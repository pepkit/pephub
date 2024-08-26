import { Editor } from '@monaco-editor/react';
import { Controller, useForm } from 'react-hook-form';

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

export const CreateSchemaForm = (props: Props) => {
  const { onCancel, onSubmit, editorHeight, defaultNamespace } = props;
  const { user } = useSession();
  const { formState, watch, register, control, reset } = useForm<FormFields>({
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
      <div className="namespace-name-tag-container">
        <label className="fw-bold text-sm">Namespace *</label>
        <label className="fw-bold text-sm">Name *</label>
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
              pattern: {
                value: /^\S+$/,
                message: 'No spaces allowed.',
              },
            })}
            id="schema-name"
            type="text"
            className="form-control"
            placeholder="name"
          />
        </div>
      </div>
      <p className='text-xs'>
        * Namespace and Schema Name are required.
      </p>
      <div className="my-1">
        <label className="fw-bold text-sm" htmlFor="schema-description">
          Description
        </label>
        <textarea
          {...register('description')}
          id="schema-description"
          className="form-control"
          placeholder="Schema description"
        />
      </div>
      <div className="border rounded mt-2 p-1">
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
      <div className="d-flex align-items-center gap-1 w-100 justify-content-start my-2">
        <button
          disabled={isSubmitting || !formState.isDirty}
          type="button"
          className="btn btn-success"
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
          className="btn btn-outline-dark"
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
