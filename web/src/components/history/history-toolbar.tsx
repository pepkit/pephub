import { useProjectPage } from '../../contexts/project-page-context';
import { dateStringToDateTime } from '../../utils/dates';

export const HistoryToolbar = () => {
  const { currentHistoryId, setCurrentHistoryId, projectAllHistoryQuery } = useProjectPage();
  const historyUpdates = projectAllHistoryQuery.data?.history;
  return (
    <div className="d-flex flex-row align-items-center p-2 gap-2">
      <button
        className="btn btn-warning"
        onClick={() => {
          setCurrentHistoryId(null);
        }}
      >
        Go back
      </button>
      <button className="btn btn-outline-warning bg-white">Restore</button>
      <select
        className="form-select w-25 shadow-lg border-warning"
        onChange={(e) => {
          setCurrentHistoryId(parseInt(e.target.value));
        }}
        value={currentHistoryId || ''}
      >
        {historyUpdates?.map((history) => (
          <option key={history.change_id} value={history.change_id}>
            {dateStringToDateTime(history.change_date)}
          </option>
        ))}
      </select>
    </div>
  );
};
