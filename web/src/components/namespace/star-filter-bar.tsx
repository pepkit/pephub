import { FC } from 'react';
import { useSearchParams } from 'react-router-dom';

interface Props {
  search: string;
  setSearch: (search: string) => void;
}

export const StarFilterBar: FC<Props> = ({ search, setSearch }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <div className="flex-row d-flex align-items-center" style={{ position: 'relative' }}>
      <div className="input-group shadow-sm rounded-2">
        <span id="search-bar-label" className="input-group-text">
          Search
        </span>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value === '') {
              searchParams.delete('search');
            } else {
              searchParams.set('search', e.target.value);
            }
            setSearchParams(searchParams);
          }}
          id="search-bar"
          type="text"
          className="form-control w-60"
          placeholder="Search through your stars"
        />
      </div>
    </div>
  );
};
