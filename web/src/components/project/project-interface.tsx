import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Fragment } from 'react/jsx-runtime';

import { useProjectPage } from '../../contexts/project-page-context';
import { useSession } from '../../contexts/session-context';
import { useTotalProjectChangeMutation } from '../../hooks/mutations/useTotalProjectChangeMutation';
import { useProjectAnnotation } from '../../hooks/queries/useProjectAnnotation';
import { useProjectConfig } from '../../hooks/queries/useProjectConfig';
import { useProjectHistory } from '../../hooks/queries/useProjectHistory';
import { useSampleTable } from '../../hooks/queries/useSampleTable';
import { useSubsampleTable } from '../../hooks/queries/useSubsampleTable';
import { useCurrentHistoryId } from '../../hooks/stores/useCurrentHistoryId';
import { useProjectPageView } from '../../hooks/stores/useProjectPageView';
import { getOS } from '../../utils/etc';
import { canEdit } from '../../utils/permissions';
import { arraysToSampleList, sampleListToArrays } from '../../utils/sample-table';
import { SampleTable } from '../tables/sample-table';
import { ProjectConfigEditor } from './project-config';
import { ProjectValidationAndEditButtons } from './project-validation-and-edit-buttons';

type Props = {
  projectConfig: ReturnType<typeof useProjectConfig>['data'];
  projectInfo: ReturnType<typeof useProjectAnnotation>['data'];
  sampleTable: ReturnType<typeof useSampleTable>['data'];
  subSampleTable: ReturnType<typeof useSubsampleTable>['data'];
};

type ProjectUpdateFields = {
  config: string;
  samples: any[][];
  subsamples: any[][];
};

export const ProjectInterface = (props: Props) => {
  const { projectConfig, sampleTable, subSampleTable } = props;

  const { user } = useSession();
  const projectDataRef = useRef<HTMLDivElement>(null);

  // get namespace, name, tag
  const { namespace, projectName, tag } = useProjectPage();
  const { data: projectInfo } = useProjectAnnotation(namespace, projectName, tag);

  // get the value of which history id is being viewed
  const { currentHistoryId } = useCurrentHistoryId();

  const { data: historyData } = useProjectHistory(namespace, projectName, tag, currentHistoryId);

  // fetch the page view (samples, subsamples, config)
  const { pageView } = useProjectPageView();

  // form to store project updated fields temporarily
  // on the client before submitting to the server
  const projectUpdates = useForm<ProjectUpdateFields>({
    defaultValues: {
      config: projectConfig?.config || '',
      samples: sampleListToArrays(sampleTable?.items || []),
      subsamples: sampleListToArrays(subSampleTable?.items || []),
    },
  });

  const newSamples = projectUpdates.watch('samples');
  const newSubsamples = projectUpdates.watch('subsamples');
  const newConfig = projectUpdates.watch('config');

  const userCanEdit = projectInfo && canEdit(user, projectInfo);

  const { isPending: isSubmitting, submit } = useTotalProjectChangeMutation(namespace, projectName, tag);

  const handleSubmit = () => {
    const values = projectUpdates.getValues();
    // submit({
    //   config: values.config,
    //   samples: arraysToSampleList(values.samples),
    //   subsamples: arraysToSampleList(values.subsamples),
    // });
    const samplesParsed = arraysToSampleList(values.samples);
    const subsamplesParsed = arraysToSampleList(values.subsamples);
    console.log('samplesParsed', samplesParsed);
    console.log('subsamplesParsed', subsamplesParsed);
  };

  // for debugging
  // useEffect(() => {
  //   console.log('old', sampleListToArrays(sampleTable?.items || []));
  //   console.log('new', newSamples);
  // }, [newSamples]);

  // on save handler
  useEffect(() => {
    // os info
    const os = getOS();

    const handleKeyDown = (e: KeyboardEvent) => {
      let ctrlKey = false;
      switch (os) {
        case 'Mac OS':
          ctrlKey = e.metaKey;
          break;
        default:
          ctrlKey = e.ctrlKey;
          break;
      }
      // check for ctrl+s, ignore if fetchsampletable is false
      if (ctrlKey && e.key === 's') {
        if (projectUpdates.formState.isDirty && !isSubmitting) {
          e.preventDefault();
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Fragment>
      <div className="pt-0 px-2" style={{ backgroundColor: '#EFF3F640', height: '3.5em' }}>
        <ProjectValidationAndEditButtons
          isDirty={projectUpdates.formState.isDirty}
          isUpdatingProject={isSubmitting}
          reset={projectUpdates.reset}
          handleSubmit={handleSubmit}
        />
      </div>
      <div ref={projectDataRef}>
        {pageView === 'samples' && (
          <Controller
            control={projectUpdates.control}
            name="samples"
            render={({ field: { onChange } }) => (
              <SampleTable
                onChange={(samples) => {
                  onChange(samples);
                }}
                readOnly={!userCanEdit}
                data={currentHistoryId ? sampleListToArrays(historyData?._sample_dict || []) : newSamples}
                height={window.innerHeight - 15 - (projectDataRef.current?.offsetTop || 300)}
              />
            )}
          />
        )}
        {pageView === 'subsamples' && (
          <Controller
            control={projectUpdates.control}
            name="subsamples"
            render={({ field: { onChange } }) => (
              <SampleTable
                onChange={(subsamples) => {
                  onChange(subsamples);
                }}
                data={currentHistoryId ? historyData?._subsample_list || [] : newSubsamples}
                height={window.innerHeight - 15 - (projectDataRef.current?.offsetTop || 300)}
                readOnly={!userCanEdit}
              />
            )}
          />
        )}
        {pageView === 'config' && (
          <Controller
            control={projectUpdates.control}
            name="config"
            render={({ field: { onChange } }) => (
              <ProjectConfigEditor
                value={currentHistoryId ? historyData?._config || '' : newConfig}
                setValue={(val) => {
                  onChange(val);
                }}
                height={window.innerHeight - 15 - (projectDataRef.current?.offsetTop || 300)}
                readOnly={!userCanEdit}
              />
            )}
          />
        )}
      </div>
    </Fragment>
  );
};
