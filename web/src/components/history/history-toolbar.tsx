import { useState } from 'react';

import { useProjectPage } from '../../contexts/project-page-context';
import { dateStringToDateTime } from '../../utils/dates';
import { RestoreFromHistoryModal } from '../modals/restore-from-history';

export const HistoryToolbar = () => {
  const { currentHistoryId, setCurrentHistoryId, projectAllHistoryQuery } = useProjectPage();
  const historyUpdates = projectAllHistoryQuery.data?.history;

  const [showRestoreModal, setShowRestoreModal] = useState(false);

  return (
    <div
      className="d-flex flex-row align-items-center p-2 gap-2"
      style={{
        zIndex: 3000,
      }}
    >
      <button
        className="btn btn-warning"
        onClick={() => {
          setCurrentHistoryId(null);
        }}
      >
        Exit
      </button>
      <button
        className="btn btn-warning"
        onClick={() => {
          setShowRestoreModal(true);
        }}
      >
        Restore
      </button>
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
      <RestoreFromHistoryModal
        show={showRestoreModal}
        onHide={() => {
          setShowRestoreModal(false);
        }}
      />
    </div>
  );
};
