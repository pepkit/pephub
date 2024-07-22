import { useSession } from '../../contexts/session-context';

type Props = {
  setCreateModalOpen: (open: boolean) => void;
};

export const SchemasNav = (props: Props) => {
  const { setCreateModalOpen } = props;
  const { user } = useSession();
  return (
    <div className="d-flex flex-column align-items-center gap-2">
      <div className="d-flex align-items-center justify-content-between w-100">
        <div className="d-flex align-items-center">
          <h1 className="m-0 fw-bold">PEPhub schemas</h1>
        </div>
        {user && (
          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-success"
              onClick={() => {
                setCreateModalOpen(true);
              }}
            >
              <span className="d-flex align-items-center gap-1">
                <i className="bi bi-plus-circle"></i>
                Create
              </span>
            </button>
            <a href={`/schemas/${user.login}`}>
              <button className="btn btn-dark">
                <span className="d-flex align-items-center gap-1">
                  <i className="bi bi-filetype-yml"></i>
                  My schemas
                </span>
              </button>
            </a>
          </div>
        )}
      </div>
      <div className="d-flex align-items-center w-100">
        <input
          type="text"
          className="form-control"
          placeholder="Search schemas"
          aria-label="Search schemas"
          aria-describedby="search-schemas"
        />
      </div>
    </div>
  );
};
