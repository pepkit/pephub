import { FC } from 'react';

interface Props {
  search: string;
  setSearch: (search: string) => void;
}

export const StarFilterBar: FC<Props> = ({ search, setSearch }) => {
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
          placeholder="Search through your stars"
        />
      </div>
    </div>
  );
};
