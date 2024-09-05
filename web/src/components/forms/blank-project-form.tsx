import { ErrorMessage } from '@hookform/error-message';
import { Tab, Tabs } from 'react-bootstrap';
import { Controller, FieldErrors, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Sample } from '../../../types';
import { useSession } from '../../contexts/session-context';
import { useBlankProjectFormMutation } from '../../hooks/mutations/useBlankProjectFormMutation';
import { arraysToSampleList, sampleListToArrays } from '../../utils/sample-table';
import { ProjectConfigEditor } from '../project/project-config';
import { SampleTable } from '../tables/sample-table';
import { SchemaDropdown } from './components/schemas-databio-dropdown';

interface BlankProjectInputs {
  is_private: boolean;
  namespace: string;
  project_name: string;
  tag: string;
  description: string;
  sample_table: any[][];
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
    return <p className="text-danger text-xs pt-1 mb-0">{msg}</p>;
  }

  return null;
};

export const BlankProjectForm = (props: Props) => {
  const { onHide, defaultNamespace } = props;
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
      sample_table: sampleListToArrays([
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
      ]),
      config: `pep_version: 2.1.0
sample_table: samples.csv
      `,
      pep_schema: undefined,
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

  const { isPending: isSubmitting, submit } = useBlankProjectFormMutation(namespace);

  return (
    <form id="blank-project-form" className="border-0 form-control p-0">
      <div className="mt-3 form-check form-switch">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="blank-is-private-toggle"
          {...register('is_private')}
        />
        <label className="form-check-label text-sm">
          <i className="bi bi-lock"></i>
          Private
        </label>
      </div>
      <div className="namespace-name-tag-container mt-2">
        <label className="fw-semibold text-sm">Namespace*</label>
        <label className="fw-semibold text-sm">Name*</label>
        <label className="fw-semibold text-sm">Tag</label>
      </div>
      <div className="namespace-name-tag-container fs-4 w-full">
        <div className="d-flex flex-row align-items-center justify-content-between w-full">
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
        <div className="d-flex flex-row align-items-center justify-content-between w-full">
          <input
            // dont allow any whitespace
            {...register('project_name', {
              required: {
                value: true,
                message: "empty",
              },
              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,
                message: "invalid",
              },
            })}
            id="blank-project-name"
            type="text"
            className="form-control"
            placeholder="name"
          />
          <span className="mx-1 mb-1">:</span>
        </div>
        <input {...register('tag', {
            required: false,
            pattern: {
              value: /^[a-zA-Z0-9_-]+$/,
              message: "invalid",
            },
          })} 
          id="blank_tag" 
          type="text" 
          className="form-control" 
          placeholder="default" 
        />
      </div>
      <CombinedErrorMessage errors={errors}/>
      <label className="fw-semibold text-sm mt-2">Description</label>
      <textarea
        id="blank_description"
        className="form-control"
        rows={3}
        placeholder="Describe your PEP."
        {...register('description')}
      ></textarea>
      <label className="fw-semibold text-sm mt-2">Schema</label>
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
              showDownload={false}
            />
          )}
        />
      </div>
      <Tabs defaultActiveKey="samples" id="blank-project-tabs" className="mt-3 text-sm">
        <Tab eventKey="samples" title="Samples">
          <div className="overflow-auto border rounded-bottom-2 custom-handsontable" style={{marginTop: '-1px', zIndex: 99999}}>
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
          <div className="border rounded-bottom-2 pb-1">
            <ProjectConfigEditor
              value={configYAML}
              setValue={(data) => {
                setValue('config', data);
              }}
              height={295}
            />
          </div>
        </Tab>
      </Tabs>
      <p className='text-xs mt-1'>
        * Namespace and Project Name are required. A tag value of "default" will be supplied if the Tag input is left empty.
      </p>
      <div className="mt-3">
        <button
          disabled={!isValid || isSubmitting}
          id="blank-project-submit-btn"
          className="btn btn-success float-end"
          type="button"
          onClick={() => {
            try {
              const parsedSamples = arraysToSampleList(sampleTable, 'Sample');
              submit({
                projectName,
                tag,
                isPrivate,
                description,
                config: configYAML,
                pepSchema,
                sampleTable: parsedSamples,
                onSuccess: onHide,
              });
            } catch (e) {
              toast((t) => (
                <div className='my-1'>
                  <p><strong>{'The project could not be created.'}</strong></p>
                  {e instanceof Error ?
                    <p>{e.message + ''}</p> : <p>An unknown error occurred.</p>
                  }
                  <button className='btn btn-sm btn-danger float-end mt-3' onClick={() => toast.dismiss(t.id)}>
                    Dismiss
                  </button>
                </div>
              ), {
                duration: 16000,
                position: 'top-right',
              });
              return;
            }
          }}
        >
          <i className="bi bi-plus-circle me-1"></i>
          {isSubmitting ? 'Submitting...' : 'Add'}
        </button>
        <button
          type="button"
          className="btn btn-outline-dark me-1 float-end"
          data-bs-dismiss="modal"
          onClick={() => {
            resetForm();
            onHide();
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
