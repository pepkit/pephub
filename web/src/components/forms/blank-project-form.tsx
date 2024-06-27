import { ErrorMessage } from '@hookform/error-message';
import { FC } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import { Controller, FieldErrors, useForm } from 'react-hook-form';

import { Sample } from '../../../types';
import { useBlankProjectFormMutation } from '../../hooks/mutations/useBlankProjectFormMutation';
import { useSession } from '../../hooks/useSession';
import { ProjectConfigEditor } from '../project/project-config';
import { SampleTable } from '../tables/sample-table';
import { SchemaDropdown } from './components/schemas-databio-dropdown';

interface BlankProjectInputs {
  is_private: boolean;
  namespace: string;
  project_name: string;
  tag: string;
  description: string;
  sample_table: Sample[];
  config: string;
  pep_schema: string;
}

interface Props {
  onHide: () => void;
  defaultNamespace?: string;
}

type CombinedErrorMessageProps = {
  errors: FieldErrors<BlankProjectInputs>;
};

const CombinedErrorMessage = (props: CombinedErrorMessageProps) => {
  const { errors } = props;
  const nameError = errors.project_name?.message;
  const tagError = errors.tag?.message;
  let msg = null;

  if (nameError == 'empty' && !tagError) {
    msg = 'Project Name must not be empty.';
  } else if (nameError == 'invalid' && !tagError) {
    msg = "Project Name must contain only alphanumeric characters, '-', or '_'.";
  } else if (nameError == 'empty' && tagError == 'invalid') {
    msg = "Project Name must not be empty and Tag must contain only alphanumeric characters, '-', or '_'.";
  } else if (nameError == 'invalid' && tagError == 'invalid') {
    msg = "Project Name and Tag must contain only alphanumeric characters, '-', or '_'.";
  } else if (!nameError && tagError == 'invalid') {
    msg = "Project Tag must contain only alphanumeric characters, '-', or '_'.";
  }

  if (nameError || tagError) {
    return <p className="text-danger text-xs pt-1">{msg}</p>;
  }

  return null;
};

export const BlankProjectForm: FC<Props> = ({ onHide, defaultNamespace }) => {
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
  } = useForm<BlankProjectInputs>({
    mode: 'onChange',
    defaultValues: {
      is_private: false,
      namespace: defaultNamespace || user?.login || '',
      project_name: 'new-project',
      sample_table: [
        {
          sample_name: 'sample1',
          sample_type: 'sample_type1',
          genome: 'genome1',
        },
        {
          sample_name: 'sample2',
          sample_type: 'sample_type2',
          genome: 'genome2',
        },
      ],
      config: `pep_version: 2.1.0
sample_table: samples.csv
      `,
      pep_schema: 'pep/2.1.0',
    },
  });

  const sampleTable = watch('sample_table');
  const configYAML = watch('config');
  const namespace = watch('namespace');
  const projectName = watch('project_name');
  const tag = watch('tag');
  const description = watch('description');
  const isPrivate = watch('is_private');
  const pepSchema = watch('pep_schema');

  const mutation = useBlankProjectFormMutation(
    namespace,
    projectName,
    tag,
    isPrivate,
    description,
    configYAML,
    pepSchema,
    sampleTable,
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
          id="blank-project-name"
          type="text"
          className="form-control"
          placeholder="name"
          // dont allow any whitespace
          {...register('project_name', {
            required: {
              value: true,
              message: 'empty',
            },
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message: 'invalid',
            },
          })}
        />
        <span className="mx-1 mb-1">:</span>
        <input
          {...register('tag', {
            required: false,
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message: 'invalid',
            },
          })}
          id="blank_tag"
          type="text"
          className="form-control"
          placeholder="default"
        />
      </span>
      <CombinedErrorMessage errors={errors} />
      <textarea
        id="blank_description"
        className="form-control mt-3"
        rows={3}
        placeholder="Describe your PEP."
        {...register('description')}
      ></textarea>
      <label className="form-check-label mt-3 mb-1">
        <i className="bi bi-file-earmark-break me-1"></i>
        Schema
      </label>
      <div>
        <Controller
          control={control}
          name="pep_schema"
          render={({ field: { value } }) => (
            <SchemaDropdown
              value={value}
              onChange={(schema) => {
                setValue('pep_schema', schema);
              }}
            />
          )}
        />
      </div>
      <Tabs defaultActiveKey="samples" id="blank-project-tabs" className="mt-3">
        <Tab eventKey="samples" title="Samples">
          <div className="p-2 border border-top-1">
            <SampleTable
              height={300}
              data={sampleTable}
              onChange={(data) => {
                setValue('sample_table', data);
              }}
            />
          </div>
        </Tab>
        <Tab eventKey="config" title="Config">
          <div className="p-1 border border-top-0">
            <ProjectConfigEditor
              value={configYAML}
              setValue={(data) => {
                setValue('config', data);
              }}
              height={300}
            />
          </div>
        </Tab>
      </Tabs>
      <div className="mt-3">
        <button
          disabled={!isValid || mutation.isPending}
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
