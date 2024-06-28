import { dateStringToDateTime } from '../../utils/dates';

export const ApiKeyView = () => {
  const testKeys = [
    {
      key_obfuscated: '*********_3456',
      created_at: '2021-09-01T00:00:00Z',
      expires: '2021-09-01T00:00:00Z',
    },
    {
      key_obfuscated: '*********_3456',
      created_at: '2021-09-01T00:00:00Z',
      expires: '2021-09-01T00:00:00Z',
    },
  ];
  return (
    <div className="d-flex flex-column p-2">
      <div>
        <h5 className="fw-bold">Active keys:</h5>
        {testKeys?.length > 0 ? (
          testKeys.map((key, index) => (
            <div key={index} className="d-flex justify-content-between border border-dark shadow-sm p-1 rounded mb-1">
              <div className="d-flex flex-column align-items-start">
                <div className="d-flex align-items-center">
                  <i className="bi bi-key me-2 text-xl"></i>
                  <span className="text-sm">
                    <code>{key.key_obfuscated}</code>
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3 text-muted">
                  <span className="text-sm">Created at: {dateStringToDateTime(key.created_at)}</span>
                  <span className="text-sm">Expires: {dateStringToDateTime(key.expires)}</span>
                </div>
              </div>
              <div className="d-flex align-items-start">
                <button className="btn btn-sm btn-danger">
                  <i className="bi bi-trash me-1"></i>
                  Revoke
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-muted">No active keys. You can create a new API key below.</div>
        )}
      </div>
      <div className="my-2 border-top"></div>
      <div>
        {/* <h5 className="fw-bold">Create new:</h5> */}
        <div>
          <button className="btn btn-sm btn-success">
            <i className="bi bi-plus-circle me-2"></i>
            Create new API key
          </button>
        </div>
      </div>
    </div>
  );
};
