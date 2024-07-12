import { useState } from 'react';

import { useProjectPage } from '../../contexts/project-page-context';
import { useSession } from '../../contexts/session-context';
import { useProjectAllHistory } from '../../hooks/queries/useProjectAllHistory';
import { useCurrentHistoryId } from '../../hooks/stores/useCurrentHistoryId';
import { dateStringToDateTime } from '../../utils/dates';
import { downloadHistoryZip } from '../../utils/project';
import { RestoreFromHistoryModal } from '../modals/restore-from-history';

export const HistoryToolbar = () => {
  const { namespace, projectName, tag } = useProjectPage();

  const { currentHistoryId, setCurrentHistoryId } = useCurrentHistoryId();

  const projectAllHistoryQuery = useProjectAllHistory(namespace, projectName, tag);

  const historyUpdates = projectAllHistoryQuery.data?.history;

  const { jwt } = useSession();

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
        <i className="bi bi-x-circle me-1"></i>
        Exit
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
      <button
        className="btn btn-warning"
        onClick={() => {
          setShowRestoreModal(true);
        }}
      >
        <i className="bi bi-arrow-repeat me-1"></i>
        Restore
      </button>
      <button
        style={{
          zIndex: 3000,
        }}
        className="btn btn-warning"
        onClick={() => {
          if (currentHistoryId === null) {
            return;
          }
          downloadHistoryZip(namespace, projectName, tag, currentHistoryId, jwt);
        }}
      >
        <i className="bi bi-download me-1"></i>
        Download
      </button>
      <RestoreFromHistoryModal
        show={showRestoreModal}
        onHide={() => {
          setShowRestoreModal(false);
        }}
      />
    </div>
  );
};
