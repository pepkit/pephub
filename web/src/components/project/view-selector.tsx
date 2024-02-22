import { useSearchParams } from 'react-router-dom';
import ReactSelect, { OptionProps } from 'react-select';

import { ProjectViewsResponse } from '../../api/project';

type ViewOption = {
  view: string;
  description: string;
  value: string;
};

interface Props {
  projectViewsIsLoading: boolean;
  projectViews: ProjectViewsResponse | undefined;
  view: string | undefined;
  setView: (view: string | undefined) => void;
}

export const ViewSelector = (props: Props) => {
  const { projectViewsIsLoading, projectViews, view, setView } = props;
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    // <select
    //   disabled={projectViewsIsLoading || projectViews?.views.length === 0}
    //   className="border border-dark form-select form-select-sm w-25"
    //   value={view}
    //   onChange={(e) => {
    //     if (e.target.value !== undefined && e.target.value !== 'None') {
    //       setView(e.target.value);
    //       setSearchParams(
    //         new URLSearchParams({
    //           ...searchParams,
    //           view: e.target.value,
    //         }),
    //       );
    //     } else {
    //       setView(undefined);
    //       searchParams.delete('view');
    //       setSearchParams(
    //         new URLSearchParams({
    //           ...searchParams,
    //         }),
    //       );
    //     }
    //   }}
    // >
    //   {projectViews?.views.length === 0 ? (
    //     <option value="default">No views</option>
    //   ) : (
    //     <Fragment>
    //       <option value={undefined}>Default view</option>
    //       {projectViews?.views.map((view, index) => (
    //         <option key={index} value={view.name}>
    //           {view.name}
    //         </option>
    //       ))}
    //     </Fragment>
    //   )}
    // </select>
    <ReactSelect
      className="w-25 top-z border border-dark rounded"
      options={
        projectViews?.views.map((view) => ({
          view: view.name,
          description: view.description || 'No description',
          value: view.name,
          label: `${view.name} | ${view.description || 'No description'}`,
        })) || []
      }
      onChange={(selectedOption) => {
        if (selectedOption === null) {
          setView(undefined);
          searchParams.delete('view');
          setSearchParams(
            new URLSearchParams({
              ...searchParams,
            }),
          );
        } else {
          setView(selectedOption.value);
          setSearchParams(
            new URLSearchParams({
              ...searchParams,
              view: selectedOption.value,
            }),
          );
        }
      }}
      isClearable
      placeholder="Select a view"
      value={view === undefined ? null : { view: view, description: view, value: view, label: view }}
    />
  );
};
