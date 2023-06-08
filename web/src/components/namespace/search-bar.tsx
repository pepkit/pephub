import { FC } from 'react';

interface Props {
  namespace: string;
  search: string;
  limit: number;
  orderBy: string;
  order: string;
  setSearch: (search: string) => void;
  setLimit: (limit: number) => void;
  setOrderBy: (orderBy: string) => void;
  setOrder: (order: string) => void;
}

export const NamespacePageSearchBar: FC<Props> = ({
  namespace,
  search,
  limit,
  orderBy,
  setSearch,
  setLimit,
  setOrderBy,
  order,
  setOrder,
}) => {
  return (
    <div className="flex-row d-flex align-items-center" style={{ position: 'relative' }}>
      <div className="input-group shadow-sm">
        <span id="search-bar-label" className="input-group-text">
          Search
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="search-bar"
          type="text"
          className="form-control w-60"
          placeholder={`Search for PEPs in ${namespace}`}
        />
        <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))} className="form-control form-select">
          <option value={5}>Limit 5</option>
          <option value={10}>Limit 10</option>
          <option value={20}>Limit 20</option>
          <option value={30}>Limit 30</option>
        </select>
        <select
          value={`${orderBy}+${order}`}
          onChange={(e) => {
            const [orderBy, order] = e.target.value.split('+');
            setOrderBy(orderBy);
            setOrder(order);
          }}
          className="form-control form-select"
        >
          <option value={'name+asc'}>Name (A-Z)</option>
          <option value={'name+desc'}>Name (Z-A)</option>
          <option value={'update_date+desc'}>Last update (newest)</option>
          <option value={'update_date+asc'}>Last update (oldest)</option>
          <option value={'submission_date+desc'}>Submission date (newest)</option>
          <option value={'submission_date+asc'}>Submission date (oldest)</option>
        </select>
      </div>
    </div>
  );
};
