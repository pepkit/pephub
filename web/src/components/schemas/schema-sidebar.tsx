import { Fragment, useRef, useState } from 'react';
import { Breadcrumb, Dropdown } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import YAML from 'yaml';
import Select from 'react-select';

import { useSession } from '../../contexts/session-context';
import { useEditSchemaMutation } from '../../hooks/mutations/useEditSchemaMutation';
import { useSchema } from '../../hooks/queries/useSchema';
import { copyToClipboard } from '../../utils/etc';
import { DeleteSchemaModal } from '../modals/delete-schema';
import { SchemaAPIEndpointsModal } from '../modals/schema-api-endpoints';
import { dateStringToDateTime } from '../../utils/dates';

const API_HOST = import.meta.env.VITE_API_HOST || '';

type Props = {
  isDirty: boolean;
  handleSave: () => void;
  handleDiscard: () => void;
  isUpdating: boolean;
  description: string;
  maintainers: string;
  isPrivate: boolean;
  lifecycleStage: string;
  releaseNotes: string;
  contributors: string;
  tags: object;
  updateDate: string;
  releaseDate: string;
  currentVersion: string;
  setCurrentVersionNumber: (versionNumber: string) => void;
  allVersionNumbers: string[];
};

export const SchemaSidebar = (props: Props) => {
  const { maintainers, isPrivate, lifecycleStage, releaseNotes, contributors, tags, updateDate, releaseDate,
    currentVersion, setCurrentVersionNumber, allVersionNumbers
   } = props;
  const { user } = useSession();
  const { namespace, schema } = useParams();

  const { data: schemaData } = useSchema(namespace, schema);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // console.log(Object.entries(tags).map(([key, value], index) => (key + ': ' + value)))

  return (
    <div className="pe-4">
      <small>
        <div className="mt-3 mb-4">
          <p className='fw-semibold my-1'>Description</p>
          <div className="text-muted">{schemaData?.description || 'N/A'}</div>
        </div>

        <div className="my-4">
          <p className='fw-semibold my-1'>Creation Date</p>
          <div className="text-muted">{dateStringToDateTime(releaseDate || '')}</div>
        </div>

        <div className="my-4">
          <p className='fw-semibold my-1'>Lifecycle Stage</p>
          <div className="text-muted">{lifecycleStage || 'N/A'}</div>
        </div>

        <div className="my-4">
          <p className='fw-semibold my-1'>Maintainers</p>
          <div className="text-muted">{maintainers || 'N/A'}</div>
        </div>

        <hr/>

        <div className="my-4">
          <p className='fw-semibold my-2'>Schema Version</p>
          <Select
            value={currentVersion ? { value: currentVersion, label: currentVersion } : null}
            options={allVersionNumbers.map(version => ({value: version, label: version}))}
            onChange={(newValue: SingleValue<{ label: string; value: string }>) => {
              setCurrentVersionNumber(newValue?.value || '');
            }}
            styles={{
              control: (provided) => ({
                ...provided,
                borderRadius: '.375em',
                borderColor: '#dee2e6'
              })
            }}
          />
        </div>

        <div className="my-4">
          <p className='fw-semibold my-1'>Version Release Date</p>
          <div className="text-muted">{dateStringToDateTime(updateDate || '')}</div>
        </div>
        
        <div className="my-4">
          <p className='fw-semibold my-1'>Release Notes</p>
          <div className="text-muted">{releaseNotes || 'N/A'}</div>
        </div>

        <div className="my-4">
          <p className='fw-semibold my-1'>Contributors</p>
          <div className="text-muted">{contributors || 'N/A'}</div>
        </div>

        <div className="mt-4 mb-3">
          <p className='fw-semibold my-1'>Tags</p>
          {tags && Object.keys(tags).length > 0 ? (
            <div className='d-flex mt-2 gap-1'>
              {Object.entries(tags).map(([key, value], index) => (
                <span className='border rounded-2 p-2 text-xs' key={key}>
                  <span className='fw-bold'>{String(key)}</span>
                  {String(value) && <span>: {String(value)}</span>}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-muted">N/A</span>
          )}
        </div>

      </small>
    </div>

  );
};
