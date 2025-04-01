import { FC } from 'react';

import { numberWithCommas } from '../../utils/etc';

interface Props {
  limit: number;
  offset: number;
  setOffset: (offset: number) => void;
  count: number;
  forSchema?: boolean;
}

export const Pagination: FC<Props> = ({ limit, offset, setOffset, count, forSchema = false }) => {
  const numPages = Math.ceil(count / limit);
  const currentPage = forSchema ? offset + 1 : Math.floor(offset / limit) + 1;
  const lowestPage = Math.max(1, currentPage - 2);
  const highestPage = Math.min(numPages, currentPage + 2);

  const pages = [];
  for (let i = lowestPage; i <= highestPage; i++) {
    pages.push(i);
  }

  return (
    <div>
      <div className="d-flex flex-row align-items-center justify-content-center mt-2">
        <button disabled={offset === 0} className="btn btn-link pagination-link shadow-none mx-0" onClick={() => setOffset(0)}>
          {/* Beginning */}
          <i className="bi bi-skip-start-btn-fill text-2xl"></i>
        </button>
        <button className="btn btn-link pagination-link shadow-none mx-0" onClick={() => setOffset(forSchema ? currentPage - 2 : offset - limit)} disabled={offset === 0}>
          {/* Previous */}
          <i className="bi bi-rewind-btn-fill text-2xl"></i>
        </button>
        <div className="">
          {pages.map((page, i) => (
            <button
              key={i}
              className={`btn btn-sm shadow-none px-2 py-1 mx-1 ${page === currentPage ? 'dark-button' : 'dark-link'}`}
              onClick={() => setOffset(forSchema ? page - 1 : (page - 1) * limit)}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          className="btn btn-link pagination-link shadow-none mx-0"
          onClick={() => setOffset(forSchema ? currentPage : offset + limit)}
          disabled={forSchema ? currentPage >= numPages : offset + limit >= count}
        >
          {/* Next */}
          <i className="bi bi-fast-forward-btn-fill text-2xl"></i>
        </button>
        <button
          className="btn btn-link pagination-link shadow-none mx-0"
          onClick={() => setOffset(forSchema ? numPages - 1 : limit * (numPages - 1))}
          disabled={forSchema ? currentPage >= numPages : offset + limit >= count}
        >
          {/* End */}
          <i className="bi bi-skip-end-btn-fill text-2xl"></i>
          </button>
      </div>
      <div className="text-center text-muted text-sm mt-1">
        Viewing results {offset + 1} - {Math.min(offset + limit, count)} of {numberWithCommas(count)}
      </div>
    </div>
  );
};
