import { useSession } from '../../contexts/session-context';

type Props = {
  setCreateModalOpen: (open: boolean) => void;
  limit: number;
  setLimit: (limit: number) => void;
  offset: number;
  setOffset: (offset: number) => void;
  orderBy: string;
  setOrderBy: (orderBy: string) => void;
  order: 'asc' | 'desc';
  setOrder: (order: 'asc' | 'desc') => void;
  search: string;
  setSearch: (search: string) => void;
};

export const SchemasNav = (props: Props) => {
  const {
    setCreateModalOpen,
    limit,
    setLimit,
    offset,
    setOffset,
    orderBy,
    setOrderBy,
    order,
    setOrder,
    search,
    setSearch,
  } = props;
  const { user } = useSession();
  return (
    <div className="d-flex flex-column align-items-center gap-2">
      <div className="d-flex align-items-center justify-content-between w-100">
        <div className="d-flex align-items-center">
          <h3 className="m-0 fw-semibold">PEPhub schemas</h3>
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
      <div className="flex-row d-flex align-items-center position-relative w-100">
        <div className="input-group">
          <label className="input-group-text" htmlFor="limit-select">
            Search
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            className="form-control rounded-end-0"
            placeholder="Search schemas"
            aria-label="Search schemas"
            aria-describedby="search-schemas"
          />
        </div>
        <select
          style={{ width: '10%' }}
          className="form-control form-select rounded-start-0  rounded-end-0"
          id="limit-select"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <select
          value={`${orderBy}+${order}`}
          onChange={(e) => {
            const [orderBy, order] = e.target.value.split('+');
            setOrderBy(orderBy);
            setOrder(order as 'asc' | 'desc');
          }}
          className="form-control form-select rounded-start-0"
          style={{ width: '20%' }}
        >
          <option value={'name+asc'}>Name (A-Z)</option>
          <option value={'name+desc'}>Name (Z-A)</option>
          <option value={'update_date+asc'}>Last update (newest)</option>
          <option value={'update_date+desc'}>Last update (oldest)</option>
          <option value={'submission_date+asc'}>Submission date (newest)</option>
          <option value={'submission_date+desc'}>Submission date (oldest)</option>
        </select>
      </div>
    </div>
  );
};
