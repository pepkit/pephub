import { FC, useEffect, useState } from 'react';

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
  const [placeholder, setPlaceholder] = useState('');

  // put inside useEffect to avoid recomputing the placeholder on every render
  useEffect(() => {
    setPlaceholder(placeholders[Math.floor(Math.random() * placeholders.length)]);
  }, []);
  return (
    <div className="w-100 d-flex flex-row align-items-center shadow-sm rounded">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSearch();
          }
        }}
        placeholder={placeholder}
        className="form-control w-100 p-2 rounded border border-dark border-2 rounded-1"
        type="text"
      />
    </div>
  );
};
