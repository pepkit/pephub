import { FC, useEffect, useMemo, useState } from 'react';

const placeholders = [
  'Search for PEPs.',
  'What is your favorite cell line?',
  'What disease do you study?',
  'What is your favorite protein?',
  'What is your favorite antibody?',
  'Search for a data type.',
];

interface Props {
  value: string;
  setValue: (value: string) => void;
  onSearch: () => void;
}

export const SearchBar: FC<Props> = ({ value, setValue, onSearch }) => {
  // put inside useMemo to avoid recomputing the placeholder on every render
  const placeholder = useMemo(() => placeholders[Math.floor(Math.random() * placeholders.length)], []);

  return (
    <div className="w-100 d-flex flex-row align-items-center shadow-sm rounded">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            // this is for the fast typers,
            // it takes react-query a few ms to generate a new query
            setTimeout(() => {
              onSearch();
            }, 500);
          }
        }}
        placeholder={placeholder}
        className="form-control w-100 p-2 rounded border border-dark border rounded-1"
        type="text"
      />
    </div>
  );
};
