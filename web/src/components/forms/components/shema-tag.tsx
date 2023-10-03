import { FC } from 'react';

interface SchemaTagProps {
  schema: string | undefined;
}

export const SchemaTag: FC<SchemaTagProps> = ({ schema }) => {
  return (
    <div>
      <small className="d-flex flex-row align-items-center shadow-sm mb-2 px-2 py-1 fw-semibold text-primary bg-primary bg-opacity-10 border border-primary border-opacity-10 rounded-2">
        <span className="me-1">{schema || 'No Schema'}</span>
      </small>
    </div>
  );
};
