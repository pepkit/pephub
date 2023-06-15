import { ErrorMessage } from '@hookform/error-message';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FC, useEffect } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import { Sample } from '../../../types';
import { submitProjectJSON } from '../../api/namespace';
import { useSession } from '../../hooks/useSession';
import { sampleListToArrays, tableDataToCsvString } from '../../utils/sample-table';
import { ProjectConfigEditor } from '../project/project-config';
import { SampleTable } from '../tables/sample-table';
import { SchemaDropdown } from './components/schemas-databio-dropdown';
import { useBlankProjectForm } from '../../hooks/mutations/useBlankProjectForm';

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
    setValue,
    control,
    formState: { isValid, errors },
  } = useForm<BlankProjectInputs>({
    defaultValues: {
      is_private: false,
      namespace: user?.login || '',
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

  const sampleTableCSV = watch('sample_table');
  const configYAML = watch('config');

  const onSubmit: SubmitHandler<BlankProjectInputs> = (data) => {
    return submitProjectJSON(
      {
        is_private: data.is_private,
        namespace: data.namespace,
        project_name: data.project_name,
        tag: data.tag || 'default',
        description: data.description || '',
        sample_table: tableDataToCsvString(sampleListToArrays(data.sample_table)),
        config: data.config,
        pep_schema: data.pep_schema,
      },
      jwt || '',
    );
  };

  const namespace = watch('namespace');

  const mutation = useBlankProjectForm(
    () => handleSubmit(onSubmit)(),
    () => { queryClient.invalidateQueries([namespace]); onHide(); }
  );

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
          render={({ field: { onChange, value } }) => (
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
              data={sampleTableCSV}
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
