import { FC } from 'react';

import { numberWithCommas } from '../../utils/etc';

interface Props {
  limit: number;
  offset: number;
  setOffset: (offset: number) => void;
  count: number;
}

export const Pagination: FC<Props> = ({ limit, offset, setOffset, count }) => {
  const numPages = Math.ceil(count / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const lowestPage = Math.max(1, currentPage - 2);
  const highestPage = Math.min(numPages, currentPage + 2);

  const pages = [];
  for (let i = lowestPage; i <= highestPage; i++) {
    pages.push(i);
  }

  return (
    <div>
      <div className="d-flex flex-row align-items-center justify-content-center mt-2">
        <button disabled={offset === 0} className="btn btn-link dark-link shadow-none mx-1" onClick={() => setOffset(0)}>
          Beginning
        </button>
        <button className="btn btn-link dark-link shadow-none mx-1" onClick={() => setOffset(offset - limit)} disabled={offset === 0}>
          <i className="bi bi-chevron-left"></i>
          Previous
        </button>
        <div className="">
          {pages.map((page, i) => (
            <button
              key={i}
              className={`btn btn-sm shadow-none px-2 py-1 me-1 ${page === currentPage ? 'dark-button' : 'dark-link'}`}
              onClick={() => setOffset((page - 1) * limit)}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          className="btn btn-link dark-link shadow-none mx-1"
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= count}
        >
          Next
          <i className="bi bi-chevron-right"></i>
        </button>
        <button
          className="btn btn-link dark-link shadow-none mx-1"
          onClick={() => setOffset(count - limit)}
          disabled={offset + limit >= count}
        >
          End
        </button>
      </div>
      <div className="text-center text-muted mt-1">
        Viewing results {offset + 1} - {Math.min(offset + limit, count)} of {numberWithCommas(count)}
      </div>
    </div>
  );
};
