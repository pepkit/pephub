import { FC } from 'react';

interface Props {
  limit: number;
  offset: number;
  setOffset: (offset: number) => void;
  count: number;
}

export const Pagination: FC<Props> = ({ limit, offset, setOffset, count }) => {
  return (
    <div className="d-flex flex-row align-items-center justify-content-center mt-2">
      <button disabled={offset === 0} className="btn btn-link" onClick={() => setOffset(0)}>
        Begining
      </button>
      <button className="btn btn-link" onClick={() => setOffset(offset - limit)} disabled={offset === 0}>
        <i className="bi bi-chevron-left"></i>
        Previous
      </button>
      <button className="btn btn-link" onClick={() => setOffset(offset + limit)} disabled={offset + limit >= count}>
        Next
        <i className="bi bi-chevron-right"></i>
      </button>
      <button className="btn btn-link" onClick={() => setOffset(count - limit)} disabled={offset + limit >= count}>
        End
      </button>
    </div>
  );
};
