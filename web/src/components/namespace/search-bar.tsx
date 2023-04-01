import { FC } from 'react';

interface Props {
  namespace: string;
  search: string;
  limit: number;
  setSearch: (search: string) => void;
  setLimit: (limit: number) => void;
}

export const NamespacePageSearchBar: FC<Props> = ({ namespace, search, limit, setSearch, setLimit }) => {
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
          className="form-control w-75"
          placeholder={`Search for PEPs in ${namespace}`}
        />
        <select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))} className="form-control form-select">
          <option value={5}>Limit 5</option>
          <option value={10}>Limit 10</option>
          <option value={20}>Limit 20</option>
          <option value={30}>Limit 30</option>
        </select>
      </div>
    </div>
  );
};
