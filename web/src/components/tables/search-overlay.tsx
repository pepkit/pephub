import { KeyboardEvent, useState } from 'react';

type Props = {
  matchCount: number;
  currentMatchIndex: number;
  onQueryChange: (query: string) => void;
  onNext: () => void;
  onPrev: () => void;
};

const OVERLAY_POSITION = { top: '2.75em', right: '0.5em', zIndex: 220 } as const;

export const SearchOverlay = (props: Props) => {
  const { matchCount, currentMatchIndex, onQueryChange, onNext, onPrev } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = () => {
    onQueryChange(query);
    setHasSearched(true);
  };

  const close = () => {
    setIsOpen(false);
    setQuery('');
    setHasSearched(false);
    onQueryChange('');
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setHasSearched(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!hasSearched) {
        runSearch();
      } else if (e.shiftKey) {
        onPrev();
      } else {
        onNext();
      }
    } else if (e.key === 'Escape') {
      close();
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary position-absolute"
        style={OVERLAY_POSITION}
        onClick={() => setIsOpen(true)}
        title="Search table"
      >
        <i className="bi bi-search" />
      </button>
    );
  }

  return (
    <div
      className="position-absolute d-flex align-items-center bg-white border rounded shadow-sm px-2 py-1"
      style={OVERLAY_POSITION}
    >
      <input
        autoFocus
        type="text"
        className="form-control form-control-sm me-2"
        style={{ width: '12em' }}
        placeholder="Search samples..."
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={runSearch} title="Run search">
        <i className="bi bi-search" />
      </button>
      <span className="text-muted text-nowrap me-2" style={{ fontSize: '0.85em' }}>
        {hasSearched ? (matchCount > 0 ? `${currentMatchIndex + 1} of ${matchCount}` : '0 of 0') : ''}
      </span>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary me-1"
        disabled={matchCount === 0}
        onClick={onPrev}
        title="Previous match"
      >
        <i className="bi bi-chevron-up" />
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary me-1"
        disabled={matchCount === 0}
        onClick={onNext}
        title="Next match"
      >
        <i className="bi bi-chevron-down" />
      </button>
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={close} title="Close search">
        <i className="bi bi-x" />
      </button>
    </div>
  );
};
