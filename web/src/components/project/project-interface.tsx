import { useEffect, useRef, useState } from 'react';
import { Fragment } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

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
  sampleTableIndex: string;
};

type ProjectUpdateFields = {
  config: string;
  samples: any[][];
  subsamples: any[][];
};

export const ProjectInterface = (props: Props) => {
  const { projectConfig, sampleTable, subSampleTable, sampleTableIndex } = props;

  const { user } = useSession();
  const projectDataRef = useRef<HTMLDivElement>(null);

  const [filteredSamples, setFilteredSamples] = useState<string[]>([]);

  // get namespace, name, tag
  const { namespace, projectName, tag } = useProjectPage();
  const { data: projectInfo } = useProjectAnnotation(namespace, projectName, tag);

  // get the value of which history id is being viewed
  const { currentHistoryId } = useCurrentHistoryId();

  const { data: historyData } = useProjectHistory(namespace, projectName, tag, currentHistoryId);

  // fetch the page view (samples, subsamples, config)
  const { pageView, setPageView } = useProjectPageView();

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

    try {
      const samplesParsed = arraysToSampleList(values.samples);
      const subsamplesParsed = arraysToSampleList(values.subsamples);
      submit({
        config: values.config,
        samples: samplesParsed,
        subsamples: subsamplesParsed,
      });
    } catch (e) {
      toast.error('The project could not be saved. ' + e, {
        duration: 5000,
        position: 'top-center',
      });
    }
  };

  // keyboard shortcuts
  useEffect(() => {
    // os info
    const os = getOS();

    const handleNavigationKeyDown = (e: KeyboardEvent) => {
      // if we are focused on any of the data elements (sample table, config, etc... dont do anything)
      if (projectDataRef.current?.contains(document.activeElement)) {
        return;
      }
      if (e.key === 'c') {
        setPageView('config');
      }
      if (e.key === 's') {
        setPageView('samples');
      }
      if (e.key === 'u') {
        setPageView('subsamples');
      }
    };

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
      // SAVE (ctrl + s)
      if (ctrlKey && e.key === 's') {
        if (projectUpdates.formState.isDirty && !isSubmitting) {
          e.preventDefault();
          handleSubmit();
        }
      }

      // DISCARD (ctrl + d)
      if (ctrlKey && e.key === 'd') {
        if (projectUpdates.formState.isDirty && !isSubmitting) {
          e.preventDefault();
          projectUpdates.reset();
        }
      }

      // NAVIGATION ('p' + other keys to go to tabs or open modals)
      if (e.key === 'p') {
        window.addEventListener('keydown', handleNavigationKeyDown);
        setTimeout(() => {
          window.removeEventListener('keydown', handleNavigationKeyDown);
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (currentHistoryId !== null) {
      // set global-search-bar z-index to -1
      const globalSearchBar = document.getElementById('global-search-bar');
      if (globalSearchBar) {
        globalSearchBar.style.zIndex = '-1';
      }
    } else {
      // set global-search-bar z-index to 1
      const globalSearchBar = document.getElementById('global-search-bar');
      if (globalSearchBar) {
        globalSearchBar.style.zIndex = '1';
      }
    }
  }, [currentHistoryId]);

  return (
    <Fragment>
      <div className="pt-0 px-2" style={{ backgroundColor: '#EFF3F640', height: '3.5em' }}>
        <ProjectValidationAndEditButtons
          isDirty={projectUpdates.formState.isDirty}
          isUpdatingProject={isSubmitting}
          reset={projectUpdates.reset}
          handleSubmit={handleSubmit}
          filteredSamples={filteredSamples || []}
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
                setFilteredSamples={(samples) => setFilteredSamples(samples)}
                sampleTableIndex={sampleTableIndex}
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
